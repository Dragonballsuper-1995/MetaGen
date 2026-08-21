# PRD.md — MetaGen Product Requirements Document

## 1. Product Overview

### 1.1 Product Name
**MetaGen** (AI-Powered Video SEO & Metadata Generator)

### 1.2 One-Line Summary
A high-performance full-stack AI platform that transforms raw video scripts, outlines, and transcripts into algorithmically optimized YouTube titles, descriptions, tags, and quantitative SEO diagnostics in under 1.5 seconds.

### 1.3 Product Vision
Eliminate the friction and guesswork of YouTube content publishing by providing creators with an intelligent, dual-path inference engine that delivers high-CTR curiosity hooks, algorithmically grounded descriptions, structured tags, and visual preview simulations with zero downtime.

### 1.4 Product Philosophy
- **Speed & Flow:** Instant perception through real-time Server-Sent Events (SSE) streaming (~500 tokens/sec).
- **Algorithmic Rigor:** Deep keyword extraction and anti-echo grounding—metadata must accurately represent the video without verbatim copying.
- **Reliability:** Dual-path hybrid inference. If cloud APIs experience outages or rate limits, the system seamlessly falls back to an offline local model.
- **Cinematic Experience:** Premium glassmorphism UI/UX with zero layout shift, dark/light dynamic theming, and terminal-grade telemetry.

---

## 2. Problem Statement

YouTube creators and video marketing teams spend significant time drafting titles, descriptions, and tags. Existing solutions suffer from:
1. **Generic Output:** Standard AI tools generate clickbait titles that lack topic grounding or regurgitate the input script verbatim.
2. **Inflexible AI Dependencies:** Most tools rely on single proprietary cloud APIs that fail during outages or rate-limiting.
3. **Lack of Diagnostic Transparency:** Creators cannot see *why* a metadata package is effective or how it scores against YouTube algorithm benchmarks.
4. **Poor UI/UX:** Cluttered, bloated dashboards that slow down the creator workflow.

MetaGen solves these problems by combining ultra-fast LPU cloud inference with local fallback execution, strict SEO heuristics, and a dedicated creator-focused interface.

---

## 3. Goals and Objectives

### 3.1 Primary Goals
1. **Ultra-Fast Generation:** Deliver complete metadata packages in under 1.5 seconds using Groq LPU streaming.
2. **Dual-Path Hybrid Architecture:** Automatic failover between primary cloud models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`) and local CPU execution (`Mistral 7B Q4_K_M GGUF`).
3. **Structured SEO Output:** Enforce strict length bounds (Title: 40–80 chars, Description: 150–300 words with CTAs, Tags: 5–12 multi-word tags).
4. **Quantitative SEO Scoring:** Real-time scoring across Title Hook, Description Depth, Tag Quality, Keyword Relevance, and Readability.
5. **A/B Title Variants:** Provide 3 distinct psychological angles (Curiosity & High CTR, Search & SEO Ranked, Direct Tutorial & Action).

### 3.2 Secondary Goals
1. **Free / Low-Cost Operation:** Prioritize 100% free developer tiers (GroqCloud Free, Gemini Flash Free, OpenRouter Free, Local GGUF).
2. **Modular Extensibility:** Clean decoupling allowing independent on-demand activation of future features (Chapters, Thumbnails, Shorts, Audio Ingestion).

---

## 4. Target Users

### 4.1 Primary Audience
- **Tech & Software YouTubers:** Need precise, spec-accurate metadata and technical tags.
- **Educators & Course Creators:** Require structured descriptions with key takeaways and clear search ranking.
- **Video Editors & Marketing Agencies:** Need fast batch processing and copy-ready formatting for clients.

### 4.2 User Personas
- **Alex (Solo Tech Creator):** Records coding tutorials, wants high-CTR titles and structured descriptions in seconds before hitting publish.
- **Sarah (Agency Content Lead):** Manages 10 client channels, needs consistent SEO scoring and multi-angle title ideas for A/B testing.
- **David (Educator / Podcaster):** Produces 45-minute deep dives, needs grounded summaries and keyword-rich tags that rank on Google Search.

---

## 5. System Architecture & Tech Stack

### 5.1 Frontend (Next.js 16 + React 19)
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS 4, Vanilla CSS variables (OKLCH color system)
- **Animations:** Framer Motion (LazyMotion optimization)
- **State Management:** Custom React hooks (`useStreamGenerate`, `useHistory`, `useTitleVariants`)
- **Deployment:** Vercel

### 5.2 Backend (FastAPI + Python 3.11)
- **Framework:** FastAPI with asynchronous lifecycle management
- **Primary Inference:** Groq API (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`)
- **Fallback Inference:** `llama-cpp-python` running Mistral 7B Q4_K_M GGUF (CPU-optimized)
- **Keyword Engine:** Zero-dependency term-frequency & n-gram extraction ([`keyword_extractor.py`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/backend/keyword_extractor.py))
- **Deployment:** Hugging Face Spaces (Dockerized CPU environment)

