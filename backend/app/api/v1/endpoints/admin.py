from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.image import Workflow, Image
from app.schemas.responses import APIResponse
from typing import Any, Dict

router = APIRouter()

def admin_required(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.get("/stats", response_model=APIResponse[Dict[str, Any]])
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    _admin = Depends(admin_required)
):
    """
    Global system overview for the admin dashboard.
    """
    total_users = await db.scalar(select(func.count(User.id)))
    total_jobs = await db.scalar(select(func.count(Workflow.id)))
    completed_jobs = await db.scalar(select(func.count(Workflow.id)).where(Workflow.status == "completed"))
    
    return APIResponse(
        success=True,
        data={
            "users": total_users,
            "total_jobs": total_jobs,
            "success_rate": (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0,
            "storage_provider": "Cloudinary",
            "inference_engine": "ONNX Runtime"
        }
    )