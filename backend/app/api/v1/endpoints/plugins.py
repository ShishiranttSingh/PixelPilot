from fastapi import APIRouter, HTTPException
from app.plugins.registry import registry
from app.schemas.responses import APIResponse

router = APIRouter()

@router.get("", response_model=APIResponse)
async def list_plugins():
    plugins = registry.list_all()
    return APIResponse(success=True, data={"items": plugins})

@router.get("/{plugin_id}", response_model=APIResponse)
async def get_plugin(plugin_id: str):
    plugin = registry.get(plugin_id)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")
    return APIResponse(success=True, data=plugin.get_metadata())
