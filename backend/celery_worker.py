"""
Celery worker — background task processing for AI generation.

Connects to Redis as both broker and result backend.
"""

from celery import Celery

from backend.config import get_settings
from backend.logger import setup_logging

logger = setup_logging("worker")
settings = get_settings()

celery_app = Celery(
    "yt_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,
)


@celery_app.task(
    name="generate_metadata_task",
    bind=True,
    max_retries=2,
    default_retry_delay=5,
)
def process_video_text(self, script_text: str, model_choice: str = "auto") -> dict:
    """
    Background task that runs the AI engine.
    """
    from backend.ai_engine import generate_youtube_metadata

    logger.info("Task %s: starting generation (model=%s)", self.request.id, model_choice)

    try:
        result = generate_youtube_metadata(script_text, model_choice=model_choice)
        logger.info("Task %s: completed successfully", self.request.id)
        return result
    except Exception as exc:
        logger.error("Task %s: failed — %s", self.request.id, exc, exc_info=True)
        raise self.retry(exc=exc) from exc
