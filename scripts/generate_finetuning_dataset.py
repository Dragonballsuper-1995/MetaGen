"""
Automated Synthetic Dataset Generator for YouTube SEO Fine-Tuning.
Generates a comprehensive, high-quality dataset of video scripts paired with
SEO-optimized titles, timestamps descriptions, and tags.
Saves to youtube_finetuning_dataset.json.
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

from backend.ai_engine import _get_groq_client, _get_gemini_client, _parse_json_safe

CATEGORIES = [
    ("Coding & Web Dev", "Building full-stack web applications, React, Next.js, FastAPI, Node.js, databases, Docker, Kubernetes"),
    ("AI & Machine Learning", "AI Agents, LLMs, fine-tuning, neural networks, computer vision, LangChain, local SLMs, Ollama"),
    ("Tech Reviews & Gadgets", "Mechanical keyboards, smartphones, custom PCs, Apple silicon, headphones, camera gear"),
    ("Personal Finance & Investing", "Index funds, real estate investing, side hustles, budgeting for beginners, tax strategies"),
    ("Fitness & Health", "Hypertrophy training, fat loss science, nutrition meal prep, mobility routines, sleep optimization"),
    ("Travel & Vlog", "Solo travel in Japan, backpacking Europe, budget city guides, travel camera setups, travel hacks"),
    ("Gaming & Esports", "Game reviews, competitive FPS tips, Unreal Engine 5 breakdowns, gaming setup tours"),
    ("Productivity & Self-Improvement", "Time management systems, Notion setup, combating burnout, morning routines, deep work"),
]

INSTRUCTION_TEMPLATE = "You are an expert YouTube SEO strategist. Generate a viral, high-CTR title, a detailed SEO-optimized description with timestamps and hashtags, and 5-8 relevant tags."

PROMPT_GENERATOR = """Generate 3 distinct, realistic YouTube video script excerpts (each 100-250 words) along with their corresponding ideal YouTube SEO metadata for the niche: {category} ({subtopics}).

