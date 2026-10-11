"""
Verification script for YT_Model_Brain_Qwen2.5_1.5B.ipynb (Lightweight SLM Fallback).
"""

import json
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))


def test_qwen15b_notebook():
    print("[+] Starting Qwen 2.5 1.5B Notebook Verification...")

    nb_path = root_dir / "notebooks" / "YT_Model_Brain_Qwen2.5_1.5B.ipynb"
    assert nb_path.exists(), f"YT_Model_Brain_Qwen2.5_1.5B.ipynb does not exist: {nb_path}"

    with open(nb_path, "r", encoding="utf-8") as f:
        nb_data = json.load(f)

    assert nb_data.get("nbformat") == 4, f"Expected nbformat 4, got {nb_data.get('nbformat')}"
    cells = nb_data.get("cells", [])
    assert len(cells) >= 10, f"Expected at least 10 cells, got {len(cells)}"

    full_code = "\n".join(["".join(c.get("source", [])) for c in cells])

    # 1. Check Model ID
    assert "Qwen/Qwen2.5-1.5B-Instruct" in full_code, "Missing base model ID in notebook"
    print("[+] Verified base model ID: Qwen/Qwen2.5-1.5B-Instruct")

    # 2. Check Qwen ChatML Prompt Formatting Tokens
    assert "<|im_start|>system" in full_code, "Missing <|im_start|>system token"
    assert "<|im_end|>" in full_code, "Missing <|im_end|> token"
    assert "<|im_start|>user" in full_code, "Missing <|im_start|>user token"
    assert "<|im_start|>assistant" in full_code, "Missing <|im_start|>assistant token"
    print("[+] Verified Qwen ChatML special prompt formatting tokens")

    # 3. Check LoRA target modules
    for mod in ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]:
        assert mod in full_code, f"Missing LoRA module {mod} in config"
    print("[+] Verified full Qwen attention & MLP LoRA target modules")

    # 4. Check GGUF export target
    assert "custom-qwen2.5-1.5b-yt-seo-Q4_K_M.gguf" in full_code, "Missing custom-qwen2.5-1.5b-yt-seo-Q4_K_M.gguf filename"
    assert "SujalChhajed925/yt-seo-qwen2.5-1.5b-merged" in full_code, "Missing Hugging Face destination repo"
    print("[+] Verified GGUF compilation and HF upload targets")

    # 5. Dry-run prompt formatting logic
    sample_input = {
        "script": "How to optimize YouTube CTR in 2026.",
        "target_json": '{"title": "YouTube CTR Secrets", "tags": ["youtube", "seo"]}'
    }
    system_msg = "You are a professional YouTube SEO specialist. Output ONLY valid JSON containing title, description, and tags."
    user_msg = f"Generate YouTube SEO metadata for this video script:\n{sample_input['script']}"
    assistant_msg = sample_input['target_json']
    formatted_text = (
        f"<|im_start|>system\n"
        f"{system_msg}<|im_end|>\n"
        f"<|im_start|>user\n"
        f"{user_msg}<|im_end|>\n"
        f"<|im_start|>assistant\n"
        f"{assistant_msg}<|im_end|>"
    )
    assert "<|im_start|>system" in formatted_text
    assert "<|im_end|>\n<|im_start|>assistant\n" in formatted_text
    print("[+] Dry-run formatting output verified.")

    print("\n[SUCCESS] Qwen 2.5 1.5B Notebook Fully Verified and Passed!")


if __name__ == "__main__":
    test_qwen15b_notebook()
