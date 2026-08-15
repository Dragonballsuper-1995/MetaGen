"""Model runtime lifecycle helpers used by API startup and request gates."""

from __future__ import annotations

import asyncio
from contextlib import suppress
from datetime import UTC, datetime
from time import perf_counter

from fastapi import FastAPI, HTTPException

MODEL_WARM_GATE_TIMEOUT_S = 75.0


def _utc_now_iso() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_model_for_warmup() -> None:
    from backend.ai_engine import _get_groq_client, get_llm

    if _get_groq_client() is not None:
        return

    get_llm()


def initialize_model_runtime_state(
    target_app: FastAPI,
    *,
    warm_timeout_s: float = MODEL_WARM_GATE_TIMEOUT_S,
    keep_warm_enabled: bool = False,
    keep_warm_interval_s: float = 240.0,
) -> None:
    target_app.state.model_warm_ready = False
    target_app.state.model_warm_error = None
    target_app.state.model_warm_duration_s = None
    target_app.state.model_warm_last_attempt_utc = None
    target_app.state.model_warm_completed_utc = None
    target_app.state.model_warm_lock = None
    target_app.state.model_warm_timeout_s = float(warm_timeout_s)

    target_app.state.model_keep_warm_enabled = bool(keep_warm_enabled)
    target_app.state.model_keep_warm_interval_s = float(keep_warm_interval_s)
    target_app.state.model_keep_warm_task = None
    target_app.state.model_keep_warm_last_attempt_utc = None
    target_app.state.model_keep_warm_last_success_utc = None
    target_app.state.model_keep_warm_duration_s = None
    target_app.state.model_keep_warm_error = None
    target_app.state.model_keep_warm_runs = 0


async def run_keep_warm_heartbeat(target_app: FastAPI, logger) -> None:
    interval_s = float(getattr(target_app.state, "model_keep_warm_interval_s", 240.0))
    timeout_s = float(getattr(target_app.state, "model_warm_timeout_s", MODEL_WARM_GATE_TIMEOUT_S))

    logger.info("Model keep-warm heartbeat enabled (interval=%.1fs)", interval_s)
    try:
        while True:
            await asyncio.sleep(interval_s)

            lock = getattr(target_app.state, "model_warm_lock", None)
            if lock is None:
                lock = asyncio.Lock()
                target_app.state.model_warm_lock = lock

            async with lock:
                target_app.state.model_keep_warm_last_attempt_utc = _utc_now_iso()
                beat_start = perf_counter()

                try:
                    await asyncio.wait_for(asyncio.to_thread(_load_model_for_warmup), timeout=timeout_s)
                    elapsed = perf_counter() - beat_start
                    target_app.state.model_keep_warm_runs += 1
                    target_app.state.model_keep_warm_last_success_utc = _utc_now_iso()
                    target_app.state.model_keep_warm_duration_s = round(elapsed, 3)
                    target_app.state.model_keep_warm_error = None
                    target_app.state.model_warm_ready = True
                    target_app.state.model_warm_error = None
                    logger.debug("Model keep-warm heartbeat success in %.2fs", elapsed)
                except TimeoutError:
                    elapsed = perf_counter() - beat_start
                    target_app.state.model_keep_warm_duration_s = round(elapsed, 3)
                    target_app.state.model_keep_warm_error = (
                        f"Keep-warm timed out after {timeout_s:.0f}s"
                    )
                    target_app.state.model_warm_ready = False
                    target_app.state.model_warm_error = target_app.state.model_keep_warm_error
                    logger.warning("Model keep-warm heartbeat timed out after %.2fs", timeout_s)
                except Exception as exc:
                    elapsed = perf_counter() - beat_start
                    target_app.state.model_keep_warm_duration_s = round(elapsed, 3)
                    target_app.state.model_keep_warm_error = str(exc)
                    target_app.state.model_warm_ready = False
                    target_app.state.model_warm_error = str(exc)
                    logger.warning("Model keep-warm heartbeat failed: %s", exc)
    except asyncio.CancelledError:
        logger.info("Model keep-warm heartbeat stopped")
        raise


async def ensure_model_warm_ready(target_app: FastAPI, logger) -> None:
    if target_app.state.model_warm_ready:
        return

    lock = getattr(target_app.state, "model_warm_lock", None)
    if lock is None:
        lock = asyncio.Lock()
        target_app.state.model_warm_lock = lock

    async with lock:
        if target_app.state.model_warm_ready:
            return

        target_app.state.model_warm_last_attempt_utc = _utc_now_iso()
        target_app.state.model_warm_completed_utc = None
        target_app.state.model_warm_error = None

        warm_start = perf_counter()
        timeout_s = float(getattr(target_app.state, "model_warm_timeout_s", MODEL_WARM_GATE_TIMEOUT_S))

        try:
            await asyncio.wait_for(asyncio.to_thread(_load_model_for_warmup), timeout=timeout_s)
            warm_elapsed = perf_counter() - warm_start
            target_app.state.model_warm_ready = True
            target_app.state.model_warm_error = None
            target_app.state.model_warm_duration_s = round(warm_elapsed, 3)
            target_app.state.model_warm_completed_utc = _utc_now_iso()
            logger.info("Model warm gate completed in %.2fs", warm_elapsed)
        except TimeoutError as exc:
            warm_elapsed = perf_counter() - warm_start
            target_app.state.model_warm_ready = False
            target_app.state.model_warm_duration_s = round(warm_elapsed, 3)
            target_app.state.model_warm_error = f"Warmup timed out after {timeout_s:.0f}s"
            target_app.state.model_warm_completed_utc = _utc_now_iso()
            logger.error("Model warm gate timed out after %.2fs", timeout_s)
            raise HTTPException(
                status_code=503,
                detail="Model is warming up. Please retry in a few seconds.",
            ) from exc
        except Exception as exc:
            warm_elapsed = perf_counter() - warm_start
            target_app.state.model_warm_ready = False
            target_app.state.model_warm_duration_s = round(warm_elapsed, 3)
            target_app.state.model_warm_error = str(exc)
            target_app.state.model_warm_completed_utc = _utc_now_iso()
            logger.error("Model warm gate failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Model warmup failed. Please retry shortly.",
            ) from exc


async def prewarm_model_runtime(target_app: FastAPI, logger) -> None:
    target_app.state.model_warm_last_attempt_utc = _utc_now_iso()
    try:
        warm_start = perf_counter()
        _load_model_for_warmup()
        warm_elapsed = perf_counter() - warm_start
        target_app.state.model_warm_ready = True
        target_app.state.model_warm_error = None
        target_app.state.model_warm_duration_s = round(warm_elapsed, 3)
        target_app.state.model_warm_completed_utc = _utc_now_iso()
        logger.info("Model pre-warm completed in %.2fs", warm_elapsed)
    except Exception as exc:
        target_app.state.model_warm_ready = False
        target_app.state.model_warm_error = str(exc)
        target_app.state.model_warm_duration_s = None
        target_app.state.model_warm_completed_utc = _utc_now_iso()
        logger.warning("Model pre-warm skipped: %s", exc)


def start_keep_warm_if_enabled(target_app: FastAPI, logger) -> None:
    if target_app.state.model_keep_warm_enabled:
        target_app.state.model_keep_warm_task = asyncio.create_task(run_keep_warm_heartbeat(target_app, logger))


async def stop_keep_warm_task(target_app: FastAPI) -> None:
    keep_warm_task = target_app.state.model_keep_warm_task
    if keep_warm_task is not None:
        keep_warm_task.cancel()
        with suppress(asyncio.CancelledError):
            await keep_warm_task
        target_app.state.model_keep_warm_task = None
