"""
AI Engine — GPU-accelerated YouTube SEO metadata generation.

Supports 5 generation strategies (set via GENERATION_STRATEGY env var):
  - standard:        Single LLM call → title + description + tags
  - two_pass:        Two LLM calls — title+tags then description
  - tfidf_tags:      TF keyword tags + LLM title/desc (fastest non-stream)
  - streaming:       Streamed single LLM call (instant perceived start)
  - tfidf_streaming: TF tags + streamed LLM title+desc (fastest + streaming)
"""

import json
import multiprocessing
import os
import re
import site
import subprocess
import threading
from collections import Counter
from collections.abc import Generator
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter
from typing import TYPE_CHECKING, Any

try:
    from groq import Groq
except ImportError:
    Groq = None

if TYPE_CHECKING:
    pass

from backend.config import get_settings
from backend.logger import setup_logging
from backend.utils.prompt_factory import (
    SYSTEM_PROMPT,
    SYSTEM_PROMPT_DESC_ONLY,
    SYSTEM_PROMPT_TITLE_DESC,
    SYSTEM_PROMPT_TITLE_TAGS,
    SYSTEM_PROMPT_TITLE_VARIANTS,
)
from backend.utils.text_processing import split_sentences

logger = setup_logging("ai_engine")

# ---------------------------------------------------------------------------
# Model singleton (module-level, loaded once per process)
# ---------------------------------------------------------------------------
_llm_instance: Any | None = None
_groq_client: Any | None = None
_gpu_probe_warning_emitted = False
_gpu_low_memory_observations = 0
_last_gpu_status: dict[str, Any] | None = None
_last_gpu_probe_ts = 0.0
_GPU_STATUS_TTL_SECONDS = 300.0
_llama_gpu_offload_supported: bool | None = None
_cuda_dll_dir_handles: list[Any] = []
_inference_diagnostics_lock = threading.Lock()
_inference_diagnostics_sequence = 0
_inference_diagnostics: dict[str, dict[str, Any] | None] = {
    "metadata_last": None,
    "stream_last": None,
    "title_variants_last": None,
}
_COLD_WARM_FIRST_TOKEN_THRESHOLD_S = 2.5
_COLD_WARM_TOTAL_THRESHOLD_S = 18.0
_COLD_WARM_VARIANT_LLM_THRESHOLD_S = 6.0


def _utc_timestamp() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get_groq_client():
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    settings = _get_settings()
    if Groq and settings.groq_api_key:
        try:
            _groq_client = Groq(api_key=settings.groq_api_key)
            logger.info("Groq client initialized for lightning-fast inference.")
            return _groq_client
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
    return None


def _classify_run_temperature(
    *,
    strategy: str,
    first_token_s: float | None = None,
    total_s: float | None = None,
    llm_total_s: float | None = None,
    token_chunks: int = 0,
) -> str:
    """Classify inference run as cold/warm/unknown based on timing signals."""
    if strategy in {"streaming", "tfidf_streaming"}:
        if first_token_s is not None:
            return "cold" if first_token_s >= _COLD_WARM_FIRST_TOKEN_THRESHOLD_S else "warm"
        if token_chunks > 0:
            return "warm"
        if total_s is not None and total_s >= _COLD_WARM_TOTAL_THRESHOLD_S:
            return "cold"
        return "unknown"

    if strategy == "title_variants":
        if llm_total_s is None:
            return "unknown"
        return "cold" if llm_total_s >= _COLD_WARM_VARIANT_LLM_THRESHOLD_S else "warm"

    if total_s is None:
        return "unknown"
    return "cold" if total_s >= _COLD_WARM_TOTAL_THRESHOLD_S else "warm"


def _record_inference_diagnostic(kind: str, payload: dict[str, Any]) -> None:
    """Persist latest inference diagnostics for benchmarking and runtime debugging."""
    global _inference_diagnostics_sequence

    kind_to_slot = {
        "metadata": "metadata_last",
        "stream": "stream_last",
        "title_variants": "title_variants_last",
    }
    slot = kind_to_slot.get(kind)
    if slot is None:
        return

    entry = deepcopy(payload)
    entry["kind"] = kind
    entry["recorded_at_utc"] = _utc_timestamp()

    with _inference_diagnostics_lock:
        _inference_diagnostics_sequence += 1
        entry["sequence"] = _inference_diagnostics_sequence
        _inference_diagnostics[slot] = entry


def get_inference_diagnostics_snapshot() -> dict[str, Any]:
    """Return latest in-memory diagnostics for metadata and title-variant inference paths."""
    with _inference_diagnostics_lock:
        snapshot = deepcopy(_inference_diagnostics)
        snapshot["generated_at_utc"] = _utc_timestamp()
        snapshot["llama_gpu_offload_supported"] = _llama_gpu_offload_supported
        snapshot["last_gpu_status"] = deepcopy(_last_gpu_status) if _last_gpu_status else None
        snapshot["gpu_status_age_s"] = (
            round(max(0.0, perf_counter() - _last_gpu_probe_ts), 3) if _last_gpu_probe_ts else None
        )
    return snapshot


def _iter_cuda_dll_candidate_dirs() -> list[Path]:
    """Return candidate directories that may contain CUDA runtime DLLs on Windows."""
    if os.name != "nt":
        return []

    settings = _get_settings()
    candidates: list[Path] = []
    seen: set[str] = set()

    def add_candidate(path_value: str | Path | None) -> None:
        if not path_value:
            return
        path = Path(path_value)
        normalized = os.path.normcase(str(path))
        if normalized in seen:
            return
        seen.add(normalized)
        candidates.append(path)

    raw_settings_paths = str(getattr(settings, "cuda_dll_paths", "") or "")
    for part in raw_settings_paths.split(";"):
        stripped = part.strip()
        if stripped:
            add_candidate(stripped)

    for env_key in ("METAGEN_CUDA_DLL_PATHS", "CUDA_DLL_PATHS"):
        for part in (os.environ.get(env_key, "") or "").split(";"):
            stripped = part.strip()
            if stripped:
                add_candidate(stripped)

    cuda_path = (os.environ.get("CUDA_PATH", "") or "").strip()
    if cuda_path:
        add_candidate(Path(cuda_path) / "bin")

    for site_dir in site.getsitepackages():
        add_candidate(Path(site_dir) / "llama_cpp" / "lib")
        nvidia_dir = Path(site_dir) / "nvidia"
        add_candidate(nvidia_dir / "cuda_runtime" / "bin")
        add_candidate(nvidia_dir / "cublas" / "bin")

    user_site = site.getusersitepackages()
    if user_site:
        add_candidate(Path(user_site) / "llama_cpp" / "lib")
        nvidia_dir = Path(user_site) / "nvidia"
        add_candidate(nvidia_dir / "cuda_runtime" / "bin")
        add_candidate(nvidia_dir / "cublas" / "bin")

    toolkit_root = Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA")
    if toolkit_root.exists():
        for bin_dir in sorted(toolkit_root.glob("v*/bin"), reverse=True):
            add_candidate(bin_dir)

    return [path for path in candidates if path.is_dir()]


def _configure_windows_cuda_dll_search_path() -> None:
    """Register CUDA DLL directories before importing llama_cpp on Windows."""
    global _cuda_dll_dir_handles

    if os.name != "nt":
        return
    if _cuda_dll_dir_handles:
        return
    if not hasattr(os, "add_dll_directory"):
        return

    existing_path = os.environ.get("PATH", "")
    path_entries = [entry for entry in existing_path.split(os.pathsep) if entry]
    normalized_path_entries = {os.path.normcase(os.path.normpath(entry)) for entry in path_entries}

    added_count = 0
    prepended_path_entries: list[str] = []
    for dll_dir in _iter_cuda_dll_candidate_dirs():
        dll_dir_str = str(dll_dir)
        normalized_dir = os.path.normcase(os.path.normpath(dll_dir_str))
        if normalized_dir not in normalized_path_entries:
            prepended_path_entries.append(dll_dir_str)
            normalized_path_entries.add(normalized_dir)

        try:
            handle = os.add_dll_directory(dll_dir_str)
            _cuda_dll_dir_handles.append(handle)
            added_count += 1
        except OSError:
            continue

    if prepended_path_entries:
        os.environ["PATH"] = os.pathsep.join(prepended_path_entries + [existing_path]) if existing_path else os.pathsep.join(prepended_path_entries)

    if added_count or prepended_path_entries:
        logger.info(
            "Registered %d DLL directory handle(s) and prepended %d PATH entries for llama runtime",
            added_count,
            len(prepended_path_entries),
        )


def _load_llama_bindings() -> tuple[type[Any], Any | None]:
    """Import llama_cpp bindings with actionable diagnostics on Windows."""
    _configure_windows_cuda_dll_search_path()

    try:
        from llama_cpp import Llama

        llama_backend: Any | None = None
        try:
            from llama_cpp import llama_cpp as llama_backend
        except Exception:
            llama_backend = None

        return Llama, llama_backend
    except Exception as exc:
        suffix = ""
        if os.name == "nt":
            suffix = (
                " On Windows CUDA wheels require cudart64_12.dll and cublas64_12.dll."
                " Install nvidia-cuda-runtime-cu12 and nvidia-cublas-cu12, or set CUDA_PATH"
                " / Settings.cuda_dll_paths to a CUDA toolkit 'bin' directory."
            )
        raise RuntimeError(f"Failed to import llama_cpp runtime.{suffix} Original error: {exc}") from exc


def _log_llama_backend_capabilities(llama_backend: Any | None) -> None:
    """Log backend-reported GPU offload capability from llama.cpp bindings."""
    global _llama_gpu_offload_supported
    _llama_gpu_offload_supported = None

    if llama_backend is None:
        return

    max_devices: int | None = None
    max_devices_fn = getattr(llama_backend, "llama_max_devices", None)
    if callable(max_devices_fn):
        try:
            max_devices = int(max_devices_fn())
        except Exception:
            max_devices = None

    supports_fn = getattr(llama_backend, "llama_supports_gpu_offload", None)
    if callable(supports_fn):
        try:
            _llama_gpu_offload_supported = bool(supports_fn())
        except Exception as exc:
            logger.debug("Could not query llama.cpp GPU support: %s", exc)
            _llama_gpu_offload_supported = None

    if _llama_gpu_offload_supported is True:
        if max_devices is None:
            logger.info("llama.cpp backend reports GPU offload support")
        else:
            logger.info("llama.cpp backend reports GPU offload support (max_devices=%d)", max_devices)
    elif _llama_gpu_offload_supported is False:
        logger.warning("llama.cpp backend reports no GPU offload support; running on CPU")


def _read_gpu_status() -> dict[str, Any] | None:
    """Best-effort GPU status read via nvidia-smi."""
    global _last_gpu_status, _last_gpu_probe_ts

    now = perf_counter()
    if _last_gpu_status and (now - _last_gpu_probe_ts) < _GPU_STATUS_TTL_SECONDS:
        return _last_gpu_status

    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.used,memory.total,utilization.gpu",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=2,
            check=False,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return

        first_line = result.stdout.strip().splitlines()[0]
        parts = [p.strip() for p in first_line.split(",")]
        if len(parts) < 4:
            return

        gpu_name, used_mb, total_mb, util_pct = parts[:4]
        status = {
            "name": gpu_name,
            "used_mb": int(used_mb),
            "total_mb": int(total_mb),
            "util_pct": int(util_pct),
        }
        _last_gpu_status = status
        _last_gpu_probe_ts = now
        return status
    except Exception as exc:
        logger.debug("GPU probe skipped: %s", exc)
        return None


def _log_gpu_status() -> dict[str, Any] | None:
    """Log current GPU utilization snapshot and return parsed status."""
    status = _read_gpu_status()
    if not status:
        logger.debug("GPU probe unavailable (nvidia-smi returned no data)")
        return None

    logger.info(
        "GPU status: %s | memory=%s/%s MB | util=%s%%",
        status["name"],
        status["used_mb"],
        status["total_mb"],
        status["util_pct"],
    )
    return status


def _should_use_cpu_fast_profile() -> bool:
    """Detect likely CPU fallback and activate conservative token caps."""
    global _gpu_probe_warning_emitted, _gpu_low_memory_observations

    settings = _get_settings()
    if settings.gpu_layers == 0:
        return True

    if _llama_gpu_offload_supported is False:
        if not _gpu_probe_warning_emitted:
            logger.warning(
                "GPU offload unavailable in llama.cpp backend. Applying CPU-fast token caps."
            )
            _gpu_probe_warning_emitted = True
        return True

    status = _read_gpu_status()
    if not status:
        return False

    used_mb = int(status["used_mb"])
    if used_mb > settings.gpu_active_memory_threshold_mb:
        _gpu_low_memory_observations = 0
        return False

    required_observations = max(1, int(getattr(settings, "gpu_inactive_confirmations", 2)))
    _gpu_low_memory_observations += 1
    if _gpu_low_memory_observations < required_observations:
        return False

    if not _gpu_probe_warning_emitted:
        logger.warning(
            "GPU offload may be inactive (observed GPU memory=%dMB <= threshold=%dMB for %d checks). "
            "Applying CPU-fast token caps.",
            used_mb,
            settings.gpu_active_memory_threshold_mb,
            _gpu_low_memory_observations,
        )
        _gpu_probe_warning_emitted = True
    return True


