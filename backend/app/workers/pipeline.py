import platform
import time
import json
from uuid import UUID

from app.core.celery import celery_app
from app.core.database import AsyncSessionLocal
from app.core.logging import logger
from app.models.image import Workflow, Image
from app.services.storage_service import StorageService
from app.services.notification_service import notify_workflow_completed, notify_workflow_failed
from app.services.workflow_transitions import (
    claim_for_processing,
    mark_completed,
    mark_failed,
    record_progress,
    requeue_for_retry,
)
from sqlalchemy import select
import asyncio

import app.plugins  # noqa: F401 — triggers plugin registration in worker
from app.plugins.registry import registry


@celery_app.task(
    name="execute_pipeline",
    bind=True,
    max_retries=3,
    default_retry_delay=30
)
def execute_pipeline_task(self, workflow_id: str):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(run_hardened_pipeline(workflow_id, self))


async def run_hardened_pipeline(workflow_id: str, celery_task):
    log = logger.bind(workflow_id=workflow_id)
    start_time = time.time()
    stage_metrics = []

    async with AsyncSessionLocal() as db:
        workflow = (await db.execute(
            select(Workflow).where(Workflow.id == UUID(str(workflow_id)))
        )).scalar_one_or_none()
        if not workflow:
            return
        # Read now: db.rollback() in the error path expires ORM attributes, and a
        # lazy load there would fail inside async code.
        image_id = workflow.image_id

        try:
            # Atomically move pending -> processing. If the user cancelled before
            # this task started (or the workflow already finished), do nothing.
            if not await claim_for_processing(db, workflow_id):
                log.info("pipeline_skipped_not_active")
                return

            image_rec = (await db.execute(
                select(Image).where(Image.id == workflow.image_id)
            )).scalar_one()

            # Download
            current_image = await StorageService.download_to_numpy(image_rec.original_url)

            total_stages = len(workflow.config)

            for idx, stage in enumerate(workflow.config):
                stage_start = time.time()
                plugin_id = stage["plugin"]
                plugin = registry.get(plugin_id)

                # Progress is the share of stages that have actually finished.
                # It is persisted (so GET /workflows/{id} can report it) and
                # the write only succeeds while the workflow is still
                # 'processing', which makes it a race-free cancellation check.
                progress = int((idx / total_stages) * 100)
                if not await record_progress(
                    db, workflow_id,
                    progress=progress, current_stage=idx, stages=stage_metrics,
                ):
                    log.info("pipeline_cancelled", stage_index=idx)
                    return
                await publish_status(workflow_id, "processing", progress)

                if not plugin:
                    log.warning("plugin_not_found", plugin_id=plugin_id)
                    continue

                try:
                    current_image = await asyncio.wait_for(
                        plugin.execute(current_image, stage.get("params", {})),
                        timeout=60.0
                    )
                    stage_metrics.append({
                        "plugin": plugin_id,
                        "duration": time.time() - stage_start,
                        "status": "success"
                    })
                except Exception as stage_err:
                    log.error("stage_failed", plugin=plugin_id, error=str(stage_err))
                    stage_metrics.append({
                        "plugin": plugin_id,
                        "status": "failed",
                        "error": str(stage_err)
                    })
                    continue

            # All stages have run. Persisting that is also the last cancellation
            # check before we spend time uploading the result.
            last_stage = max(total_stages - 1, 0)
            if not await record_progress(
                db, workflow_id,
                progress=100, current_stage=last_stage, stages=stage_metrics,
            ):
                log.info("pipeline_cancelled", stage_index=total_stages)
                return

            # Upload final
            output_meta = await StorageService.upload_numpy(current_image, folder="processed")

            completed = await mark_completed(
                db, workflow_id,
                output_url=output_meta["url"],
                meta={
                    "total_duration": time.time() - start_time,
                    "stages": stage_metrics,
                    "worker_node": platform.node(),
                    "progress": 100,
                    "current_stage": last_stage,
                },
            )
            if not completed:
                # Cancelled while the result was uploading: keep 'cancelled'.
                log.info("completion_discarded_workflow_cancelled")
                return

            await publish_status(workflow_id, "completed", 100, output_url=output_meta["url"])

            # Notify user — workflow completed
            try:
                await notify_workflow_completed(db, image_rec.user_id, workflow_id)
            except Exception as notify_err:
                log.warning("notification_failed", error=str(notify_err))

        except Exception as exc:
            log.error("pipeline_crash", error=str(exc))
            try:
                await db.rollback()
            except Exception:
                pass

            # 'failed' is terminal for clients, so only record it once Celery has
            # run out of retries; until then the workflow is simply queued again.
            is_final = celery_task.request.retries >= celery_task.max_retries
            error_message = f"{type(exc).__name__}: {exc}"[:300]
            marked_failed = False
            try:
                if is_final:
                    marked_failed = await mark_failed(
                        db, workflow_id, error=error_message, stages=stage_metrics,
                    )
                    if marked_failed:
                        await publish_status(workflow_id, "failed", 0)
                else:
                    await requeue_for_retry(db, workflow_id, error=error_message)
            except Exception as status_err:
                log.error("status_update_failed", error=str(status_err))

            # Only notify on permanent failure — after all retries are exhausted
            if is_final and marked_failed:
                try:
                    async with AsyncSessionLocal() as notify_db:
                        image_rec_retry = (await notify_db.execute(
                            select(Image).where(Image.id == image_id)
                        )).scalar_one_or_none()
                        if image_rec_retry:
                            await notify_workflow_failed(
                                notify_db, image_rec_retry.user_id, workflow_id
                            )
                except Exception as notify_err:
                    log.warning("notification_failed", error=str(notify_err))

            raise celery_task.retry(exc=exc)


async def publish_status(
    workflow_id: str,
    status: str,
    progress: int,
    output_url: str = None,
) -> None:
    """
    Publish a workflow status update to Redis pub/sub.

    Best-effort: pub/sub is fire-and-forget and the database is the source of
    truth, so a Redis hiccup must never turn a finished workflow into a failed
    one. Uses the shared ConnectionPool so Celery workers do not open a new TCP
    connection for every status broadcast.
    """
    try:
        from app.core.redis_pool import get_redis_client   # pool-backed
        redis = await get_redis_client()
        await redis.publish(
            f"workflow:{workflow_id}",
            json.dumps({
                "status": status,
                "progress": progress,
                "output_url": output_url,
            }),
        )
        # Do NOT close — connection returns to pool automatically.
    except Exception as publish_err:
        logger.warning(
            "status_publish_failed", workflow_id=workflow_id, error=str(publish_err)
        )
