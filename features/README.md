# MetaGen Standalone Feature Specifications (On-Hold Index)

This directory contains complete, independent, and modular technical specifications for MetaGen features placed on hold. Each feature is designed with zero cross-dependencies and can be implemented on-demand in isolation.

---

## Feature Catalog

| ID | Feature Name | Primary Target | Specification File |
| :--- | :--- | :--- | :--- |
| **F-01** | **Auto Video Chapters & Timestamps** | Long-form Video Retention & Google SEO | [`01_auto_chapters_and_timestamps.md`](./01_auto_chapters_and_timestamps.md) |
| **F-02** | **AI Thumbnail Concept & Visual Hook Studio** | Visual CTR & Image Gen Prompts | [`02_ai_thumbnail_concept_studio.md`](./02_ai_thumbnail_concept_studio.md) |
| **F-03** | **YouTube Shorts & Reels Viral Mode** | Short-form Growth & 3s Hook Analysis | [`03_shorts_and_reels_viral_mode.md`](./03_shorts_and_reels_viral_mode.md) |
| **F-04** | **YouTube URL & Whisper Audio Ingestion** | Frictionless Input & Audio Transcription | [`04_youtube_url_and_whisper_ingestion.md`](./04_youtube_url_and_whisper_ingestion.md) |
| **F-05** | **Creator Persona & Tone Customizer** | Multi-Niche Stylistic Control | [`05_creator_persona_and_tone_customizer.md`](./05_creator_persona_and_tone_customizer.md) |
| **F-06** | **1-Click YouTube Studio Export (OAuth)** | Direct Channel Publishing & Draft Sync | [`06_youtube_studio_oauth_export.md`](./06_youtube_studio_oauth_export.md) |
| **F-07** | **Keyword Search Volume & Competition Insights** | Algorithmic Niche & Long-tail SEO | [`07_keyword_search_volume_insights.md`](./07_keyword_search_volume_insights.md) |

---

## Architectural Principles for On-Demand Activation
1. **Zero Dependency:** No feature requires another feature to function.
2. **Schema Extensibility:** Each feature extends the metadata contract optionally without breaking core title/description/tag generation.
3. **Toggleable UI Components:** Features plug into the main `OutputGrid` and `TerminalCore` via standalone sub-components.
