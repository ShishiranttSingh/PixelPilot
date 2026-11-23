import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    redirect_url: str | None
    created_at: datetime
    read_at: datetime | None

    model_config = {"from_attributes": True}


class UnreadCountOut(BaseModel):
    unread_count: int