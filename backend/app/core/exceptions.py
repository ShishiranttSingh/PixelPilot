from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.core.logging import logger
from fastapi.encoders import jsonable_encoder

async def global_exception_handler(request: Request, exc: Exception):
    await logger.aerror("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred."},
            "meta": {"request_id": getattr(request.state, "request_id", None)}
        },
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
            },
            "meta": {"request_id": getattr(request.state, "request_id", None)}
        },
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []

    for err in exc.errors():
        details.append({
            "loc": err["loc"],
            "msg": err["msg"],
            "type": err["type"],
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": details,
            },
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
            },
        },
    )

async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    await logger.aerror("database_error", error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": "Service temporarily unavailable"}
        },
    )