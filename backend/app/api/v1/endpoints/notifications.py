import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import NotificationOut, UnreadCountOut
from app.schemas.responses import APIResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=APIResponse[list[NotificationOut]])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db)
    notifications = await svc.get_latest(current_user.id)
    return APIResponse(success=True, data=[NotificationOut.model_validate(n) for n in notifications])


@router.get("/unread-count", response_model=APIResponse[UnreadCountOut])
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db)
    count = await svc.get_unread_count(current_user.id)
    return APIResponse(success=True, data=UnreadCountOut(unread_count=count))


@router.post("/{notification_id}/read", response_model=APIResponse[NotificationOut])
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db)
    notification = await svc.mark_read(notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return APIResponse(success=True, data=NotificationOut.model_validate(notification))