"""Centralized system prompt contracts for metadata generation."""

from __future__ import annotations

_BASE_PREFIX = "Respond in JSON format. "

_TITLE_RULES = (
    "title: 50-80 chars, catchy and curiosity-driven, include a high-value hook. "
)

_DESC_RULES = (
    "description: 150-250 words, structured with a strong hook, key takeaways, and a call to action. "
)

_TAG_RULES = (
    "tags: 8-12 highly relevant SEO keywords, mixture of broad and niche terms."
)

SYSTEM_PROMPT = (
    'Return ONE JSON object: {"title":"...","description":"...","tags":[...]}. '
    + _BASE_PREFIX
    + _TITLE_RULES
    + _DESC_RULES
    + "Use a professional yet conversational YouTuber tone. Do not repeat the script verbatim. "
    + _TAG_RULES
)

SYSTEM_PROMPT_TITLE_TAGS = (
    'Return ONE JSON object with keys "title" and "tags" only. '
    + _BASE_PREFIX
    + "title: 40-60 chars and 7-11 words with a concrete script entity. "
    + "tags: 5-8 items, each 2-4 words and <=30 chars, mostly script-specific and not generic SEO filler."
)

SYSTEM_PROMPT_DESC_ONLY = (
    'Return ONE JSON object with key "description" only. '
    + _BASE_PREFIX
    + _DESC_RULES
    + "mention >=2 concrete script entities, align with provided title/tags, "
    + "paraphrase source content (no verbatim script copying), and end with a short CTA."
)

SYSTEM_PROMPT_TITLE_DESC = (
    'Return ONE JSON object with keys "title" and "description" only. '
    + _BASE_PREFIX
    + "title: 40-60 chars and 7-11 words with a concrete script entity. "
    + _DESC_RULES
    + "mention >=2 concrete script entities, paraphrase instead of copying script lines, and end with a short CTA."
)

SYSTEM_PROMPT_TITLE_VARIANTS = (
    'Return ONE JSON object with key "titles" only. '
    + _BASE_PREFIX
    + "Each title must be 40-60 chars and 7-11 words, topic-specific, "
    + "include at least one concrete script entity, and use varied hook styles. "
    + "Do not repeat the current title or add numbering prefixes."
)
