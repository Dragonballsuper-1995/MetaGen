"""Shared text processing helpers for backend services."""

from __future__ import annotations

import re


def split_sentences(text: str, *, keep_punctuation: bool = True) -> list[str]:
    """Split text into sentence-like chunks.

    When ``keep_punctuation`` is True, sentence-ending punctuation stays attached.
    """
    source = text or ""
    if keep_punctuation:
        parts = re.split(r"(?<=[.!?])\s+", source)
    else:
        parts = re.split(r"[.!?]+", source)
    return [segment.strip() for segment in parts if segment and segment.strip()]
