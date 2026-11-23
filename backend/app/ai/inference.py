"""
ONNX Runtime inference manager.

Improvements over v1:
  - CUDAExecutionProvider configured with memory optimisations.
  - Sessions loaded once and reused (no repeated disk I/O).
  - np.ascontiguousarray used before every inference call to avoid
    implicit copies inside the ONNX Runtime C++ layer.
  - Temporary per-call arrays are not retained, allowing the GC /
    CUDA allocator to reclaim VRAM promptly.
"""

import os
import numpy as np
import onnxruntime as ort
from typing import Dict, List, Optional

from app.core.config import settings
from app.core.logging import logger


def _build_providers() -> List:
    """
    Return the provider list for ort.InferenceSession.

    CUDAExecutionProvider is configured with:
      - arena_extend_strategy=kSameAsRequested  : avoids over-allocation
      - gpu_mem_limit                           : caps VRAM per session
      - do_copy_in_default_stream=True          : serialises H2D/D2H copies
        so temporaries are freed before the next kernel launches.
    """
    if settings.ai.USE_GPU:
        cuda_opts = {
            "arena_extend_strategy": "kSameAsRequested",
            # 4 GB hard cap — adjust via env / config as needed
            "gpu_mem_limit": 4 * 1024 * 1024 * 1024,
            "do_copy_in_default_stream": True,
            "cudnn_conv_algo_search": "HEURISTIC",
        }
        return [("CUDAExecutionProvider", cuda_opts), "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]


class InferenceManager:
    """
    Singleton-style ONNX session cache.

    Sessions are loaded lazily on first use and kept alive for the
    lifetime of the process.  Worker processes each maintain their own
    cache; no cross-process sharing is required because ONNX Runtime
    sessions are not picklable.
    """

    _sessions: Dict[str, ort.InferenceSession] = {}

    @classmethod
    def get_session(cls, model_name: str) -> ort.InferenceSession:
        """
        Return a cached InferenceSession, loading from disk on first call.

        Args:
            model_name: Filename stem of the .onnx model
                        (e.g. 'realesrgan_x2').

        Raises:
            FileNotFoundError: When the model file is absent.
        """
        if model_name not in cls._sessions:
            model_path = os.path.join(
                settings.ai.MODELS_DIR, f"{model_name}.onnx"
            )
            if not os.path.exists(model_path):
                logger.error("model_not_found", path=model_path)
                raise FileNotFoundError(
                    f"Model '{model_name}' not found at {model_path}. "
                    "Download the ONNX weights and place them in "
                    f"{settings.ai.MODELS_DIR}."
                )

            providers = _build_providers()
            logger.info("loading_model", model=model_name, providers=providers)

            sess_opts = ort.SessionOptions()
            # Disable all graph optimisations that duplicate tensors
            sess_opts.graph_optimization_level = (
                ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            )
            # Single-threaded intra-op execution keeps GPU pipeline clean
            sess_opts.intra_op_num_threads = 1

            cls._sessions[model_name] = ort.InferenceSession(
                model_path, sess_options=sess_opts, providers=providers
            )
            logger.info("model_loaded", model=model_name)

        return cls._sessions[model_name]

    @classmethod
    def run_inference(cls, model_name: str, image_hwc: np.ndarray) -> np.ndarray:
        """
        Run a single forward pass and return the result as HWC float32.

        The caller is responsible for normalising pixel values to [0, 1]
        before calling this method.

        Args:
            model_name: Model identifier (stem of .onnx file).
            image_hwc:  Input image in HWC layout, dtype float32.

        Returns:
            Output image in HWC layout, dtype float32, range [0, 1].
        """
        session = cls.get_session(model_name)
        input_name: str = session.get_inputs()[0].name

        # --- HWC → NCHW, contiguous layout avoids an internal ORT copy ---
        nchw = np.ascontiguousarray(
            image_hwc.transpose(2, 0, 1)[np.newaxis], dtype=np.float32
        )

        # Run inference; ORT allocates output tensors internally
        raw_outputs = session.run(None, {input_name: nchw})

        # --- NCHW → HWC; squeeze batch dim ---
        result: np.ndarray = raw_outputs[0]
        if result.ndim == 4:
            result = result[0]                          # drop batch
        result = np.ascontiguousarray(result.transpose(1, 2, 0))

        # Explicitly delete the raw output list so CUDA can reclaim VRAM
        del raw_outputs
        return result

    @classmethod
    def is_model_available(cls, model_name: str) -> bool:
        """Return True if the .onnx file exists on disk."""
        path = os.path.join(settings.ai.MODELS_DIR, f"{model_name}.onnx")
        return os.path.exists(path)