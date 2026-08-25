"""
MetaGen Offline Model Benchmark & Evaluation Suite.
Evaluates custom fine-tuned GGUF models and cloud providers against a standardized golden test dataset.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

# Ensure project root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from download_model import MODEL_CATALOG, verify_gguf_file, LOCAL_DIR
from backend.ai_engine import generate_youtube_metadata, _apply_output_contract, _parse_json_safe, _load_llama_bindings

EVAL_FIXTURES_PATH = ROOT_DIR / "tests" / "fixtures" / "eval_scripts.json"


def load_eval_dataset(limit: int | None = None) -> list[dict]:
    """Load evaluation test cases from fixtures."""
    if not EVAL_FIXTURES_PATH.exists():
        raise FileNotFoundError(f"Evaluation fixtures not found at {EVAL_FIXTURES_PATH}")
    with open(EVAL_FIXTURES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if limit and limit > 0:
        return data[:limit]
    return data


def evaluate_single_prediction(script_text: str, result_metadata: dict) -> dict[str, Any]:
    """Calculate quality and compliance metrics for a single prediction."""
    title = result_metadata.get("title", "")
    description = result_metadata.get("description", "")
    tags = result_metadata.get("tags", [])
    seo_score = result_metadata.get("seo_score", 0)
    seo_breakdown = result_metadata.get("seo_breakdown", {})

    title_len = len(title)
    title_words = len(title.split())
    desc_words = len(description.split())
    desc_len = len(description)
    tag_count = len(tags)
    
    # Contract compliance checks
    title_valid = (40 <= title_len <= 85) and (6 <= title_words <= 15)
    desc_valid = (150 <= desc_words <= 300) and (900 <= desc_len <= 1800)
    tags_valid = (8 <= tag_count <= 12)

    return {
        "title": title,
        "title_len": title_len,
        "title_words": title_words,
        "title_valid": title_valid,
        "desc_words": desc_words,
        "desc_len": desc_len,
        "desc_valid": desc_valid,
        "tag_count": tag_count,
        "tags_valid": tags_valid,
        "seo_score": seo_score,
        "seo_breakdown": seo_breakdown,
        "fully_compliant": title_valid and desc_valid and tags_valid,
    }


def run_benchmark_for_model(model_key: str, dataset: list[dict], runs_per_script: int = 1) -> dict[str, Any]:
    """Run full evaluation suite for a specified model key."""
    print(f"\n=======================================================")
    print(f"[*] Benchmarking Model: {model_key} on {len(dataset)} scripts...")
    print(f"=======================================================")

    latencies = []
    seo_scores = []
    title_lens = []
    desc_word_counts = []
    tag_counts = []
    compliant_count = 0
    raw_json_successes = 0
    total_runs = 0
    results_detail = []

    for idx, item in enumerate(dataset, 1):
        script_id = item.get("id", f"sample_{idx}")
        category = item.get("category", "General")
        script = item["script"]

        for run_idx in range(runs_per_script):
            total_runs += 1
            start_t = time.perf_counter()
            try:
                # Call metadata generator with explicit model
                res = generate_youtube_metadata(script, model_choice=model_key)
                elapsed = time.perf_counter() - start_t
                latencies.append(elapsed)

                eval_metrics = evaluate_single_prediction(script, res)
                seo_scores.append(eval_metrics["seo_score"])
                title_lens.append(eval_metrics["title_len"])
                desc_word_counts.append(eval_metrics["desc_words"])
                tag_counts.append(eval_metrics["tag_count"])

                if eval_metrics["fully_compliant"]:
                    compliant_count += 1
                
                results_detail.append({
                    "id": script_id,
                    "category": category,
                    "latency_s": round(elapsed, 2),
                    "seo_score": eval_metrics["seo_score"],
                    "title": eval_metrics["title"],
                    "compliant": eval_metrics["fully_compliant"],
                })

                print(f"  [{idx:02d}/{len(dataset):02d}] {script_id:<12} | {category:<22} | SEO: {eval_metrics['seo_score']:>2}/100 | {elapsed:.2f}s")
            except Exception as e:
                print(f"  [{idx:02d}/{len(dataset):02d}] {script_id:<12} | ERROR: {e}")

    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
    avg_seo = sum(seo_scores) / len(seo_scores) if seo_scores else 0.0
    avg_title_len = sum(title_lens) / len(title_lens) if title_lens else 0.0
    avg_desc_words = sum(desc_word_counts) / len(desc_word_counts) if desc_word_counts else 0.0
    avg_tag_count = sum(tag_counts) / len(tag_counts) if tag_counts else 0.0
    compliance_rate = (compliant_count / total_runs * 100) if total_runs else 0.0

    summary = {
        "model_key": model_key,
        "total_evaluated": total_runs,
        "avg_latency_s": round(avg_latency, 2),
        "avg_seo_score": round(avg_seo, 1),
        "compliance_rate_pct": round(compliance_rate, 1),
        "avg_title_len": round(avg_title_len, 1),
        "avg_desc_words": round(avg_desc_words, 1),
        "avg_tag_count": round(avg_tag_count, 1),
        "details": results_detail,
    }
    return summary


def format_markdown_report(benchmark_summaries: list[dict], output_file: str | None = None) -> str:
    """Format benchmark results into a clean markdown report."""
    md = []
    md.append("# MetaGen Model Evaluation & Benchmark Report\n")
    md.append(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    md.append("## Executive Comparison Matrix\n")
    md.append("| Model Key | Avg SEO Score | Compliance Rate | Avg Latency (s) | Avg Title Len | Avg Desc Words | Avg Tags |")
    md.append("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |")

    for s in benchmark_summaries:
        md.append(
            f"| **{s['model_key']}** | **{s['avg_seo_score']}/100** | {s['compliance_rate_pct']}% | "
            f"{s['avg_latency_s']}s | {s['avg_title_len']} chars | {s['avg_desc_words']} words | {s['avg_tag_count']} |"
        )
    
    md.append("\n## Compliance Targets Reference\n")
    md.append("- **Title Target:** 40–85 characters, 6–15 words, curiosity hook.")
    md.append("- **Description Target:** 150–300 words, 900–1800 chars, structured with hook, takeaways, CTA.")
    md.append("- **Tags Target:** 8–12 relevant keywords, 2–4 words per tag.\n")

    report_str = "\n".join(md)
    if output_file:
        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(report_str)
        print(f"\n[+] Benchmark Report saved to: {output_file}")
    
    return report_str


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run MetaGen Offline Model Benchmark")
    parser.add_argument(
        "--models",
        type=str,
        default="mistral-7b,phi-4-mini,qwen-2.5-7b,llama-3.1-8b",
        help="Comma-separated model keys or choices (e.g. 'mistral-7b,phi-4-mini,auto')",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=5,
        help="Number of evaluation script samples to run per model (1-30)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=os.path.join(ROOT_DIR, "benchmark_report.md"),
        help="Output path for markdown benchmark report",
    )
    args = parser.parse_args()

    dataset = load_eval_dataset(args.samples)
    models_to_run = [m.strip() for m in args.models.split(",") if m.strip()]

    summaries = []
    for model_key in models_to_run:
        summary = run_benchmark_for_model(model_key, dataset)
        summaries.append(summary)

    report = format_markdown_report(summaries, args.output)
    print("\n" + report)
