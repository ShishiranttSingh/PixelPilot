"""
UpscalePlugin — Real-ESRGAN x2 / x4 ONNX inference with tiling.

Model is chosen automatically from the 'scale' param:
  scale=2  →  realesrgan_x2.onnx
  scale=4  →  realesrgan_x4.onnx
"""

import cv2
import numpy as np
from typing import Any, Dict

from app.plugins.interface import ImagePlugin
from app.ai.inference import InferenceManager
from app.ai.tiling import run_tiled_inference
from app.core.logging import logger

_MODEL_MAP: Dict[int, str] = {
    2: "realesrgan_x2",
    4: "realesrgan_x4",
}
_SUPPORTED_SCALES = frozenset(_MODEL_MAP)


class UpscalePlugin(ImagePlugin):
    """Upscale images 2× or 4× using Real-ESRGAN ONNX."""

    @property
    def identifier(self) -> str:
        return "upscale"

    @property
    def name(self) -> str:
        return "Real-ESRGAN Upscale"

    @property
    def credit_cost(self) -> int:
        return 5

    async def execute(self, image: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """
        Upscale image using Real-ESRGAN.

        Args:
            image:  HWC uint8 BGR image.
            params: scale (int, 2 or 4 — default 2).

        Returns:
            Upscaled HWC uint8 BGR image.
        """
        scale: int = int(params.get("scale", 2))
        if scale not in _SUPPORTED_SCALES:
            logger.warning(
                "unsupported_scale", scale=scale, fallback=2
            )
            scale = 2

        model_name = _MODEL_MAP[scale]

        if not InferenceManager.is_model_available(model_name):
            logger.warning(
                "realesrgan_model_unavailable",
                model=model_name,
                fallback="opencv_resize",
                # TODO: download realesrgan_x2.onnx / realesrgan_x4.onnx
                #       to settings.ai.MODELS_DIR
            )
            return self._run_opencv_fallback(image, scale)

        return await self._run_onnx(image, model_name, scale)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _run_onnx(
        self, image: np.ndarray, model_name: str, scale: int
    ) -> np.ndarray:
        """Run Real-ESRGAN via tiled inference at the requested scale."""
        img_f32 = image.astype(np.float32) / 255.0

        async def infer(tile: np.ndarray) -> np.ndarray:
            """Forward one tile; model outputs at (H*scale, W*scale)."""
            return InferenceManager.run_inference(model_name, tile)

        result_f32 = await run_tiled_inference(img_f32, infer, scale=scale)
        output = (result_f32.clip(0.0, 1.0) * 255.0).astype(np.uint8)

        logger.info(
            "upscale_complete",
            model=model_name,
            scale=scale,
            input_shape=image.shape,
            output_shape=output.shape,
        )
        return output

    @staticmethod
    def _run_opencv_fallback(image: np.ndarray, scale: int) -> np.ndarray:
        """Bicubic resize fallback when ONNX model weights are absent."""
        h, w = image.shape[:2]
        return cv2.resize(
            image, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC
        )

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.identifier,
            "name": self.name,
            "description": (
                "Upscales images 2× or 4× using Real-ESRGAN for "
                "superior detail reconstruction."
            ),
            "category": "upscaling",
            "version": "2.0.0",
            "credits": self.credit_cost,
            "icon": "upscale",
            "params": {
                "scale": {
                    "type": "int",
                    "default": 2,
                    "min": 2,
                    "max": 4,
                    "step": 2,
                    "description": (
                        "Upscaling factor — 2× or 4× "
                        "(4× requires more VRAM)."
                    ),
                }
            },
        }