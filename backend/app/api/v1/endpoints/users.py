from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.responses import APIResponse

router = APIRouter()


class UserUpdate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)


@router.get("/me", response_model=APIResponse[UserOut])
async def get_me(current_user: User = Depends(get_current_user)):
    return APIResponse(success=True, data=UserOut.model_validate(current_user))


@router.patch("/me", response_model=APIResponse[UserOut])
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check username is not already taken by someone else
    from sqlalchemy import select
    existing = await db.execute(
        select(User).where(User.username == payload.username)
    )
    other = existing.scalar_one_or_none()
    if other is not None and str(other.id) != str(current_user.id):
        raise HTTPException(status_code=409, detail="Username already taken")

    current_user.username = payload.username
    await db.commit()
    await db.refresh(current_user)
    return APIResponse(success=True, data=UserOut.model_validate(current_user))