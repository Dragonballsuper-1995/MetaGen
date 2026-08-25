"""
Verification script for Dynamic Model Loading and Model Registry (Mini-Phase 3.1).
Tests:
  1. download_model.py catalog structure and availability query
  2. FastAPI TestClient verification for /health/runtime and /api/models endpoints
  3. Model choice normalization for local and cloud models
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

from fastapi.testclient import TestClient
from download_model import MODEL_CATALOG, get_available_local_models, get_model_info
from backend.main import app
from backend.ai_engine import _normalize_model_choice


def test_dynamic_models():
    print("[+] Starting Dynamic Model Loader Verification...")

    # 1. Test Model Catalog & Local Detection
    print("\n--- 1. Testing download_model.py Catalog ---")
    assert "mistral-7b" in MODEL_CATALOG, "Missing mistral-7b in catalog"
    assert "llama-3.1-8b" in MODEL_CATALOG, "Missing llama-3.1-8b in catalog"
    assert "qwen-2.5-7b" in MODEL_CATALOG, "Missing qwen-2.5-7b in catalog"
    assert "phi-4-mini" in MODEL_CATALOG, "Missing phi-4-mini in catalog"
    
    local_models = get_available_local_models()
    print(f"[+] Total registered local models: {len(local_models)}")
    for m in local_models:
        print(f" - [{m['key']}] {m['display_name']} -> Installed: {m['installed']}")

    # 2. Test Model Normalization in ai_engine
    print("\n--- 2. Testing Model Normalization ---")
    assert _normalize_model_choice("auto") == "auto"
    assert _normalize_model_choice("gemini") == "gemini"
    assert _normalize_model_choice("opencode-zen") == "opencode-zen"
    assert _normalize_model_choice("openrouter") == "openrouter"
    assert _normalize_model_choice("mistral") == "mistral"
    assert _normalize_model_choice("mistral-7b") == "mistral"
    print("[+] Model normalization rules verified successfully.")

    # 3. Test FastAPI Endpoints via TestClient
    print("\n--- 3. Testing /api/models and /health/runtime Endpoints ---")
    client = TestClient(app)
    
    runtime_res = client.get("/health/runtime")
    assert runtime_res.status_code == 200, f"Runtime health check failed: {runtime_res.text}"
    runtime_data = runtime_res.json()
    print("[+] /health/runtime Output:")
    print("   Providers:", runtime_data.get("providers"))
    
    models_res = client.get("/api/models")
    assert models_res.status_code == 200, f"/api/models failed: {models_res.text}"
    models_data = models_res.json()
    print(f"[+] /api/models Output:")
    print(f"   Cloud Models ({len(models_data.get('cloud_models', []))}):")
    for cm in models_data.get("cloud_models", []):
        print(f"     * {cm['id']}: {cm['name']} (Available: {cm['available']})")
    print(f"   Local Models ({len(models_data.get('local_models', []))}):")
    for lm in models_data.get("local_models", []):
        print(f"     * {lm['key']}: {lm['display_name']} (Installed: {lm['installed']})")

    assert len(models_data.get("cloud_models", [])) >= 4, "Expected at least 4 cloud model options"
    assert len(models_data.get("local_models", [])) >= 4, "Expected 4 local model options"

    print("\n[SUCCESS] Mini-Phase 3.1 (Backend Dynamic Loader) Fully Verified and Passed!")


if __name__ == "__main__":
    test_dynamic_models()
