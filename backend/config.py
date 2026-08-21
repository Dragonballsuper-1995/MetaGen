"""
Centralized configuration using Pydantic Settings.

All config is loaded from environment variables (or .env file).
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Model ---
    # NOTE: Do NOT commit model files to the repository. Set this via environment.
    model_path: str = Field(
        default="custom-mistral-yt-seo-Q4_K_M.gguf",
        description="Path to the GGUF model file (set via env or default filename)",
    )
    context_window: int = Field(default=1024, ge=512, le=8192)
    max_tokens: int = Field(default=384, ge=64, le=4096)
    temperature: float = Field(default=0.35, ge=0.0, le=2.0)
    top_p: float = Field(default=0.92, ge=0.1, le=1.0)
    repeat_penalty: float = Field(default=1.15, ge=1.0, le=2.0)
    gpu_layers: int = Field(
        default=-1,
        description="-1 offloads all layers to GPU",
    )
    llm_batch_size: int = Field(
        default=1024,
        ge=128,
        le=4096,
        description="Batch size for llama-cpp token processing",
    )
    cuda_dll_paths: str = Field(
        default="",
        description=(
            "Windows only: semicolon-separated directories to add to DLL search path "
            "before loading llama_cpp (for cudart/cublas DLL discovery)."
        ),
    )

    # --- Input Limits ---
    max_script_length: int = Field(
        default=3000,
        description="Max characters allowed in user script input",
    )
    min_script_length: int = Field(
        default=20,
        description="Min characters required in user script input",
    )

    # --- Output constraints ---
    title_min_chars: int = Field(default=40, ge=10, le=120)
    title_max_chars: int = Field(default=85, ge=20, le=140)
    title_min_words: int = Field(default=6, ge=3, le=20)
    title_max_words: int = Field(default=15, ge=4, le=24)

    description_min_words: int = Field(default=150, ge=50, le=400)
    description_max_words: int = Field(default=300, ge=60, le=500)
    description_min_chars: int = Field(default=900, ge=250, le=3000)
    description_max_chars: int = Field(default=1800, ge=300, le=4000)

    tags_min_count: int = Field(default=8, ge=3, le=20)
    tags_max_count: int = Field(default=12, ge=4, le=30)
    tag_min_words: int = Field(default=2, ge=1, le=8)
    tag_max_words: int = Field(default=4, ge=1, le=10)
    tag_max_chars: int = Field(default=30, ge=10, le=64)

    constraint_retry_count: int = Field(
        default=2,
        ge=0,
        le=5,
        description="How many times to retry regenerating failing metadata fields",
    )
    stream_allow_retry: bool = Field(
        default=False,
        description="Allow expensive field-level retry calls for streaming strategies",
    )

    # --- Latency tuning ---
    stream_title_desc_max_tokens: int = Field(
        default=220,
        ge=90,
        le=1024,
        description="Max output tokens for streamed title+description generation",
    )
    non_stream_title_desc_max_tokens: int = Field(
        default=260,
        ge=100,
        le=2048,
        description="Max output tokens for non-stream title+description generation",
    )
    description_retry_max_tokens: int = Field(
        default=220,
        ge=80,
        le=1024,
        description="Max output tokens for description-only retry regeneration",
    )
    cpu_fallback_max_tokens: int = Field(
        default=130,
        ge=80,
        le=1024,
        description="Token cap to use when GPU offload appears inactive",
    )
    stream_input_max_chars: int = Field(
        default=300,
        ge=280,
        le=3000,
        description="Max prompt characters to feed into streaming generation paths",
    )
    gpu_active_memory_threshold_mb: int = Field(
        default=256,
        ge=0,
        le=16384,
        description="Minimum GPU memory usage considered active offload",
    )
    gpu_inactive_confirmations: int = Field(
        default=2,
        ge=1,
        le=10,
        description="Consecutive low-memory observations before CPU-fast profile is activated",
    )
    model_keep_warm_enabled: bool = Field(
        default=True,
        description="Enable periodic background keep-warm checks for the loaded model",
    )
    model_keep_warm_interval_s: int = Field(
        default=240,
        ge=30,
        le=3600,
        description="Seconds between keep-warm heartbeat checks",
    )

    # --- Redis / Celery ---
    redis_url: str = Field(default="redis://localhost:6379/0")

    # --- API Keys & Cloud Models (optional, only needed for specific features) ---
    hf_token: str = Field(default="", description="HuggingFace API token")
    groq_api_key: str = Field(default="", description="Groq API key for lightning-fast inference")
    groq_model: str = Field(
        default="openai/gpt-oss-120b",
        description="Primary Groq model ID for cloud inference (e.g. openai/gpt-oss-120b)",
    )
    groq_fallback_models: list[str] = Field(
        default=["openai/gpt-oss-20b", "qwen/qwen3.6-27b"],
        description="Ordered list of cloud fallback models if primary model encounters rate-limits or errors",
    )
    youtube_api_key: str = Field(default="", description="YouTube Data API key")

    # --- Security ---
    api_key: str = Field(
        default="",
        description="API key for authentication. Empty = no auth (dev only).",
    )
    rate_limit: str = Field(
        default="10/minute",
        description="Rate limit for /api/generate (slowapi format, e.g. '10/minute').",
    )

    # --- Generation strategy ---
    generation_strategy: str = Field(
        default="tfidf_streaming",
        description=(
            "Generation strategy: "
            "standard (single LLM call), "
            "two_pass (title+tags then description), "
            "tfidf_tags (TF keyword tags + LLM title/desc), "
            "streaming (streamed single call), "
            "tfidf_streaming (TF tags + streamed title/desc)"
        ),
    )

    # --- Server ---
    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")
    debug: bool = Field(default=False)
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:8501",
        description="Comma-separated list of allowed CORS origins when debug is False.",
    )

    model_config = {
        "env_file": (".env", "backend/.env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
