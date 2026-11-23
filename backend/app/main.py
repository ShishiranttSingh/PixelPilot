from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import setup_logging, logger, RequestIdMiddleware
from fastapi import HTTPException
from app.core.exceptions import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    database_exception_handler
)
from app.services.storage_service import StorageService
from app.api.v1.api import api_router
from app.core.database import engine, Base
from app.models.user import User
from app.models.image import Image, Workflow

# Critical: Import plugins to trigger registration in the Registry
import app.plugins  # noqa: F401

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Setup Logging
    setup_logging()
    
    # 2. Setup Storage
    StorageService.setup()
    # Create database tables (development only)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await logger.ainfo("application_startup", 
                       env=settings.app.ENVIRONMENT,
                       version="1.0.0")
    yield
    await logger.ainfo("application_shutdown")

app = FastAPI(
    title=settings.app.PROJECT_NAME,
    lifespan=lifespan,
    docs_url=f"{settings.app.API_V1_STR}/docs",
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.app.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestIdMiddleware)

# Global Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)

# Versioned API Routing
app.include_router(api_router, prefix=settings.app.API_V1_STR)