"""
Comprehensive Benchmark Script: Runs a ~2000-char video script through all available models
and evaluates latency, SEO score, relevancy, formatting compliance, and quality.
"""

import json
import time
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.ai_engine import generate_youtube_metadata

SCRIPT_TEXT = """Welcome back to the channel! Today we are building a production-grade Autonomous AI Agent system from scratch using Next.js 16, FastAPI in Python, and local open-source LLMs running with llama.cpp.

If you have been following the rapid evolution of generative AI in 2026, you know that relying solely on closed APIs like GPT-4 or Claude has serious drawbacks: rate limits, soaring API bills, vendor lock-in, and privacy concerns when handling proprietary user data. In this comprehensive masterclass, I will show you how to architect a hybrid AI infrastructure that combines lightning-fast cloud LPUs with quantized local Small Language Models running on your own CPU and GPU.

Here is the exact architectural breakdown we are covering:
First, we set up our Next.js 16 App Router frontend with real-time Server-Sent Events (SSE) streaming, reactive telemetry monitoring, and optimistic UI updates for instant perceived speed.
Second, we construct a high-throughput FastAPI backend in Python 3.11 with an adaptive multi-tier fallback cascade. When cloud providers like Groq or Gemini experience 429 rate limits or platform downtime, our system automatically falls back to lightweight 1B and 1.5B parameter models like Qwen 2.5 and Llama 3.2 without throwing a single 500 error to the end user.
Third, we implement deterministic constraint repair algorithms to guarantee perfect JSON compliance, strict YouTube SEO character bounds, and instant keyword extraction using local TF-IDF and KeyBERT algorithms.
Fourth, we dive deep into fine-tuning custom models on Google Colab using QLoRA and Unsloth, converting the resulting LoRA adapters into GGUF Q4_K_M binaries, and hosting them on Hugging Face Spaces with Docker.
Finally, we benchmark inference latency, Time-To-First-Token (TTFT), tokens per second, and SEO discoverability scores to ensure our YouTube metadata ranks at the top of search results.

Make sure to grab the complete open-source codebase from the GitHub link down in the description below, subscribe with notifications turned on, and drop your questions in the comments!"""

MODELS_TO_BENCHMARK = [
    ("auto", "Auto Multi-Tier Cascade"),
    ("groq-120b", "Groq LPU (GPT-OSS 120B / 20B)"),
    ("groq-20b", "Groq LPU (GPT-OSS 20B)"),
    ("qwen-27b", "Groq LPU (Qwen 3.8 27B)"),
    ("gemini", "Google Gemini 3.6 Flash"),
    ("opencode-zen", "OpenCode Zen (Laguna 2.1 Free)"),
    ("openrouter", "OpenRouter (Laguna 2.1 Free)"),
    ("mistral", "Local Custom Mistral 7B (GGUF)"),
]


def evaluate_output_quality(result: dict, script: str) -> dict:
    title = str(result.get("title", ""))
    desc = str(result.get("description", ""))
    tags = result.get("tags", [])
    
    # 1. Relevance keywords check
    key_terms = ["next.js", "fastapi", "ai agent", "python", "llama.cpp", "llm", "seo", "autonomous"]
    found_in_title = [term for term in key_terms if term in title.lower()]
    found_in_desc = [term for term in key_terms if term in desc.lower()]
    relevance_score = round((len(set(found_in_title + found_in_desc)) / len(key_terms)) * 100, 1)

    # 2. YouTube bounds compliance
    title_chars = len(title)
    title_words = len(title.split())
    desc_chars = len(desc)
    desc_words = len(desc.split())
    tag_count = len(tags) if isinstance(tags, list) else 0

    title_valid = 40 <= title_chars <= 85 and 6 <= title_words <= 15
    desc_valid = 900 <= desc_chars <= 1800 and 150 <= desc_words <= 300
    tags_valid = 8 <= tag_count <= 15

    return {
        "relevance_score": relevance_score,
        "key_terms_covered": list(set(found_in_title + found_in_desc)),
        "title_chars": title_chars,
        "title_words": title_words,
        "title_valid": title_valid,
        "desc_chars": desc_chars,
        "desc_words": desc_words,
        "desc_valid": desc_valid,
        "tag_count": tag_count,
        "tags_valid": tags_valid,
        "all_bounds_pass": title_valid and desc_valid and tags_valid,
    }


def run_benchmark():
    print(f"[*] Starting Comprehensive Model Benchmark")
    print(f"[*] Test Script Length: {len(SCRIPT_TEXT)} characters, {len(SCRIPT_TEXT.split())} words\n")
    
    results = {}
    
    for choice, label in MODELS_TO_BENCHMARK:
        print(f"--- Running: {label} (model_choice='{choice}') ---")
        t0 = time.perf_counter()
        try:
            res = generate_youtube_metadata(SCRIPT_TEXT, model_choice=choice)
            elapsed = time.perf_counter() - t0
            eval_metrics = evaluate_output_quality(res, SCRIPT_TEXT)
            
            model_used = res.get("model", choice)
            seo_score = res.get("seo_score", 0.0)
            seo_breakdown = res.get("seo_breakdown", {})

            print(f"  [+] Success in {elapsed:.2f}s | Active Model: {model_used}")
            print(f"  [+] Title: \"{res.get('title')}\" ({eval_metrics['title_chars']} chars)")
            print(f"  [+] SEO Score: {seo_score} / 100")
            print(f"  [+] Description: {eval_metrics['desc_chars']} chars ({eval_metrics['desc_words']} words)")
            print(f"  [+] Tags Count: {eval_metrics['tag_count']}")
            print(f"  [+] Relevance: {eval_metrics['relevance_score']}% keywords covered")
            print(f"  [+] Bounds Valid: Title={eval_metrics['title_valid']}, Desc={eval_metrics['desc_valid']}, Tags={eval_metrics['tags_valid']}\n")

            results[choice] = {
                "label": label,
                "status": "success",
                "latency_s": round(elapsed, 2),
                "model_used": model_used,
                "title": res.get("title"),
                "description": res.get("description"),
                "tags": res.get("tags"),
                "seo_score": seo_score,
                "seo_breakdown": seo_breakdown,
                "metrics": eval_metrics,
            }
        except Exception as e:
            elapsed = time.perf_counter() - t0
            print(f"  [-] FAILED in {elapsed:.2f}s: {e}\n")
            results[choice] = {
                "label": label,
                "status": "failed",
                "latency_s": round(elapsed, 2),
                "error": str(e),
            }

    # Save to JSON artifact
    output_path = ROOT_DIR / "docs" / "model_benchmark_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"[+] All results saved to {output_path}")


if __name__ == "__main__":
    run_benchmark()