def _cap_max_tokens(requested: int, profile: str) -> int:
    """Apply profile-specific and CPU-fallback token caps."""
    settings = _get_settings()
    capped = min(requested, settings.max_tokens)

    if profile == "title_desc_stream":
        capped = min(capped, settings.stream_title_desc_max_tokens)
    elif profile == "title_desc_batch":
        capped = min(capped, settings.non_stream_title_desc_max_tokens)
    elif profile == "description_retry":
        capped = min(capped, settings.description_retry_max_tokens)

    if _should_use_cpu_fast_profile():
        cpu_cap = settings.cpu_fallback_max_tokens
        if profile == "title_desc_batch":
            cpu_cap = min(cpu_cap + 20, settings.non_stream_title_desc_max_tokens)
        capped = min(capped, cpu_cap)

    floor = 110
    if profile == "title_desc_stream":
        floor = 96
    elif profile == "description_retry":
        floor = 100

    final_tokens = max(floor, capped)
    logger.debug(
        "Token cap profile=%s requested=%d final=%d",
        profile,
        requested,
        final_tokens,
    )
    return final_tokens


def get_llm() -> Any:
    """
    Return the cached LLM instance, loading it on first call.

    The model is ~4.37 GB GGUF. With n_gpu_layers=-1, it is offloaded to GPU
    when the active llama.cpp backend supports CUDA offload.
    """
    global _llm_instance
    # Allow tests to patch the top-level `ai_engine._llm_instance` name.
    # If present, prefer that (this keeps tests working when they patch the
    # public module instead of the backend package module).
    try:
        import sys

        ai_mod = sys.modules.get("ai_engine")
        if ai_mod is not None and hasattr(ai_mod, "_llm_instance") and ai_mod._llm_instance is not None:
            _llm_instance = ai_mod._llm_instance
    except Exception:
        pass

    if _llm_instance is not None:
        return _llm_instance

    llama_class, llama_backend = _load_llama_bindings()

    # Load model if not already cached
    settings = _get_settings()

    # Fail fast with a clear message if model path not provided.
    if not settings.model_path:
        raise RuntimeError(
            "MODEL_PATH is not configured. Set the model path via the environment variable 'MODEL_PATH' or Settings.model_path."
        )

    model_path = settings.model_path
    # If a relative path was given but doesn't exist as-is, try common locations
    if not os.path.isabs(model_path) and not os.path.exists(model_path):
        candidates = [
            model_path,
            os.path.join("backend", model_path),
            os.path.join("backend", "model", model_path),
            os.path.join("model", model_path),
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                model_path = candidate
                break

    if not os.path.exists(model_path):
        raise RuntimeError(f"Model path does not exist: {settings.model_path}")

    threads = max(1, multiprocessing.cpu_count() - 2)

    logger.info(
        "Loading GGUF model '%s' (threads=%d, gpu_layers=%d, batch=%d)",
        model_path,
        threads,
        settings.gpu_layers,
        settings.llm_batch_size,
    )

    model_load_start = perf_counter()
    _llm_instance = llama_class(
        model_path=model_path,
        n_ctx=settings.context_window,
        n_batch=settings.llm_batch_size,
        n_threads=threads,
        n_gpu_layers=settings.gpu_layers,
        flash_attn=True,
        chat_format="mistral-instruct",
        verbose=False,
    )

    logger.info("Model loaded successfully in %.2fs", perf_counter() - model_load_start)
    _log_llama_backend_capabilities(llama_backend)
    _log_gpu_status()
    return _llm_instance


# Helper to allow tests to monkeypatch get_settings on the top-level ai_engine module
def _get_settings():
    try:
        import sys

        ai_mod = sys.modules.get("ai_engine")
        if ai_mod is not None and getattr(ai_mod, "get_settings", None) is not None:
            return ai_mod.get_settings()
    except Exception:
        pass
    return get_settings()



# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------


class ScriptValidationError(ValueError):
    """Raised when the user-provided script fails validation."""


def validate_script(script_text: str) -> str:
    """
    Validate and sanitize the input script.

    Returns:
        Cleaned script text.

    Raises:
        ScriptValidationError: If input is invalid.
    """
    settings = _get_settings()

    if not script_text or not script_text.strip():
        raise ScriptValidationError("Script text cannot be empty.")

    cleaned = script_text.strip()

    if len(cleaned) < settings.min_script_length:
        raise ScriptValidationError(
            f"Script is too short ({len(cleaned)} chars). "
            f"Minimum is {settings.min_script_length} characters."
        )

    if len(cleaned) > settings.max_script_length:
        raise ScriptValidationError(
            f"Script is too long ({len(cleaned)} chars). "
            f"Maximum is {settings.max_script_length} characters."
        )

    return cleaned


# ---------------------------------------------------------------------------
# Metadata generation
# ---------------------------------------------------------------------------


def _clean_title(title: str) -> str:
    """
    Post-process the title to remove common model artefacts.

    Strips trailing "Video Summary", leading numbers/measurements,
    and other noise the model sometimes injects.
    """
    import re

    # Strip "Video Summary" suffix (case-insensitive)
    title = re.sub(r'\s*Video\s*Summary\s*$', '', title, flags=re.IGNORECASE).strip()

    # Strip leading/trailing patterns like "30 minutes, 425 degrees, "
    # (numbers followed by units then comma, at the start of the title)
    title = re.sub(
        r'^(?:\d+[\s]*(?:minutes?|seconds?|hours?|degrees?|fahrenheit|celsius|°[fFcC])\s*,\s*)+',
        '', title, flags=re.IGNORECASE
    ).strip()

    # Strip leading/trailing junk punctuation
    title = title.strip(' ,;:-')

    # Capitalise first letter if it got lowered
    if title and title[0].islower():
        title = title[0].upper() + title[1:]

    return title


def _word_count(text: str) -> int:
    """Return a conservative word count."""
    return len(re.findall(r"\b[\w'-]+\b", text or ""))


def _split_sentences(text: str) -> list[str]:
    """Split text into sentence-like chunks."""
    return split_sentences(text, keep_punctuation=True)


def _ensure_terminal_punctuation(text: str) -> str:
    """Ensure text ends with sentence punctuation."""
    cleaned = (text or "").strip()
    if not cleaned:
        return ""
    if cleaned.endswith((".", "!", "?")):
        return cleaned
    return f"{cleaned}."


def _truncate_to_words(text: str, max_words: int) -> str:
    """Trim text to a max number of words while keeping readability."""
    words = (text or "").split()
    if len(words) <= max_words:
        return (text or "").strip()
    return _ensure_terminal_punctuation(" ".join(words[:max_words]).rstrip(" ,;:-"))


def _truncate_to_chars(text: str, max_chars: int) -> str:
    """Trim text to max chars without cutting hard mid-word when possible."""
    cleaned = (text or "").strip()
    if len(cleaned) <= max_chars:
        return cleaned

    clipped = cleaned[:max_chars].rstrip(" ,;:-")
    if " " in clipped:
        clipped = clipped[:clipped.rfind(" ")].rstrip(" ,;:-")
    return _ensure_terminal_punctuation(clipped)


def _clean_description(desc: str) -> str:
    """
    Post-process description to strip script echoes and known bad prefixes.
    """
    if not desc:
        return ""

    # Strip common bad prefixes the model likes to add
    bad_prefixes = [
        r"^Video\s*Summary\s*:\s*",
        r"^Script\s*Segment\s*:\s*",
        r"^Description\s*:\s*",
        r"^Summary\s*:\s*",
    ]
    for pattern in bad_prefixes:
        desc = re.sub(pattern, "", desc, flags=re.IGNORECASE).strip()

    # Strip leaked brief fragments ("Topics: ...", "Entities: ...", "Key topics: ...")
    desc = re.sub(
        r'\s*(?:Topics|Entities|Key\s*topics|Themes|Context)\s*:.*$',
        '', desc, flags=re.IGNORECASE
    ).strip()

    desc = re.sub(r"\s+", " ", desc).strip()
    settings = _get_settings()

    # Keep script-echo protection, but do not collapse into very short output.
    if _word_count(desc) > settings.description_max_words * 2:
        desc = _truncate_to_words(desc, settings.description_max_words + 25)
    if len(desc) > settings.description_max_chars * 2:
        desc = _truncate_to_chars(desc, settings.description_max_chars + 180)

    return desc


def _script_overlap_score(desc: str, script_text: str) -> float:
    """Compute token overlap ratio between description and script."""
    if not desc or not script_text:
        return 0.0

    script_norm = re.sub(r"\s+", " ", script_text).strip().lower()
    desc_norm = re.sub(r"\s+", " ", desc).strip().lower()

    script_token_set = {tok for tok in re.findall(r"[a-z0-9]+", script_norm) if len(tok) > 2}
    desc_token_set = {tok for tok in re.findall(r"[a-z0-9]+", desc_norm) if len(tok) > 2}
    if not desc_token_set:
        return 0.0
    return len(script_token_set.intersection(desc_token_set)) / len(desc_token_set)


def _token_set(text: str) -> set[str]:
    return {tok for tok in re.findall(r"[a-z0-9]+", text.lower()) if len(tok) > 2}


def _normalize_sentence(sentence: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", sentence.lower()).strip()


_GENERIC_DESCRIPTION_PHRASES = {
    "creator workflow",
    "creator workflow system",
    "audience growth",
    "retention signals",
    "creator tactics",
    "growth breakdowns",
    "creator growth playbooks",
    "practical creator tactics",
    "weekly growth breakdowns",
}

_GENERIC_DESCRIPTION_TOKENS = {
    "creator",
    "growth",
    "playbook",
    "playbooks",
    "workflow",
    "audience",
    "retention",
    "signals",
    "tactics",
    "strategy",
    "strategies",
    "practical",
    "weekly",
    "breakdown",
    "breakdowns",
    "system",
    "systems",
}


def _extract_script_grounding_terms(script_text: str, tags: list[str], *, limit: int = 6) -> list[str]:
    """Extract script-grounded topic phrases for fallback rewrites."""
    normalized_script = re.sub(r"\s+", " ", script_text or "").strip().lower()
    script_tokens = {
        tok
        for tok in re.findall(r"[a-z0-9]+", normalized_script)
        if len(tok) > 2
    }

    candidates: list[str] = [str(tag).strip() for tag in tags if str(tag).strip()]

    if script_text:
        try:
            from backend.keyword_extractor import extract_tags

            candidates.extend(extract_tags(script_text, top_n=max(limit * 4, 20)))
        except Exception:
            pass

        token_counts = Counter(
            tok
            for tok in re.findall(r"[a-zA-Z]{4,}", script_text.lower())
            if tok not in _GENERIC_DESCRIPTION_TOKENS
        )
        candidates.extend(tok for tok, _count in token_counts.most_common(limit * 3))

    result: list[str] = []
    seen: set[str] = set()
    for raw_candidate in candidates:
        candidate = re.sub(r"\s+", " ", str(raw_candidate)).strip(" ,;:-")
        if not candidate:
            continue
        lowered = candidate.lower()
        if lowered in seen:
            continue
        if any(phrase in lowered for phrase in _GENERIC_DESCRIPTION_PHRASES):
            continue

        tokens = [tok for tok in re.findall(r"[a-z0-9]+", lowered) if len(tok) > 2]
        if not tokens:
            continue
        if not any(tok not in _GENERIC_DESCRIPTION_TOKENS for tok in tokens):
            continue
        if script_tokens and not set(tokens).intersection(script_tokens):
            continue

        words = candidate.split()
        if len(words) > 5:
            candidate = " ".join(words[:5]).strip(" ,;:-")
            lowered = candidate.lower()

        seen.add(lowered)
        result.append(candidate)
        if len(result) >= limit:
            break

    return result


def _grounded_topic_triplet(script_text: str, tags: list[str]) -> tuple[str, str, str]:
    terms = _extract_script_grounding_terms(script_text, tags, limit=3)
    defaults = [
        "script entities",
        "search intent mapping",
        "metadata sequencing",
    ]
    while len(terms) < 3:
        terms.append(defaults[len(terms)])
    return terms[0], terms[1], terms[2]


def _build_script_grounded_cta(script_text: str, tags: list[str]) -> str:
    topics = _extract_script_grounding_terms(script_text, tags, limit=2)
    if len(topics) >= 2:
        return (
            f"Apply these {topics[0]} and {topics[1]} steps on your next upload, "
            "then subscribe for more script-based breakdowns."
        )
    if len(topics) == 1:
        return (
            f"Apply this {topics[0]} process on your next upload, "
            "then subscribe for more script-based breakdowns."
        )
    return "Apply this script-based process on your next upload, then subscribe for more practical walkthroughs."


def _build_script_grounded_fillers(script_text: str, tags: list[str]) -> list[str]:
    primary, secondary, tertiary = _grounded_topic_triplet(script_text, tags)
    return [
        (
            f"It ties {primary} to {secondary} so each metadata field stays anchored to the script's concrete entities "
            "instead of broad placeholders."
        ),
        (
            f"You will also see how {tertiary} decisions influence title clarity, description depth, and tag relevance "
            "before publishing."
        ),
    ]


def _apply_anti_echo_penalty(
    description: str,
    script_text: str,
    *,
    min_keep: int = 2,
    min_words: int | None = None,
    min_chars: int | None = None,
) -> tuple[str, int]:
    """Remove sentences that closely echo the script when possible."""
    if not description or not script_text:
        return description, 0

    sentences = _split_sentences(description)
    if len(sentences) <= min_keep:
        return description, 0

    script_sentences = [
        s for s in _split_sentences(script_text)
        if len(s.strip()) >= 20
    ]
    if not script_sentences:
        return description, 0

    script_norms = {
        _normalize_sentence(s) for s in script_sentences
        if s.strip()
    }
    script_token_sets = [
        _token_set(s) for s in script_sentences
        if _token_set(s)
    ]

    echo_meta: list[tuple[int, float, int, int]] = []
    keep_indices: list[int] = []
    for idx, sentence in enumerate(sentences):
        norm = _normalize_sentence(sentence)
        if not norm:
            continue

        is_echo = False
        best_overlap = 0.0
        if norm in script_norms:
            is_echo = True
            best_overlap = 1.0
        else:
            desc_tokens = _token_set(sentence)
            if desc_tokens:
                for script_tokens in script_token_sets:
                    overlap = len(desc_tokens.intersection(script_tokens)) / len(desc_tokens)
                    if overlap > best_overlap:
                        best_overlap = overlap
                    if (
                        overlap >= 0.85
                        and len(desc_tokens) >= 8
                        and len(desc_tokens) / max(1, len(script_tokens)) >= 0.6
                    ):
                        is_echo = True
                        break

        if is_echo:
            echo_meta.append((idx, best_overlap, _word_count(sentence), len(sentence)))
        else:
            keep_indices.append(idx)

    if not echo_meta:
        return description, 0

    keep_set = set(keep_indices)
    current_words = sum(_word_count(sentences[idx]) for idx in keep_set)
    current_chars = sum(len(sentences[idx]) for idx in keep_set)
    needed = max(0, min_keep - len(keep_set))

    echo_ranked = sorted(echo_meta, key=lambda item: (item[1], -item[2]))
    for idx, _overlap, word_count, char_count in echo_ranked:
        if idx in keep_set:
            continue
        if needed > 0:
            keep_set.add(idx)
            needed -= 1
            current_words += word_count
            current_chars += char_count + 1
            continue
        if min_words is not None and current_words < min_words:
            keep_set.add(idx)
            current_words += word_count
            current_chars += char_count + 1
            continue
        if min_chars is not None and current_chars < min_chars:
            keep_set.add(idx)
            current_words += word_count
            current_chars += char_count + 1
            continue

    cleaned_sentences = [
        sentences[i] for i in range(len(sentences))
        if i in keep_set
    ]
    kept_echo = sum(1 for idx, *_ in echo_meta if idx in keep_set)
    removed_count = max(0, len(echo_meta) - kept_echo)

    return " ".join(cleaned_sentences).strip(), removed_count


def _add_non_echo_fillers(description: str, tags: list[str], script_text: str = "") -> str:
    settings = _get_settings()
    primary, secondary, tertiary = _grounded_topic_triplet(script_text, tags)

    fillers = [
        f"Expect a clear walkthrough of {primary} choices and the tradeoffs behind each step.",
        f"We also connect {secondary} decisions so the final summary stays focused without losing context.",
        f"Use {tertiary} cues to keep the narrative tight while preserving the key details from the script.",
    ]

    for filler in fillers:
        if (
            _word_count(description) >= settings.description_min_words
            and len(description) >= settings.description_min_chars
        ):
            break
        if filler.lower() in description.lower():
            continue
        candidate = f"{description} {filler}".strip()
        if (
            _word_count(candidate) <= settings.description_max_words
            and len(candidate) <= settings.description_max_chars
        ):
            description = candidate

    return description


def _expand_description_if_thin(desc: str, script_text: str) -> str:
    """Expand short descriptions so outputs can meet strict contract targets."""

    if not desc or not script_text:
        return desc

    settings = _get_settings()

    if _word_count(desc) >= settings.description_min_words and len(desc) >= settings.description_min_chars:
        return desc

    script_norm = re.sub(r"\s+", " ", script_text).strip().lower()
    desc_norm = re.sub(r"\s+", " ", desc).strip().lower()
    overlap_ratio = _script_overlap_score(desc, script_text)

    is_script_echo = desc_norm in script_norm or overlap_ratio >= 0.75
    if not is_script_echo:
        return desc

    script_sentences = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", script_text)
        if len(s.strip()) >= 25
    ]
    if not script_sentences:
        return desc

    parts: list[str] = [desc.strip()]
    seen = {desc_norm}
    for sentence in script_sentences:
        normalized = re.sub(r"\s+", " ", sentence).strip().lower()
        if normalized in seen:
            continue
        if normalized in desc_norm:
            continue
        parts.append(sentence)
        seen.add(normalized)
        joined = " ".join(parts)
        if (
            len(parts) >= 7
            or _word_count(joined) >= settings.description_min_words
            or len(joined) >= settings.description_min_chars
        ):
            break

    expanded = re.sub(r"\s+", " ", " ".join(parts)).strip()

    if _word_count(expanded) < settings.description_min_words and script_sentences:
        bridge = " ".join(script_sentences[:2])
        expanded = re.sub(r"\s+", " ", f"{expanded} {bridge}").strip()

    if not re.search(r"\b(subscribe|like|follow|comment)\b", expanded, flags=re.IGNORECASE):
        expanded = f"{expanded} {_build_script_grounded_cta(script_text, [])}"

    expanded = _truncate_to_words(expanded, settings.description_max_words + 20)
    expanded = _truncate_to_chars(expanded, settings.description_max_chars + 140)

    return re.sub(r"\s+", " ", expanded).strip()


def _upgrade_description_quality(desc: str, script_text: str, tags: list[str]) -> str:
    """Rewrite weak script-echo descriptions into richer creator-style copy."""

    if not desc or not script_text:
        return desc

    settings = _get_settings()
    desc_norm = re.sub(r"\s+", " ", desc).strip()
    desc_lower = desc_norm.lower()
    words = desc_norm.split()
    overlap = _script_overlap_score(desc_norm, script_text)

    # Keep already-rich descriptions.
    has_structure = "what you'll learn" in desc_lower or len(_split_sentences(desc_norm)) >= 4
    has_cta = bool(re.search(r"\b(subscribe|like|follow|comment|share)\b", desc_lower))
    if (
        len(words) >= settings.description_min_words
        and len(desc_norm) >= settings.description_min_chars
        and has_cta
        and has_structure
    ):
        return desc_norm

    # Only rewrite when the description looks like script echo or bland filler.
    echo_phrases = re.search(
        r"\b(welcome back|today we're|in this video|first[, ]|next[, ]|finally[, ])\b",
        desc_lower,
    )
    if overlap < 0.55 and not echo_phrases:
        return desc_norm

    script_sentences = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", script_text)
        if len(s.strip()) >= 28
    ]
    if not script_sentences:
        return desc_norm

    def _shorten(sentence: str, max_words: int = 26) -> str:
        s = re.sub(r"^(?:first|next|finally|step\s+\w+)\s*[:,\-]?\s*", "", sentence, flags=re.IGNORECASE)
        s = re.sub(r"\s+", " ", s).strip(" ,;:-")
        words_local = s.split()
        if len(words_local) > max_words:
            s = " ".join(words_local[:max_words]).rstrip(" ,;:-")
        if not s.endswith((".", "!", "?")):
            s += "."
        return s

    # Value-driven hook, avoid intro chatter.
    primary, secondary, tertiary = _grounded_topic_triplet(script_text, tags)
    hook = (
        f"Unlock the secrets of {primary} in this deep dive into {secondary}. "
        f"We're breaking down how to master {tertiary} to elevate your results."
    )

    bullets: list[str] = []
    seen: set[str] = set()
    for sentence in script_sentences:
        candidate = _shorten(sentence)
        low = candidate.lower()
        if any(p in low for p in ["welcome back", "thanks for watching", "today we", "hi guys"]):
            continue
        if low in seen:
            continue
        seen.add(low)
        bullets.append(candidate)
        if len(bullets) >= 3:
            break

    if len(bullets) < 3:
        fillers = [
            f"Discover how {primary} shapes the narrative and drives engagement.",
            f"Learn the {secondary} techniques used by top-tier creators.",
            f"Master {tertiary} to ensure every upload lands with maximum impact.",
        ]
        for filler in fillers:
            if len(bullets) >= 3:
                break
            low = filler.lower()
            if low in seen:
                continue
            seen.add(low)
            bullets.append(filler)

    bridge = "We move beyond the basics to give you actionable insights you can apply immediately."
    cta = _build_script_grounded_cta(script_text, tags)

    structured = " ".join(
        [
            hook,
            bridge,
            f"Key Takeaways:\n• {bullets[0]}\n• {bullets[1]}\n• {bullets[2]}",
            cta,
        ]
    ).strip()

    minimum_target = settings.description_min_words
    if len(structured.split()) < minimum_target:
        top_up = (
            f"By understanding the relationship between {primary} and {secondary}, "
            "you'll be able to create content that resonates more deeply with your audience."
        )
        structured = f"{structured} {top_up}"

    # Keep the result within a readable target band.
    structured_words = structured.split()
    if len(structured_words) > settings.description_max_words:
        structured = " ".join(structured_words[: settings.description_max_words]).rstrip(" ,;:-") + "."

    structured = _truncate_to_chars(structured, settings.description_max_chars)

    return structured


