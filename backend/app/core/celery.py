from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "pixelpilot_workers",
    broker=settings.redis.URL,
    backend=settings.redis.URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Auto-discover pipeline tasks so the Celery worker picks them up
import app.workers.pipeline  # noqa: E402, F401