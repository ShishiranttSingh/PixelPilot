from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.responses import APIResponse

router = APIRouter()

@router.get("/balance", response_model=APIResponse)
async def get_credit_balance(user: User = Depends(get_current_user)):
    return APIResponse(success=True, data={"credits_remaining": user.credits_remaining})
