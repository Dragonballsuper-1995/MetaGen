"""
Unit tests for Groq active model catalog and multi-tier cloud fallback engine.
"""

import pytest
from unittest.mock import MagicMock, patch

from backend.ai_engine import (
    _normalize_model_choice,
    _human_model_name,
    _get_groq_candidate_models,
    _llm_call,
    get_last_used_model_name,
)
from backend.config import get_settings


def test_normalize_model_choice():
    assert _normalize_model_choice("auto") == "auto"
    assert _normalize_model_choice(None) == "auto"
    assert _normalize_model_choice("groq") == "groq-120b"
    assert _normalize_model_choice("openai/gpt-oss-120b") == "groq-120b"
    assert _normalize_model_choice("120b") == "groq-120b"
    assert _normalize_model_choice("groq-20b") == "groq-20b"
    assert _normalize_model_choice("openai/gpt-oss-20b") == "groq-20b"
    assert _normalize_model_choice("20b") == "groq-20b"
    assert _normalize_model_choice("qwen-27b") == "qwen-27b"
    assert _normalize_model_choice("qwen") == "qwen-27b"
    assert _normalize_model_choice("mistral") == "mistral"
    assert _normalize_model_choice("custom") == "mistral"
    assert _normalize_model_choice("local") == "mistral"


def test_human_model_name():
    assert _human_model_name("openai/gpt-oss-120b") == "OpenAI GPT-OSS 120B (Groq)"
    assert _human_model_name("openai/gpt-oss-20b") == "OpenAI GPT-OSS 20B (Groq)"
    assert _human_model_name("qwen/qwen3.6-27b") == "Qwen 3.6 27B (Groq)"
    assert _human_model_name("mistral") == "Mistral 7B (Custom HF)"


def test_groq_candidate_models_auto():
    candidates = _get_groq_candidate_models("auto")
    assert "openai/gpt-oss-120b" in candidates
    assert "openai/gpt-oss-20b" in candidates
    assert "qwen/qwen3.6-27b" in candidates
    assert len(candidates) >= 3


def test_groq_candidate_models_explicit():
    assert _get_groq_candidate_models("groq-120b") == ["openai/gpt-oss-120b"]
    assert _get_groq_candidate_models("groq-20b") == ["openai/gpt-oss-20b"]
    assert _get_groq_candidate_models("qwen-27b") == ["qwen/qwen3.6-27b"]


def test_groq_multi_tier_fallback_success():
    """Simulate primary Groq model failure (e.g. 429 rate limit) failing over to GPT-OSS 20B."""
    mock_groq = MagicMock()

    # First call (120b) raises rate limit, second call (20b) succeeds
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='{"title": "Test Title", "description": "Test Desc", "tags": ["Tag One"]}'))
    ]

    mock_groq.chat.completions.create.side_effect = [
        Exception("Rate limit exceeded 429"),
        mock_response,
    ]

    with patch("backend.ai_engine._get_groq_client", return_value=mock_groq):
        result = _llm_call(
            system_prompt="Test system",
            user_msg="Test user",
            max_tokens=100,
            model_choice="auto",
        )
        assert result.get("title") == "Test Title"
        assert get_last_used_model_name() == "OpenAI GPT-OSS 20B (Groq)"
        assert mock_groq.chat.completions.create.call_count == 2
