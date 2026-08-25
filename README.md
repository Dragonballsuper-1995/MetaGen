<div align="center">
  
# 🚀 MetaGen | AI-Powered YouTube Metadata Studio

[![Live Frontend](https://img.shields.io/badge/Frontend-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://metagen-one.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Live_on_Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/spaces/SujalChhajed925/MetaGen)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-16_Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)]()

A high-performance, full-stack AI engineering platform that transforms raw video scripts into high-CTR YouTube titles, SEO-optimized descriptions, structured tags, and authentic search previews in real-time.

</div>

---

## 🌟 Overview

**MetaGen** eliminates the friction of video publishing. By providing a video script or transcript, creators receive a full YouTube optimization package with real-time SSE token streaming, multi-tier cloud failover, custom fine-tuned GGUF inference, A/B curiosity title hooks, and an authentic YouTube search & mobile feed simulator.

---

## 🧠 Supported Models Matrix

MetaGen supports both ultra-fast cloud LPUs and custom fine-tuned open-source LLMs fine-tuned specifically for YouTube metadata generation and SEO optimization:

### 1. Custom Fine-Tuned Local Models (GGUF / llama.cpp)

| Model Name | Parameters | Quantization | Hugging Face Repository | Chat Template | Key Strength |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **Microsoft Phi-4 Mini** | 3.8B | `Q4_K_M` | [`SujalChhajed925/yt-seo-phi4-merged`](https://huggingface.co/SujalChhajed925/yt-seo-phi4-merged) | `ChatML` | Ultra-fast lightweight inference & compact memory footprint |
| **Alibaba Qwen 2.5** | 7B | `Q4_K_M` | [`SujalChhajed925/yt-seo-qwen2.5-merged`](https://huggingface.co/SujalChhajed925/yt-seo-qwen2.5-merged) | `ChatML` | High tag precision, dense keyword extraction, & structured JSON |
| **Meta Llama 3.1** | 8B | `Q4_K_M` | [`SujalChhajed925/yt-seo-llama3-merged`](https://huggingface.co/SujalChhajed925/yt-seo-llama3-merged) | `Llama-3` | High-CTR title hooks, curiosity framing, & engaging descriptions |
| **Mistral 7B** | 7B | `Q4_K_M` | [`SujalChhajed925/yt-seo-mistral-merged`](https://huggingface.co/SujalChhajed925/yt-seo-mistral-merged) | `Mistral-Instruct` | Balanced baseline SEO generation with deep formatting rules |

### 2. Cloud Multi-Tier Fallback Cascade

| Tier | Provider | Engine / Model | Latency | Capability |
| :---: | :--- | :--- | :---: | :--- |
| **Tier 1** | **Groq LPU** | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b` | **~300–800 t/s** | Sub-second real-time token streaming |
| **Tier 2** | **Google Gemini** | `gemini-2.5-flash` / `gemini-3.6-flash` | **Fast** | Large context window and deep semantic comprehension |
| **Tier 3** | **OpenCode Zen** | `laguna-2.1` | **Fast** | Free high-availability gateway |
| **Tier 4** | **OpenRouter** | Free Gateway | **Standard** | Multi-provider fallback |
| **Tier 5** | **Local GGUF** | Native `llama-cpp-python` / CPU / CUDA | **Offline** | Zero external dependency local generation |

---

## ✨ Key Features

- **Single-Viewport Studio Cockpit:** A refined, zero-scroll interface fitting within `100vh` on standard desktop screens with internal card scrolling for long content.
- **Morphing Physical Card:** Smooth expanding card interface with preset samples (Tech Review, Tutorials, Travel Vlog) and character counters.
- **Single Active Title Carousel:** Switch smoothly between *Curiosity & High CTR*, *Search & SEO Dominant*, and *Direct Action & Tutorial* angles with character count and optimal CTR length scoring.
- **Interactive SEO Diagnostics Scorecard:** Real-time 0–100 SEO calculation analyzing *Title Hook*, *Description Depth*, *Tag Relevance*, *Keyword Density*, and *Readability*.
- **Authentic YouTube Live Simulator:** Dedicated tab previewing how your video will look on **Desktop Search Grids** and **Mobile App Feeds** with 16:9 thumbnails, timestamps, and channel badges.
- **Real-Time Token Streaming:** Live terminal stream preview in the loading matrix using Server-Sent Events (SSE) with early keyword extraction.
- **Dynamic Context Eviction:** Backend automatically manages memory when switching between 4GB+ GGUF models to prevent OOM errors on constrained environments (16GB RAM limits).

---

## 📁 Clean Repository Structure

```
MetaGen-Production/
├── backend/
│   ├── ai_engine.py           # Multi-tier LLM inference, dynamic GGUF switching, and chat templates
│   ├── config.py              # Centralized Pydantic v2 settings & model cascade configuration
│   ├── logger.py              # Structured logging with safe UTF-8 encoding
│   ├── main.py                # FastAPI endpoints (/api/generate, /api/generate/stream, /health)
│   └── services/              # Model runtime warmers and background thread managers
├── data/
│   └── youtube_finetuning_dataset.json # Fine-tuning dataset for YouTube metadata optimization
├── docs/
│   ├── api_and_model_expansion_plan.md # Technical implementation plan & roadmap
│   └── benchmark_report.md             # Offline model benchmark & compliance evaluation
├── frontend/
│   ├── app/                   # Next.js 16 App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/metagen/    # Studio UI (TerminalCore, OutputGrid, YoutubePreview, Header, etc.)
│   ├── hooks/                 # Custom React hooks (useStreamGenerate, useHistory)
│   └── lib/                   # TypeScript types, constants, and SSE stream parsers
├── notebooks/
│   ├── YT_Model_Brain.ipynb          # Mistral 7B QLoRA fine-tuning notebook
│   ├── YT_Model_Brain_Phi4.ipynb     # Phi-4 Mini 3.8B QLoRA fine-tuning notebook
│   ├── YT_Model_Brain_Qwen.ipynb     # Qwen 2.5 7B QLoRA fine-tuning notebook
│   └── YT_Model_Brain_Llama3.ipynb   # Llama 3.1 8B QLoRA fine-tuning notebook
├── scripts/
│   ├── benchmark_models.py    # Automated SEO scoring & latency benchmark runner
│   ├── dataset_builder.py     # Script for generating training datasets
│   └── merge_local.py         # Script for merging LoRA adapters with base checkpoints
├── tests/
│   ├── fixtures/              # Evaluation test scripts (eval_scripts.json)
│   ├── test_model_fallback.py # Unit tests for model normalization & failover
│   ├── test_live_stream.py    # Live SSE streaming integration test
│   └── verify_*.py            # Model integrity & provider verification scripts
├── download_model.py          # Dynamic GGUF model downloader & catalog registry
├── requirements_hf.txt        # Production dependencies
├── run_app.py                 # Fast container entrypoint with non-blocking model preload
├── Dockerfile                 # Containerized deployment config for Hugging Face Spaces
├── PRD.md                     # Product Requirements Document
└── README.md                  # Project Documentation
```

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Dragonballsuper-1995/MetaGen.git
cd MetaGen-Production
```

### 2. Setup the Backend
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows (or `source venv/bin/activate` on Linux/macOS)

# Install dependencies
pip install -r requirements_hf.txt

# Start the FastAPI server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Setup the Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Benchmarking

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

## 📄 License
MIT License. Built for creators and developers.
