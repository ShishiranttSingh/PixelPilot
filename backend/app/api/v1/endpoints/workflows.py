from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.core.celery import celery_app
from app.schemas.responses import APIResponse
from app.core.logging import logger
from app.services.workflow_service import WorkflowService
from app.services.workflow_state import (
    CANCELLED,
    compute_progress,
    current_stage_index,
    failure_message,
)
from app.services.workflow_transitions import mark_cancelled
from app.models.image import Image, Workflow
from app.models.user import User

router = APIRouter()

class WorkflowCreateRequest(BaseModel):
    image_id: UUID
    config: list[dict]

@router.post("", response_model=APIResponse)
async def create_workflow(
    body: WorkflowCreateRequest,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
        select(Image).where(Image.id == body.image_id, Image.user_id == user.id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    workflow = await WorkflowService(db).create_workflow(body.image_id, body.config, user)

    # Return credits_remaining so the frontend can update the display
    result = await db.execute(select(User).where(User.id == user.id))
    updated_user = result.scalar_one()

    return APIResponse(success=True, data={
        "id": str(workflow.id),
        "credits_remaining": updated_user.credits_remaining
    })

@router.get("/{workflow_id}", response_model=APIResponse)
async def get_workflow(
    workflow_id: UUID,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    # This endpoint is polled for live status; no layer may serve a stale copy.
    response.headers["Cache-Control"] = "no-store"
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.image))
        .where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow or str(workflow.image.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Workflow not found")

    image = workflow.image
    return APIResponse(success=True, data={
        "id": str(workflow.id),
        "image_id": str(workflow.image_id),
        "image": {
            "id": str(image.id),
            "filename": image.filename,
            "original_url": image.original_url,
            "thumbnail_url": image.thumbnail_url,
            "width": image.width,
            "height": image.height,
        },
        "config": workflow.config,
        "status": workflow.status,
        "progress": compute_progress(workflow.status, workflow.meta),
        "current_stage": current_stage_index(workflow.meta),
        "error": failure_message(workflow.status, workflow.meta),
        "output_url": workflow.output_url,
        "total_credits": workflow.total_credits,
        "meta": workflow.meta,
        "created_at": workflow.created_at.isoformat(),
        "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
    })

@router.post("/{workflow_id}/cancel", response_model=APIResponse)
async def cancel_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.image))
        .where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow or str(workflow.image.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Atomic compare-and-set: only an active workflow can become 'cancelled', and
    # the worker's own writes are guarded the same way, so cancel and completion
    # can race but never overwrite each other.
    if await mark_cancelled(db, workflow_id):
        try:
            # Drops the task if it is still queued (task id == workflow id). A
            # running task notices the new status on its next guarded write.
            celery_app.control.revoke(str(workflow_id))
        except Exception as revoke_err:
            logger.warning("revoke_failed", workflow_id=str(workflow_id), error=str(revoke_err))
        return APIResponse(success=True, data={"id": str(workflow_id), "status": CANCELLED})

    # Not active any more: report what actually happened.
    await db.refresh(workflow, attribute_names=["status"])
    if workflow.status == CANCELLED:
        # Idempotent: a repeated cancel is not an error.
        return APIResponse(success=True, data={"id": str(workflow_id), "status": CANCELLED})
    raise HTTPException(
        status_code=409,
        detail=f"Workflow is already {workflow.status} and can no longer be cancelled",
    )