def _enhance_generic_title(title: str, tags: list[str]) -> str:
    """Improve obviously generic titles using extracted script-specific tags."""
    if not title:
        return title

    lowered = title.lower()
    if any(p in title for p in ("?", "!", ":")):
        return title

    generic_markers = {
        "from scratch",
        "in python",
        "tutorial",
        "guide",
        "introduction",
        "basics",
        "beginner",
    }
    if not any(marker in lowered for marker in generic_markers):
        return title

    generic_tags = {
        "python",
        "programming",
        "machine learning",
        "tutorial",
        "guide",
        "video",
        "youtube",
    }
    core_tags = [
        t for t in tags
        if t
        and t.lower() not in generic_tags
        and len(t) >= 4
        and len(t.split()) <= 3
    ]
    if len(core_tags) < 2:
        return title

    primary = core_tags[0]
    primary_tokens = {tok for tok in re.findall(r"[a-z0-9]+", primary.lower()) if len(tok) > 2}
    secondary = None
    for candidate in core_tags[1:]:
        candidate_tokens = {tok for tok in re.findall(r"[a-z0-9]+", candidate.lower()) if len(tok) > 2}
        if not candidate_tokens:
            continue
        overlap = len(primary_tokens.intersection(candidate_tokens))
        if overlap == 0:
            secondary = candidate
            break

    if not secondary:
        return title

    settings = _get_settings()
    base = f"{primary.title()} with {secondary.title()}"
    suffixes = [
        "Practical Walkthrough",
        "Workflow Breakdown",
        "Step by Step",
    ]
    for suffix in suffixes:
        candidate = _clean_title(f"{base}: {suffix}".strip())
        if (
            len(candidate) <= settings.title_max_chars
            and _word_count(candidate) <= settings.title_max_words
        ):
            return candidate

    # Avoid hard char slicing that can leave clipped fragments.
    return _clean_title(base)


def _target_tag_count(script_text: str) -> int:
    """Return dynamic tag count in the configured 5-8 band."""
    settings = _get_settings()
    min_count = settings.tags_min_count
    max_count = settings.tags_max_count
    if max_count <= min_count:
        return min_count

    span = max(1, settings.max_script_length - settings.min_script_length)
    relative = (len(script_text) - settings.min_script_length) / span
    relative = max(0.0, min(1.0, relative))
    return int(round(min_count + (max_count - min_count) * relative))


