from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, users, images, jobs, workflows, plugins, credits, notifications

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["system"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(plugins.router, prefix="/plugins", tags=["plugins"])
api_router.include_router(credits.router, prefix="/credits", tags=["credits"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])