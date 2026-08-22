"""
FastAPI application — YouTube SEO metadata generation API (moved into backend package).
"""

import asyncio
import json
from contextlib import asynccontextmanager, suppress
from time import perf_counter
from typing import Any

from celery.result import AsyncResult
from fastapi import Depends, FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse, StreamingResponse

from backend.celery_worker import celery_app, process_video_text
from backend.config import get_settings
from backend.logger import setup_logging
from backend.services.model_runtime import (
    ensure_model_warm_ready,
    initialize_model_runtime_state,
    prewarm_model_runtime,
    start_keep_warm_if_enabled,
    stop_keep_warm_task,
)

logger = setup_logging("api")
settings = get_settings()
allowed_origins = (
    [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    if settings.cors_origins
    else []
)

limiter = Limiter(key_func=get_remote_address, default_limits=[])
MODEL_WARM_GATE_TIMEOUT_S = 75.0
DEPS_HEALTH_CACHE_TTL_S = 10.0
DEPS_HEALTH_PROBE_TIMEOUT_S = 2.0

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(api_key_header)):
    if not settings.api_key:
        return
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def _probe_dependency_health_sync() -> dict[str, Any]:
    """Run dependency checks in a worker thread so async routes stay responsive."""
    redis_ok = False
    redis_error: str | None = None

    worker_ok = False
    worker_error: str | None = None
    worker_online = 0

    try:
        with celery_app.connection_for_read() as conn:
            conn.ensure_connection(max_retries=0)
        redis_ok = True
    except Exception as exc:
        redis_error = str(exc)

    if redis_ok:
        try:
            inspector = celery_app.control.inspect(timeout=0.4)
            stats = inspector.stats() if inspector else None
            worker_online = len(stats or {})
            worker_ok = worker_online > 0
            if not worker_ok:
                worker_error = "No Celery worker connected"
        except Exception as exc:
            worker_error = str(exc)
    else:
        worker_error = "Redis unavailable"

    poll_ready = redis_ok and worker_ok

    return {
        "status": "healthy" if poll_ready else "degraded",
        "poll_ready": poll_ready,
        "redis": {
            "ok": redis_ok,
            "error": redis_error,
        },
        "worker": {
            "ok": worker_ok,
            "online": worker_online,
            "error": worker_error,
        },
    }


async def _ensure_model_warm(target_app: FastAPI) -> None:
    """Compatibility shim: original tests patch `main._ensure_model_warm`.

    Delegate to the extracted runtime helper while keeping the old
    symbol available for tests and backwards compatibility.
    """
    await ensure_model_warm_ready(target_app, logger)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API server starting (debug=%s)", settings.debug)
    await prewarm_model_runtime(app, logger)
    start_keep_warm_if_enabled(app, logger)

    yield

    with suppress(asyncio.CancelledError):
        await stop_keep_warm_task(app)

    logger.info("API server shutting down")


app = FastAPI(
    title="YouTube SEO Generator API",
    version="1.0.0",
    description="Generate SEO-optimized titles, descriptions, and tags for YouTube videos.",
    lifespan=lifespan,
)

app.state.limiter = limiter
initialize_model_runtime_state(
    app,
    warm_timeout_s=MODEL_WARM_GATE_TIMEOUT_S,
    keep_warm_enabled=bool(settings.model_keep_warm_enabled),
    keep_warm_interval_s=float(settings.model_keep_warm_interval_s),
)
app.state.deps_health_cache = None
app.state.deps_health_cache_ts = 0.0
app.state.deps_health_lock = None


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class VideoRequest(BaseModel):
    text: str = Field(..., min_length=20, max_length=3000)
    model: str = Field(default="auto", description="Model choice: 'auto', 'groq', or 'mistral'")


class TitleVariantsRequest(BaseModel):
    text: str = Field(..., min_length=20, max_length=3000)
    base_title: str = Field(..., min_length=5, max_length=120)
    count: int = Field(default=2, ge=1, le=5)
    model: str = Field(default="auto", description="Model choice: 'auto', 'groq', or 'mistral'")


class TaskResponse(BaseModel):
    task_id: str
    status: str = "Processing"


class SeoBreakdown(BaseModel):
    title: float = Field(..., ge=0, le=100)
    description: float = Field(..., ge=0, le=100)
    tags: float = Field(..., ge=0, le=100)
    keyword_relevance: float = Field(..., ge=0, le=100)
    readability: float = Field(..., ge=0, le=100)


class TelemetryData(BaseModel):
    latency_s: float | None = None
    ttft_s: float | None = None
    tokens_per_second: float | None = None


