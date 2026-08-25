"""
Live API Comparison Showcase for MetaGen.
Tests all configured API providers (Groq, Gemini, OpenCode Zen, OpenRouter)
on the exact same input video script and displays the outputs side-by-side.
"""

import json
import os
import sys
from pathlib import Path
from time import perf_counter

# Fix Windows console unicode issues
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.config import get_settings
from backend.ai_engine import (
    _call_gemini_llm,
    _call_opencode_zen_llm,
    _call_openrouter_llm,
    _get_groq_client,
    _parse_json_safe,
    _human_model_name,
)

SYSTEM_PROMPT = """You are an elite YouTube SEO strategist and metadata expert.
Analyze the input video script and generate:
1. title: A high-CTR, punchy title (40-60 chars).
2. description: An SEO-optimized structured description with timestamps, overview, and hashtags.
3. tags: 5-8 relevant, multi-word tags.

Output ONLY a single valid JSON object with keys: "title", "description", "tags"."""

INPUT_SCRIPT = """
Welcome back to the channel! Today we are doing a complete architectural breakdown of AI Agent systems in 2026.
We'll explore autonomous multi-agent reasoning, self-healing code loops, local SLMs running on edge devices,
and how developer workflows are completely shifting from writing boilerplate to directing AI swarms.
We also benchmark latency between cloud LPUs, edge NPUs, and local quantized GGUF models with full telemetry.
Don't forget to like, subscribe, and check the GitHub link in the description for the full source code!
"""


def test_groq():
    client = _get_groq_client()
    if not client:
        return {"error": "GROQ_API_KEY not configured"}
    
    start = perf_counter()
    resp = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": INPUT_SCRIPT},
        ],
        model="openai/gpt-oss-120b",
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    elapsed = perf_counter() - start
    parsed = _parse_json_safe(resp.choices[0].message.content.strip())
    return {"elapsed_s": elapsed, "model": "OpenAI GPT-OSS 120B (Groq LPU)", "output": parsed}


def test_gemini():
    settings = get_settings()
    if not (settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")):
        return {"error": "GEMINI_API_KEY not configured"}
    
    start = perf_counter()
    parsed = _call_gemini_llm(
        system_prompt=SYSTEM_PROMPT,
        user_msg=INPUT_SCRIPT,
        max_tokens=1000,
        temperature=0.7,
    )
    elapsed = perf_counter() - start
    return {"elapsed_s": elapsed, "model": f"Google Gemini ({settings.gemini_model})", "output": parsed}


def test_opencode_zen():
    settings = get_settings()
    if not (settings.opencode_zen_api_key or os.environ.get("OPENCODE_ZEN_API_KEY")):
        return {"error": "OPENCODE_ZEN_API_KEY not configured"}
    
    start = perf_counter()
    parsed = _call_opencode_zen_llm(
        system_prompt=SYSTEM_PROMPT,
        user_msg=INPUT_SCRIPT,
        max_tokens=1000,
        temperature=0.7,
    )
    elapsed = perf_counter() - start
    return {"elapsed_s": elapsed, "model": f"OpenCode Zen ({settings.opencode_zen_model})", "output": parsed}


def test_openrouter():
    settings = get_settings()
    if not (settings.openrouter_api_key or os.environ.get("OPENROUTER_API_KEY")):
        return {"error": "OPENROUTER_API_KEY not configured"}
    
    start = perf_counter()
    parsed = _call_openrouter_llm(
        system_prompt=SYSTEM_PROMPT,
        user_msg=INPUT_SCRIPT,
        max_tokens=1000,
        temperature=0.7,
    )
    elapsed = perf_counter() - start
    return {"elapsed_s": elapsed, "model": f"OpenRouter ({settings.openrouter_model})", "output": parsed}


def main():
    print("=" * 70)
    print("⚡ METAGEN LIVE MULTI-PROVIDER API TEST")
    print("=" * 70)
    print(f"\n[INPUT SCRIPT]:\n{INPUT_SCRIPT.strip()}\n")
    print("-" * 70)

    providers = [
        ("1. Groq Cloud (LPU)", test_groq),
        ("2. Google AI Studio (Gemini)", test_gemini),
        ("3. OpenCode Zen (Free Gateway)", test_opencode_zen),
        ("4. OpenRouter (Free Pool)", test_openrouter),
    ]

    for name, test_func in providers:
        print(f"\n🚀 Running {name}...")
        try:
            res = test_func()
            if "error" in res:
                print(f"❌ Error: {res['error']}")
                continue
            
            print(f"⏱️  Latency: {res['elapsed_s']:.2f}s | 🧠 Engine: {res['model']}")
            out = res["output"]
            print(f"📌 Title: {out.get('title')}")
            print(f"🏷️  Tags: {out.get('tags')}")
            desc_preview = out.get('description', '')
            if len(desc_preview) > 180:
                desc_preview = desc_preview[:180] + "..."
            print(f"📄 Description Preview: {desc_preview}")
        except Exception as e:
            print(f"❌ Execution failed: {e}")

    print("\n" + "=" * 70)
    print("✅ All LLM API keys executed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    main()
