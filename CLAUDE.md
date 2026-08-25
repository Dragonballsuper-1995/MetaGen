# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MetaGen turns a video script (20–3000 chars) into YouTube metadata: title, description, tags, a 5-factor SEO score, and telemetry. Two deployables from one repo:

- **Backend** — FastAPI (Python 3.11), deployed as a Docker Space on Hugging Face (port 7860).
- **Frontend** — Next.js 16 App Router **static export**, deployed to Vercel.

`PRD.md` is the product spec. `features/` holds seven on-hold feature specs (F-01…F-07) that are *not* implemented. `api_and_model_expansion_plan.md` is an in-progress, phase-gated plan to add Gemini/OpenRouter/OpenCode Zen providers — read it before touching provider wiring in `ai_engine.py`.

## Commands

```bash
# Backend dev server (from repo root — the `backend` package must be importable from CWD)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
# Backend unit tests — MUST be `python -m pytest`, not bare `pytest`
python -m pytest tests/test_model_fallback.py -v
```

```bash
# Single test
python -m pytest tests/test_model_fallback.py::test_groq_multi_tier_fallback_success -v
```

```bash
# Live SSE smoke test — needs the backend already running on :8000; hits Groq for real (120B, 20B, Qwen)
python tests/test_live_stream.py
```

```bash
# Frontend
cd frontend && npm install && npm run dev     # :3000
cd frontend && npm run build                  # static export → frontend/out/
```

Notes on the toolchain, so you don't lose time to it:

- Bare `pytest` fails with `ModuleNotFoundError: No module named 'backend'` — `tests/` has no `__init__.py`, so pytest puts `tests/` on `sys.path` instead of the repo root. `python -m pytest` adds CWD. There is no `pytest.ini`/`pyproject.toml`.
- `npm run lint` is **broken** — the script calls `eslint .` but eslint is not in `devDependencies` and there is no eslint config. Don't cite it as a verification step.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `npm run build` passing does **not** mean the TypeScript is clean. Use `npx tsc --noEmit` in `frontend/` for that.
- Two dependency files, both real: `requirements_hf.txt` (root, CPU wheels, used by the HF Dockerfile) and `frontend/requirements.txt` (stale Python file living under `frontend/` — Windows CUDA wheels, Streamlit, Py3.12; it belongs to an older deployment shape and is *not* what the frontend uses).

## Architecture

### Backend request paths

Two independent paths reach the same engine:

| Path | Endpoints | Transport | Used by the current UI? |
| --- | --- | --- | --- |
| **Stream** | `POST /api/generate/stream` | SSE (`data: {json}\n\n`) | **Yes** — the only path the UI uses |
| **Poll** | `POST /api/generate` → `GET /api/status/{task_id}` | Celery task + Redis | No |

Poll mode requires Redis and a Celery worker; without them both endpoints return 503 with a "start Redis + Celery worker, or switch to Stream mode" message. `GET /health/deps` reports that readiness (cached 10s, probed in a worker thread).

Also: `GET /health`, `/health/warmup`, `/health/runtime`, `GET /api/diagnostics/inference`, `POST /api/title-variants`.

### The inference engine (`backend/ai_engine.py`, ~3.7k lines)

This one file is the whole engine. Its layers, in the order a request passes through them:

1. **`validate_script`** — length bounds, raises `ScriptValidationError`.
2. **Strategy dispatch** — `settings.generation_strategy` picks one of five (`_strategy_*`): `standard`, `two_pass`, `tfidf_tags` (non-streaming, in `_NON_STREAMING`) and `streaming`, `tfidf_streaming` (generators, in `_STREAMING`). Production default is **`tfidf_streaming`**: tags come from local keyword extraction instantly, then title+description stream from the LLM.
3. **`_llm_call` / `_llm_stream`** — the multi-tier fallback. Walks `_get_groq_candidate_models(choice)` in order; if every Groq candidate fails, `_try_cloud_fallback` runs the cascade in `backend/api_clients/fallback_chain.py` (**Gemini → OpenRouter → OpenCode Zen**, each skipped without error when its key is unset), and only if that is exhausted too does it fall through to local `llama-cpp-python`. The cascade fires **only in `"auto"` mode** — an explicit `model_choice` still raises rather than silently substituting a provider, and `choice == "mistral"` goes straight to local. `model_choice` strings are normalized by `_normalize_model_choice` (`"groq"`/`"cloud"`/`"120b"` → `groq-120b`, `"local"`/`"hf"`/`"custom"` → `mistral`, unknown → `auto`). The streaming path strips `<think>…</think>` reasoning blocks (Qwen) and normalizes unicode dashes/NBSP inline. `response_format: json_object` is sent only to `gpt-oss` models.
4. **`_apply_output_contract`** — the real output guarantee. Normalizes tags, coerces title/description into configured bounds, validates, and (budget permitting) issues targeted `_regenerate_title`/`_regenerate_description` calls, then re-coerces. Ends by computing `seo_score` + `seo_breakdown`. Returns **best-effort** output with a warning log if violations survive — it never raises.
5. **Telemetry** — the streaming entrypoint stamps `latency_s`, `ttft_s`, `tokens_per_second` onto the final payload from timings it measured itself.

