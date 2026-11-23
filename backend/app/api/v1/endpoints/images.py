"""
Images API endpoints.

SQL optimisation changes:
  - Total count now uses SELECT COUNT(*) in the DB instead of
    fetching all rows into Python and calling len().
  - Status filter is applied in SQLAlchemy (via a correlated subquery)
    instead of post-processing the serialised dicts.
  - selectinload is retained to prevent N+1 on workflow relationships.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import inspect as sa_inspect

from app.core.deps import get_db, get_current_user
from app.schemas.responses import APIResponse
from app.services.image_service import ImageService
from app.services.analysis_service import ImageAnalysisService, RecommendationEngine
from app.models.image import Image as ImageModel, Workflow

router = APIRouter()


@router.post("/upload", response_model=APIResponse)
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    image_data = await ImageService(db).process_upload(file, user.id)
    analysis = await ImageAnalysisService.analyze_from_url(image_data.original_url)
    recommendations = RecommendationEngine.recommend(analysis)

    image_data.analysis_results = {
        "analysis": analysis,
        "recommendations": recommendations,
    }
    await db.commit()
    await db.refresh(image_data)

    return APIResponse(
        success=True,
        data={
            "image": _image_to_dict(image_data),
            "analysis": analysis,
            "recommendations": recommendations,
        },
    )


@router.get("", response_model=APIResponse)
async def list_images(
    page: int = 1,
    size: int = 20,
    sort: str = "created_at",
    status: str = "",
    search: str = "",
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    # ── Base predicate ────────────────────────────────────────────────
    base_where = [ImageModel.user_id == user.id]
    if search:
        base_where.append(ImageModel.filename.ilike(f"%{search}%"))

    # ── Status filter via correlated subquery ─────────────────────────
    # Find the latest workflow status for each image in SQL, avoiding
    # Python-side filtering that would require fetching all rows first.
    if status:
        latest_status_sq = (
            select(Workflow.status)
            .where(Workflow.image_id == ImageModel.id)
            .order_by(desc(Workflow.created_at))
            .limit(1)
            .correlate(ImageModel)
            .scalar_subquery()
        )
        base_where.append(latest_status_sq == status)

    # ── Count query (no LIMIT, no ORDER BY, no eager loads) ───────────
    count_q = select(func.count()).select_from(ImageModel).where(*base_where)
    total: int = (await db.scalar(count_q)) or 0

    # ── Data query ────────────────────────────────────────────────────
    data_q = (
        select(ImageModel)
        .options(selectinload(ImageModel.workflows))
        .where(*base_where)
    )

    if sort == "filename":
        data_q = data_q.order_by(ImageModel.filename)
    elif sort == "size":
        data_q = data_q.order_by(desc(ImageModel.size_bytes))
    else:
        data_q = data_q.order_by(desc(ImageModel.created_at))

    offset = (page - 1) * size
    data_q = data_q.offset(offset).limit(size)

    result = await db.execute(data_q)
    images = result.scalars().unique().all()

    return APIResponse(
        success=True,
        data={
            "items": [_image_to_dict(img) for img in images],
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if total else 0,
        },
    )


@router.delete("/{image_id}", response_model=APIResponse)
async def delete_image(
    image_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(ImageModel).where(
            ImageModel.id == image_id,
            ImageModel.user_id == user.id,
        )
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    await db.delete(image)
    await db.commit()
    return APIResponse(success=True, data={"id": str(image_id)})


@router.post("/{image_id}/reprocess", response_model=APIResponse)
async def reprocess_image(
    image_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(ImageModel)
        .options(selectinload(ImageModel.workflows))
        .where(ImageModel.id == image_id, ImageModel.user_id == user.id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return APIResponse(
        success=True,
        data={"id": str(image_id), "message": "Reprocess queued"},
    )


# ── Serialisation helper ──────────────────────────────────────────────────────

def _image_to_dict(image: ImageModel) -> dict:
    status = "completed"
    wf_loaded = "workflows" not in sa_inspect(image).unloaded
    if wf_loaded and image.workflows:
        latest = max(image.workflows, key=lambda w: w.created_at)
        status = latest.status
    return {
        "id": str(image.id),
        "filename": image.filename,
        "original_url": image.original_url,
        "thumbnail_url": image.thumbnail_url,
        "width": image.width,
        "height": image.height,
        "format": image.format,
        "size_bytes": image.size_bytes,
        "analysis_results": image.analysis_results,
        "status": status,
        "created_at": image.created_at.isoformat(),
    }