from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[dict[str, Any]] = None
    meta: dict[str, Any] = {}

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None