Retry budget is asymmetric on purpose: `settings.stream_allow_retry` defaults to **False**, so streaming requests get `retry_budget = 0` (coercion only, no extra LLM calls) while non-streaming requests get `constraint_retry_count` (2).

A large amount of the file is deterministic text repair, not prompting — anti-echo penalties against the source script (`_apply_anti_echo_penalty`, `_script_overlap_score`), generic-phrase detection, description expansion/upgrade, script-grounded CTA and filler synthesis, title enhancement, and multi-stage JSON salvage (`_parse_json_safe` → `_extract_json_fields_fallback`). When output quality regresses, the cause is usually here rather than in `backend/utils/prompt_factory.py`.

`_record_inference_diagnostic` keeps the last metadata / stream / title-variant run in memory (with a cold-vs-warm classification from timing thresholds), surfaced by `/api/diagnostics/inference`. That endpoint is the fastest way to see what actually happened on the last request.

### SSE event contract

`generate_youtube_metadata_stream` yields dicts that `main.py` serializes as `data: {json}\n\n`. Four event types, mirrored in `frontend/lib/types.ts` as `StreamEvent`:

```
{"type": "tags",  "data": [...]}     # tfidf_streaming only, arrives first
{"type": "token", "data": "..."}     # raw LLM token chunks
{"type": "done",  "data": {...}}     # full post-processed MetadataResult
{"type": "error", "message": "..."}  # terminal
```

Errors are delivered **inside a 200 response** as an `error` event, not as an HTTP error status — client code must handle both. `_STREAMING` strategies that finish without a `done` event synthesize an error event. The generator checks `request.is_disconnected()` each iteration and closes the underlying generator in a `finally`.

Changing this contract means changing three places: `ai_engine.py` (producer), `frontend/lib/types.ts` (`StreamEvent`), and the `switch` in `frontend/hooks/useStreamGenerate.ts`.

### Model warm-up / keep-warm (`backend/services/model_runtime.py`)

State lives on `app.state.model_warm_*`. On startup `prewarm_model_runtime` tries a 3-second warm and gives up silently; `start_keep_warm_if_enabled` then runs a background heartbeat every `model_keep_warm_interval_s` (240s) so HF Spaces' CPU doesn't evict the GGUF.

The critical detail: `_load_model_for_warmup` **returns immediately if a Groq client exists** — it only loads the 4.4 GB local GGUF when there is no cloud path. Correspondingly, request handlers only block on `_ensure_model_warm` when the caller explicitly asked for `mistral` or Groq is unconfigured. Cloud requests never wait on local warm-up.

`main._ensure_model_warm` is a deliberate shim delegating to `ensure_model_warm_ready` — tests patch that name; don't inline it away.

### Local model / GPU profile

`get_llm()` lazily loads the GGUF singleton. Around it: Windows CUDA DLL search-path injection (`_configure_windows_cuda_dll_search_path`, driven by `cuda_dll_paths`), backend capability probing, and `nvidia-smi`-based GPU memory polling. If GPU offload looks inactive for `gpu_inactive_confirmations` consecutive probes, `_should_use_cpu_fast_profile()` flips on and `_cap_max_tokens` clamps every generation to `cpu_fallback_max_tokens` — a silent quality/length reduction that explains "why is output suddenly short" on CPU hosts.

### Frontend

`app/page.tsx` is the single stateful root: it owns `appState: "input" | "loading" | "output"`, the selected model, the current script, the result, and history. Everything else is presentational and prop-driven.

- `useStreamGenerate` — the only data hook in use. Manual `fetch` + `ReadableStream` reader (not `EventSource`, because the endpoint is a POST), buffered through `parseJsonDataLineBuffer` in `lib/sse.ts`. Has a 45s first-activity watchdog that aborts and retries once, since a cold HF Space can stall before the first token. Progress percent is derived from an adaptive moving token target, monotonically increasing, capped at 99.5% until `done`.
- `useHistory` — last 50 generations in `localStorage` under `metagen_neural_cache_v2`.
- `lib/constants.ts` `resolveApiUrl()` — **runtime backend discovery**, not a static env var. It probes `/health` on candidates in order (`NEXT_PUBLIC_API_URL`, then localhost variants when in dev, then the hardcoded `https://sujalchhajed925-metagen.hf.space`), memoizes the first that answers, and refuses `http://` candidates from an `https://` page. The production HF URL is hardcoded in this file — update it here when the Space moves.
- Design system lives in `app/globals.css` (378 lines): Tailwind 4 `@theme inline`, electric-blue `#0084FF` primary, the `Doto` dot-matrix font (loaded via `<link>` in `layout.tsx`, exposed as `--font-dot` / `.dm-label` / `.dm-digit`), and the `.morph-card` collapsed↔expanded input animation that `terminal-core.tsx` drives with class names only.

