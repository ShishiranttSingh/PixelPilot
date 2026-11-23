"""
FastAPI dependency providers.

Changes from v1:
  - get_redis() and get_redis_client() now draw from the shared
    ConnectionPool instead of opening a new connection per request.
"""

from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.redis_pool import get_redis_client          # ← pool-backed
from app.repositories.user_repository import UserRepository
from app.models.user import User


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a SQLAlchemy async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_redis() -> AsyncGenerator[Redis, None]:
    """
    Yield a Redis client from the shared pool.

    The connection is NOT closed here — it returns to the pool
    automatically when the client is garbage-collected or when
    close_redis_pool() is called at shutdown.
    """
    client = await get_redis_client()
    yield client


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate Bearer token and return the authenticated User."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.app.SECRET_KEY,
            algorithms=[settings.auth.ALGORITHM],
        )
        user_id: Optional[str] = payload.get("sub")
        if user_id is None or payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(
            status_code=401, detail="Could not validate credentials"
        )

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user