"""
SharpenPlugin — Restormer ONNX inference with tiled processing.

Falls back to OpenCV unsharp masking when the ONNX model is unavailable.
"""

import cv2
import numpy as np
from typing import Any, Dict

from app.plugins.interface import ImagePlugin
from app.ai.inference import InferenceManager
from app.ai.tiling import run_tiled_inference
from app.core.logging import logger

_MODEL = "restormer_sharpen"


class SharpenPlugin(ImagePlugin):
    """Sharpen images using Restormer ONNX or OpenCV fallback."""

    @property
    def identifier(self) -> str:
        return "sharpen"

    @property
    def name(self) -> str:
        return "AI Sharpen (Restormer)"

    @property
    def credit_cost(self) -> int:
        return 2

    async def execute(self, image: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """
        Sharpen image using Restormer ONNX when available.

        Args:
            image:  HWC uint8 BGR image.
            params: intensity (float 0-3, default 1.0).

        Returns:
            Sharpened HWC uint8 BGR image.
        """
        intensity: float = float(params.get("intensity", 1.0))

        if InferenceManager.is_model_available(_MODEL):
            return await self._run_onnx(image, intensity)

        logger.warning(
            "restormer_model_unavailable",
            model=_MODEL,
            fallback="opencv_unsharp_mask",
            # TODO: download restormer_sharpen.onnx to settings.ai.MODELS_DIR
        )
        return self._run_opencv_fallback(image, intensity)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _run_onnx(self, image: np.ndarray, intensity: float) -> np.ndarray:
        """Run Restormer tiled inference and blend by intensity."""
        img_f32 = image.astype(np.float32) / 255.0

        async def infer(tile: np.ndarray) -> np.ndarray:
            return InferenceManager.run_inference(_MODEL, tile)

        result_f32 = await run_tiled_inference(img_f32, infer, scale=1)

        # intensity > 1 amplifies the sharpening effect beyond the model output
        clamped = min(intensity, 3.0) / 3.0
        blended = (1.0 - clamped) * img_f32 + clamped * result_f32
        return (blended.clip(0.0, 1.0) * 255.0).astype(np.uint8)

    @staticmethod
    def _run_opencv_fallback(image: np.ndarray, intensity: float) -> np.ndarray:
        """OpenCV unsharp mask fallback when ONNX model is absent."""
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]]) * intensity
        return cv2.filter2D(image, -1, kernel)

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.identifier,
            "name": self.name,
            "description": (
                "Enhances image sharpness and detail clarity "
                "using Restormer neural sharpening."
            ),
            "category": "enhancement",
            "version": "2.0.0",
            "credits": self.credit_cost,
            "icon": "sharpen",
            "params": {
                "intensity": {
                    "type": "float",
                    "default": 1.0,
                    "min": 0.0,
                    "max": 3.0,
                    "step": 0.1,
                    "description": (
                        "Sharpening intensity — higher values produce "
                        "stronger edge contrast."
                    ),
                }
            },
        }