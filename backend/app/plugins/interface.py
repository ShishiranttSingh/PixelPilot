from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import numpy as np

class ImagePlugin(ABC):
    """
    Base interface for all AI processing plugins.
    """
    @property
    @abstractmethod
    def identifier(self) -> str:
        """Unique ID for the plugin (e.g., 'upscale_realesrgan')"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def credit_cost(self) -> int:
        pass

    @abstractmethod
    async def execute(self, image: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """
        Processes the image and returns a modified numpy array.
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.identifier,
            "name": self.name,
            "description": "",
            "category": "general",
            "version": "1.0.0",
            "credits": self.credit_cost,
            "icon": self.identifier,
            "params": {}
        }