class MetadataResult(BaseModel):
    title: str = Field(..., min_length=40, max_length=60)
    description: str = Field(..., min_length=800, max_length=1300)
    tags: list[str] = Field(..., min_length=5, max_length=8)
    seo_score: float | None = Field(default=None, ge=0, le=100)
    seo_breakdown: SeoBreakdown | None = None
    model: str | None = Field(default=None, description="Active AI model used for generation")
    telemetry: TelemetryData | None = None

    @field_validator("tags")
    @classmethod
    def _validate_tags(cls, value: list[str]) -> list[str]:
        for tag in value:
            words = len(tag.split())
            if words < 2 or words > 4:
                raise ValueError("Each tag must contain 2-4 words")
            if len(tag) > 30:
                raise ValueError("Each tag must be at most 30 characters")
        return value


class TitleVariantsResponse(BaseModel):
    titles: list[str]


class StatusResponse(BaseModel):
    status: str
    result: MetadataResult | None = None
    error: str | None = None


class DependencyStatus(BaseModel):
    ok: bool
    error: str | None = None


class WorkerStatus(DependencyStatus):
    online: int = 0


class DepsHealthResponse(BaseModel):
    status: str
    poll_ready: bool
    redis: DependencyStatus
    worker: WorkerStatus


class InferenceDiagnosticsResponse(BaseModel):
    generated_at_utc: str
    llama_gpu_offload_supported: bool | None = None
    last_gpu_status: dict[str, Any] | None = None
    gpu_status_age_s: float | None = None
    metadata_last: dict[str, Any] | None = None
    stream_last: dict[str, Any] | None = None
    title_variants_last: dict[str, Any] | None = None


class WarmupStatusResponse(BaseModel):
    status: str
    ready: bool
    last_attempt_utc: str | None = None
    completed_at_utc: str | None = None
    warmup_duration_s: float | None = None
    error: str | None = None


@app.get("/")
async def root():
    return {
        "message": "YouTube SEO Generator API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/health/runtime")
async def runtime_health_check():
    groq_key = (
        (getattr(settings, "groq_api_key", None) or "").strip()
        or os.environ.get("GROQ_API_KEY", "").strip()
        or os.environ.get("GROQ_KEY", "").strip()
    )
    return {
        "status": "online",
        "groq_configured": bool(groq_key),
        "groq_key_preview": f"{groq_key[:8]}...{groq_key[-4:]}" if groq_key else None,
        "groq_primary_model": settings.groq_model,
        "groq_fallback_models": settings.groq_fallback_models,
        "generation_strategy": settings.generation_strategy,
    }


@app.get("/health/warmup", response_model=WarmupStatusResponse)
async def warmup_health_check():
    if app.state.model_warm_ready:
        status = "ready"
    elif app.state.model_warm_error:
        status = "error"
    elif app.state.model_warm_last_attempt_utc:
        status = "warming"
    else:
        status = "unknown"

    return WarmupStatusResponse(
        status=status,
        ready=bool(app.state.model_warm_ready),
        last_attempt_utc=app.state.model_warm_last_attempt_utc,
        completed_at_utc=app.state.model_warm_completed_utc,
        warmup_duration_s=app.state.model_warm_duration_s,
        error=app.state.model_warm_error,
    )


@app.get(
    "/api/diagnostics/inference",
    response_model=InferenceDiagnosticsResponse,
    dependencies=[Depends(verify_api_key)],
)
async def inference_diagnostics():
    from backend.ai_engine import get_inference_diagnostics_snapshot

    return InferenceDiagnosticsResponse(**get_inference_diagnostics_snapshot())


@app.get("/health/deps", response_model=DepsHealthResponse)
async def dependency_health_check():
    cache_payload = getattr(app.state, "deps_health_cache", None)
    cache_ts = float(getattr(app.state, "deps_health_cache_ts", 0.0) or 0.0)
    now = perf_counter()

    if isinstance(cache_payload, dict) and (now - cache_ts) < DEPS_HEALTH_CACHE_TTL_S:
        return DepsHealthResponse(**cache_payload)

    lock = getattr(app.state, "deps_health_lock", None)
    if lock is None:
        lock = asyncio.Lock()
        app.state.deps_health_lock = lock

    async with lock:
        cache_payload = getattr(app.state, "deps_health_cache", None)
        cache_ts = float(getattr(app.state, "deps_health_cache_ts", 0.0) or 0.0)
        now = perf_counter()
        if isinstance(cache_payload, dict) and (now - cache_ts) < DEPS_HEALTH_CACHE_TTL_S:
            return DepsHealthResponse(**cache_payload)

        try:
            payload = await asyncio.wait_for(
                asyncio.to_thread(_probe_dependency_health_sync),
                timeout=DEPS_HEALTH_PROBE_TIMEOUT_S,
            )
        except TimeoutError:
            payload = {
                "status": "degraded",
                "poll_ready": False,
                "redis": {
                    "ok": False,
                    "error": "Dependency probe timed out",
                },
                "worker": {
                    "ok": False,
                    "online": 0,
                    "error": "Dependency probe timed out",
                },
            }

        app.state.deps_health_cache = payload
        app.state.deps_health_cache_ts = perf_counter()

        return DepsHealthResponse(**payload)


