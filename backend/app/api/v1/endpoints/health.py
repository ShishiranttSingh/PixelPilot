import os

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.inference import InferenceManager
from app.core.config import settings
from app.core.deps import get_db
from app.schemas.responses import APIResponse

router = APIRouter()


@router.get("", response_model=APIResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return APIResponse(
            success=True,
            data={
                "status": "healthy",
                "database": "connected",
            },
        )
    except Exception as e:
        return APIResponse(
            success=False,
            error={
                "code": "HEALTH_CHECK_FAILED",
                "message": str(e),
            },
        )


@router.get("/ready")
async def readiness_check():
    """
    Checks if AI models are loaded and the system is ready to accept jobs.
    """
    models_present = (
        os.path.exists(settings.ai.MODELS_DIR)
        and len(os.listdir(settings.ai.MODELS_DIR)) > 0
    )

    return {
        "status": "ready" if models_present else "initializing",
        "models_loaded": len(InferenceManager._sessions),
        "device": settings.ai.ONNX_EXECUTION_PROVIDER,
    }