def _normalize_tags(
    tags: Any,
    target_count: int | None = None,
    fallback_text: str | None = None,
) -> list[str]:
    """Normalize tags and enforce configured per-tag limits."""
    settings = _get_settings()
    min_count = settings.tags_min_count
    max_count = settings.tags_max_count

    if target_count is None:
        target_count = max_count
        if fallback_text:
            target_count = _target_tag_count(fallback_text)
        target_count = max(min_count, min(max_count, target_count))
    else:
        target_count = max(1, min(max_count, target_count))

    if isinstance(tags, list):
        cleaned = [str(t).strip() for t in tags if str(t).strip()]
    elif isinstance(tags, str):
        cleaned = [t.strip() for t in tags.split(",") if t.strip()]
    else:
        cleaned = []

    result: list[str] = []
    seen: set[str] = set()
    generic_single_word = {
        "video",
        "youtube",
        "tutorial",
        "guide",
        "tips",
        "content",
        "text",
        "word",
        "words",
        "sentence",
        "sentences",
        "library",
        "tech",
        "code",
        "import",
        "list",
        "block",
        "welcome",
        "everyone",
        "basic",
        "channel",
        "creator",
    }
    generic_phrase_blacklist = {
        "youtube seo strategy",
        "video metadata optimization",
        "content growth strategy",
        "creator workflow system",
        "search visibility tactics",
        "audience retention tactics",
        "keyword targeting method",
        "discoverability optimization plan",
    }
    edge_noise_tokens = {
        "welcome",
        "today",
        "everyone",
        "episode",
        "first",
        "next",
        "finally",
        "thanks",
        "watching",
        "using",
        "used",
        "look",
        "looking",
        "show",
        "showing",
        "notice",
        "imagine",
        "dive",
        "straight",
        "single",
        "past",
        "recent",
        "high",
        "basic",
        "because",
        "four",
        "five",
        "means",
        "contains",
        "containing",
        "exactly",
        "probably",
        "just",
        "really",
        "also",
        "without",
        "massive",
        "ones",
        "one",
    }
    tag_noise_tokens = edge_noise_tokens.union(
        {
            "approachable",
            "surprisingly",
            "incredibly",
            "tracked",
            "wearing",
            "monitored",
            "justified",
            "stick",
            "moving",
            "check",
            "paths",
            "immediately",
            "terminal",
            "paragraph",
            "project",
            "weekend",
            "tackling",
            "elegant",
            "efficient",
            "neatly",
            "understand",
            "relevant",
            "existing",
            "core",
            "information",
            "day",
            "year",
            "finder",
            "marked",
            "visit",
            "heavily",
            "enter",
            "runs",
            "run",
            "radiating",
            "outward",
            "starting",
            "build",
            "building",
            "make",
            "making",
            "makes",
        }
    )
    latex_noise_tokens = {
        "mathcal",
        "sqrt",
        "frac",
        "cdot",
        "times",
        "mathbf",
        "left",
        "right",
    }
    grounding_stopwords = {
        "this", "that", "with", "from", "into", "your", "you", "they", "them",
        "then", "than", "over", "under", "after", "before", "about", "while",
        "also", "just", "very", "really", "each", "every", "other", "another",
    }
    script_token_counts: Counter[str] = Counter()

    def _normalize_token(token: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", token.lower()).strip()

    def _clean_tag(raw_tag: str) -> str:
        tag = raw_tag.strip().lstrip("#")
        tag = tag.replace("|", " ").replace("/", " ")
        tag = re.sub(r"[^0-9A-Za-z\s#/_-]", " ", tag)
        tag = re.sub(r"\s+", " ", tag)
        words = [w.strip(" ,;:-_") for w in tag.split() if w.strip(" ,;:-_")]
        words = [w for w in words if _normalize_token(w) and _normalize_token(w) not in latex_noise_tokens]

        while words and _normalize_token(words[0]) in tag_noise_tokens:
            words.pop(0)
        while words and _normalize_token(words[-1]) in tag_noise_tokens:
            words.pop()

        if not words:
            return ""

        if len(words) > settings.tag_max_words:
            words = words[: settings.tag_max_words]

        tag = " ".join(words)
        while len(tag) > settings.tag_max_chars and len(words) > settings.tag_min_words:
            words = words[:-1]
            tag = " ".join(words)

        if len(tag) > settings.tag_max_chars:
            tag = tag[: settings.tag_max_chars].strip(" ,;:-")

        if not tag:
            return ""
        return re.sub(r"\s+", " ", tag).strip()

    def _is_low_quality(tag: str) -> bool:
        lowered = tag.lower()
        words = lowered.split()
        normalized_words = [_normalize_token(word) for word in words if _normalize_token(word)]

        if re.fullmatch(r"(?:19|20)\d{2}", lowered):
            return True
        if len(lowered) < 3 or "#" in lowered:
            return True
        if not normalized_words:
            return True
        if any(word in latex_noise_tokens for word in normalized_words):
            return True
        if any(word.startswith("mathcal") for word in normalized_words):
            return True
        if lowered in generic_phrase_blacklist:
            return True
        if len(words) == 1 and lowered in generic_single_word:
            return True
        weak_hits = sum(1 for word in normalized_words if word in tag_noise_tokens)
        if weak_hits >= 2:
            return True
        if len(normalized_words) >= 3 and weak_hits >= 1:
            return True
        if len(set(words)) < len(words):
            return True
        if any(len(word) < 3 for word in normalized_words):
            return True
        if len(words) < settings.tag_min_words:
            return True
        if len(words) > settings.tag_max_words:
            return True

        if script_token_counts and len(normalized_words) >= 3:
            support_hits = sum(1 for word in normalized_words if script_token_counts.get(word, 0) >= 2)
            if support_hits < 2:
                return True

        return len(tag) > settings.tag_max_chars

    apply_quality_filter = fallback_text is not None
    script_token_set: set[str] = set()
    extracted_candidates: list[str] = []
    top_terms: list[str] = []

    if fallback_text:
        from backend.keyword_extractor import _STOP_WORDS, extract_tags

        extracted_candidates = extract_tags(fallback_text, top_n=max(target_count * 8, 36))
        script_token_counts = Counter(
            tok
            for tok in re.findall(r"[a-z0-9]+", fallback_text.lower())
            if (
                len(tok) > 2
                and tok not in grounding_stopwords
                and tok not in _STOP_WORDS
                and tok not in generic_single_word
                and tok not in tag_noise_tokens
                and tok not in latex_noise_tokens
            )
        )
        script_token_set = {
            tok
            for tok in re.findall(r"[a-z0-9]+", fallback_text.lower())
            if (
                len(tok) > 2
                and tok not in grounding_stopwords
                and tok not in _STOP_WORDS
                and tok not in generic_single_word
                and tok not in tag_noise_tokens
                and tok not in latex_noise_tokens
            )
        }
        for phrase in extracted_candidates:
            for tok in re.findall(r"[a-z0-9]+", phrase.lower()):
                if (
                    len(tok) > 2
                    and tok not in grounding_stopwords
                    and tok not in _STOP_WORDS
                    and tok not in generic_single_word
                    and tok not in tag_noise_tokens
                    and tok not in latex_noise_tokens
                ):
                    script_token_set.add(tok)

        top_terms = [tok for tok, _count in script_token_counts.most_common(18)]

    def _candidate_variants(raw_tag: str) -> list[str]:
        base = _clean_tag(raw_tag)
        if not base:
            return []

        variants = [base]

        deduped: list[str] = []
        seen_local: set[str] = set()
        for candidate in variants:
            cleaned_candidate = _clean_tag(candidate)
            if not cleaned_candidate:
                continue
            key = cleaned_candidate.lower()
            if key in seen_local:
                continue
            seen_local.add(key)
            deduped.append(cleaned_candidate)
        return deduped

    def _try_add(raw_tag: str) -> None:
        tag = _clean_tag(raw_tag)
        if not tag:
            return
        if apply_quality_filter and _is_low_quality(tag):
            return
        key = tag.lower()
        if apply_quality_filter and script_token_set:
            tag_tokens = {
                tok for tok in re.findall(r"[a-z0-9]+", key)
                if len(tok) > 2
            }
            grounded_hits = len(tag_tokens.intersection(script_token_set)) if tag_tokens else 0
            min_grounded_hits = 2 if len(tag_tokens) >= 3 else 1
            if grounded_hits < min_grounded_hits:
                return
            if script_token_counts:
                support_score = sum(min(script_token_counts.get(tok, 0), 3) for tok in tag_tokens)
                required_support = 5 if len(tag_tokens) >= 3 else 3
                if support_score < required_support:
                    return
        if key in seen:
            return
        seen.add(key)
        result.append(tag)

    for tag in cleaned:
        for variant in _candidate_variants(tag):
            _try_add(variant)
            if len(result) >= target_count:
                return result[:target_count]

    if fallback_text and len(result) < target_count:
        for candidate in extracted_candidates:
            for variant in _candidate_variants(candidate):
                _try_add(variant)
                if len(result) >= target_count:
                    break
            if len(result) >= target_count:
                break

    if fallback_text and len(result) < target_count:
        backup_tags: list[str] = []
        for i in range(len(top_terms) - 1):
            backup_tags.append(f"{top_terms[i]} {top_terms[i + 1]}")
        backup_tags.extend(extracted_candidates[:12])

        for tag in backup_tags:
            for variant in _candidate_variants(tag):
                _try_add(variant)
                if len(result) >= target_count:
                    break
            if len(result) >= target_count:
                break

    # If strict filtering starved the list, relax just enough to hit target.
    if fallback_text and len(result) < target_count:
        relaxed_candidates = cleaned + extracted_candidates
        for candidate in relaxed_candidates:
            tag = _clean_tag(candidate)
            if not tag:
                continue
            words = tag.split()
            if len(words) == 1:
                anchor = next((t for t in top_terms if t != words[0]), "workflow")
                tag = f"{tag} {anchor}"
            tag = _clean_tag(tag)
            if not tag:
                continue
            normalized_words = [_normalize_token(word) for word in tag.split() if _normalize_token(word)]
            if not normalized_words:
                continue
            if any(word in latex_noise_tokens for word in normalized_words):
                continue
            if normalized_words[0] in edge_noise_tokens or normalized_words[-1] in edge_noise_tokens:
                continue
            if len(set(normalized_words)) < len(normalized_words):
                continue
            if (lowered := tag.lower()) and lowered in generic_phrase_blacklist:
                continue
            if script_token_set and not any(word in script_token_set for word in normalized_words):
                continue
            key = tag.lower()
            if key in seen:
                continue
            seen.add(key)
            result.append(tag)
            if len(result) >= target_count:
                break

    return result[:target_count]


def _extract_json_fields_fallback(text: str) -> dict[str, Any] | None:
    """Best-effort field extraction when full JSON parsing fails."""
    if not text:
        return None

    extracted: dict[str, Any] = {}

    title_match = re.search(r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.IGNORECASE | re.DOTALL)
    if title_match:
        extracted["title"] = title_match.group(1).encode("utf-8", "ignore").decode("unicode_escape")

    desc_match = re.search(r'"description"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.IGNORECASE | re.DOTALL)
    if desc_match:
        extracted["description"] = desc_match.group(1).encode("utf-8", "ignore").decode("unicode_escape")

    tags_match = re.search(r'"tags"\s*:\s*\[(.*?)\]', text, re.IGNORECASE | re.DOTALL)
    if tags_match:
        tags_blob = tags_match.group(1)
        tag_items = re.findall(r'"((?:[^"\\]|\\.)*)"', tags_blob)
        if tag_items:
            extracted["tags"] = [
                t.encode("utf-8", "ignore").decode("unicode_escape") for t in tag_items
            ]

    return extracted or None


def _parse_json_safe(text: str) -> dict:
    """
    Parse JSON from model output, attempting repair if truncated.

    LLMs sometimes exceed max_tokens, producing cut-off JSON.  This
    function tries progressively aggressive fixups before giving up.
    """
    cleaned_text = (text or "").strip()
    if cleaned_text.startswith("```"):
        cleaned_text = re.sub(r"^```(?:json)?", "", cleaned_text, flags=re.IGNORECASE).strip()
        cleaned_text = re.sub(r"```$", "", cleaned_text).strip()

    # 1. Happy path
    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        pass

    # 2. Extract outer JSON object when extra prose surrounds output.
    start = cleaned_text.find("{")
    end = cleaned_text.rfind("}")
    candidate = cleaned_text
    if 0 <= start < end:
        candidate = cleaned_text[start:end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # 3. Truncated string/array — close open quotes, brackets, braces
    repaired = candidate.rstrip()
    # Strip trailing incomplete value after last comma
    if repaired.endswith(","):
        repaired = repaired[:-1]

    # Count unclosed delimiters and close them
    open_braces = repaired.count("{") - repaired.count("}")
    open_brackets = repaired.count("[") - repaired.count("]")
    open_quotes = repaired.count('"') % 2  # odd = unclosed string

    if open_quotes:
        repaired += '"'
    repaired += "]" * open_brackets
    repaired += "}" * open_braces

    try:
        result = json.loads(repaired)
        logger.warning("Repaired truncated JSON (added %d closing delimiters)",
                       open_braces + open_brackets + open_quotes)
        return result
    except json.JSONDecodeError:
        pass

    # 4. Regex fallback for partially malformed JSON-like payloads.
    extracted = _extract_json_fields_fallback(cleaned_text)
    if extracted:
        logger.warning("Recovered partial metadata fields from malformed JSON payload")
        return extracted

    # 5. Give up — re-raise with original text so caller logs it
    raise json.JSONDecodeError("Could not repair malformed JSON", cleaned_text, 0)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _estimate_input_char_budget(reserved_output_tokens: int) -> int:
    """Estimate safe input character budget from context window settings."""
    settings = _get_settings()

    # Reserve room for system/user instructions and JSON scaffolding.
    prompt_overhead_tokens = 220
    available_tokens = max(
        256,
        settings.context_window - reserved_output_tokens - prompt_overhead_tokens,
    )

    # Conservative approximation for Mistral-family tokenizers.
    chars_per_token = 3.5
    return max(500, int(available_tokens * chars_per_token))


def _prep_input(cleaned_script: str, reserved_output_tokens: int) -> str:
    """Prepare script text for prompting while preserving head and tail context."""
    max_chars = _estimate_input_char_budget(reserved_output_tokens)

    if len(cleaned_script) <= max_chars:
        return cleaned_script

    # Keep early setup + later conclusions instead of only the opening segment.
    head_chars = int(max_chars * 0.7)
    tail_chars = max(80, max_chars - head_chars - 7)
    return (
        f"{cleaned_script[:head_chars].rstrip()}\n...\n"
        f"{cleaned_script[-tail_chars:].lstrip()}"
    )


def _cap_prompt_chars(prepped_input: str, max_chars: int) -> str:
    """Apply an explicit char cap while preserving both start and ending context."""
    if len(prepped_input) <= max_chars:
        return prepped_input

    head_chars = int(max_chars * 0.7)
    tail_chars = max(60, max_chars - head_chars - 7)
    return (
        f"{prepped_input[:head_chars].rstrip()}\n...\n"
        f"{prepped_input[-tail_chars:].lstrip()}"
    )


_last_used_model_name: str = "OpenAI GPT-OSS 120B (Groq)"


def _normalize_model_choice(model_choice: str | None) -> str:
    choice = (model_choice or "auto").strip().lower()
    if choice in ("mistral", "custom", "hf", "huggingface", "local"):
        return "mistral"
    if choice in ("groq", "openai/gpt-oss-120b", "cloud"):
        return "groq"
    return "auto"


def get_last_used_model_name() -> str:
    return _last_used_model_name


def _llm_call(
    system_prompt: str,
    user_msg: str,
    max_tokens: int,
    temperature: float | None = None,
    model_choice: str = "auto",
) -> dict:
    """Single non-streaming LLM call → parsed JSON dict. Respects model_choice."""
    global _last_used_model_name
    settings = _get_settings()
    groq = _get_groq_client()
    normalized_choice = _normalize_model_choice(model_choice)

    if normalized_choice in ("auto", "groq") and groq:
        try:
            inference_start = perf_counter()
            groq_system_prompt = system_prompt + "\n\nYou are a strict API. Output ONLY valid JSON. Do NOT wrap the JSON in markdown formatting (e.g., no ```json). Do NOT add conversational text. Output the raw JSON object directly."
            groq_max_tokens = max(max_tokens, 2048)
            response = groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": groq_system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                model=settings.groq_model,
                max_tokens=groq_max_tokens,
                temperature=settings.temperature if temperature is None else temperature,
                top_p=settings.top_p,
            )
            elapsed = perf_counter() - inference_start
            result_text = response.choices[0].message.content.strip()
            _last_used_model_name = "OpenAI GPT-OSS 120B (Groq)"
            logger.info("Groq LLM call completed in %.2fs (model=%s)", elapsed, settings.groq_model)
            return _parse_json_safe(result_text)
        except Exception as e:
            if normalized_choice == "groq":
                logger.error("Groq explicit model call failed: %s", e)
                raise RuntimeError(f"Groq generation failed: {e}") from e
            logger.warning("Groq primary call failed, falling back to local model: %s", e)

    # Fallback / explicit local llama-cpp (Custom Mistral 7B)
    llm = get_llm()
    inference_start = perf_counter()
    response = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        max_tokens=max_tokens,
        temperature=settings.temperature if temperature is None else temperature,
        top_p=settings.top_p,
        repeat_penalty=settings.repeat_penalty,
    )
    elapsed = perf_counter() - inference_start
    result_text = response["choices"][0]["message"]["content"].strip()
    _last_used_model_name = "Mistral 7B (Custom HF)"
    logger.info("Local LLM call completed in %.2fs (max_tokens=%d)", elapsed, max_tokens)
    _log_gpu_status()
    logger.debug("Raw model output: %s", result_text)
    return _parse_json_safe(result_text)


def _llm_stream(
    system_prompt: str,
    user_msg: str,
    max_tokens: int,
    model_choice: str = "auto",
) -> Generator[str, None, None]:
    """Streaming LLM call — yields individual token strings. Respects model_choice."""
    global _last_used_model_name
    settings = _get_settings()
    groq = _get_groq_client()
    normalized_choice = _normalize_model_choice(model_choice)

    if normalized_choice in ("auto", "groq") and groq:
        try:
            start = perf_counter()
            token_count = 0
            groq_system_prompt = system_prompt + "\n\nYou are a strict API. Output ONLY valid JSON. Do NOT wrap the JSON in markdown formatting (e.g., no ```json). Do NOT add conversational text. Output the raw JSON object directly."
            groq_max_tokens = max(max_tokens, 2048)
            response = groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": groq_system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                model=settings.groq_model,
                max_tokens=groq_max_tokens,
                temperature=settings.temperature,
                top_p=settings.top_p,
                stream=True,
            )
            for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    token_count += 1
                    yield content

            _last_used_model_name = "OpenAI GPT-OSS 120B (Groq)"
            logger.info("Groq stream completed in %.2fs (%d chunks, model=%s)", perf_counter() - start, token_count, settings.groq_model)
            return
        except Exception as e:
            if normalized_choice == "groq":
                logger.error("Groq explicit stream failed: %s", e)
                raise RuntimeError(f"Groq streaming failed: {e}") from e
            logger.warning("Groq streaming failed, falling back to local model: %s", e)

    # Fallback / explicit local llama-cpp (Custom Mistral 7B)
    llm = get_llm()
    start = perf_counter()
    token_count = 0
    response = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        max_tokens=max_tokens,
        temperature=settings.temperature,
        top_p=settings.top_p,
        repeat_penalty=settings.repeat_penalty,
        stream=True,
    )

    # Some backends/tests return non-stream payloads even with stream=True.
    if isinstance(response, dict):
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        if content:
            token_count = 1
            yield content
        _last_used_model_name = "Mistral 7B (Custom HF)"
        logger.info(
            "Local LLM stream completed in %.2fs (%d chunks, max_tokens=%d)",
            perf_counter() - start,
            token_count,
            max_tokens,
        )
        _log_gpu_status()
        return

    for chunk in response:
        choice = chunk["choices"][0]
        content = choice.get("delta", {}).get("content", "")
        if content:
            token_count += 1
            yield content

    _last_used_model_name = "Mistral 7B (Custom HF)"
    logger.info(
        "Local LLM stream completed in %.2fs (%d chunks, max_tokens=%d)",
        perf_counter() - start,
        token_count,
        max_tokens,
    )
    _log_gpu_status()


