import asyncio
import json
import logging
from uuid import UUID
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from sse_starlette.sse import EventSourceResponse
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user, get_redis
from app.core.celery import celery_app
from app.schemas.responses import APIResponse
from app.models.image import Image, Workflow
from app.services.workflow_state import compute_progress, failure_message
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

router = APIRouter()


def _compute_duration(workflow: Workflow) -> float | None:
    if workflow.completed_at and workflow.created_at:
        return (workflow.completed_at - workflow.created_at).total_seconds()
    if workflow.meta and workflow.meta.get("total_duration"):
        return workflow.meta["total_duration"]
    return None


def _build_job_base_query(user_id: UUID) -> select:
    return (
        select(Workflow)
        .options(selectinload(Workflow.image))
        .join(Image, Workflow.image_id == Image.id)
        .where(Image.user_id == user_id)
    )


def _apply_job_filters(
    query: select,
    status: str,
    search: str,
) -> select:
    if status:
        statuses = [s.strip() for s in status.split(",") if s.strip()]
        if statuses:
            query = query.where(Workflow.status.in_(statuses))
    if search:
        query = query.where(Image.filename.ilike(f"%{search}%"))
    return query


def _apply_job_sorting(
    query: select,
    sort: str,
) -> select:
    if sort == "status":
        query = query.order_by(Workflow.status)
    elif sort == "credits":
        query = query.order_by(desc(Workflow.total_credits))
    elif sort == "updated":
        query = query.order_by(desc(Workflow.completed_at))
    else:
        query = query.order_by(desc(Workflow.created_at))
    return query


@router.get("", response_model=APIResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "created_at",
    status: str = "",
    search: str = "",
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user),
):
    base_query = _build_job_base_query(user.id)
    base_query = _apply_job_filters(base_query, status, search)

    filtered_query = _apply_job_filters(
    _build_job_base_query(user.id),
    status,
    search,
    )

    query = _apply_job_sorting(filtered_query, sort)

    count_query = (
    select(func.count())
    .select_from(filtered_query.order_by(None).subquery())
    )

    total = await db.scalar(count_query)
    total = (await db.scalar(count_query)) or 0

    query = _apply_job_sorting(base_query, sort)

    offset = (page - 1) * size
    query = query.offset(offset).limit(size)
    result = await db.execute(query)
    workflows = result.scalars().unique().all()

    items = []
    for w in workflows:
        duration = _compute_duration(w)

        stage_names = [s.get("plugin", "unknown") for s in (w.config or [])]
        config_name = " + ".join(s.capitalize() for s in stage_names) if stage_names else "Workflow"

        items.append({
            "id": str(w.id),
            "image_id": str(w.image_id),
            "image": {
                "id": str(w.image.id),
                "filename": w.image.filename,
                "thumbnail_url": w.image.thumbnail_url,
            },
            "config_name": config_name,
            "stages": stage_names,
            "status": w.status,
            "progress": compute_progress(w.status, w.meta),
            "output_url": w.output_url,
            "total_credits": w.total_credits,
            "duration": duration,
            "created_at": w.created_at.isoformat(),
            "completed_at": w.completed_at.isoformat() if w.completed_at else None,
        })

    return APIResponse(
        success=True,
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if total else 0,
        }
    )


@router.get("/{workflow_id}", response_model=APIResponse)
async def get_job(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user),
):
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.image))
        .join(Image, Workflow.image_id == Image.id)
        .where(Workflow.id == workflow_id)
        .where(Image.user_id == user.id)
    )
    w = result.scalar_one_or_none()
    if not w:
        raise HTTPException(status_code=404, detail="Job not found")

    return APIResponse(success=True, data=_job_to_dict(w))


@router.post("/{workflow_id}/retry", response_model=APIResponse)
async def retry_job(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user),
):
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.image))
        .join(Image, Workflow.image_id == Image.id)
        .where(Workflow.id == workflow_id)
        .where(Image.user_id == user.id)
    )
    w = result.scalar_one_or_none()
    if not w:
        raise HTTPException(status_code=404, detail="Job not found")
    if w.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")

    w.status = "pending"
    w.output_url = None
    w.completed_at = None
    w.meta = None
    await db.commit()
    await db.refresh(w)

    from app.workers.pipeline import execute_pipeline_task
    execute_pipeline_task.apply_async(args=[str(w.id)], task_id=str(w.id))

    return APIResponse(success=True, data={"id": str(w.id), "status": "pending"})


@router.get("/stream/{workflow_id}")
async def stream_job_status(
    workflow_id: str,
    request: Request,
    redis: Redis = Depends(get_redis),
):
    async def event_generator():
        logger.info(f"Starting SSE stream for workflow {workflow_id}")
        pubsub = redis.pubsub()
        try:
            await pubsub.subscribe(f"workflow:{workflow_id}")
            logger.debug(f"Subscribed to workflow:{workflow_id}")
        except Exception as e:
            logger.error(f"Failed to subscribe: {e}")
            raise

        try:
            while True:
                if await request.is_disconnected():
                    logger.info(f"Client disconnected for workflow {workflow_id}")
                    break
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True)
                    if message:
                        logger.debug(f"Message received for workflow {workflow_id}")
                        yield {"event": "update", "data": message["data"]}
                except Exception as e:
                    logger.error(f"Error getting message: {e}")
                    raise
                await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Event generator error: {e}")
            raise
        finally:
            try:
                await pubsub.unsubscribe(f"workflow:{workflow_id}")
                logger.debug(f"Unsubscribed from workflow:{workflow_id}")
            except Exception as e:
                logger.error(f"Error unsubscribing: {e}")

    return EventSourceResponse(event_generator())


def _job_to_dict(w: Workflow) -> dict:
    duration = _compute_duration(w)

    return {
        "id": str(w.id),
        "image_id": str(w.image_id),
        "image": {
            "id": str(w.image.id),
            "filename": w.image.filename,
            "original_url": w.image.original_url,
            "thumbnail_url": w.image.thumbnail_url,
        },
        "config": w.config,
        "status": w.status,
        "progress": compute_progress(w.status, w.meta),
        "error": failure_message(w.status, w.meta),
        "output_url": w.output_url,
        "total_credits": w.total_credits,
        "meta": w.meta,
        "duration": duration,
        "created_at": w.created_at.isoformat(),
        "completed_at": w.completed_at.isoformat() if w.completed_at else None,
    }