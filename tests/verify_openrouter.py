"""
Verification script for OpenRouter API integration and ai_engine helpers.
Executes live non-streaming and streaming calls via backend.ai_engine.
"""

import os
import sys
from pathlib import Path

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
from backend.ai_engine import _call_openrouter_llm, _stream_openrouter_llm


def test_openrouter_integration():
    settings = get_settings()
    api_key = settings.openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "").strip()
    
    if not api_key:
        print("[-] OPENROUTER_API_KEY is not configured in backend/.env or environment.")
        sys.exit(1)
        
    print(f"[+] Initializing OpenRouter test (model: {settings.openrouter_model})")
    
    # 1. Non-streaming JSON test through ai_engine
    print("\n--- 1. Testing _call_openrouter_llm in backend.ai_engine ---")
    system_prompt = "You are a YouTube SEO expert. Output ONLY valid JSON with keys: title, description, tags."
    user_prompt = "Topic: Full-Stack Web Development in 2026. Give 1 title, a short 2-sentence description, and 3 tags."
    
    try:
        resp = _call_openrouter_llm(
            system_prompt=system_prompt,
            user_msg=user_prompt,
        )
        print("[+] _call_openrouter_llm Output (type:", type(resp), "):")
        print(resp)
        assert isinstance(resp, dict), "Expected dict response from _call_openrouter_llm"
        assert "title" in resp or "description" in resp, "Missing expected keys in JSON"
    except Exception as e:
        print(f"[-] _call_openrouter_llm Failed: {e}")
        sys.exit(1)

    # 2. Streaming test through ai_engine
    print("\n--- 2. Testing _stream_openrouter_llm in backend.ai_engine ---")
    try:
        stream_gen = _stream_openrouter_llm(
            system_prompt=system_prompt,
            user_msg="Generate 1 YouTube title about AI Agents in 2026.",
        )
        print("[+] Streaming chunks: ", end="", flush=True)
        chunks = []
        for chunk in stream_gen:
            chunks.append(chunk)
            print(chunk, end="", flush=True)
        print(f"\n[+] Stream completed successfully with {len(chunks)} chunks!")
    except Exception as e:
        print(f"\n[-] _stream_openrouter_llm Failed: {e}")
        sys.exit(1)

    print("\n[SUCCESS] Mini-Phase 2.3 (OpenRouter Integration) Verified and Passed!")


if __name__ == "__main__":
    test_openrouter_integration()