def _build_result(
    parsed: dict,
    fallback_text: str | None = None,
    target_tag_count: int | None = None,
) -> dict:
    """Apply primary post-processing to parsed LLM output."""
    tags = _normalize_tags(
        parsed.get("tags", []),
        target_count=target_tag_count,
        fallback_text=fallback_text,
    )
    description = _clean_description(str(parsed.get("description", "")).strip())
    if fallback_text:
        description = _expand_description_if_thin(description, fallback_text)
        description = _upgrade_description_quality(description, fallback_text, tags)
    title = _clean_title(str(parsed.get("title", "")).strip())
    title = _enhance_generic_title(title, tags)

    return {
        "title": title,
        "description": description,
        "tags": tags,
    }


def _coerce_title_to_bounds(title: str, tags: list[str]) -> str:
    """Coerce title into configured char/word limits with minimal edits."""
    settings = _get_settings()
    title = _clean_title(re.sub(r"\s+", " ", title or "").strip())

    # If title is way too long, try to find a natural break point (colon, dash, etc.)
    if len(title) > settings.title_max_chars:
        # Priority 1: Break at colon or dash if it leaves enough length
        break_points = [m.start() for m in re.finditer(r"[:\-–|]", title)]
        for bp in reversed(break_points):
            candidate = title[:bp].strip()
            if settings.title_min_chars <= len(candidate) <= settings.title_max_chars:
                title = candidate
                break

    # Final fallback: word-based truncation
    words = title.split()
    while words and (
        len(words) > settings.title_max_words
        or len(" ".join(words)) > settings.title_max_chars
    ):
        words.pop()
    title = " ".join(words).strip(" ,;:-")

    if not title:
        seed = tags[0].title() if tags else "Creator Growth"
        title = f"{seed} Strategy Breakdown"

    boosters = [t.title() for t in tags if t] + [
        "Step by Step",
        "Real Growth Playbook",
        "Practical Creator Strategy",
    ]
    for booster in boosters:
        if (
            _word_count(title) >= settings.title_min_words
            and len(title) >= settings.title_min_chars
        ):
            break

        candidate = (
            f"{title}: {booster}" if title and ":" not in title else f"{title} {booster}"
        ).strip()
        if (
            len(candidate) <= settings.title_max_chars
            and _word_count(candidate) <= settings.title_max_words
        ):
            title = candidate

    padding_words = ["guide", "playbook", "results", "today"]
    for word in padding_words:
        if (
            _word_count(title) >= settings.title_min_words
            and len(title) >= settings.title_min_chars
        ):
            break
        candidate = f"{title} {word}".strip()
        if (
            len(candidate) <= settings.title_max_chars
            and _word_count(candidate) <= settings.title_max_words
        ):
            title = candidate

    if _word_count(title) < settings.title_min_words:
        seed_words = [
            token.title()
            for token in re.findall(r"[a-z0-9]+", tags[0].lower())[:2]
        ] if tags else []
        if not seed_words:
            seed_words = ["Creator", "Strategy"]

        compact_fillers = ["Workflow", "Breakdown", "Guide", "Results", "Today", "Plan"]
        rebuilt_words: list[str] = []
        for word in seed_words + compact_fillers:
            candidate = " ".join(rebuilt_words + [word]).strip()
            if (
                len(candidate) <= settings.title_max_chars
                and _word_count(candidate) <= settings.title_max_words
            ):
                rebuilt_words.append(word)

        short_fillers = ["tips", "now", "fast", "step"]
        for word in short_fillers:
            if len(rebuilt_words) >= settings.title_min_words:
                break
            candidate = " ".join(rebuilt_words + [word]).strip()
            if (
                len(candidate) <= settings.title_max_chars
                and _word_count(candidate) <= settings.title_max_words
            ):
                rebuilt_words.append(word)

        if len(rebuilt_words) >= settings.title_min_words:
            title = " ".join(rebuilt_words)

    return _clean_title(title.strip(" ,;:-"))


def _coerce_description_to_bounds(desc: str, script_text: str, tags: list[str]) -> str:
    """Coerce description into configured word/char bounds."""
    settings = _get_settings()
    description = _clean_description(desc)
    description = re.sub(r"\s+", " ", description).strip()

    if not description:
        primary, secondary, tertiary = _grounded_topic_triplet(script_text, tags)
        description = (
            f"This breakdown turns your raw script into a {primary} system that connects {secondary} and {tertiary} "
            "so every metadata choice stays specific from the first line to the final CTA."
        )

    script_sentences = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+", script_text)
        if len(s.strip()) >= 28
    ]

    if (
        _word_count(description) < settings.description_min_words
        or len(description) < settings.description_min_chars
    ):
        additions: list[str] = []
        expanded_to_target = False
        normalized_description = description.lower()
        for sentence in script_sentences:
            normalized = sentence.lower().strip()
            if normalized in normalized_description:
                continue
            additions.append(sentence)
            candidate = re.sub(r"\s+", " ", f"{description} {' '.join(additions)}").strip()
            if (
                _word_count(candidate) >= settings.description_min_words
                and len(candidate) >= settings.description_min_chars
            ):
                description = candidate
                expanded_to_target = True
                break
        if additions and not expanded_to_target:
            description = re.sub(r"\s+", " ", f"{description} {' '.join(additions)}").strip()

    if not re.search(r"\b(subscribe|follow|comment|like|share)\b", description, flags=re.IGNORECASE):
        description = f"{description} {_build_script_grounded_cta(script_text, tags)}"

    long_fillers = _build_script_grounded_fillers(script_text, tags)
    for filler in long_fillers:
        if (
            _word_count(description) >= settings.description_min_words
            and len(description) >= settings.description_min_chars
        ):
            break
        candidate = f"{description} {filler}".strip()
        if (
            _word_count(candidate) <= settings.description_max_words
            and len(candidate) <= settings.description_max_chars
        ):
            description = candidate

    anti_echo_triggered = False
    description, removed = _apply_anti_echo_penalty(
        description,
        script_text,
        min_words=settings.description_min_words,
        min_chars=settings.description_min_chars,
    )
    if removed:
        anti_echo_triggered = True
        if not re.search(r"\b(subscribe|follow|comment|like|share)\b", description, flags=re.IGNORECASE):
            description = f"{description} {_build_script_grounded_cta(script_text, tags)}"
        description = _add_non_echo_fillers(description, tags, script_text)

    if _word_count(description) > settings.description_max_words:
        description = _truncate_to_words(description, settings.description_max_words)
    if len(description) > settings.description_max_chars:
        description = _truncate_to_chars(description, settings.description_max_chars)

    # Final top-up pass if trim steps dropped below the lower band.
    if (
        _word_count(description) < settings.description_min_words
        or len(description) < settings.description_min_chars
    ):
        if anti_echo_triggered:
            description = _add_non_echo_fillers(description, tags, script_text)
        else:
            for sentence in script_sentences:
                candidate = f"{description} {sentence}".strip()
                if (
                    _word_count(candidate) > settings.description_max_words
                    or len(candidate) > settings.description_max_chars
                ):
                    continue
                description = candidate
                if (
                    _word_count(description) >= settings.description_min_words
                    and len(description) >= settings.description_min_chars
                ):
                    break

    return _ensure_terminal_punctuation(re.sub(r"\s+", " ", description).strip())


def _validate_metadata_constraints(metadata: dict) -> dict[str, Any]:
    """Validate title/description/tags against configured output constraints."""
    settings = _get_settings()
    title = str(metadata.get("title", "")).strip()
    description = str(metadata.get("description", "")).strip()
    tags = metadata.get("tags", [])
    tags = tags if isinstance(tags, list) else []

    title_chars = len(title)
    title_words = _word_count(title)
    desc_chars = len(description)
    desc_words = _word_count(description)

    violations: dict[str, list[str]] = {}

    if not (settings.title_min_chars <= title_chars <= settings.title_max_chars):
        violations.setdefault("title", []).append(
            f"title chars {title_chars} not in {settings.title_min_chars}-{settings.title_max_chars}"
        )
    if not (settings.title_min_words <= title_words <= settings.title_max_words):
        violations.setdefault("title", []).append(
            f"title words {title_words} not in {settings.title_min_words}-{settings.title_max_words}"
        )

    if not (settings.description_min_words <= desc_words <= settings.description_max_words):
        violations.setdefault("description", []).append(
            "description words "
            f"{desc_words} not in {settings.description_min_words}-{settings.description_max_words}"
        )
    if not (settings.description_min_chars <= desc_chars <= settings.description_max_chars):
        violations.setdefault("description", []).append(
            "description chars "
            f"{desc_chars} not in {settings.description_min_chars}-{settings.description_max_chars}"
        )

    if not (settings.tags_min_count <= len(tags) <= settings.tags_max_count):
        violations.setdefault("tags", []).append(
            f"tag count {len(tags)} not in {settings.tags_min_count}-{settings.tags_max_count}"
        )

    for index, tag in enumerate(tags):
        tag_words = _word_count(tag)
        tag_chars = len(tag)
        if tag_words < settings.tag_min_words or tag_words > settings.tag_max_words:
            violations.setdefault("tags", []).append(
                f"tag[{index}] words {tag_words} not in {settings.tag_min_words}-{settings.tag_max_words}"
            )
        if tag_chars > settings.tag_max_chars:
            violations.setdefault("tags", []).append(
                f"tag[{index}] chars {tag_chars} exceeds {settings.tag_max_chars}"
            )

    return {
        "valid": not violations,
        "violations": violations,
        "metrics": {
            "title_chars": title_chars,
            "title_words": title_words,
            "description_chars": desc_chars,
            "description_words": desc_words,
            "tag_count": len(tags),
        },
    }


