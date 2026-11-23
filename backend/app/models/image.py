import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import String, Integer, JSON, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class Image(Base):
    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    filename: Mapped[str] = mapped_column(String(255))
    original_url: Mapped[str] = mapped_column(String(1024))
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1024))
    
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    format: Mapped[str] = mapped_column(String(10))
    size_bytes: Mapped[int] = mapped_column(Integer)
    
    # Analysis metadata (Blur, Noise, etc.)
    analysis_results: Mapped[Dict[str, Any]] = mapped_column(JSONB, default={})
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="images")
    workflows = relationship("Workflow", back_populates="image")

class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("images.id"), nullable=False)
    
    # Stores the sequence of stages: [{"plugin": "upscale", "params": {"scale": 2}}, ...]
    config: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    
    status: Mapped[str] = mapped_column(String(20), default="pending")
    output_url: Mapped[Optional[str]] = mapped_column(String(1024))
    total_credits: Mapped[int] = mapped_column(Integer, default=0)
    meta: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    image = relationship("Image", back_populates="workflows")