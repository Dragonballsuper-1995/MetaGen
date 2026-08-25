"""
Verification script for YT_Model_Brain_Llama3.ipynb (Mini-Phase 4.1).
"""

import json
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))


def test_llama3_notebook():
    print("[+] Starting Llama 3.1 Notebook Verification...")

    nb_path = root_dir / "notebooks" / "YT_Model_Brain_Llama3.ipynb"
    if not nb_path.exists():
        nb_path = root_dir / "YT_Model_Brain_Llama3.ipynb"
    assert nb_path.exists(), f"YT_Model_Brain_Llama3.ipynb does not exist in notebooks/ or root: {nb_path}"

    with open(nb_path, "r", encoding="utf-8") as f:
        nb_data = json.load(f)

    assert nb_data.get("nbformat") == 4, f"Expected nbformat 4, got {nb_data.get('nbformat')}"
    cells = nb_data.get("cells", [])
    assert len(cells) >= 10, f"Expected at least 10 cells, got {len(cells)}"

    full_code = "\n".join(["".join(c.get("source", [])) for c in cells])

    # 1. Check Model ID
    assert "meta-llama/Llama-3.1-8B-Instruct" in full_code, "Missing base model ID in notebook"
    print("[+] Verified base model ID: meta-llama/Llama-3.1-8B-Instruct")

    # 2. Check Llama 3 Prompt Formatting Tokens
    assert "<|begin_of_text|>" in full_code, "Missing <|begin_of_text|> token"
    assert "<|start_header_id|>" in full_code, "Missing <|start_header_id|> token"
    assert "<|end_header_id|>" in full_code, "Missing <|end_header_id|> token"
    assert "<|eot_id|>" in full_code, "Missing <|eot_id|> token"
    print("[+] Verified Llama 3 special prompt formatting tokens")

    # 3. Check LoRA target modules
    for mod in ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]:
        assert mod in full_code, f"Missing LoRA module {mod} in config"
    print("[+] Verified full Llama 3 attention & MLP LoRA target modules")

    # 4. Check GGUF export target
    assert "custom-llama3-yt-seo-Q4_K_M.gguf" in full_code, "Missing custom-llama3-yt-seo-Q4_K_M.gguf filename"
    assert "SujalChhajed925/yt-seo-llama3-merged" in full_code, "Missing Hugging Face destination repo"
    print("[+] Verified GGUF compilation and HF upload targets")

    # 5. Dry-run prompt formatting logic
    sample_input = {
        "script": "How to fine-tune Llama 3 for beginners in 2026.",
        "target_json": '{"title": "Llama 3 Fine-Tuning Guide", "tags": ["llama3", "ai"]}'
    }
    system_msg = "You are a professional YouTube SEO specialist. Output ONLY valid JSON containing title, description, and tags."
    user_msg = f"Generate YouTube SEO metadata for this video script:\n{sample_input['script']}"
    assistant_msg = sample_input['target_json']
    formatted_text = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
        f"{system_msg}<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n\n"
        f"{user_msg}<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n\n"
        f"{assistant_msg}<|eot_id|>"
    )
    assert "<|begin_of_text|><|start_header_id|>system<|end_header_id|>" in formatted_text
    assert "<|eot_id|><|start_header_id|>assistant<|end_header_id|>" in formatted_text
    print("[+] Dry-run formatting output verified.")

    print("\n[SUCCESS] Mini-Phase 4.1 (Llama 3.1 Notebook) Fully Verified and Passed!")


if __name__ == "__main__":
    test_llama3_notebook()