def _regenerate_title(cleaned_script: str, tags: list[str], description: str) -> str:
    """Regenerate title only when constraints fail."""
    settings = _get_settings()
    prompt_input = _prep_input(cleaned_script, 120)
    user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        f"Known tags: {', '.join(tags[:4])}\n"
        f"Description context: {description[:280]}\n\n"
        "Generate ONE improved title that strictly follows the required title constraints."
    )
    parsed = _llm_call(
        'Output ONE JSON object with key "title" ONLY. '
        "Title must be catchy, specific, 40-60 chars, and 7-11 words.",
        user_msg,
        max_tokens=120,
        temperature=min(0.9, settings.temperature + 0.15),
    )
    return _clean_title(str(parsed.get("title", "")).strip())


def _regenerate_description(cleaned_script: str, title: str, tags: list[str]) -> str:
    """Regenerate description only when constraints fail."""
    settings = _get_settings()
    prompt_input = _prep_input(cleaned_script, 320)
    user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        f'Title: "{title}"\n'
        f"Tags: {', '.join(tags)}\n\n"
        "Generate ONE improved description that strictly follows the required description constraints, "
        "stays specific, and paraphrases the script instead of copying lines verbatim."
    )
    max_tokens = _cap_max_tokens(min(360, settings.max_tokens), "description_retry")
    parsed = _llm_call(
        SYSTEM_PROMPT_DESC_ONLY,
        user_msg,
        max_tokens=max_tokens,
        temperature=min(0.95, settings.temperature + 0.12),
    )
    return _clean_description(str(parsed.get("description", "")).strip())


def _score_band(value: float, min_value: float, max_value: float) -> float:
    """Return 0-100 score for a value against a target band."""
    if min_value <= value <= max_value:
        return 100.0
    if value < min_value:
        penalty = ((min_value - value) / max(1.0, min_value)) * 120.0
        return max(0.0, 100.0 - penalty)
    penalty = ((value - max_value) / max(1.0, max_value)) * 120.0
    return max(0.0, 100.0 - penalty)


def _calculate_seo_score(metadata: dict, script_text: str) -> tuple[float, dict[str, float]]:
    """Calculate overall SEO score and weighted component breakdown."""
    settings = _get_settings()
    title = str(metadata.get("title", "")).strip()
    description = str(metadata.get("description", "")).strip()
    tags = metadata.get("tags", [])
    tags = tags if isinstance(tags, list) else []

    title_char_score = _score_band(len(title), settings.title_min_chars, settings.title_max_chars)
    title_word_score = _score_band(_word_count(title), settings.title_min_words, settings.title_max_words)

    sentence_count = len(_split_sentences(description))
    description_word_score = _score_band(
        _word_count(description),
        settings.description_min_words,
        settings.description_max_words,
    )
    description_char_score = _score_band(
        len(description),
        settings.description_min_chars,
        settings.description_max_chars,
    )
    sentence_score = _score_band(sentence_count, 4, 8)
    cta_score = 100.0 if re.search(r"\b(subscribe|follow|comment|like|share)\b", description, re.IGNORECASE) else 55.0

    tag_count_score = _score_band(len(tags), settings.tags_min_count, settings.tags_max_count)
    per_tag_scores: list[float] = []
    for tag in tags:
        tag_word_score = _score_band(_word_count(tag), settings.tag_min_words, settings.tag_max_words)
        tag_char_score = 100.0 if len(tag) <= settings.tag_max_chars else 0.0
        per_tag_scores.append((tag_word_score * 0.7) + (tag_char_score * 0.3))
    tag_quality_score = sum(per_tag_scores) / len(per_tag_scores) if per_tag_scores else 0.0

    from backend.keyword_extractor import extract_tags

    keywords = extract_tags(script_text, top_n=12)
    combined_text = " ".join([title, description, " ".join(tags)]).lower()
    if keywords:
        keyword_hits = sum(1 for kw in keywords if kw.lower() in combined_text)
        keyword_relevance = min(100.0, (keyword_hits / len(keywords)) * 120.0)
    else:
        keyword_relevance = 60.0

    description_words = description.split()
    avg_sentence_len = len(description_words) / max(1, sentence_count)
    readability = _score_band(avg_sentence_len, 12.0, 26.0)

    title_score = (title_char_score * 0.5) + (title_word_score * 0.5)
    description_score = (
        (description_word_score * 0.4)
        + (description_char_score * 0.35)
        + (sentence_score * 0.15)
        + (cta_score * 0.10)
    )
    tags_score = (tag_count_score * 0.45) + (tag_quality_score * 0.55)

    overall = (
        (title_score * 0.25)
        + (description_score * 0.35)
        + (tags_score * 0.25)
        + (keyword_relevance * 0.10)
        + (readability * 0.05)
    )

    breakdown = {
        "title": round(title_score, 1),
        "description": round(description_score, 1),
        "tags": round(tags_score, 1),
        "keyword_relevance": round(keyword_relevance, 1),
        "readability": round(readability, 1),
    }
    return round(overall, 1), breakdown


def _apply_output_contract(
    metadata: dict,
    cleaned_script: str,
    *,
    allow_retry: bool,
) -> dict:
    """Apply strict constraint contract with targeted retries and SEO scoring."""
    contract_start = perf_counter()
    settings = _get_settings()
    target_tag_count = _target_tag_count(cleaned_script)

    current = {
        "title": str(metadata.get("title", "")).strip(),
        "description": str(metadata.get("description", "")).strip(),
        "tags": metadata.get("tags", []),
    }

    current["tags"] = _normalize_tags(
        current["tags"],
        target_count=target_tag_count,
        fallback_text=cleaned_script,
    )
    current["title"] = _coerce_title_to_bounds(current["title"], current["tags"])
    current["description"] = _coerce_description_to_bounds(
        current["description"],
        cleaned_script,
        current["tags"],
    )

    validation = _validate_metadata_constraints(current)
    retry_budget = settings.constraint_retry_count if allow_retry else 0
    retry_calls = 0

    for attempt in range(retry_budget):
        if validation["valid"]:
            break

        failed_fields = set(validation["violations"].keys())
        logger.warning(
            "Constraint violations on attempt %d/%d: %s",
            attempt + 1,
            retry_budget,
            validation["violations"],
        )

        if "tags" in failed_fields:
            current["tags"] = _normalize_tags(
                current["tags"],
                target_count=target_tag_count,
                fallback_text=cleaned_script,
            )

        if "title" in failed_fields:
            try:
                regenerated = _regenerate_title(
                    cleaned_script,
                    current["tags"],
                    current["description"],
                )
                if regenerated:
                    current["title"] = regenerated
                    retry_calls += 1
            except Exception as exc:
                logger.warning("Title retry failed: %s", exc)

        if "description" in failed_fields:
            try:
                regenerated = _regenerate_description(
                    cleaned_script,
                    current["title"],
                    current["tags"],
                )
                if regenerated:
                    current["description"] = regenerated
                    retry_calls += 1
            except Exception as exc:
                logger.warning("Description retry failed: %s", exc)

        current["title"] = _coerce_title_to_bounds(current["title"], current["tags"])
        current["description"] = _coerce_description_to_bounds(
            current["description"],
            cleaned_script,
            current["tags"],
        )
        validation = _validate_metadata_constraints(current)

    if not validation["valid"]:
        logger.warning("Returning best-effort metadata with residual issues: %s", validation["violations"])

    seo_score, seo_breakdown = _calculate_seo_score(current, cleaned_script)
    current["seo_score"] = seo_score
    current["seo_breakdown"] = seo_breakdown
    current["model"] = current.get("model") or _last_used_model_name

    logger.info(
        "Output contract finalized in %.2fs (valid=%s, retries=%d, title_chars=%d, desc_chars=%d, tags=%d)",
        perf_counter() - contract_start,
        validation["valid"],
        retry_calls,
        len(current.get("title", "")),
        len(current.get("description", "")),
        len(current.get("tags", [])),
    )
    return current


# ---------------------------------------------------------------------------
# Strategy: standard (single LLM call → title + description + tags)
# ---------------------------------------------------------------------------

def _strategy_standard(cleaned_script: str, model_choice: str = "auto") -> dict:
    settings = _get_settings()
    target_tag_count = _target_tag_count(cleaned_script)
    prompt_input = _prep_input(cleaned_script, settings.max_tokens)
    user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        f"Generate title, description, and {target_tag_count} SEO tags for this script. "
        "Keep wording specific to concrete entities, avoid generic filler, and make the description detailed "
        "(125-200 words, around 800-1300 chars) without copying script lines verbatim."
    )
    parsed = _llm_call(SYSTEM_PROMPT, user_msg, settings.max_tokens, model_choice=model_choice)
    res = _build_result(
        parsed,
        fallback_text=cleaned_script,
        target_tag_count=target_tag_count,
    )
    res["model"] = _last_used_model_name
    return res


# ---------------------------------------------------------------------------
# Strategy: two_pass (call 1 → title+tags, call 2 → description)
# ---------------------------------------------------------------------------

def _strategy_two_pass(cleaned_script: str, model_choice: str = "auto") -> dict:
    settings = _get_settings()
    target_tag_count = _target_tag_count(cleaned_script)
    prompt_input = _prep_input(cleaned_script, 320)

    # --- Pass 1: title + tags ---
    user_msg_1 = (
        f"Video script:\n{prompt_input}\n\n"
        f"Generate a catchy title and {target_tag_count} SEO tags for this script. "
        "Prioritize concrete entities and tools from the script."
    )
    parsed_1 = _llm_call(SYSTEM_PROMPT_TITLE_TAGS, user_msg_1, 260, model_choice=model_choice)
    tags = _normalize_tags(
        parsed_1.get("tags", []),
        target_count=target_tag_count,
        fallback_text=cleaned_script,
    )
    title = _clean_title(str(parsed_1.get("title", "")).strip())
    title = _enhance_generic_title(title, tags)
    logger.info("Pass 1 done: title='%s', %d tags", title[:40], len(tags))

    # --- Pass 2: description (with title context) ---
    user_msg_2 = (
        f"Video script:\n{prompt_input}\n\n"
        f'The video title is: "{title}"\n\n'
        f"Focus keywords: {', '.join(tags[:4])}\n\n"
        "Write a detailed creator-style description (125-200 words, around 800-1300 chars) that complements "
        "the title and tags. Paraphrase script content instead of copying lines, keep it concrete, and end with "
        "a short CTA."
    )
    desc_tokens = _cap_max_tokens(min(360, settings.max_tokens), "title_desc_batch")
    parsed_2 = _llm_call(SYSTEM_PROMPT_DESC_ONLY, user_msg_2, desc_tokens, model_choice=model_choice)
    description = _clean_description(str(parsed_2.get("description", "")).strip())
    description = _expand_description_if_thin(description, cleaned_script)
    description = _upgrade_description_quality(description, cleaned_script, tags)

    return {"title": title, "description": description, "tags": tags, "model": _last_used_model_name}


# ---------------------------------------------------------------------------
# Strategy: tfidf_tags (keyword extraction → tags, LLM → title+desc)
# ---------------------------------------------------------------------------

def _strategy_tfidf_tags(cleaned_script: str, model_choice: str = "auto") -> dict:
    from backend.keyword_extractor import extract_tags

    settings = _get_settings()
    target_tag_count = _target_tag_count(cleaned_script)
    prompt_input = _prep_input(cleaned_script, 220)
    tags = _normalize_tags(
        extract_tags(cleaned_script),
        target_count=target_tag_count,
        fallback_text=cleaned_script,
    )
    logger.info("TF extracted %d tags", len(tags))

    user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        "Generate a catchy title and detailed description using concrete script entities. "
        "Description should be 125-200 words (around 800-1300 chars), energetic, and paraphrased "
        "instead of script-copy narration."
    )
    desc_tokens = _cap_max_tokens(min(360, settings.max_tokens), "title_desc_batch")
    parsed = _llm_call(SYSTEM_PROMPT_TITLE_DESC, user_msg, desc_tokens, model_choice=model_choice)

    description = _clean_description(str(parsed.get("description", "")).strip())
    description = _expand_description_if_thin(description, cleaned_script)
    description = _upgrade_description_quality(description, cleaned_script, tags)

    title = _clean_title(str(parsed.get("title", "")).strip())
    title = _enhance_generic_title(title, tags)

    return {
        "title": title,
        "description": description,
        "tags": tags,
        "model": _last_used_model_name,
    }


# ---------------------------------------------------------------------------
# Strategy: streaming (streamed single LLM call)
# ---------------------------------------------------------------------------

def _strategy_streaming(cleaned_script: str, model_choice: str = "auto") -> Generator[dict, None, None]:
    settings = _get_settings()
    target_tag_count = _target_tag_count(cleaned_script)
    prompt_input = _prep_input(cleaned_script, settings.max_tokens)
    prompt_input = _cap_prompt_chars(prompt_input, settings.stream_input_max_chars)
    user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        f"Generate title, description, and {target_tag_count} SEO tags. "
        "Keep output concrete, energetic, and specific to script entities. Description should be 125-200 words "
        "(around 800-1300 chars) and paraphrased rather than copied from the script."
    )

    accumulated = ""
    stream_tokens = _cap_max_tokens(min(320, settings.max_tokens), "title_desc_stream")
    for token in _llm_stream(SYSTEM_PROMPT, user_msg, stream_tokens, model_choice=model_choice):
        accumulated += token
        yield {"type": "token", "data": token}

    parse_start = perf_counter()
    parsed = _parse_json_safe(accumulated)
    logger.info("Streaming parse completed in %.2fs", perf_counter() - parse_start)

    post_start = perf_counter()
    payload = _build_result(
        parsed,
        fallback_text=cleaned_script,
        target_tag_count=target_tag_count,
    )
    payload["model"] = _last_used_model_name
    logger.info("Streaming post-process completed in %.2fs", perf_counter() - post_start)
    yield {
        "type": "done",
        "data": payload,
    }


# ---------------------------------------------------------------------------
# Strategy: tfidf_streaming (TF tags + streamed LLM title+desc)
# ---------------------------------------------------------------------------

