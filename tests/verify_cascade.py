"""
Verification script for Unified Fallback Cascade (Mini-Phase 2.4).
Tests:
  1. Auto-mode non-streaming call
  2. Auto-mode streaming call
  3. Explicit provider calls (Groq, Gemini, OpenCode Zen, OpenRouter)
  4. Simulated failover test (Groq disabled -> seamlessly cascades to Gemini/Zen/Router)
"""

import os
import sys
from pathlib import Path
from unittest.mock import patch

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
    _llm_call,
    _llm_stream,
    get_last_used_model_name,
)

SYSTEM_PROMPT = "You are a YouTube SEO expert. Output ONLY valid JSON with keys: title, description, tags."
USER_PROMPT = "Topic: AI Agents in 2026. Give 1 viral title, a 2-sentence description, and 3 tags."


def test_cascade():
    print("[+] Starting Unified Cascade Verification...")
    
    # 1. Standard Auto Mode Call
    print("\n--- 1. Testing _llm_call(model_choice='auto') ---")
    resp = _llm_call(SYSTEM_PROMPT, USER_PROMPT, max_tokens=300, model_choice="auto")
    used_model = get_last_used_model_name()
    print(f"[+] Result from model: {used_model}")
    print("[+] Output:", resp)
    assert isinstance(resp, dict), "Expected dict response from _llm_call"

    # 2. Standard Auto Mode Streaming
    print("\n--- 2. Testing _llm_stream(model_choice='auto') ---")
    chunks = list(_llm_stream(SYSTEM_PROMPT, USER_PROMPT, max_tokens=300, model_choice="auto"))
    stream_model = get_last_used_model_name()
    print(f"[+] Stream finished from model: {stream_model} with {len(chunks)} chunks")
    assert len(chunks) > 0, "Expected non-empty chunks from _llm_stream"

    # 3. Explicit Model Choices
    print("\n--- 3. Testing Explicit Provider Dispatches ---")
    for choice in ["gemini", "opencode-zen", "openrouter"]:
        print(f"\n[*] Dispatching explicit model_choice='{choice}'...")
        try:
            r = _llm_call(SYSTEM_PROMPT, USER_PROMPT, max_tokens=300, model_choice=choice)
            print(f"[+] Succeeded with {get_last_used_model_name()}: {list(r.keys())}")
        except Exception as e:
            print(f"[-] Choice '{choice}' failed: {e}")
            raise e

    # 4. Simulated Failover Test: Disable Groq -> Cascade to Gemini
    print("\n--- 4. Testing Simulated Failover (Groq Disabled -> Cascades to Gemini) ---")
    with patch("backend.ai_engine._get_groq_client", return_value=None):
        r_failover = _llm_call(SYSTEM_PROMPT, USER_PROMPT, max_tokens=300, model_choice="auto")
        failover_model = get_last_used_model_name()
        print(f"[+] Cascaded successfully to: {failover_model}")
        assert "Gemini" in failover_model or "OpenCode" in failover_model or "OpenRouter" in failover_model, \
            f"Expected cloud fallback model, got {failover_model}"

    # 5. Simulated Failover Test: Disable Groq and Gemini -> Cascade to OpenCode Zen / OpenRouter
    print("\n--- 5. Testing Simulated Deep Failover (Groq & Gemini Disabled -> Cascades to Zen/Router) ---")
    with patch("backend.ai_engine._get_groq_client", return_value=None), \
         patch("backend.ai_engine._get_gemini_client", return_value=None):
        r_deep = _llm_call(SYSTEM_PROMPT, USER_PROMPT, max_tokens=300, model_choice="auto")
        deep_model = get_last_used_model_name()
        print(f"[+] Cascaded successfully to: {deep_model}")
        assert "OpenCode" in deep_model or "OpenRouter" in deep_model, \
            f"Expected OpenCode or OpenRouter fallback, got {deep_model}"

    print("\n[SUCCESS] Mini-Phase 2.4 (Unified Fallback Cascade) Fully Verified and Passed!")


if __name__ == "__main__":
    test_cascade()
