"""
Automated YouTube Dataset Builder for Fine-Tuning.
Queries the YouTube Data API v3 for high-view, high-engagement videos across 80+ diverse niches,
extracts authentic title, description, and keyword tags, and compiles them into
an optimized QLoRA fine-tuning dataset (youtube_finetuning_dataset.json).
"""

import json
import os
import sys
from pathlib import Path

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from backend.config import get_settings
from backend.logger import setup_logging

logger = setup_logging("dataset_builder")

# Comprehensive collection of 85+ high-volume search queries across 10 major YouTube niches
SEARCH_QUERIES = [
    # 💻 1. Software Engineering & Web Development
    "Python programming tutorial for beginners",
    "Full stack web development course 2026",
    "React and Next.js tutorial from scratch",
    "FastAPI Python backend tutorial",
    "Docker and Kubernetes full crash course",
    "TypeScript complete guide for developers",
    "Build a SaaS application from scratch",
    "Software engineering day in the life",
    "System design interview preparation",
    "Microservices architecture explained",
    "Tailwind CSS tutorial for beginners",
    "PostgreSQL and SQL database tutorial",

    # 🤖 2. Artificial Intelligence, Data Science & Machine Learning
    "Machine learning full course for beginners",
    "AI Agents architecture and development",
    "Deep learning PyTorch tutorial",
    "Fine tuning open source LLMs with LoRA",
    "LangChain and LlamaIndex tutorial",
    "Computer vision with OpenCV and YOLO",
    "Run local LLM with Ollama and GGUF",
    "Prompt engineering masterclass",
    "Data science roadmap and portfolio projects",
    "Retrieval Augmented Generation RAG tutorial",

    # 📱 3. Tech Reviews, Gadgets & Hardware
    "Tech review smartphone 2025 2026",
    "How to build a gaming PC step by step",
    "Best budget laptop for students and coding",
    "Custom mechanical keyboard build guide",
    "Apple Silicon Mac vs Windows laptop review",
    "Ultimate desk setup tour and productivity",
    "Best noise cancelling headphones review",
    "Camera gear for YouTube beginners",
    "Smart home automation setup",

    # 💰 4. Personal Finance, Investing & Business
    "How to invest in stocks for beginners",
    "Index funds and ETF investing guide",
    "Passive income ideas that actually work",
    "How to start a successful side hustle",
    "Real estate investing for beginners",
    "Crypto market analysis and Bitcoin guide",
    "Budgeting and saving money in your 20s",
    "How to build wealth with compound interest",
    "E-commerce dropshipping step by step",
    "Personal finance habits of wealthy people",

    # 🎮 5. Gaming, Esports & Game Development
    "Gaming funny moments compilation",
    "Minecraft survival lets play episode 1",
    "GTA 6 gameplay and trailer breakdown",
    "Elden Ring boss guide and walkthrough",
    "Unreal Engine 5 beginner tutorial",
    "Unity game development from scratch",
    "Competitive FPS aim training guide",
    "Top 10 open world games of all time",
    "Retro gaming console restoration",

    # 🏋️ 6. Health, Fitness & Nutrition
    "Fitness full body workout at home no equipment",
    "How to build muscle and lose fat body recomposition",
    "Easy high protein meal prep for the week",
    "Science of hypertrophy and progressive overload",
    "Calisthenics workout routine for beginners",
    "Mobility and stretching routine for back pain",
    "Science based fat loss nutrition guide",
    "Intermittent fasting for beginners explained",
    "Optimal sleep hygiene and recovery science",

    # 🌍 7. Travel, Food & Cultural Vlogs
    "Travel vlog cinematic Tokyo Japan",
    "Solo backpacking Europe on a budget",
    "Street food tour Bangkok Thailand",
    "Hidden travel gems in Italy guide",
    "48 hours in New York City travel guide",
    "Solo travel tips for first timers",
    "Cinematic travel filmmaking b-roll tutorial",
    "Living abroad in Southeast Asia cost of living",

    # 📚 8. Productivity, Study Hacks & Self-Improvement
    "Productivity desk setup and workflow tour",
    "How to study effectively for exams active recall",
    "Self improvement morning routine habits",
    "Notion workspace setup for productivity",
    "Deep work and how to overcome procrastination",
    "Atomic habits summary and implementation",
    "How to speak with confidence and charisma",
    "Dopamine detox and focus reset guide",

    # 🎨 9. Creative Arts, Filmmaking & Design
    "Blender 3D beginner tutorial complete series",
    "Premiere Pro video editing masterclass",
    "UI UX design Figma tutorial for beginners",
    "Street photography composition rules",
    "Color grading in DaVinci Resolve tutorial",
    "Music production in FL Studio for beginners",
    "Digital illustration and drawing tutorial",

    # 🔬 10. Science, History & Educational Deep Dives
    "Quantum physics explained simply",
    "James Webb Space Telescope discoveries",
    "Ancient civilizations history documentary",
    "How the human brain learns new skills",
    "Evolutionary biology documentary",
    "Economics explained basic principles"
]