def _strategy_tfidf_streaming(cleaned_script: str, model_choice: str = "auto") -> Generator[dict, None, None]:
    from backend.keyword_extractor import extract_tags

    settings = _get_settings()
    target_tag_count = _target_tag_count(cleaned_script)
    prompt_input = _prep_input(cleaned_script, 220)
    prompt_input = _cap_prompt_chars(prompt_input, settings.stream_input_max_chars)

    # Tags are instant (CPU, <10 ms)
    tags = _normalize_tags(
        extract_tags(cleaned_script),
        target_count=target_tag_count,
        fallback_text=cleaned_script,
    )
    logger.info("TF extracted %d tags", len(tags))
    yield {"type": "tags", "data": tags}

    user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        "Generate a catchy title and detailed description. "
        "Keep it energetic, concrete, script-specific, and paraphrased (no verbatim script copying). "
        "Description target: 125-200 words, around 800-1300 chars."
    )

    stream_tokens = _cap_max_tokens(min(360, settings.max_tokens), "title_desc_stream")
    accumulated = ""
    for token in _llm_stream(SYSTEM_PROMPT_TITLE_DESC, user_msg, stream_tokens, model_choice=model_choice):
        accumulated += token
        yield {"type": "token", "data": token}

    parse_start = perf_counter()
    parsed = _parse_json_safe(accumulated)
    logger.info("TFIDF streaming parse completed in %.2fs", perf_counter() - parse_start)

    post_start = perf_counter()
    description = _clean_description(str(parsed.get("description", "")).strip())
    description = _expand_description_if_thin(description, cleaned_script)
    description = _upgrade_description_quality(description, cleaned_script, tags)
    title = _clean_title(str(parsed.get("title", "")).strip())
    title = _enhance_generic_title(title, tags)
    logger.info("TFIDF streaming post-process completed in %.2fs", perf_counter() - post_start)
    yield {
        "type": "done",
        "data": {
            "title": title,
            "description": description,
            "tags": tags,
            "model": _last_used_model_name,
        },
    }


# ---------------------------------------------------------------------------
# Title variants (A/B testing)
# ---------------------------------------------------------------------------


def _normalize_variant_title(raw_title: Any, max_len: int | None = None) -> str:
    """Clean and validate a single candidate title variant."""
    settings = _get_settings()
    if max_len is None:
        max_len = settings.title_max_chars

    title = _clean_title(str(raw_title).strip())
    title = title.replace("\\n", " ").replace("\\t", " ")
    title = title.replace("\\", " ")
    title = title.replace('"', '').replace("“", "").replace("”", "")
    title = re.sub(r"^[\s'‘’]+|[\s'‘’]+$", "", title)
    title = re.sub(r"\s*#\S+", "", title)
    title = re.sub(r"^(?:[-*•]+|\.+)\s*", "", title)
    title = re.sub(r"^[^A-Za-z0-9]+", "", title)
    title = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", title)
    title = re.sub(r"[^A-Za-z0-9)\]]+$", "", title)
    title = re.sub(r"\s+", " ", title).strip()

    # Remove numbering or option prefixes the model sometimes emits.
    title = re.sub(
        r"^(?:\d+[\).:\-]\s*|option\s*[a-z]\s*[:\-]\s*)",
        "",
        title,
        flags=re.IGNORECASE,
    ).strip()

    lowered = title.lower()
    if re.search(r"\b(?:alt|alternative)\b", lowered):
        return ""

    if len(title) > max_len:
        return ""

    if len(title) < settings.title_min_chars:
        return ""

    word_count = _word_count(title)
    if word_count < settings.title_min_words or word_count > settings.title_max_words:
        return ""

    if sum(ch.isalpha() for ch in title) < 6:
        return ""

    return title


def _extract_variant_candidates(parsed: dict) -> list[str]:
    """Extract title candidates from flexible model payload shapes."""
    candidates: list[str] = []
    seen: set[str] = set()

    def _append_candidate(text: str) -> None:
        normalized = " ".join(text.split()).strip()
        if not normalized:
            return
        key = normalized.lower()
        if key in seen:
            return
        seen.add(key)
        candidates.append(normalized)

    def _collect(value: Any) -> None:
        if isinstance(value, list):
            for item in value:
                _collect(item)
            return

        if isinstance(value, dict):
            for key in sorted(value.keys()):
                _collect(value[key])
            return

        if not isinstance(value, str):
            return

        text = value.strip()
        if not text:
            return

        # Some outputs provide stringified JSON arrays/objects.
        if text[0] in "[{":
            nested = None
            try:
                nested = json.loads(text)
            except json.JSONDecodeError:
                try:
                    nested = json.loads(text.replace('\\"', '"'))
                except json.JSONDecodeError:
                    nested = None

            if nested is not None:
                _collect(nested)
                return

        _append_candidate(text)

    for key in ("titles", "alternative_titles", "title_variants", "variants"):
        if key in parsed:
            _collect(parsed[key])

    # Handle keys like title1/title2 at top-level.
    for key, value in parsed.items():
        low_key = key.lower()
        if low_key in {"title", "description", "tags"}:
            continue
        if low_key.startswith("title"):
            _collect(value)

    return candidates


def _backfill_variant_candidates(
    base_title: str,
    script_text: str,
    requested_count: int,
    seen: set[str],
) -> list[str]:
    """Generate deterministic fallback variants when the model under-produces."""
    from backend.keyword_extractor import _STOP_WORDS, extract_tags

    script_lower = script_text.lower()
    base_lower = base_title.lower()
    acronym_tokens = {"ai", "api", "llm", "nlp", "seo", "nltk"}
    phrase_noise = {
        "workflow", "workflows", "strategy", "strategies", "guide", "playbook",
        "results", "result", "today", "build", "boost", "better", "video", "creator",
    }

    def _format_token(token: str) -> str:
        return token.upper() if token in acronym_tokens else token.capitalize()

    def _compact_topic(raw_phrase: str, max_words: int = 2, max_chars: int = 24) -> str:
        tokens = [
            tok for tok in re.findall(r"[a-z0-9]+", raw_phrase.lower())
            if len(tok) > 2 and tok not in _STOP_WORDS and tok not in phrase_noise
        ]
        if not tokens:
            tokens = [
                tok for tok in re.findall(r"[a-z0-9]+", raw_phrase.lower())
                if len(tok) > 2 and tok not in _STOP_WORDS
            ]
        if not tokens:
            return ""

        tokens = tokens[:max_words]
        formatted = [_format_token(tok) for tok in tokens]
        compact = " ".join(formatted)
        while len(compact) > max_chars and len(formatted) > 1:
            formatted = formatted[:-1]
            compact = " ".join(formatted)
        return compact.strip()

    raw_topics: list[str] = []
    known_phrases = [
        "text summarization",
        "extractive summarization",
        "natural language processing",
        "machine learning",
        "computer vision",
        "data science",
        "prompt engineering",
    ]
    for phrase in known_phrases:
        if phrase in base_lower or phrase in script_lower:
            raw_topics.append(phrase)

    raw_topics.extend(extract_tags(script_text, top_n=max(16, requested_count * 6)))
    raw_topics.extend(seg.strip() for seg in re.split(r"[:|\-]", base_title) if seg.strip())

    topic_phrases: list[str] = []
    seen_topics: set[str] = set()
    for phrase in raw_topics:
        compact = _compact_topic(phrase)
        if not compact:
            continue
        key = compact.lower()
        if key in seen_topics:
            continue
        seen_topics.add(key)
        topic_phrases.append(compact)
        if len(topic_phrases) >= 12:
            break

    if not topic_phrases:
        topic_phrases = ["Creator Workflow"]

    tech_terms = [
        "python",
        "nltk",
        "nlp",
        "llm",
        "api",
        "seo",
        "langchain",
        "chromadb",
        "ollama",
        "react",
        "tailwind",
        "fastapi",
        "pandas",
        "numpy",
        "pytorch",
        "tensorflow",
    ]
    detected_tools = [
        _format_token(term)
        for term in tech_terms
        if re.search(rf"\b{re.escape(term)}\b", script_lower)
        or re.search(rf"\b{re.escape(term)}\b", base_lower)
    ]

    if not detected_tools:
        detected_tools.append(topic_phrases[0].split()[0])

    kw1 = topic_phrases[0]
    kw2 = detected_tools[0]
    kw3 = topic_phrases[1] if len(topic_phrases) > 1 else kw1
    kw4 = detected_tools[1] if len(detected_tools) > 1 else kw2
    support_tags = [kw1.lower(), kw2.lower(), kw3.lower(), kw4.lower()]

    templates = [
        f"{kw1} with {kw2}: Workflow for Results",
        f"Build {kw1} in {kw2}: Practical Workflow",
        f"{kw1} in {kw2}: Mistakes to Avoid Today",
        f"{kw3} with {kw4}: Creator Playbook Breakdown",
        f"{kw3}: Faster Results with {kw2} Workflow",
        f"{kw1} in {kw2}: Step by Step Guide",
    ]

    hooks = [
        "Practical Creator Workflow",
        "Faster Search Reach",
        "High Retention Playbook",
        "Mistakes to Avoid",
    ]
    for hook in hooks:
        templates.append(f"{kw1} with {kw2}: {hook}")

    filled: list[str] = []
    for template in templates:
        title = _normalize_variant_title(template)
        if not title:
            title = _normalize_variant_title(_coerce_title_to_bounds(template, support_tags))
        if not title:
            continue
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        filled.append(title)
        if len(filled) >= requested_count:
            break

    return filled


def generate_title_variants(
    script_text: str,
    base_title: str,
    count: int = 2,
    model_choice: str = "auto",
) -> list[str]:
    """
    Generate model-driven alternative titles for A/B testing.

    Args:
        script_text: Source script used for metadata generation.
        base_title: Existing title to diversify from.
        count: Number of alternative titles to request.
        model_choice: Preferred model ('auto', 'groq', or 'mistral').

    Returns:
        A list of unique alternative titles (up to ``count``).
    """
    request_start = perf_counter()
    requested_count = max(1, min(count, 5))

    try:
        cleaned_script = validate_script(script_text)
    except ScriptValidationError as exc:
        _record_inference_diagnostic(
            "title_variants",
            {
                "ok": False,
                "error": str(exc),
                "stage": "validate_script",
                "requested_count": requested_count,
                "run_temperature": "unknown",
                "timings_s": {
                    "total_s": round(perf_counter() - request_start, 3),
                },
            },
        )
        raise

    cleaned_base_title = _clean_title(base_title.strip())
    if not cleaned_base_title:
        error = "Base title cannot be empty."
        _record_inference_diagnostic(
            "title_variants",
            {
                "ok": False,
                "error": error,
                "stage": "validate_base_title",
                "requested_count": requested_count,
                "script_chars": len(cleaned_script),
                "run_temperature": "unknown",
                "timings_s": {
                    "total_s": round(perf_counter() - request_start, 3),
                },
            },
        )
        raise ScriptValidationError(error)

    prompt_input = _prep_input(cleaned_script, 220)
    base_user_msg = (
        f"Video script:\n{prompt_input}\n\n"
        f'Current title: "{cleaned_base_title}"\n\n'
        f"Generate EXACTLY {requested_count} alternative titles for A/B testing. "
        "Return JSON only."
    )

    raw_titles: list[str] = []
    llm_attempt_s: list[float] = []
    llm_parse_failures = 0
    llm_empty_payload_attempts = 0
    llm_success_attempt: int | None = None

    for attempt in range(1, 4):
        user_msg = (
            base_user_msg
            if attempt == 1
            else (
                base_user_msg
                + "\n\nCRITICAL: JSON must contain key \"titles\" with an array of strings."
            )
        )

        temp = min(1.0, max(0.65, _get_settings().temperature + (attempt - 1) * 0.12))
        llm_call_start = perf_counter()

        try:
            parsed = _llm_call(
                SYSTEM_PROMPT_TITLE_VARIANTS,
                user_msg,
                220,
                temperature=temp,
                model_choice=model_choice,
            )
        except json.JSONDecodeError as exc:
            llm_attempt_s.append(perf_counter() - llm_call_start)
            llm_parse_failures += 1
            logger.warning(
                "Title variants JSON parse failed on attempt %d: %s",
                attempt,
                exc,
            )
            continue

        llm_attempt_s.append(perf_counter() - llm_call_start)
        attempt_titles = parsed.get("titles", []) if isinstance(parsed, dict) else []
        if isinstance(attempt_titles, list) and attempt_titles:
            raw_titles = [str(item) for item in attempt_titles]
            llm_success_attempt = attempt
            break

        llm_empty_payload_attempts += 1
        logger.warning(
            "Title variants returned empty payload on attempt %d: %s",
            attempt,
            parsed,
        )

    support_tags = _normalize_tags(
        [],
        target_count=_target_tag_count(cleaned_script),
        fallback_text=f"{cleaned_base_title} {cleaned_script}",
    )
    normalized = _clean_and_dedupe_title_variants(
        raw_titles,
        cleaned_base_title,
        requested_count,
        support_tags=support_tags,
    )

    if len(normalized) < requested_count:
        fallback_titles = _generate_deterministic_title_variants(
            cleaned_base_title,
            cleaned_script,
            requested_count,
        )
        for candidate in fallback_titles:
            if candidate not in normalized and candidate != cleaned_base_title:
                normalized.append(candidate)
            if len(normalized) >= requested_count:
                break

    if len(normalized) < requested_count:
        emergency_titles = _build_emergency_title_variants(
            cleaned_base_title,
            cleaned_script,
            requested_count,
            support_tags=support_tags,
        )
        for candidate in emergency_titles:
            if candidate not in normalized and candidate != cleaned_base_title:
                normalized.append(candidate)
            if len(normalized) >= requested_count:
                break

    normalized = normalized[:requested_count]
    if not normalized:
        normalized = [_coerce_title_to_bounds(f"{cleaned_base_title} Guide", support_tags)]

    total_elapsed = perf_counter() - request_start
    _record_inference_diagnostic(
        "title_variants",
        {
            "ok": True,
            "requested_count": requested_count,
            "returned_count": len(normalized),
            "script_chars": len(cleaned_script),
            "base_title_chars": len(cleaned_base_title),
            "run_temperature": "warm" if llm_attempt_s and llm_attempt_s[0] < 1.0 else "cold",
            "llm_attempts": len(llm_attempt_s),
            "llm_success_attempt": llm_success_attempt,
            "llm_parse_failures": llm_parse_failures,
            "llm_empty_payload_attempts": llm_empty_payload_attempts,
            "timings_s": {
                "total_s": round(total_elapsed, 3),
                "llm_attempt_s": [round(val, 3) for val in llm_attempt_s],
            },
            "titles": normalized,
        },
    )

    logger.info(
        "Generated %d title variants in %.2fs (requested=%d, attempts=%d)",
        len(normalized),
        total_elapsed,
        requested_count,
        len(llm_attempt_s),
    )
    return normalized