@app.post("/api/generate", response_model=TaskResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(settings.rate_limit)
async def start_generation(request: Request, req: VideoRequest):
    logger.info("New generation request (%d chars, model=%s)", len(req.text), req.model)
    try:
        task = process_video_text.delay(req.text, model_choice=req.model)
        return TaskResponse(task_id=task.id)
    except Exception as exc:
        logger.error("Poll mode unavailable (Celery/Redis): %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=(
                "Poll mode unavailable: Redis/Celery is not running. "
                "Start Redis + Celery worker, or switch to Stream mode."
            ),
        ) from exc


@app.get("/api/status/{task_id}", response_model=StatusResponse, dependencies=[Depends(verify_api_key)])
async def get_status(task_id: str):
    try:
        task_result = AsyncResult(task_id, app=celery_app)

        if task_result.failed():
            error_msg = str(task_result.result) if task_result.result else "Unknown error"
            logger.warning("Task %s failed: %s", task_id, error_msg)
            return StatusResponse(status="Failed", error=error_msg)

        if task_result.ready():
            logger.info("Task %s completed", task_id)
            try:
                return StatusResponse(
                    status="Completed",
                    result=MetadataResult(**task_result.result),
                )
            except Exception as exc:
                logger.error(
                    "Task %s completed with invalid payload: %s",
                    task_id,
                    exc,
                    exc_info=True,
                )
                return StatusResponse(
                    status="Failed",
                    error="Task completed but produced invalid metadata payload.",
                )

        return StatusResponse(status="Processing")
    except Exception as exc:
        logger.error("Status check unavailable (Celery/Redis): %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=(
                "Poll mode unavailable: Redis/Celery is not running. "
                "Start Redis + Celery worker, or switch to Stream mode."
            ),
        ) from exc


@app.post("/api/generate/stream", dependencies=[Depends(verify_api_key)])
@limiter.limit(settings.rate_limit)
async def stream_generation(request: Request, req: VideoRequest):
    from backend.ai_engine import _get_groq_client, _normalize_model_choice

    # Only block on local CPU GGUF warmup if explicitly requesting Mistral or if Groq is unconfigured
    normalized = _normalize_model_choice(req.model)
    if normalized == "mistral" or not _get_groq_client():
        await _ensure_model_warm(app)

    async def event_generator():
        from backend.ai_engine import ScriptValidationError, generate_youtube_metadata_stream

        try:
            stream = generate_youtube_metadata_stream(req.text, model_choice=req.model)
            try:
                for event in stream:
                    if await request.is_disconnected():
                        logger.info("Client disconnected from /api/generate/stream; ending stream")
                        break

                    if not isinstance(event, dict):
                        logger.warning("Unexpected stream payload type: %s", type(event))
                        event = {
                            "type": "error",
                            "message": "Malformed streaming payload from generator.",
                        }
                    yield f"data: {json.dumps(event)}\n\n"
            finally:
                stream.close()
        except ScriptValidationError as e:
            logger.warning("Streaming validation error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception as e:
            logger.error("Streaming endpoint error: %s", e, exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': f'AI generation failed: {e}'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )


@app.post(
    "/api/title-variants",
    response_model=TitleVariantsResponse,
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit(settings.rate_limit)
async def generate_title_variants(request: Request, req: TitleVariantsRequest):
    from backend.ai_engine import ScriptValidationError, _get_groq_client, _normalize_model_choice
    from backend.ai_engine import generate_title_variants as build_title_variants

    try:
        normalized = _normalize_model_choice(req.model)
        if normalized == "mistral" or not _get_groq_client():
            await _ensure_model_warm(app)
        titles = build_title_variants(req.text, req.base_title, req.count, model_choice=req.model)
        return TitleVariantsResponse(titles=titles)
    except ScriptValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
