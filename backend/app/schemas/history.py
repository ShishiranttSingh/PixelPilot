from pydantic import BaseModel
from typing import List, Optional, Generic, TypeVar
from app.schemas.auth import UserOut
from app.schemas.responses import APIResponse

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class WorkflowDetail(BaseModel):
    # Expanded metadata for the inspection page
    id: str
    status: str
    config: List[dict]
    output_url: Optional[str]
    created_at: str
    duration: Optional[float]
    metrics: Optional[dict]
    
    class Config:
        from_attributes = True