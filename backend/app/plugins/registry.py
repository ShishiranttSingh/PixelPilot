from typing import Dict, List, Optional, Any
from app.plugins.interface import ImagePlugin
from app.core.logging import logger

class PluginRegistry:
    _plugins: Dict[str, ImagePlugin] = {}

    @classmethod
    def register(cls, plugin: ImagePlugin):
        cls._plugins[plugin.identifier] = plugin
        logger.info(f"Plugin registered: {plugin.identifier}")

    @classmethod
    def get(cls, identifier: str) -> Optional[ImagePlugin]:
        return cls._plugins.get(identifier)

    @classmethod
    def list_all(cls) -> List[Dict[str, Any]]:
        return [p.get_metadata() for p in cls._plugins.values()]

# Global registry instance
registry = PluginRegistry()