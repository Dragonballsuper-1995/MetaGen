"""
Local LoRA Weight Merging Script
Usage:
    python scripts/merge_local.py --model meta-llama/Llama-3.1-8B-Instruct --adapter ./final_llama3_adapter --output ./llama3_yt_seo_merged
    python scripts/merge_local.py --model Qwen/Qwen2.5-7B-Instruct --adapter ./final_qwen25_adapter --output ./qwen25_yt_seo_merged
    python scripts/merge_local.py --model microsoft/Phi-4-mini-instruct --adapter ./final_phi4_adapter --output ./phi4_yt_seo_merged
"""

import argparse
import json
import os
import shutil
import gc
import torch
from huggingface_hub import snapshot_download
from safetensors.torch import load_file, save_file
from transformers import AutoTokenizer

def merge_lora(model_id: str, adapter_path: str, output_dir: str):
    print(f"\n=======================================================")
    print(f"🚀 MetaGen Local LoRA Safetensors Stream Merger")
    print(f"Base Model:    {model_id}")
    print(f"LoRA Adapter:  {adapter_path}")
    print(f"Merged Output: {output_dir}")
    print(f"=======================================================\n")

    if not os.path.exists(adapter_path):
        raise FileNotFoundError(f"Adapter folder not found at: {adapter_path}")

    # 1. Load LoRA weights and scaling config
    print(f"1. Loading LoRA weights from {adapter_path}...")
    config_file = os.path.join(adapter_path, "adapter_config.json")
    with open(config_file, "r", encoding="utf-8") as f:
        adapter_config = json.load(f)

    r = adapter_config.get("r", 16)
    lora_alpha = adapter_config.get("lora_alpha", 32)
    scaling = lora_alpha / r
    print(f"   -> Rank r={r}, Alpha={lora_alpha}, Scaling={scaling:.2f}")

    adapter_weights_file = os.path.join(adapter_path, "adapter_model.safetensors")
    lora_weights = load_file(adapter_weights_file)
    print(f"   -> Loaded {len(lora_weights)} adapter tensors successfully.")

    # 2. Download / locate base model safetensors
    print(f"\n2. Fetching base model safetensors for {model_id}...")
    base_dir = snapshot_download(
        repo_id=model_id,
        allow_patterns=["*.json", "*.safetensors", "tokenizer*", "*.txt"],
    )

    os.makedirs(output_dir, exist_ok=True)
    # Copy metadata and configs
    for item in os.listdir(base_dir):
        if item.endswith(".json") or item.startswith("tokenizer") or item.endswith(".txt"):
            shutil.copy(os.path.join(base_dir, item), os.path.join(output_dir, item))

    # 3. Stream and merge shard-by-shard
    safetensor_shards = [f for f in os.listdir(base_dir) if f.endswith(".safetensors")]
    print(f"\n3. Merging {len(safetensor_shards)} shards (Streaming < 2 GB RAM)...")

    for shard_name in sorted(safetensor_shards):
        print(f"   Processing shard: {shard_name} ...")
        shard_data = load_file(os.path.join(base_dir, shard_name))
        merged_shard = {}

        for key, tensor in shard_data.items():
            lora_a_key = f"base_model.model.{key}".replace(".weight", ".lora_A.weight")
            lora_b_key = f"base_model.model.{key}".replace(".weight", ".lora_B.weight")

            if lora_a_key in lora_weights and lora_b_key in lora_weights:
                w_a = lora_weights[lora_a_key].to(torch.float32)
                w_b = lora_weights[lora_b_key].to(torch.float32)
                delta = (w_b @ w_a) * scaling
                merged_tensor = tensor.to(torch.float32) + delta
                merged_shard[key] = merged_tensor.to(tensor.dtype)
            else:
                merged_shard[key] = tensor

        save_file(merged_shard, os.path.join(output_dir, shard_name), metadata={"format": "pt"})
        del shard_data
        del merged_shard
        gc.collect()

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.save_pretrained(output_dir)
    print(f"\n✅ Merging Complete! Merged model saved to: {output_dir}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Local LoRA Direct Safetensors Merger")
    parser.add_argument("--model", type=str, required=True, help="Base Hugging Face model ID")
    parser.add_argument("--adapter", type=str, required=True, help="Path to adapter folder")
    parser.add_argument("--output", type=str, required=True, help="Output path for merged model")
    args = parser.parse_args()

    merge_lora(args.model, args.adapter, args.output)
