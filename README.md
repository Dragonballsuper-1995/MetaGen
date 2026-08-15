<div align="center">
  
# 🚀 MetaGen | AI-Powered Video Metadata Generator

[![Live Frontend](https://img.shields.io/badge/Frontend-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://metagen-one.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Live_on_Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/spaces/SujalChhajed925/MetaGen)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)]()

A high-performance, full-stack application that leverages Large Language Models to automatically generate highly optimized YouTube titles, descriptions, and SEO tags from raw video scripts.

</div>

---

## 🌟 Overview

MetaGen is designed to eliminate the friction of content publishing. By pasting a video script, creators instantly receive a comprehensive SEO package tailored to the YouTube algorithm. 

The application features a **Dual-Path Hybrid Inference Engine**:
1. **Lightning Fast (Groq):** Uses the Groq API and `openai/gpt-oss-120b` (OpenAI's 120B open-weight model at ~500 T/s) to stream full metadata packages in under 1.5 seconds.
2. **Resilient Fallback (Local Mistral):** If the external API is unavailable, the backend gracefully falls back to a locally hosted Mistral 7B (GGUF) model running on a Hugging Face Space CPU, ensuring the application never goes offline.

## ✨ Key Features

- **Blazing Fast Streaming:** Real-time generation using Groq's LPU inference engine (~500 tokens/sec) and Server-Sent Events (SSE).
- **Cinematic UI/UX:** A stunning, highly optimized glassmorphism interface built with Next.js, Tailwind CSS 4, and Framer Motion. Smooth transitions with zero layout shift.
- **Dark/Light Mode:** First-class support for system themes using dynamic Oklch color profiles.
- **Smart Fallback Architecture:** Zero-downtime AI generation. The backend intelligently routes between cloud APIs and local LLM execution.
- **SEO Breakdown:** Provides a quantitative SEO score and algorithmic breakdown for generated metadata.

---

## 🏗️ Architecture & Tech Stack

### Frontend (Deployed on Vercel)
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS (v4), Vanilla CSS for optimized LCP transitions
- **Animations:** Framer Motion (Optimized via `LazyMotion` for performance)
- **Data Fetching:** Custom React Hooks with robust error handling and polling/streaming support

### Backend (Deployed on Hugging Face Spaces)
- **Framework:** FastAPI (Python 3.11)
- **Primary AI Engine:** Groq API (`openai/gpt-oss-120b`, configurable via `GROQ_MODEL`)
- **Fallback AI Engine:** Llama.cpp via `llama-cpp-python` (Mistral 7B Q4 GGUF)
- **Deployment:** Dockerized environment optimized for CPU execution with lazy model loading to bypass repository storage limits.

---

## 🚀 Live Demo

* **Frontend App:** [MetaGen on Vercel](https://metagen-one.vercel.app)
* **Backend API Specs:** [Hugging Face Space API Docs](https://huggingface.co/spaces/SujalChhajed925/MetaGen)

---

## 💻 Local Development Setup

If you wish to run the project locally, follow these steps:

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Groq API Key (Optional, but highly recommended for speed)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/MetaGen.git
cd MetaGen
```

### 2. Setup the Backend
```bash
# Create a virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r ../requirements_hf.txt

# Create .env file
echo "GROQ_API_KEY=your_groq_key_here" > .env

# Start the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Setup the Frontend
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---
*This project was developed as a portfolio showcase of full-stack AI application architecture, emphasizing performance, resilient system design, and modern UI/UX principles.*
