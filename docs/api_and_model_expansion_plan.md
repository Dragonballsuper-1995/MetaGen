## Goal Description
Expand MetaGen's AI capabilities by integrating multiple free/low-cost API providers (Gemini, OpenRouter, OpenCode Zen) alongside the existing Groq integration, and by supporting dynamic local open-source models for fine-tuning and inference.

> [!IMPORTANT]
> **Execution Rule:** Only **one phase, or one mini-phase within a phase**, is implemented at a time.
> - Every phase begins with a **pre-phase verification** step (packages, files, folders, API keys).
> - Every mini-phase inside a phase is followed immediately by **mini-phase testing & validation** before the next mini-phase starts.
> - Every phase ends with a **deep, phase-level validation pass** before the next phase is allowed to begin.
> - No phase or mini-phase is skipped, merged, or run in parallel with another.

---

# Phase 1 — Environment, Secrets & Baseline Health Check

**Goal:** Confirm the ground you're building on is solid — current Groq integration, packages, config, and secrets — before adding anything new.

### Step 1.0 — Pre-Phase Verification
Before writing any code, confirm the current state:
- [ ] Locate and open `backend/config.py` — confirm it uses Pydantic `BaseSettings` (or `pydantic-settings`), and note its current fields.
- [ ] Locate `.env` (or `.env.example`) — confirm it exists and note which keys are currently present (likely just `GROQ_API_KEY` and a HF token).
- [ ] Locate `requirements_hf.txt` — note current pinned versions of `groq`, `pydantic`, and any HTTP client libraries already installed.
- [ ] Run `pip show groq openai google-generativeai 2>&1` — confirm which of these are already installed vs. missing (do this before adding new deps, so you know your true starting point).
- [ ] Search the codebase for every literal Groq model string in use:
  ```bash
  grep -rn "llama-3.1-8b-instant\|llama-3.3-70b-versatile\|llama-4-scout\|qwen/qwen3-32b" backend/
  ```
  Record every match with file + line number.

### Mini-Phase 1.1 — Groq Deprecation Audit (do this first — it may be a live production bug)
**Implementation:**
- For every Groq model string found in Step 1.0, check it against Groq's current deprecation list. As of this plan, the following are deprecated (free/developer tier included):
  - `llama-3.1-8b-instant` → replace with `openai/gpt-oss-20b`
  - `llama-3.3-70b-versatile` → replace with `openai/gpt-oss-120b` or `qwen/qwen3.6-27b`
  - `qwen/qwen3-32b` → replace with `openai/gpt-oss-120b`
  - `meta-llama/llama-4-scout-17b-16e-instruct` → replace with `qwen/qwen3.6-27b`
- Update every occurrence found in Step 1.0 to its replacement model string.
- **Mini-Phase 1.1 Testing & Validation:**
  1. Write a throwaway script `tests/verify_groq_models.py` that sends `"Say hello"` to each *new* Groq model string using the existing Groq client code path (not a new one — reuse whatever `ai_engine.py` currently calls).
  2. Confirm each call returns HTTP 200 and a non-empty `choices[0].message.content`.
  3. Confirm no `grep` matches for the old deprecated strings remain anywhere in `backend/`.
  4. Only proceed once every replaced model string has a passing live call logged.

### Mini-Phase 1.2 — Config Schema Extension
**Implementation:**
- Open `backend/config.py`. Inside the `BaseSettings` subclass, add:
  ```python
  GEMINI_API_KEY: str | None = None
  OPENROUTER_API_KEY: str | None = None
  OPENCODE_ZEN_API_KEY: str | None = None
  ```
