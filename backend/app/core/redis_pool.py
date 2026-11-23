"""
Redis connection pool — singleton, worker-safe.

All application code should call get_redis_pool() rather than
creating bare from_url() connections.  The pool is initialised once
per process and reused for every request / task, eliminating the
per-call TCP handshake overhead of the previous implementation.
"""

import asyncio
from typing import Optional

from redis.asyncio import Redis, ConnectionPool
from redis.asyncio.connection import SSLConnection

from app.core.config import settings
from app.core.logging import logger

# Module-level pool — one instance per OS process
_pool: Optional[ConnectionPool] = None
_pool_lock = asyncio.Lock()


async def get_redis_pool() -> ConnectionPool:
    """
    Return the process-wide Redis ConnectionPool, creating it on first call.

    Thread / coroutine safe: uses an asyncio.Lock to prevent duplicate
    pool creation when multiple coroutines start concurrently.
    """
    global _pool
    if _pool is not None:
        return _pool

    async with _pool_lock:
        # Double-checked locking — another coroutine may have created it
        if _pool is not None:
            return _pool

        logger.info("creating_redis_pool", url=settings.redis.URL)
        _pool = ConnectionPool.from_url(
            settings.redis.URL,
            decode_responses=True,
            max_connections=20,
        )
        logger.info("redis_pool_created")

    return _pool


async def get_redis_client() -> Redis:
    """
    Return a Redis client that draws connections from the shared pool.

    This replaces the old get_redis_client() in deps.py that called
    from_url() and created a new connection every time.

    Usage in Celery tasks::

        redis = await get_redis_client()
        await redis.publish(channel, message)
        # Do NOT close — connection returns to pool automatically.
    """
    pool = await get_redis_pool()
    return Redis(connection_pool=pool)


async def close_redis_pool() -> None:
    """
    Drain and close the pool.  Call during application shutdown only.
    """
    global _pool
    if _pool is not None:
        await _pool.disconnect()
        _pool = None
        logger.info("redis_pool_closed")