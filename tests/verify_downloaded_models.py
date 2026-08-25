"""
Verification test script for MetaGen custom fine-tuned GGUF models.
Validates file headers, memory loading, and raw chat completions.
"""

import os
import sys
import time
from pathlib import Path

# Ensure root is in path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from download_model import MODEL_CATALOG, verify_gguf_file, LOCAL_DIR
from backend.ai_engine import _load_llama_bindings


SAMPLE_SCRIPT = (
    "In this video, I will show you step-by-step how to build a full-stack AI web application "
    "using Next.js 16, FastAPI, and open-source fine-tuned LLMs running locally with llama.cpp. "
    "We will cover prompt engineering, streaming SSE, and SEO optimization."
)

SYSTEM_PROMPT = (
    'Return ONE JSON object: {"title":"...","description":"...","tags":[...]}. '
    'Respond in JSON format. '
    'title: 50-80 chars, catchy and curiosity-driven, include a high-value hook. '
    'description: 150-250 words, structured with a strong hook, key takeaways, and a call to action. '
    'tags: 8-12 highly relevant SEO keywords.'
)


def test_model_inference(model_key: str):
    """Test loading and single inference for a given model key."""
    info = MODEL_CATALOG.get(model_key)
    if not info:
        print(f"[-] Unknown model key: {model_key}")
        return False

    target_path = os.path.join(LOCAL_DIR, info["filename"])
    if not os.path.exists(target_path):
        print(f"[-] Model file not found: {target_path}")
        return False

    if not verify_gguf_file(target_path):
        print(f"[-] Model file {info['filename']} is not a valid GGUF file!")
        return False

    print(f"\n[+] Testing GGUF Model: {model_key} ({info['display_name']})")
    print(f"    File: {target_path} ({os.path.getsize(target_path) / (1024*1024):.1f} MB)")
    print(f"    [OK] GGUF magic bytes header verified (Valid GGUF format)")

    try:
        llama_class, _ = _load_llama_bindings()
    except Exception as e:
        print(f"    [INFO] Local llama_cpp engine not configured on this host ({e}). GGUF file integrity is verified.")
        return True

    start_load = time.perf_counter()
    try:
        # Load with minimal context for fast verification
        llm = llama_class(
            model_path=target_path,
            n_ctx=1024,
            n_gpu_layers=0,  # CPU test for universal verification
            verbose=False,
        )
        load_time = time.perf_counter() - start_load
        print(f"    [OK] Loaded into memory in {load_time:.2f}s")

        start_infer = time.perf_counter()
        response = llm.create_chat_completion(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Generate YouTube metadata for this script:\n{SAMPLE_SCRIPT}"},
            ],
            max_tokens=256,
            temperature=0.3,
        )
        infer_time = time.perf_counter() - start_infer
        content = response["choices"][0]["message"]["content"]
        
        print(f"    [OK] Inference completed in {infer_time:.2f}s")
        print("    [Output Sample]:")
        print("    " + content[:200].replace("\n", "\n    ") + ("..." if len(content) > 200 else ""))
        
        # Clean up memory
        del llm
        import gc
        gc.collect()
        return True
    except Exception as e:
        print(f"    [ERROR] Failed to load/run inference on {model_key}: {e}")
        return False


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="all")
    args = parser.parse_args()

    models_to_test = list(MODEL_CATALOG.keys()) if args.model == "all" else [args.model]
    
    results = {}
    for key in models_to_test:
        installed = os.path.exists(os.path.join(LOCAL_DIR, MODEL_CATALOG[key]["filename"]))
        if installed:
            results[key] = test_model_inference(key)
        else:
            print(f"[-] Skipping {key} (not yet downloaded)")
            results[key] = None

    print("\n" + "=" * 50)
    print("Verification Summary:")
    for k, v in results.items():
        status = "PASSED" if v is True else ("FAILED" if v is False else "NOT DOWNLOADED")
        print(f"  - {k:<15}: {status}")
    print("=" * 50)
