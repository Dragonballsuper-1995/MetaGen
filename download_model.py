"""
Dynamic Model Downloader and Catalog Registry for MetaGen.
Supports downloading and managing multiple custom fine-tuned GGUF models.
"""

import argparse
import os
import sys
from pathlib import Path
from huggingface_hub import hf_hub_download

LOCAL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "model")

MODEL_CATALOG = {
    "mistral-7b": {
        "repo_id": "SujalChhajed925/yt-seo-mistral-merged",
        "filename": "custom-mistral-yt-seo-Q4_K_M.gguf",
        "display_name": "Mistral 7B Q4_K_M (Custom HF)",
        "description": "Primary custom fine-tuned Mistral 7B model for YouTube SEO metadata.",
        "size_mb": 4100,
    },
    "llama-3.1-8b": {
        "repo_id": "SujalChhajed925/yt-seo-llama3-merged",
        "filename": "custom-llama3-yt-seo-Q4_K_M.gguf",
        "display_name": "Llama 3.1 8B Q4_K_M (Custom HF)",
        "description": "Meta Llama 3.1 8B fine-tuned for high CTR YouTube hooks.",
        "size_mb": 4600,
    },
    "qwen-2.5-7b": {
        "repo_id": "SujalChhajed925/yt-seo-qwen2.5-merged",
        "filename": "custom-qwen2.5-yt-seo-Q4_K_M.gguf",
        "display_name": "Qwen 2.5 7B Q4_K_M (Custom HF)",
        "description": "Alibaba Qwen 2.5 7B fine-tuned for structured tag relevance.",
        "size_mb": 4400,
    },
    "phi-4-mini": {
        "repo_id": "SujalChhajed925/yt-seo-phi4-merged",
        "filename": "custom-phi4-yt-seo-Q4_K_M.gguf",
        "display_name": "Phi-4 Mini 3.8B Q4_K_M (Custom HF)",
        "description": "Microsoft Phi-4 Mini 3.8B optimized for lightweight CPU inference.",
        "size_mb": 2400,
    },
}


def get_model_info(model_key: str = "mistral-7b") -> dict | None:
    """Get metadata dictionary for a specific model key."""
    return MODEL_CATALOG.get(model_key)


def get_available_local_models() -> list[dict]:
    """Return catalog of all models with their local installation status."""
    result = []
    for key, info in MODEL_CATALOG.items():
        target_path = os.path.join(LOCAL_DIR, info["filename"])
        installed = os.path.exists(target_path)
        result.append({
            "key": key,
            "display_name": info["display_name"],
            "filename": info["filename"],
            "description": info["description"],
            "repo_id": info["repo_id"],
            "installed": installed,
            "path": target_path if installed else None,
        })
    return result


def download(model_key: str = "mistral-7b") -> str | None:
    """Download a specific model file from Hugging Face if not already present."""
    info = MODEL_CATALOG.get(model_key)
    if not info:
        print(f"[-] Unknown model key '{model_key}'. Available: {list(MODEL_CATALOG.keys())}")
        return None

    target_path = os.path.join(LOCAL_DIR, info["filename"])
    if os.path.exists(target_path):
        print(f"[+] Model [{model_key}] already exists at {target_path}, skipping download.")
        return target_path

    print(f"[+] Downloading {info['filename']} from {info['repo_id']}...")
    os.makedirs(LOCAL_DIR, exist_ok=True)
    try:
        path = hf_hub_download(
            repo_id=info["repo_id"],
            filename=info["filename"],
            local_dir=LOCAL_DIR
        )
        print(f"[+] Model downloaded to: {path}")
        return path
    except Exception as e:
        print(f"[Warning] Background download for {model_key} encountered error: {e}")
        return None


def download_all():
    """Download all configured models in the catalog."""
    for key in MODEL_CATALOG:
        download(key)


def verify_gguf_file(file_path: str) -> bool:
    """Verify that a file exists and has valid GGUF magic bytes."""
    if not os.path.exists(file_path):
        return False
    try:
        with open(file_path, "rb") as f:
            magic = f.read(4)
            return magic == b"GGUF"
    except Exception:
        return False


def verify_all_models() -> dict[str, bool]:
    """Verify validity of all downloaded model files."""
    results = {}
    for key, info in MODEL_CATALOG.items():
        target_path = os.path.join(LOCAL_DIR, info["filename"])
        is_valid = verify_gguf_file(target_path)
        results[key] = is_valid
    return results


def print_status_table():
    """Print a clean CLI table of all models and their download/integrity status."""
    print("\n" + "=" * 80)
    print(f"{'Model Key':<15} | {'Display Name':<28} | {'Status':<12} | {'File Size'}")
    print("-" * 80)
    for model in get_available_local_models():
        key = model["key"]
        display = model["display_name"]
        installed = model["installed"]
        if installed:
            is_valid = verify_gguf_file(model["path"])
            size_mb = os.path.getsize(model["path"]) / (1024 * 1024)
            status_str = "VALID (GGUF)" if is_valid else "CORRUPT"
            size_str = f"{size_mb:,.1f} MB"
        else:
            status_str = "Not Downloaded"
            size_str = f"~{MODEL_CATALOG[key]['size_mb']} MB (Remote)"
        print(f"{key:<15} | {display:<28} | {status_str:<12} | {size_str}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download and verify custom GGUF models for MetaGen")
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        choices=list(MODEL_CATALOG.keys()) + ["all"],
        help="Model key to download (or 'all')",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Print status of all models in the catalog",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available models and exit",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify GGUF magic bytes on downloaded models",
    )
    args = parser.parse_args()

    if args.status or args.list:
        print_status_table()
    elif args.verify:
        results = verify_all_models()
        for k, v in results.items():
            print(f"[{'PASS' if v else 'FAIL/MISSING'}] {k}")
    elif args.model == "all":
        download_all()
    elif args.model:
        download(args.model)
    else:
        print_status_table()
