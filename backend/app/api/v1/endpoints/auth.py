# Authentication endpoints api/v1/endpoints/auth.py


from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError
from app.core.deps import get_db
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token, RegisterResponse
from app.schemas.responses import APIResponse
from app.services.auth_service import AuthService
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.repositories.user_repository import UserRepository

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.register_user(data)
    return APIResponse(
        success=True,
        data={
            "message": "Registration successful.",
            "user": RegisterResponse.from_orm(user),
        },
    )

@router.post("/login", response_model=APIResponse[Token])
async def login(
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(data)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key=settings.auth.COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.auth.SECURE_COOKIE,
        samesite="lax",
        max_age=settings.auth.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    )

    return APIResponse(
        success=True,
        data=Token(access_token=access_token)
    )

@router.post("/refresh", response_model=APIResponse[Token])
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    token = request.cookies.get(settings.auth.COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    response.set_cookie(
        key=settings.auth.COOKIE_NAME,
        value=new_refresh,
        httponly=True,
        secure=settings.auth.SECURE_COOKIE,
        samesite="lax",
        max_age=settings.auth.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    )

    return APIResponse(success=True, data=Token(access_token=new_access))

@router.post("/logout", response_model=APIResponse)
async def logout(response: Response):
    response.delete_cookie(settings.auth.COOKIE_NAME)
    return APIResponse(success=True, data={"message": "Logged out successfully"})

@router.get("/verify-email")
async def verify_email():
    return {"message": "Verification endpoint (Dev mode: Auto-verified)"}