Output ONLY a valid JSON object with key "dataset" containing a list of 3 items with this exact schema:
{{
  "dataset": [
    {{
      "instruction": "{instruction}",
      "input": "<Video script excerpt>",
      "output": "<Strict JSON string containing title (40-60 chars), description (with 0:00 timestamps and #hashtags), and tags list>"
    }}
  ]
}}"""


def generate_dataset_batch(category: str, subtopics: str, client, engine: str = "groq") -> list[dict]:
    prompt = PROMPT_GENERATOR.format(category=category, subtopics=subtopics, instruction=INSTRUCTION_TEMPLATE)
    
    if engine == "groq" and client:
        resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an elite synthetic dataset generator. Output ONLY a valid JSON object with key 'dataset'."},
                {"role": "user", "content": prompt},
            ],
            model="openai/gpt-oss-120b",
            response_format={"type": "json_object"},
            temperature=0.8,
        )
        raw = resp.choices[0].message.content.strip()
        parsed = _parse_json_safe(raw)
        if isinstance(parsed, dict) and "dataset" in parsed and isinstance(parsed["dataset"], list):
            return parsed["dataset"]
        if isinstance(parsed, list):
            return parsed
        for v in parsed.values():
            if isinstance(v, list):
                return v
    return []


def create_curated_seed_dataset() -> list[dict]:
    """Provide high-quality seed examples across all major categories."""
    return [
        {
            "instruction": INSTRUCTION_TEMPLATE,
            "input": "Topic: Build a Full-Stack SaaS with Next.js 15, FastAPI & Stripe. Context: In this comprehensive 2-hour crash course, we build and deploy a production-ready AI SaaS application from scratch. We cover authentication with Auth.js, server components in Next.js 15, high-speed Python FastAPI backend with Celery queues, Stripe subscription checkout sessions, and webhook processing. We finish by deploying the frontend to Vercel and backend to Hugging Face Spaces with automated CI/CD pipelines.",
            "output": json.dumps({
                "title": "Build a Full-Stack AI SaaS in 2026 (Next.js 15, FastAPI, Stripe)",
                "description": "Learn how to build and deploy a complete full-stack AI SaaS from absolute scratch in 2026!\n\nIn this complete masterclass, you'll learn modern full-stack development using Next.js 15 App Router, FastAPI, PostgreSQL, and Stripe subscriptions.\n\n📌 Timestamps:\n0:00 - SaaS Architecture Overview\n5:30 - Next.js 15 Setup & Auth\n25:00 - FastAPI Backend & AI Workers\n55:00 - Stripe Billing & Webhooks\n1:30:00 - Deployment & CI/CD\n\n#FullStack #NextJS #FastAPI #WebDev2026 #SaaS",
                "tags": ["full stack saas", "nextjs 15 tutorial", "fastapi tutorial", "build saas 2026", "stripe integration", "python web dev"]
            })
        },
        {
            "instruction": INSTRUCTION_TEMPLATE,
            "input": "Topic: AI Agents Architecture in 2026. Context: Welcome back to the channel! Today we are doing a complete architectural breakdown of AI Agent systems in 2026. We explore autonomous multi-agent reasoning, self-healing code loops, local SLMs running on edge devices, and how developer workflows are completely shifting from writing boilerplate to directing AI swarms. We also benchmark latency between cloud LPUs, edge NPUs, and local quantized GGUF models.",
            "output": json.dumps({
                "title": "AI Agent Systems in 2026: Architecture & Benchmarks",
                "description": "Explore the revolutionary architecture of autonomous AI Agent systems in 2026!\n\nWe break down multi-agent collaboration, self-healing code execution loops, and benchmark latency across cloud LPUs, edge NPUs, and local GGUF models.\n\n📌 Timestamps:\n0:00 - The AI Agent Revolution in 2026\n2:15 - Multi-Agent Reasoning Loops\n5:40 - Edge SLMs vs Cloud LPUs\n9:00 - Live Latency Benchmarks\n12:30 - Future Predictions\n\n#AIAgents #ArtificialIntelligence #MachineLearning #Tech2026",
                "tags": ["ai agent systems", "multi agent reasoning", "edge ai benchmarks", "gguf local llm", "autonomous ai 2026", "future tech"]
            })
        },
        {
            "instruction": INSTRUCTION_TEMPLATE,
            "input": "Topic: Solo Photography Journey in Kyoto Japan. Context: Join me on a 48-hour solo photography trip through the foggy morning mountains and neon streets of Kyoto. I share my street photography camera settings, prime lens choices, composition techniques in rainy weather, finding hidden espresso bars in Gion, and honest reflections on creative burnout and rediscovering inspiration.",
            "output": json.dumps({
                "title": "Solo Rainy Photography in Kyoto: Finding Inspiration Again",
                "description": "Come with me on a cinematic 48-hour solo photography journey through Kyoto, Japan.\n\nIn this video, I share my street photography camera settings, favorite prime lenses for low-light shooting, and how taking solo photo walks helped me overcome creative burnout.\n\n📌 Timestamps:\n0:00 - Foggy Morning in Arashiyama\n3:20 - Street Photography Camera Settings\n7:15 - Rainy Gion at Night\n11:00 - Overcoming Creative Burnout\n\n#Kyoto #StreetPhotography #TravelVlog #CinematicVlog #PhotographyTips",
                "tags": ["kyoto photography", "solo travel japan", "street photography tips", "cinematic vlog", "camera settings tutorial", "japan travel vlog"]
            })
        },
        {
            "instruction": INSTRUCTION_TEMPLATE,
            "input": "Topic: Science of Fat Loss & Muscle Building. Context: In this video, we review over 50 peer-reviewed exercise physiology papers to debunk common fitness myths and provide a step-by-step blueprint for body recomposition. We analyze daily protein distribution, progressive overload frequency, optimal cardio timing, and how to maintain lean muscle mass in a caloric deficit.",
            "output": json.dumps({
                "title": "The Science of Body Recomposition: Build Muscle & Lose Fat",
                "description": "Discover the scientifically proven blueprint for building muscle while losing fat simultaneously (Body Recomposition).\n\nBacked by 50+ clinical studies, we break down optimal protein intake, training volume, and deficit strategies.\n\n📌 Timestamps:\n0:00 - Is Body Recomposition Real?\n2:45 - The Science of Caloric Deficits\n6:10 - Optimal Protein Distribution\n9:30 - Resistance Training Blueprints\n14:00 - 3 Costly Mistakes to Avoid\n\n#FitnessScience #BodyRecomposition #FatLoss #Hypertrophy #WorkoutRoutine",
                "tags": ["body recomposition", "science of fat loss", "build muscle lose fat", "hypertrophy training", "nutrition science", "workout routine"]
            })
        },
        {
            "instruction": INSTRUCTION_TEMPLATE,
            "input": "Topic: How to Invest in Index Funds in 2026 for Beginners. Context: Today we break down the simplest, highest-return investment strategy for beginners: low-cost broad market index funds. We explain ETFs vs mutual funds, dollar-cost averaging, compound interest math, Roth IRA vs 401k tax advantages, and how to set up an automated 3-fund portfolio that runs on autopilot.",
            "output": json.dumps({
                "title": "Index Fund Investing for Beginners in 2026 (Step-by-Step)",
                "description": "The ultimate beginner's guide to index fund investing and building long-term wealth on autopilot in 2026!\n\nLearn how compound interest works, how to choose between S&P 500 ETFs vs total market funds, and how to set up your Roth IRA.\n\n📌 Timestamps:\n0:00 - Why 90% of Stock Pickers Lose\n3:10 - What is an Index Fund / ETF?\n7:00 - The Power of Compound Interest\n11:20 - Roth IRA vs 401(k) Explained\n16:00 - The 3-Fund Lazy Portfolio\n\n#Investing #IndexFunds #PersonalFinance #PassiveIncome #WealthBuilding",
                "tags": ["index funds for beginners", "how to invest 2026", "roth ira tutorial", "etf investing", "passive income investing", "financial freedom"]
            })
        }
    ]


def main():
    print("[+] Starting YouTube SEO Fine-Tuning Dataset Generator...", flush=True)
    client = _get_groq_client()
    dataset = create_curated_seed_dataset()
    print(f"[+] Loaded {len(dataset)} base seed examples.", flush=True)

    if client:
        print("[+] Generating rich multi-niche synthetic samples using Groq LPU (gpt-oss-120b)...", flush=True)
        for category, subtopics in CATEGORIES:
            try:
                start = perf_counter()
                batch = generate_dataset_batch(category, subtopics, client)
                if batch:
                    for item in batch:
                        if isinstance(item, dict) and "instruction" in item and "input" in item and "output" in item:
                            if isinstance(item["output"], dict):
                                item["output"] = json.dumps(item["output"])
                            dataset.append(item)
                    print(f" - [Category: {category}] +{len(batch)} samples generated ({perf_counter()-start:.2f}s)", flush=True)
            except Exception as e:
                print(f" - [Warning] Failed batch for {category}: {e}", flush=True)

    output_file = Path("youtube_finetuning_dataset.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    print(f"\n[SUCCESS] Generated and saved {len(dataset)} high-quality training pairs to {output_file.resolve()}!", flush=True)


if __name__ == "__main__":
    main()