## Configuration

All backend config is `backend/config.py` (`Settings`, pydantic-settings), read from `.env` or `backend/.env`, **no env prefix** — field names map straight to env vars (`GENERATION_STRATEGY`, `GROQ_API_KEY`, `GROQ_MODEL`, `MODEL_PATH`, `RATE_LIMIT`, `LOG_LEVEL`…). `get_settings()` and `_get_settings()` are `lru_cache`d: **env changes require a process restart**, and tests that need different settings must patch, not re-read.

Output bounds (title 40–85 chars / 6–15 words, description 150–300 words & 900–1800 chars, tags 8–12 items of 2–4 words ≤30 chars), token caps per profile, GPU thresholds, and the Groq cascade (`groq_model` + `groq_fallback_models`) all live there. Rate limit is `10/minute` via SlowAPI on the three generation endpoints.

Frontend: only `NEXT_PUBLIC_API_URL` (`frontend/.env.local`, `frontend/.env.production`). Never put a secret in a `NEXT_PUBLIC_*` var — `lib/api.ts` `getHeaders()` deliberately sends no API key and documents why.

## Deployment

Two remotes, two targets:

- `origin` → GitHub (`Dragonballsuper-1995/MetaGen`). Vercel builds the frontend from here.
- `hf` → the Hugging Face Space (`SujalChhajed925/MetaGen`). Pushing here deploys the backend.

The HF Space builds the root `Dockerfile` and runs `run_app.py`, which starts the GGUF download on a **daemon thread** and launches uvicorn on 7860 immediately — the Space must answer health checks in under a second, so never make the model download blocking. `download_model.py` pulls `custom-mistral-yt-seo-Q4_K_M.gguf` from `SujalChhajed925/yt-seo-mistral-merged` into `backend/model/`. Model files are gitignored and must never be committed. `start.sh` is the older blocking variant, unused by the Dockerfile.

`README.md` carries HF Space YAML frontmatter (`sdk: docker`, `app_port: 7860`) — it is load-bearing for the Space, so preserve it when editing. `README_new.md` is a minimal alternate copy of that frontmatter, not wired to anything.

`GROQ_API_KEY` must be set as an HF Space secret; without it every request degrades to the CPU GGUF path.

## Landmines

Verified issues and inconsistencies in the current tree. Don't "fix" them incidentally in unrelated work, but know they exist.

- **`/health/runtime` will raise `NameError`** when `settings.groq_api_key` is empty — `backend/main.py:271` references `os.environ` but `main.py` never imports `os`. The `or` chain short-circuits, so the bug only fires on unconfigured hosts, which is exactly where you'd use the diagnostic.
- **Poll-mode response bounds contradict the engine's bounds.** `MetadataResult` in `backend/main.py` requires title 40–60 chars, description 800–1300 chars, and 5–8 tags; `config.py` targets title ≤85, description 900–1800, and 8–12 tags. Perfectly valid engine output therefore fails `/api/status/{task_id}` validation and returns `"Task completed but produced invalid metadata payload."` The stream path returns raw dicts and bypasses this model entirely — which is why streaming works while poll mode reports failures on the same generation.
- **CORS settings are computed and then ignored.** `allowed_origins` is built from `settings.cors_origins` at `backend/main.py:34` and never used; the middleware hardcodes `allow_origins=["*"]`.
- **Unwired frontend code** — nothing imports `hooks/useGenerate.ts` (poll mode), `hooks/useWarmupAndDepsHealth.ts`, `hooks/useTitleVariants.ts`, `components/metagen/title-variants.tsx`, or `styles/globals.css` (a stale shadcn OKLCH theme; the live one is `app/globals.css`).
- **The three "title angles" are not AI-generated.** `output-grid.tsx` derives them from `result.title` with client-side string templating (including a hardcoded `"(2026 Guide)"`). The real `POST /api/title-variants` endpoint and `useTitleVariants` hook exist but are not connected to the UI.
- `_target_tag_count`'s docstring says "5-8 band"; it reads `tags_min_count`/`tags_max_count`, which are 8 and 12.
- `frontend/out/` is a committed-to-disk but gitignored build artifact; `next.config.mjs` uses `output: 'export'`, so **no API routes, middleware, or server components** are available on the frontend — all dynamic behavior is client-side against the FastAPI backend.
- `hf-cli/SKILL.md` is a gitignored generated reference for the `hf` CLI, not project documentation.