- Keep these `Optional`/nullable — the app must still boot cleanly for a local-only setup with no cloud keys at all.
- **Mini-Phase 1.2 Testing & Validation — masked presence check, then a real live call per key:**
  1. Run:
     ```bash
     python -c "from backend.config import settings; print({k: (v[:4]+'...' if v else None) for k, v in settings.dict().items() if 'KEY' in k})"
     ```
     Confirm the three new keys appear in the printed dict (masked), with `None` for any not yet set in `.env`. This only proves the key is *loaded* — it does not prove the key actually works. Do not stop here.
  2. **For every key that is set, make one real, minimal live call to that provider right now** (not deferred to Phase 2) to confirm the key itself is valid, before any client wrapper code exists:
     ```bash
     # Gemini — minimal live call
     python -c "
     import google.generativeai as genai
     from backend.config import settings
     genai.configure(api_key=settings.GEMINI_API_KEY)
     m = genai.GenerativeModel('gemini-2.5-flash')
     print(m.generate_content('Say OK').text)
     "

     # OpenRouter — minimal live call
     python -c "
     from openai import OpenAI
     from backend.config import settings
     client = OpenAI(base_url='https://openrouter.ai/api/v1', api_key=settings.OPENROUTER_API_KEY)
     r = client.chat.completions.create(model='openrouter/free', messages=[{'role':'user','content':'Say OK'}])
     print(r.choices[0].message.content)
     "

     # OpenCode Zen — minimal live call (list models first to confirm the key can auth at all)
     python -c "
     import httpx
     from backend.config import settings
     r = httpx.get('https://opencode.ai/zen/v1/models', headers={'Authorization': f'Bearer {settings.OPENCODE_ZEN_API_KEY}'})
     print(r.status_code, r.json())
     "
     ```
  3. Confirm each call above returns a real HTTP 200 and real text/JSON content — not just "no exception." A key that's present but invalid (typo'd, expired, wrong project) will often fail silently later inside a wrapped client; catching that now, with a raw call, is the point of this step.
  4. If a key is intentionally left unset (e.g., you don't have an OpenCode Zen account yet), explicitly record that as a known gap rather than treating the missing test as a pass.
  5. Confirm the app still starts (`uvicorn backend.main:app --reload` or equivalent) with **zero** of the three new keys set, to prove the "local-only, no cloud keys" path still works.

### Mini-Phase 1.3 — Dependencies & `.env` Template
**Implementation:**
- Add to `requirements_hf.txt`:
  ```
  google-generativeai>=0.8.0
  openai>=1.40.0
  ```
- Update `.env.example` (or equivalent) with placeholder lines:
  ```
  GEMINI_API_KEY=
  OPENROUTER_API_KEY=
  OPENCODE_ZEN_API_KEY=
  ```
- **Mini-Phase 1.3 Testing & Validation:**
  1. Run `pip install -r requirements_hf.txt` in a clean virtualenv (not your dev env, to catch missing transitive deps).
  2. Run `python -c "import google.generativeai, openai; print('ok')"` — must print `ok` with no import errors.
  3. Confirm no existing package version got silently downgraded (`pip list --outdated` before/after diff).

### End-of-Phase 1 — Deep Validation (must pass before Phase 2 starts)
- [ ] All Groq calls in the codebase use non-deprecated model strings, each with a passing live-call log from Mini-Phase 1.1.
- [ ] `backend/config.py` loads cleanly with all three new keys unset, and separately with all three set to dummy values.
- [ ] `requirements_hf.txt` installs cleanly in a fresh environment with no dependency conflicts.
- [ ] Full existing app smoke test (whatever your normal "does the app still boot and serve one request" check is) passes unchanged — this phase must not have altered any existing runtime behavior.
- [ ] Commit this phase in isolation (its own commit/PR) before starting Phase 2, so it can be reverted independently if Phase 2 uncovers an issue.

---

# Phase 2 — Multi-Tier API Fallback Implementation

**Goal:** Add Gemini, OpenCode Zen, and OpenRouter as fallback providers behind Groq, each verified with a real live call before being wired into the fallback chain.

### Step 2.0 — Pre-Phase Verification
- [ ] Confirm Phase 1's end-of-phase checklist is fully signed off.
- [ ] Confirm you have real (not placeholder) API keys in `.env` for at least Gemini and OpenRouter (OpenCode Zen requires billing details even for its "free" promo models — decide now whether you're setting that up).
- [ ] Confirm outbound network access to `generativelanguage.googleapis.com`, `opencode.ai`, and `openrouter.ai` from your dev/deploy environment (a blocked egress here will look like a silent timeout later, not an obvious error).
- [ ] Create the test directory if it doesn't exist: `mkdir -p tests`.

### Mini-Phase 2.1 — Gemini Client
**Implementation:**
- Create `backend/api_clients/gemini_client.py`:
  ```python
  import google.generativeai as genai
  from backend.config import settings

  def _configure():
      if not settings.GEMINI_API_KEY:
          raise RuntimeError("GEMINI_API_KEY not set")
      genai.configure(api_key=settings.GEMINI_API_KEY)

  async def generate_with_gemini(system_prompt: str, user_prompt: str) -> str:
      _configure()
      model = genai.GenerativeModel(
          model_name="gemini-2.5-flash",  # NOT gemini-1.5-flash — that model is shut down (404)
          system_instruction=system_prompt,
      )
      response = await model.generate_content_async(user_prompt)
      return response.text
  ```
  - Note the free tier for Flash models has low RPM (roughly 5–15 requests/minute depending on the exact model) — add basic rate-limit awareness (catch `429`) rather than assuming unlimited free calls.
- **Mini-Phase 2.1 Testing & Validation:**
  1. Create `tests/verify_gemini.py` that calls `generate_with_gemini("You are a test.", "Say hello")`.
  2. Confirm it returns a non-empty string with no exception.
  3. Deliberately send an invalid/empty `GEMINI_API_KEY` and confirm the function raises a clear error rather than hanging or returning silently empty output.
  4. Send 20 rapid requests and confirm a `429` is caught and handled (not an unhandled crash) if you hit the rate limit.

### Mini-Phase 2.2 — OpenCode Zen Client
**Implementation:**
- Correct base URL is `https://opencode.ai/zen/v1` (not `opencodezen.com`).
- OpenCode Zen's free models rotate — do **not** hardcode a model id. Fetch the live model list first:
  ```python
  import httpx
  from openai import AsyncOpenAI
  from backend.config import settings

  ZEN_BASE_URL = "https://opencode.ai/zen/v1"

  async def _get_current_free_model() -> str:
      async with httpx.AsyncClient() as client:
          resp = await client.get(
              f"{ZEN_BASE_URL}/models",
              headers={"Authorization": f"Bearer {settings.OPENCODE_ZEN_API_KEY}"},
          )
          resp.raise_for_status()
          models = resp.json().get("data", [])
      free_models = [m["id"] for m in models if m.get("pricing", {}).get("prompt") == "0"]
      if not free_models:
          raise RuntimeError("No free-tier model currently available on OpenCode Zen")
      return free_models[0]

  async def generate_with_opencode(system_prompt: str, user_prompt: str) -> str:
      model_id = await _get_current_free_model()
      client = AsyncOpenAI(base_url=ZEN_BASE_URL, api_key=settings.OPENCODE_ZEN_API_KEY)
      completion = await client.chat.completions.create(
          model=model_id,
          messages=[
              {"role": "system", "content": system_prompt},
              {"role": "user", "content": user_prompt},
          ],
      )
      return completion.choices[0].message.content
  ```
  - Treat this provider as potentially billed — it is pay-as-you-go by default; only the specific promo model(s) returned by the `/models` check above are free. Consider caching the free-model lookup for a few minutes rather than calling it on every request.
- **Mini-Phase 2.2 Testing & Validation:**
  1. Create `tests/verify_opencode.py` — call `_get_current_free_model()` alone first, print the result, and manually confirm it matches a currently-free model on OpenCode Zen's dashboard.
  2. Then call `generate_with_opencode(...)` end-to-end and confirm a valid completion object comes back (correct OpenAI-compatible shape: `choices[0].message.content` populated).
  3. Confirm behavior when zero free models are available (simulate by mocking an empty list) — must raise a clear, catchable error, not crash the whole fallback chain.

### Mini-Phase 2.3 — OpenRouter Client
**Implementation:**
```python
from openai import AsyncOpenAI
from backend.config import settings

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

async def generate_with_openrouter(system_prompt: str, user_prompt: str) -> str:
    client = AsyncOpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=settings.OPENROUTER_API_KEY,
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MetaGen",
        },
    )
    completion = await client.chat.completions.create(
        model="openrouter/free",  # auto-router: picks a live free model per-request
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return completion.choices[0].message.content
```
- **Mini-Phase 2.3 Testing & Validation:**
  1. Create `tests/verify_openrouter.py`, call `generate_with_openrouter(...)`.
  2. Confirm HTTP 200 and non-empty content.
  3. Log which underlying model `openrouter/free` actually routed to (check `completion.model` in the response) — confirm it's a real, non-empty model id, since the router picks randomly among available free models.
  4. Run it 3 times and confirm it doesn't always fail on the same underlying model if that model happens to be rate-limited (i.e., confirm the router actually retries/reroutes).

### Mini-Phase 2.4 — Unified Fallback Engine
**Implementation:**
- In `backend/ai_engine.py`, locate `generate_metadata` and implement an ordered, exception-catching cascade. Given OpenCode Zen's free tier is the least stable (promo-based, can disappear), place it **after** OpenRouter, not before:
  ```python
  FALLBACK_CHAIN = [
      ("groq", generate_with_groq),
      ("gemini", generate_with_gemini),
      ("openrouter", generate_with_openrouter),
      ("opencode_zen", generate_with_opencode),
      ("local_gguf", generate_with_local_model),
  ]

  async def generate_metadata(system_prompt: str, user_prompt: str) -> tuple[str, str]:
      last_error = None
      for name, fn in FALLBACK_CHAIN:
          try:
              result = await fn(system_prompt, user_prompt)
              return result, name  # return which tier actually served the request
          except Exception as e:
              last_error = e
              logger.warning(f"[fallback] {name} failed: {e}")
              continue
      raise RuntimeError(f"All providers failed. Last error: {last_error}")
  ```
  - Returning `(result, name)` (which tier served the request) is deliberate — you'll want this for the Mini-Phase 2.4 test and for production observability.
- **Mini-Phase 2.4 Testing & Validation:**
  1. Create `tests/test_model_fallback.py` using mocks: force `generate_with_groq` and `generate_with_gemini` to raise `TimeoutError`, leave OpenRouter working. Assert the function returns a result and that the returned tier name is `"openrouter"`.
  2. Repeat forcing Groq, Gemini, and OpenRouter all to fail — assert it falls to `opencode_zen`.
  3. Repeat forcing all four cloud tiers to fail — assert it falls to `local_gguf`.
  4. Confirm each failure is logged with the provider name and error, so a real production failure is diagnosable from logs alone.

### End-of-Phase 2 — Deep Validation (must pass before Phase 3 starts)
- [ ] Run a real (non-mocked) end-to-end request through the full chain with all four cloud providers' keys valid — confirm it returns a result from `groq` (the top of the chain) under normal conditions.
- [ ] Run the same real request with the Groq API key temporarily corrupted (e.g., appended garbage) — confirm it correctly cascades to `gemini` and still returns a valid result.
- [ ] Confirm no API key ever appears in plaintext in logs (grep your log output for each key value after a full test run).
- [ ] Confirm total latency of a full-chain failure (all four cloud tiers down, falling to local) is within an acceptable bound for your app — this is the worst case and it's the one users will actually notice.
- [ ] Commit Phase 2 in isolation before starting Phase 3.

---

# Phase 3 — Dynamic Local Model Support

**Goal:** Let the backend and frontend switch between multiple downloaded GGUF models instead of one hardcoded model.

### Step 3.0 — Pre-Phase Verification
- [ ] Confirm Phase 2's end-of-phase checklist is signed off.
- [ ] Confirm current disk space available for multiple GGUF files (`df -h`) — running several 7–8B Q4 GGUFs simultaneously downloaded can easily be 20–30GB combined; confirm this fits before downloading anything.
- [ ] Confirm `download_model.py` currently succeeds for the existing Mistral model as a baseline (`python download_model.py` should still work unmodified before you touch it).
- [ ] Note current RAM available (`free -h` or equivalent) — this determines how many local models you can realistically keep warm vs. load-on-demand.

### Mini-Phase 3.1 — Backend Dynamic Loader
**Implementation:**
- In `download_model.py`, replace the hardcoded `REPO_ID` with:
  ```python
  SUPPORTED_MODELS = {
      "mistral-7b": {"repo_id": "<existing mistral repo id>", "filename": "<existing gguf filename>"},
      "llama-3-8b": {"repo_id": "<llama 3 gguf repo>", "filename": "<gguf filename>"},
      "qwen-2.5-7b": {"repo_id": "<qwen gguf repo>", "filename": "<gguf filename>"},
      "phi-4-mini": {"repo_id": "<phi-4 gguf repo>", "filename": "<gguf filename>"},
  }
  ```
- In `backend/main.py`, extend the `/api/generate` Pydantic request schema:
  ```python
  class GenerateRequest(BaseModel):
      # ...existing fields...
      local_model_name: str | None = None  # must match a key in SUPPORTED_MODELS
  ```
  - Validate it against `SUPPORTED_MODELS.keys()` explicitly and return a 400 with a clear message if it doesn't match — don't let an invalid string reach the `Llama()` constructor.
- In `backend/ai_engine.py`, refactor the `Llama` initialization to lazy-load per model name, with a simple in-memory cache so switching models doesn't re-load from disk on every request:
  ```python
  _loaded_models: dict[str, Llama] = {}

  def get_local_model(name: str) -> Llama:
      if name not in _loaded_models:
          path = get_gguf_path_for(name)  # from download_model.py's SUPPORTED_MODELS
          _loaded_models[name] = Llama(model_path=path, n_ctx=4096)
      return _loaded_models[name]
  ```
- **Mini-Phase 3.1 Testing & Validation:**
  1. Send direct `curl` POSTs to `/api/generate` with each valid `local_model_name` value one at a time; confirm each returns a valid generation and the backend logs show the correct GGUF file path being loaded.
  2. Send a request with an invalid `local_model_name` (e.g., `"gpt-9000"`); confirm a clean 400 response, not a stack trace or crash.
  3. Send two requests in sequence with two different valid model names; confirm the second request doesn't silently reuse the first model's weights (i.e., confirm the cache keys correctly by name).
  4. Monitor RAM before, during, and after loading 2–3 models in the cache; confirm it stays within your available memory from Step 3.0's check.

### Mini-Phase 3.2 — Frontend UI Selector
**Implementation:**
- In `frontend/components/metagen/Header.tsx` (or the settings panel), add:
  ```tsx
  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
    <option value="">Cloud Auto-Failover</option>
    <option value="mistral-7b">Local - Mistral 7B</option>
    <option value="llama-3-8b">Local - Llama 3 8B</option>
    <option value="qwen-2.5-7b">Local - Qwen 2.5 7B</option>
    <option value="phi-4-mini">Local - Phi-4 Mini</option>
  </select>
  ```
- In `frontend/hooks/useStreamGenerate.ts`, include `local_model_name: selectedModel || undefined` in the JSON payload sent to `/api/generate`.
- **Mini-Phase 3.2 Testing & Validation:**
  1. Launch the dev server, open browser DevTools Network tab.
  2. Select each dropdown option in turn, submit a generation, and confirm the request payload's `local_model_name` field exactly matches the selected option's value.
  3. Confirm selecting "Cloud Auto-Failover" sends `local_model_name: undefined` (or omits the field), not the literal string `"Cloud Auto-Failover"`.
  4. Confirm switching models mid-session (without a page reload) correctly changes the payload on the very next request.

### End-of-Phase 3 — Deep Validation (must pass before Phase 4 starts)
- [ ] Full end-to-end test: select each of the 4 dropdown options in the running UI, submit a generation for each, and confirm correct output is produced and correct model was loaded (cross-check backend logs against frontend selection).
- [ ] Confirm switching models in rapid succession (5+ switches in under a minute) doesn't leak memory — re-check RAM usage after this stress test vs. before.
- [ ] Confirm the existing "Cloud Auto-Failover" (Phase 2's fallback chain) still works completely unmodified after these changes — Phase 3 must not have broken Phase 2.
- [ ] Commit Phase 3 in isolation before starting Phase 4.

---

# Phase 4 — Fine-Tuning Notebooks for New Base Models

**Goal:** Produce clean, isolated Colab notebooks for fine-tuning additional open-source models, without breaking the existing Mistral 7B fine-tuning pipeline.

### Step 4.0 — Pre-Phase Verification
- [ ] Confirm Phase 3's end-of-phase checklist is signed off.
- [ ] Confirm the existing `YT_Model_Brain.ipynb` (Mistral) still runs top-to-bottom without modification — this is your working baseline and reference for dataset loading/formatting code you'll be adapting per model.
- [ ] Confirm your current dataset file/location and format (columns, JSON schema) is unchanged and accessible from a fresh Colab runtime.
- [ ] Confirm Colab GPU availability at your current tier is sufficient for QLoRA fine-tuning of a 7–9B model (T4/A100 depending on tier) — note this before creating any new notebook.

### Mini-Phase 4.1 — Qwen3.5-9B Notebook (recommended primary addition — Apache 2.0 license, strong current reasoning)
**Implementation:**
- Create `YT_Model_Brain_Qwen35.ipynb` as a copy of the baseline notebook.
- Replace the dataset formatting function with the ChatML template:
  ```python
  def format_example(instruction, input_text, output):
      return (
          f"<|im_start|>user\n{instruction}\n{input_text}<|im_end|>\n"
          f"<|im_start|>assistant\n{output}<|im_end|>"
      )
  ```
- Update the base model repo id to the Qwen3.5-9B (or Qwen3.6, whichever is current at implementation time — check Hugging Face for the latest Apache-2.0-licensed Qwen release) and confirm the tokenizer's special tokens include `<|im_start|>`/`<|im_end|>` natively (don't add them as new tokens if the tokenizer already has them — check `tokenizer.special_tokens_map` first).
- **Mini-Phase 4.1 Testing & Validation:**
  1. Dry-run `format_example(...)` on 5 sample dataset rows; print output and manually confirm correct template structure.
  2. Round-trip test: tokenize a formatted example, decode it back, confirm it matches the original string exactly (catches silent token-splitting issues).
  3. Load the base model + tokenizer only (no training yet) in the Colab runtime; confirm no OOM and no tokenizer/model mismatch warnings.

### Mini-Phase 4.2 — Llama 3.1/3.3 8B Notebook (broadest fine-tune ecosystem, Meta community license)
**Implementation:**
- Create `YT_Model_Brain_Llama3.ipynb`.
- Dataset formatting using Llama 3's special tokens:
  ```python
  def format_example(instruction, input_text, output):
      return (
          f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n"
          f"{instruction}\n{input_text}<|eot_id|>"
          f"<|start_header_id|>assistant<|end_header_id|>\n{output}<|eot_id|>"
      )
  ```
- **Mini-Phase 4.2 Testing & Validation:** same three checks as Mini-Phase 4.1 (dry-run formatting, tokenizer round-trip, base model load test), applied to this notebook.

### Mini-Phase 4.3 — Phi-4-Mini Notebook (restored — critical for lower-end hardware)
**Why this one is kept in the lineup:** Phi-4-Mini is 3.8B parameters, roughly half the size of the 7–9B models used in Mini-Phases 4.1 and 4.2. In practice that means it needs roughly half the RAM/VRAM to fine-tune and run, and it runs about twice as fast as the 7B-class models on standard laptop hardware. It's the one you reach for whenever the deployment target is lower-end hardware rather than a GPU box.

**Implementation:**
- Create `YT_Model_Brain_Phi4.ipynb`.
- Implement Microsoft's Phi-4 instruct template.
- Adjust `BitsAndBytesConfig`/LoRA target modules — Phi models target `Wqkv` (fused attention matrix), not the separate `q_proj`/`k_proj`/`v_proj` used by Llama/Qwen:
  ```python
  lora_config = LoraConfig(
      target_modules=["Wqkv", "out_proj"],  # confirm against the actual model's named_modules() output
      # ...
  )
  ```
- **Mini-Phase 4.3 Testing & Validation:**
  1. Same dry-run formatting + tokenizer round-trip checks as above.
  2. Run `model.named_modules()` and grep for `Wqkv` to confirm the target module name is correct for the exact Phi-4-mini checkpoint you've pulled (module names can vary slightly between quantized/unquantized variants) before starting a training run.

### End-of-Phase 4 — Deep Validation
- [ ] For each of the three new notebooks, run a tiny smoke fine-tune (e.g., 20–50 steps on a 20-row subset of your dataset) end-to-end: load → tokenize → train → save adapter.
- [ ] Confirm training loss decreases over those steps (even slightly) — a flat or NaN loss means the formatting/tokenization is wrong, not that more steps are needed.
- [ ] Load the saved LoRA adapter back onto the base model and run one inference call; confirm output is coherent text in the expected format (not garbled tokens, not an error).
- [ ] Confirm the original Mistral notebook (baseline) still runs unmodified after all this — these are separate notebooks and shouldn't have touched shared dataset files.
- [ ] Only after this passes for all three notebooks do you move to a full-scale training run on any of them, and only one at a time.

---

## Bonus: Is training a model from scratch feasible?

Short answer: **no, not for this project, and it isn't close.**

- **Compute cost.** Even a small (1–3B parameter) competent base model needs on the order of hundreds of billions to low trillions of training tokens and typically weeks on a multi-GPU (often multi-node) cluster — realistically tens of thousands to low millions of dollars in compute, before data costs.
- **Data.** You'd need a filtered, deduplicated, web-scale pretraining corpus plus tokenizer training and eval infrastructure — a separate research-engineering effort from the model training itself.
- **You don't need it.** Fine-tuning (what you're already doing with Mistral 7B, and expanding in Phase 4) gets you nearly all the practical benefit — domain adaptation, style, task behavior — for a tiny fraction of the cost, since you start from weights that already encode general language ability.
- **A middle ground, if you ever want more control than LoRA gives you:** continued pretraining (further pretraining an existing open model on your domain data before instruction-tuning) or full fine-tuning of a small 1–3B model. Both are far cheaper than pretraining from scratch and still produce a genuinely "yours" model.