# ---------------------------------------------------------------------------
# Public API — batch
# ---------------------------------------------------------------------------

_NON_STREAMING = {"standard", "two_pass", "tfidf_tags"}
_STREAMING = {"streaming", "tfidf_streaming"}


def generate_youtube_metadata(script_text: str, model_choice: str = "auto") -> dict:
    """
    Generate SEO-optimized YouTube metadata from a video script.

    Dispatches to the configured generation strategy.  For streaming
    strategies called through this function, tokens are consumed
    internally and the final dict is returned.

    Args:
        script_text: The user's video script or summary.
        model_choice: Preferred model ('auto', 'groq', or 'mistral').

    Returns:
        Dict with keys: title (str), description (str), tags (list[str]), model (str).

    Raises:
        ScriptValidationError: If input fails validation.
        RuntimeError: If model inference or JSON parsing fails.
    """
    request_start = perf_counter()
    try:
        cleaned_script = validate_script(script_text)
    except ScriptValidationError as exc:
        _record_inference_diagnostic(
            "metadata",
            {
                "ok": False,
                "error": str(exc),
                "stage": "validate_script",
                "timings_s": {
                    "total_s": round(perf_counter() - request_start, 3),
                },
            },
        )
        raise

    validation_elapsed = perf_counter() - request_start
    settings = _get_settings()
    strategy = settings.generation_strategy

    logger.info(
        "Generating metadata (strategy=%s, script=%d chars, model_choice=%s)",
        strategy, len(cleaned_script), model_choice,
    )

    strategy_elapsed = 0.0
    contract_elapsed = 0.0
    stream_token_chunks = 0
    stream_tags_count = 0
    stream_first_event_s: float | None = None
    stream_first_token_s: float | None = None

    def _record_failure(error: Exception, stage: str) -> None:
        total_elapsed = perf_counter() - request_start
        _record_inference_diagnostic(
            "metadata",
            {
                "ok": False,
                "strategy": strategy,
                "stage": stage,
                "error": str(error),
                "script_chars": len(cleaned_script),
                "run_temperature": _classify_run_temperature(
                    strategy=strategy,
                    first_token_s=stream_first_token_s,
                    total_s=total_elapsed,
                    token_chunks=stream_token_chunks,
                ),
                "timings_s": {
                    "validation_s": round(validation_elapsed, 3),
                    "strategy_s": round(strategy_elapsed, 3),
                    "contract_s": round(contract_elapsed, 3),
                    "total_s": round(total_elapsed, 3),
                },
                "stream_observations": {
                    "token_chunks": stream_token_chunks,
                    "tags_count": stream_tags_count,
                    "first_event_s": round(stream_first_event_s, 3) if stream_first_event_s is not None else None,
                    "first_token_s": round(stream_first_token_s, 3) if stream_first_token_s is not None else None,
                } if strategy in _STREAMING else None,
            },
        )

    try:
        strategy_start = perf_counter()
        if strategy == "two_pass":
            metadata = _strategy_two_pass(cleaned_script, model_choice=model_choice)
        elif strategy == "tfidf_tags":
            metadata = _strategy_tfidf_tags(cleaned_script, model_choice=model_choice)
        elif strategy in _STREAMING:
            # Consume stream, keep only the final result.
            metadata = None
            stream = (
                _strategy_streaming(cleaned_script, model_choice=model_choice)
                if strategy == "streaming"
                else _strategy_tfidf_streaming(cleaned_script, model_choice=model_choice)
            )
            for event in stream:
                now = perf_counter()
                if stream_first_event_s is None:
                    stream_first_event_s = now - strategy_start

                event_type = str(event.get("type", "")).lower()
                if event_type == "token":
                    stream_token_chunks += 1
                    if stream_first_token_s is None:
                        stream_first_token_s = now - strategy_start
                elif event_type == "tags":
                    tags_payload = event.get("data")
                    if isinstance(tags_payload, list):
                        stream_tags_count = len(tags_payload)
                elif event_type == "done":
                    payload = event.get("data")
                    if isinstance(payload, dict):
                        metadata = payload

            if metadata is None:
                raise RuntimeError("Streaming strategy produced no result.")
        else:
            metadata = _strategy_standard(cleaned_script, model_choice=model_choice)
        strategy_elapsed = perf_counter() - strategy_start

        allow_retry = settings.stream_allow_retry if strategy in _STREAMING else True
        contract_start = perf_counter()
        metadata = _apply_output_contract(
            metadata,
            cleaned_script,
            allow_retry=allow_retry,
        )
        contract_elapsed = perf_counter() - contract_start

    except ScriptValidationError as exc:
        _record_failure(exc, "validation")
        raise
    except json.JSONDecodeError as exc:
        logger.error("JSON parse failed: %s", exc)
        _record_failure(exc, "json_parse")
        raise RuntimeError(
            "Model returned invalid JSON. Please try again."
        ) from exc
    except Exception as exc:
        _record_failure(exc, "generation")
        if isinstance(exc, RuntimeError):
            raise
        logger.error("Generation error: %s", exc, exc_info=True)
        raise RuntimeError(f"AI generation failed: {exc}") from exc

    if not metadata.get("title"):
        error = RuntimeError("Model returned an empty title.")
        _record_failure(error, "empty_title")
        raise error

    total_elapsed = perf_counter() - request_start
    _record_inference_diagnostic(
        "metadata",
        {
            "ok": True,
            "strategy": strategy,
            "script_chars": len(cleaned_script),
            "run_temperature": _classify_run_temperature(
                strategy=strategy,
                first_token_s=stream_first_token_s,
                total_s=total_elapsed,
                token_chunks=stream_token_chunks,
            ),
            "timings_s": {
                "validation_s": round(validation_elapsed, 3),
                "strategy_s": round(strategy_elapsed, 3),
                "contract_s": round(contract_elapsed, 3),
                "total_s": round(total_elapsed, 3),
            },
            "stream_observations": {
                "token_chunks": stream_token_chunks,
                "tags_count": stream_tags_count,
                "first_event_s": round(stream_first_event_s, 3) if stream_first_event_s is not None else None,
                "first_token_s": round(stream_first_token_s, 3) if stream_first_token_s is not None else None,
            } if strategy in _STREAMING else None,
            "output": {
                "title_chars": len(str(metadata.get("title", ""))),
                "description_chars": len(str(metadata.get("description", ""))),
                "tag_count": len(metadata.get("tags", [])) if isinstance(metadata.get("tags"), list) else 0,
                "seo_score": metadata.get("seo_score"),
            },
        },
    )

    logger.info(
        "Metadata generated in %.2fs: title='%s'",
        total_elapsed,
        metadata["title"][:60],
    )
    return metadata


# ---------------------------------------------------------------------------
# Public API — streaming
# ---------------------------------------------------------------------------


def generate_youtube_metadata_stream(
    script_text: str,
    model_choice: str = "auto",
) -> Generator[dict, None, None]:
    """
    Stream metadata generation token-by-token.

    Yields event dicts:
      {"type": "tags",  "data": [...]}   — pre-extracted tags (tfidf_streaming)
      {"type": "token", "data": "..."}   — individual LLM tokens
      {"type": "done",  "data": {...}}   — final post-processed metadata

    For non-streaming strategies, the full result is computed first
    and yielded as a single ``done`` event.
    """
    request_start = perf_counter()
    try:
        cleaned_script = validate_script(script_text)
    except ScriptValidationError as exc:
        _record_inference_diagnostic(
            "stream",
            {
                "ok": False,
                "error": str(exc),
                "stage": "validate_script",
                "run_temperature": "unknown",
                "timings_s": {
                    "total_s": round(perf_counter() - request_start, 3),
                },
            },
        )
        yield {"type": "error", "message": str(exc)}
        return

    validation_elapsed = perf_counter() - request_start
    settings = _get_settings()
    strategy = settings.generation_strategy
    allow_retry = settings.stream_allow_retry if strategy in _STREAMING else True

    logger.info(
        "Streaming metadata (strategy=%s, script=%d chars, model_choice=%s)",
        strategy, len(cleaned_script), model_choice,
    )

    strategy_elapsed = 0.0
    contract_elapsed = 0.0
    token_chunks = 0
    tags_count = 0
    first_event_s: float | None = None
    first_token_s: float | None = None

    def _stream_observations() -> dict[str, Any]:
        return {
            "token_chunks": token_chunks,
            "tags_count": tags_count,
            "first_event_s": round(first_event_s, 3) if first_event_s is not None else None,
            "first_token_s": round(first_token_s, 3) if first_token_s is not None else None,
        }

    def _record_stream_diagnostic(
        *,
        ok: bool,
        stage: str,
        error: str | None = None,
        output: dict[str, Any] | None = None,
    ) -> None:
        total_elapsed = perf_counter() - request_start
        payload: dict[str, Any] = {
            "ok": ok,
            "strategy": strategy,
            "stage": stage,
            "script_chars": len(cleaned_script),
            "allow_retry": allow_retry,
            "run_temperature": _classify_run_temperature(
                strategy=strategy,
                first_token_s=first_token_s,
                total_s=total_elapsed,
                token_chunks=token_chunks,
            ),
            "timings_s": {
                "validation_s": round(validation_elapsed, 3),
                "strategy_s": round(strategy_elapsed, 3),
                "contract_s": round(contract_elapsed, 3),
                "total_s": round(total_elapsed, 3),
            },
            "stream_observations": _stream_observations(),
        }
        if error:
            payload["error"] = error
        if output is not None:
            payload["output"] = {
                "title_chars": len(str(output.get("title", ""))),
                "description_chars": len(str(output.get("description", ""))),
                "tag_count": len(output.get("tags", [])) if isinstance(output.get("tags"), list) else 0,
                "seo_score": output.get("seo_score"),
            }
        _record_inference_diagnostic("stream", payload)

    try:
        if strategy in _STREAMING:
            strategy_start = perf_counter()
            stream = (
                _strategy_tfidf_streaming(cleaned_script, model_choice=model_choice)
                if strategy == "tfidf_streaming"
                else _strategy_streaming(cleaned_script, model_choice=model_choice)
            )

            emitted_done = False
            for event in stream:
                now = perf_counter()
                if first_event_s is None:
                    first_event_s = now - request_start

                event_type = str(event.get("type", "")).lower()
                if event_type == "token":
                    token_chunks += 1
                    if first_token_s is None:
                        first_token_s = now - request_start
                elif event_type == "tags":
                    tags_payload = event.get("data")
                    if isinstance(tags_payload, list):
                        tags_count = len(tags_payload)

                if event_type == "done":
                    contract_start = perf_counter()
                    finalized = _apply_output_contract(
                        event.get("data", {}),
                        cleaned_script,
                        allow_retry=allow_retry,
                    )
                    contract_elapsed = perf_counter() - contract_start
                    strategy_elapsed = perf_counter() - strategy_start
                    _record_stream_diagnostic(
                        ok=True,
                        stage="completed",
                        output=finalized,
                    )
                    yield {"type": "done", "data": finalized}
                    emitted_done = True
                    break

                yield event
            
            if not emitted_done:
                message = "Streaming strategy produced no final result."
                strategy_elapsed = perf_counter() - strategy_start
                _record_stream_diagnostic(
                    ok=False,
                    stage="missing_done_event",
                    error=message,
                )
                yield {
                    "type": "error",
                    "message": message,
                }
            return

        # Non-streaming fallback: compute and yield as single event.
        strategy_start = perf_counter()
        if strategy == "two_pass":
            metadata = _strategy_two_pass(cleaned_script)
        elif strategy == "tfidf_tags":
            metadata = _strategy_tfidf_tags(cleaned_script)
        else:
            metadata = _strategy_standard(cleaned_script)
        strategy_elapsed = perf_counter() - strategy_start

        contract_start = perf_counter()
        finalized = _apply_output_contract(metadata, cleaned_script, allow_retry=True)
        contract_elapsed = perf_counter() - contract_start
        _record_stream_diagnostic(
            ok=True,
            stage="completed_non_stream_fallback",
            output=finalized,
        )
        yield {"type": "done", "data": finalized}
    except json.JSONDecodeError as exc:
        _record_stream_diagnostic(
            ok=False,
            stage="json_parse",
            error=str(exc),
        )
        yield {
            "type": "error",
            "message": "Model returned invalid JSON. Please try again.",
        }
    except Exception as exc:
        logger.error("Streaming generation error: %s", exc, exc_info=True)
        _record_stream_diagnostic(
            ok=False,
            stage="stream_exception",
            error=str(exc),
        )
        yield {
            "type": "error",
            "message": f"AI generation failed: {exc}",
        }
