<div align="center">

# MetaGen

**AI-Powered YouTube Metadata Studio**

A high-performance full-stack platform that transforms video scripts into high-CTR titles, SEO-optimized descriptions, and structured tags with real-time SSE streaming, custom fine-tuned GGUF inference, and multi-tier cloud failover.

[![Live Frontend](https://img.shields.io/badge/Frontend-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://metagen-one.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Live_on_Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/spaces/SujalChhajed925/MetaGen)
[![Keep-Alive](https://img.shields.io/badge/Keep--Alive-cron--job.org-2ba02c?style=for-the-badge&logo=clock&logoColor=white)](https://cron-job.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-16_Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)]()

</div>

---

## Features

- **Real-Time Token Streaming:** Sub-second Server-Sent Events (SSE) metadata generation powered by Groq LPUs (~300–800 tok/s) with early tag extraction.
- **Multi-Tier Fallback Cascade:** Resilient cascade from Groq (120B / 20B / Qwen 27B) → Google Gemini Flash → Local GGUF offline engine.
- **Custom Fine-Tuned GGUF Models:** 6 domain-specific SLMs/LLMs fine-tuned on YouTube metadata datasets and converted to 4-bit GGUFs for efficient CPU/GPU inference.
- **Dynamic Context Eviction:** Intelligent memory manager that evicts inactive GGUFs before loading new ones, preventing OOM errors on RAM-constrained hosts.
- **SEO Diagnostics & Simulator:** Instant 0–100 quality scoring paired with authentic YouTube desktop search and mobile feed previews.
- **24/7 Zero Cold Starts:** Automated healthcheck pinging prevents free-tier container sleep.

---

## Custom Fine-Tuned Local Models (GGUF)

MetaGen includes 6 custom models fine-tuned specifically for YouTube metadata generation, quantized to `Q4_K_M` for local CPU/GPU execution via `llama-cpp-python`:

| Model | Parameters | Quantization | Hugging Face Repository | Primary Focus |
| :--- | :---: | :---: | :--- | :--- |
| **Meta Llama 3.2** | 1B | `Q4_K_M` | [`SujalChhajed925/yt-seo-llama3.2-1b-merged`](https://huggingface.co/SujalChhajed925/yt-seo-llama3.2-1b-merged) | Ultra-lightweight SLM (~750MB), ~40 tok/s CPU, high-velocity hook generation |
| **Alibaba Qwen 2.5** | 1.5B | `Q4_K_M` | [`SujalChhajed925/yt-seo-qwen2.5-1.5b-merged`](https://huggingface.co/SujalChhajed925/yt-seo-qwen2.5-1.5b-merged) | Ultra-compact tag extractor (<1.1GB), structured JSON reliability |
| **Microsoft Phi-4 Mini** | 3.8B | `Q4_K_M` | [`SujalChhajed925/yt-seo-phi4-merged`](https://huggingface.co/SujalChhajed925/yt-seo-phi4-merged) | Compact memory footprint and structured output generation |
| **Alibaba Qwen 2.5** | 7B | `Q4_K_M` | [`SujalChhajed925/yt-seo-qwen2.5-merged`](https://huggingface.co/SujalChhajed925/yt-seo-qwen2.5-merged) | High tag precision, dense keyword extraction, and structured JSON |
| **Meta Llama 3.1** | 8B | `Q4_K_M` | [`SujalChhajed925/yt-seo-llama3-merged`](https://huggingface.co/SujalChhajed925/yt-seo-llama3-merged) | High-CTR title hooks, curiosity framing, and narrative descriptions |
| **Mistral 7B** | 7B | `Q4_K_M` | [`SujalChhajed925/yt-seo-mistral-merged`](https://huggingface.co/SujalChhajed925/yt-seo-mistral-merged) | Balanced baseline SEO generation with deep formatting rules |

> Models are managed via `download_model.py` and loaded dynamically. The runtime enforces strict context eviction when switching between models to stay within host RAM limits.

---

## Cloud Inference & Fallback Cascade

For high-concurrency and sub-second generation, MetaGen routes requests through a multi-tier fallback cascade:

1. **Tier 1 (Groq LPU):** `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.6-27b` delivering ~300–800 tok/s.
2. **Tier 2 (Google Gemini):** `gemini-2.5-flash` for deep semantic reasoning and fallback on rate limits.
3. **Tier 3 (Local GGUF):** Offline execution via local fine-tuned checkpoints when cloud APIs are unreachable.

---

## 24/7 Keep-Alive Architecture (cron-job.org)

Hugging Face Spaces (CPU Basic) puts inactive containers into a sleep state after **48 hours of zero traffic**, resulting in a **45–90 second cold start** on subsequent requests.

MetaGen eliminates cold starts using an automated external keep-alive cron job:

- **Service:** [cron-job.org](https://cron-job.org)
- **Schedule:** Every **10 minutes**
- **Target:** `GET https://sujalchhajed925-metagen.hf.space/health`
- **Execution:** The `/health` endpoint responds in `<5ms` (`{"status":"healthy"}`) without loading heavy model weights or consuming CPU quotas.
- **Outcome:** The 48-hour idle timer continuously resets, keeping the backend container permanently warm 24/7 with zero hosting costs and instant response times.

---

## Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend

```bash
# Setup virtual environment
python -m venv venv
venv\Scripts\activate  # Windows (or `source venv/bin/activate` on Linux/macOS)

# Install dependencies
pip install -r requirements_hf.txt

# Start backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Verification

```bash
# 1. Run backend unit tests & failover cascade assertions
python -m pytest tests/test_model_fallback.py -v

# 2. Run model file integrity verification
python tests/verify_downloaded_models.py

# 3. Run full automated SEO benchmark matrix
python scripts/benchmark_models.py --models auto,groq-120b,gemini --samples 10

# 4. Run live SSE streaming smoke test
python tests/test_live_stream.py

# 5. Verify frontend TypeScript & static build
cd frontend && npx tsc --noEmit && npm run build
```

---

## License

[MIT](LICENSE) © MetaGen Contributors