def get_trending_videos(query: str, youtube_client, max_results: int = 50) -> list[dict]:
    """Fetch top-ranking videos for a search query and format into training records."""
    logger.info("Searching for top videos in niche: '%s'", query)

    # Search top videos sorted by view count
    search_response = youtube_client.search().list(
        q=query,
        part="id",
        maxResults=max_results,
        type="video",
        order="viewCount",
    ).execute()

    video_ids = [item["id"]["videoId"] for item in search_response.get("items", []) if "videoId" in item.get("id", {})]
    if not video_ids:
        return []

    # Fetch detailed snippet metadata (title, description, tags)
    video_response = youtube_client.videos().list(id=",".join(video_ids), part="snippet").execute()

    dataset = []
    for item in video_response.get("items", []):
        snippet = item.get("snippet", {})
        title = snippet.get("title", "").strip()
        description = snippet.get("description", "").strip()
        tags = snippet.get("tags", [])

        # Filter out videos without tags or meaningful descriptions
        if not tags or not description or len(description) < 30:
            continue

        # Format output as strict JSON string
        formatted_output = json.dumps({
            "title": title,
            "description": description[:600],
            "tags": ", ".join(tags[:15]),
        }, ensure_ascii=False)

        data_point = {
            "instruction": "You are an expert YouTube SEO strategist. Generate a viral title, description, and tags for this topic.",
            "input": f"Topic: {title}. Context: {description[:250]}",
            "output": formatted_output,
        }
        dataset.append(data_point)

    return dataset


def main():
    settings = get_settings()
    if not settings.youtube_api_key:
        logger.error("YOUTUBE_API_KEY is not configured! Please set YOUTUBE_API_KEY in your .env file.")
        sys.exit(1)

    youtube = build("youtube", "v3", developerKey=settings.youtube_api_key)
    output_path = Path("youtube_finetuning_dataset.json")

    # Load existing dataset if present to accumulate new data without overwriting
    existing_data = []
    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            logger.info("Loaded %d existing examples from %s", len(existing_data), output_path.name)
        except Exception as e:
            logger.warning("Could not load existing dataset: %s", e)

    full_dataset = list(existing_data)
    logger.info("Starting massive data collection across %d diverse queries...", len(SEARCH_QUERIES))

    collected_this_run = 0
    quota_exceeded = False

    for idx, query in enumerate(SEARCH_QUERIES, start=1):
        try:
            batch = get_trending_videos(query, youtube, max_results=50)
            full_dataset.extend(batch)
            collected_this_run += len(batch)
            logger.info("[%d/%d] Fetched +%d videos for '%s'", idx, len(SEARCH_QUERIES), len(batch), query)
        except HttpError as http_err:
            if "quotaExceeded" in str(http_err) or http_err.resp.status == 403:
                logger.warning("⚠️ YouTube API daily quota limit reached (10,000 units). Saving collected data...")
                quota_exceeded = True
                break
            else:
                logger.warning("HTTP error on query '%s': %s", query, http_err)
        except Exception as e:
            logger.warning("Skipping '%s' due to error: %s", query, e)

    # De-duplicate by title
    seen_titles = set()
    unique_dataset = []
    for item in full_dataset:
        try:
            out_data = json.loads(item["output"]) if isinstance(item["output"], str) else item["output"]
            title_key = out_data.get("title", "").strip().lower()
            if title_key and title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_dataset.append(item)
        except Exception:
            unique_dataset.append(item)

    # Save to JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(unique_dataset, f, indent=4, ensure_ascii=False)

    logger.info("======================================================================")
    logger.info("✅ DATASET EXPANSION COMPLETE!")
    logger.info("📊 Total unique high-quality training pairs: %d", len(unique_dataset))
    logger.info("📁 Saved to: %s", output_path.resolve())
    if quota_exceeded:
        logger.info("ℹ️ Note: API quota paused the run. You can re-run tomorrow to accumulate even more!")
    logger.info("======================================================================")


if __name__ == "__main__":
    main()
