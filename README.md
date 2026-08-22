---
title: MetaGen
emoji: 🚀
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

<div align="center">
  
# 🚀 MetaGen | AI-Powered Video Metadata Studio

[![Live Frontend](https://img.shields.io/badge/Frontend-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://metagen-one.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Live_on_Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/spaces/SujalChhajed925/MetaGen)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-16_Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white)]()

A high-performance, full-stack AI engineering platform that transforms raw video scripts into high-CTR YouTube titles, SEO-optimized descriptions, structured tags, and authentic search previews in real-time.

</div>

---

## 🌟 Overview

MetaGen eliminates the friction of video publishing. By providing a video script or transcript, creators receive a full YouTube optimization package with real-time SSE token streaming, multi-tier cloud fallback, A/B curiosity title hooks, and an authentic YouTube search & mobile feed simulator.

### Dual-Path Hybrid Inference Engine
1. **Lightning Cloud Engine (Groq LPUs):** Uses Groq's high-speed LPUs streaming at **~500 to 1000 tokens/sec** with automatic multi-tier cloud failover (`openai/gpt-oss-120b` $\rightarrow$ `openai/gpt-oss-20b` $\rightarrow$ `qwen/qwen3.6-27b`).
2. **Offline Local Fallback (Mistral 7B GGUF):** If cloud APIs encounter network partitions or rate limits, the engine gracefully falls back to a locally hosted GGUF model (`llama-cpp-python` on CPU), ensuring uninterrupted operation.

---

## ✨ Key Features

- **Single-Viewport Studio Cockpit:** A refined, zero-scroll interface fitting within `100vh` on standard desktop screens with internal card scrolling for long content.
- **Single Active Title Carousel:** Switch smoothly between *Curiosity & High CTR*, *Search & SEO Dominant*, and *Direct Action & Tutorial* angles with character count and optimal CTR length scoring.
- **Interactive SEO Diagnostics Scorecard:** Displays a prominent overall score (`99.2% SEO SCORE`) that reveals a breakdown (*Title Hook, Description Depth, Tag Relevance, Keyword Density, Readability*) on hover.
- **Authentic YouTube Live Simulator:** Dedicated tab previewing how your video will look on **Desktop Search Grids** and **Mobile App Feeds** with 16:9 4K thumbnails, timestamps, and channel badges.
- **Live Telemetry Ribbon:** Real-time marquee footer tracking Groq LPU inference latency, generation speed (tokens/sec), and precise Time-to-First-Token (TTFT) metrics.
- **Real-Time Token Streaming:** Live terminal stream preview in the loading matrix using Server-Sent Events (SSE) with early keyword extraction.
- **Neural Cache Session History:** Persists past generations locally with one-click restore and copy.

---

## 📁 Repository Structure

```
MetaGen-Production/
├── backend/
│   ├── ai_engine.py           # Multi-tier LLM inference, Groq failover, and TF-IDF extraction
│   ├── config.py              # Pydantic v2 settings & model cascade configuration
│   ├── logger.py              # Structured logging with safe UTF-8 encoding
│   └── main.py                # FastAPI endpoints (/api/generate, /api/generate/stream, /health)
├── frontend/
│   ├── app/                   # Next.js 16 App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/metagen/    # Studio UI (Header, TerminalCore, OutputGrid, YoutubePreview, etc.)
│   ├── hooks/                 # Custom React hooks (useStreamGenerate, useHistory)
│   └── lib/                   # Types, constants, and SSE parsers
├── features/                  # Standalone feature specifications (Modules A–G)
├── tests/                     # Pytest unit tests & live SSE verification scripts
├── PRD.md                     # Official Product Requirements Document
└── Dockerfile                 # Hugging Face Spaces CPU deployment configuration
```

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS (v4), Vanilla CSS design tokens
- **Animations:** Framer Motion
- **Streaming:** Native `ReadableStream` & SSE chunk parser

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Primary Cloud Models:** `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`
- **Fallback Local Model:** Mistral 7B Q4_K_M GGUF (`llama-cpp-python`)
- **Deployment:** Dockerized for Hugging Face Spaces & Vercel

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Dragonballsuper-1995/MetaGen.git
cd MetaGen
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

## 🧪 Testing

```bash
# Run backend model fallback & normalization tests
python -m pytest tests/test_model_fallback.py -v

# Run live SSE stream verification
python tests/test_live_stream.py

# Verify frontend production build
cd frontend && npm run build
```

---

## 📄 License
MIT License. Built for creators and developers.