---

## 6. Functional Requirements

### 6.1 Script Input & Presets
- Support raw text input, pasted scripts, or outlines (20 to 3,000 characters).
- Live input telemetry: Character count, word count, and estimated speaking time ($\sim 130\text{ wpm}$).
- One-click sample presets (Tech Review, Vlog, Educational, Architecture).

### 6.2 Model Selection & Strategy
- Model Choice Selector:
  - `Auto (Hybrid)`: Automatic failover from Groq 120B $\rightarrow$ Llama 70B $\rightarrow$ Llama 8B $\rightarrow$ Local Mistral 7B.
  - `Groq 120B`: Explicit cloud LPU execution.
  - `Mistral 7B`: Explicit local HF Spaces execution.
- Real-time SSE token streaming over `/api/generate/stream`.

### 6.3 Metadata Output Contract
Each generation must produce:
1. **Title:** High-converting, bounded between 40 and 85 characters, enriched with grounded topic entities.
2. **Description:** 150 to 300 words with strong introductory hook, value breakdown, and engagement call-to-action.
3. **Tags:** 5 to 12 multi-word tags (2–4 words per tag, $\le 30$ chars each).
4. **SEO Diagnostics:** Composite score (0–100) and 5-factor breakdown.
5. **Model Telemetry:** Active model name, generation duration, and token count.

### 6.4 Creator Output Tools
- One-click "Copy All Metadata" formatted for YouTube Studio.
- Individual section copy buttons (Title, Description, Comma-separated Studio tags).
- Live YouTube Snippet Simulator (Desktop and Mobile search result view).
- Multi-Angle Title Switcher with CTR estimates.
- Session-persisted History Drawer (last 50 generations cached in LocalStorage).

---

## 7. Non-Functional Requirements

### 7.1 Performance & Latency
- **Time to First Token (TTFT):** $<350\text{ ms}$ on Groq LPU.
- **Full Stream Completion:** $<1.5\text{ s}$ on Groq, $<25\text{ s}$ on HF Spaces CPU.
- **Frontend Load Performance:** Zero Layout Shift (CLS = 0), First Contentful Paint (FCP) $<0.8\text{ s}$.

### 7.2 Reliability & Availability
- Automatic graceful degradation from Cloud to Local GGUF.
- Background keep-warm heartbeat daemon (`backend/services/model_runtime.py`) preventing CPU memory eviction.
- Rate limiting via SlowAPI (`10/minute` default).

### 7.3 Security
- API key verification support via `X-API-Key` header.
- CORS restricted to configured production and local development origins.
- Zero client-side exposure of private secrets.

---

## 8. Standalone Future Modules (On-Hold Index)

Detailed standalone specifications are located in [`features/`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/):
- **F-01:** Auto Video Chapters & Timestamps ([`features/01_auto_chapters_and_timestamps.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/01_auto_chapters_and_timestamps.md))
- **F-02:** AI Thumbnail Concept & Visual Hook Studio ([`features/02_ai_thumbnail_concept_studio.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/02_ai_thumbnail_concept_studio.md))
- **F-03:** YouTube Shorts & Reels Viral Mode ([`features/03_shorts_and_reels_viral_mode.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/03_shorts_and_reels_viral_mode.md))
- **F-04:** YouTube URL & Whisper Audio Ingestion ([`features/04_youtube_url_and_whisper_ingestion.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/04_youtube_url_and_whisper_ingestion.md))
- **F-05:** Creator Persona & Tone Customizer ([`features/05_creator_persona_and_tone_customizer.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/05_creator_persona_and_tone_customizer.md))
- **F-06:** 1-Click YouTube Studio Export (OAuth) ([`features/06_youtube_studio_oauth_export.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/06_youtube_studio_oauth_export.md))
- **F-07:** Keyword Search Volume & Competition Insights ([`features/07_keyword_search_volume_insights.md`](file:///C:/Users/sujal/Documents/Projects/MetaGen-Production/features/07_keyword_search_volume_insights.md))
