"""
DenoisePlugin — NAFNet ONNX inference with tiled processing.

Falls back to OpenCV fastNlMeans when the ONNX model is unavailable,
so the application remains functional without the model weights.
"""

import cv2
import numpy as np
from typing import Any, Dict

from app.plugins.interface import ImagePlugin
from app.ai.inference import InferenceManager
from app.ai.tiling import run_tiled_inference
from app.core.logging import logger

_MODEL = "nafnet_denoise"


class DenoisePlugin(ImagePlugin):
    """Denoise images using NAFNet ONNX or OpenCV fallback."""

    @property
    def identifier(self) -> str:
        return "denoise"

    @property
    def name(self) -> str:
        return "AI Denoiser (NAFNet)"

    @property
    def credit_cost(self) -> int:
        return 3

    async def execute(self, image: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """
        Denoise image using NAFNet ONNX when available.

        Args:
            image:  HWC uint8 BGR image.
            params: strength (float 0-1, default 0.5).

        Returns:
            Denoised HWC uint8 BGR image.
        """
        strength: float = float(params.get("strength", 0.5))

        if InferenceManager.is_model_available(_MODEL):
            return await self._run_onnx(image, strength)

        logger.warning(
            "nafnet_model_unavailable",
            model=_MODEL,
            fallback="opencv_fastNlMeans",
            # TODO: download nafnet_denoise.onnx to settings.ai.MODELS_DIR
        )
        return self._run_opencv_fallback(image, strength)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _run_onnx(self, image: np.ndarray, strength: float) -> np.ndarray:
        """Run NAFNet tiled inference."""
        # Normalise to [0, 1] float32
        img_f32 = image.astype(np.float32) / 255.0

        async def infer(tile: np.ndarray) -> np.ndarray:
            """Forward one tile through NAFNet (scale = 1, same size)."""
            return InferenceManager.run_inference(_MODEL, tile)

        result_f32 = await run_tiled_inference(img_f32, infer, scale=1)

        # Blend with original based on strength (0 = no effect, 1 = full)
        blended = (1.0 - strength) * img_f32 + strength * result_f32
        return (blended.clip(0.0, 1.0) * 255.0).astype(np.uint8)

    @staticmethod
    def _run_opencv_fallback(image: np.ndarray, strength: float) -> np.ndarray:
        """OpenCV Non-Local Means fallback when ONNX model is absent."""
        h = max(1, int(strength * 10))
        return cv2.fastNlMeansDenoisingColored(image, None, h, h, 7, 21)

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.identifier,
            "name": self.name,
            "description": (
                "Reduces image noise while preserving fine details "
                "using NAFNet neural denoising."
            ),
            "category": "restoration",
            "version": "2.0.0",
            "credits": self.credit_cost,
            "icon": "denoise",
            "params": {
                "strength": {
                    "type": "float",
                    "default": 0.5,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.1,
                    "description": (
                        "Denoising strength — higher values remove more "
                        "noise but may soften fine details."
                    ),
                }
            },
        }