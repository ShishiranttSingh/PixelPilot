"""
Tile-based inference engine.
Splits large images into overlapping tiles, runs inference per tile,
and blends overlaps using a cosine weight mask to avoid seams.
"""

import numpy as np
from typing import Callable, Awaitable
from app.core.config import settings
from app.core.logging import logger


def _cosine_weight_mask(tile_size: int) -> np.ndarray:
    """
    Build a 2D cosine blending weight mask for a square tile.
    Values peak at the centre and taper to zero at edges.
    """
    ramp = np.hanning(tile_size).astype(np.float32)
    return np.outer(ramp, ramp)


async def run_tiled_inference(
    image: np.ndarray,
    infer_fn: Callable[[np.ndarray], Awaitable[np.ndarray]],
    scale: int = 1,
) -> np.ndarray:
    """
    Run infer_fn on overlapping tiles and reconstruct the full image.

    Args:
        image:    Input HWC float32 image normalised to [0, 1].
        infer_fn: Async callable that accepts a tile (HWC float32) and
                  returns the processed tile at output resolution.
        scale:    Integer scale factor applied by infer_fn (1 for
                  denoise/sharpen, 2 or 4 for upscaling).

    Returns:
        Reconstructed HWC float32 image at (H*scale, W*scale).
    """
    tile_size: int = settings.ai.TILING_SIZE
    overlap: int = settings.ai.TILING_OVERLAP
    stride: int = tile_size - overlap

    h, w, c = image.shape
    out_h = h * scale
    out_w = w * scale
    out_tile = tile_size * scale
    out_stride = stride * scale
    out_overlap = overlap * scale

    output = np.zeros((out_h, out_w, c), dtype=np.float32)
    weight = np.zeros((out_h, out_w, 1), dtype=np.float32)
    mask_2d = _cosine_weight_mask(out_tile)            # (out_tile, out_tile)
    mask = mask_2d[:, :, np.newaxis]                   # (out_tile, out_tile, 1)

    # Collect tile coordinates in input space
    ys = list(range(0, h - tile_size, stride)) + [max(0, h - tile_size)]
    xs = list(range(0, w - tile_size, stride)) + [max(0, w - tile_size)]
    # Remove duplicates while preserving order
    ys = list(dict.fromkeys(ys))
    xs = list(dict.fromkeys(xs))

    total = len(ys) * len(xs)
    logger.debug("tiling_start", tiles=total, scale=scale,
                 input_shape=image.shape, output_shape=(out_h, out_w, c))

    for y in ys:
        for x in xs:
            # --- Extract input tile (pad if near edge) ---
            tile_in = image[y: y + tile_size, x: x + tile_size]
            pad_h = tile_size - tile_in.shape[0]
            pad_w = tile_size - tile_in.shape[1]
            if pad_h > 0 or pad_w > 0:
                tile_in = np.pad(
                    tile_in,
                    ((0, pad_h), (0, pad_w), (0, 0)),
                    mode="reflect",
                )

            # --- Run inference ---
            tile_out = await infer_fn(tile_in)          # HWC float32

            # Trim padding in output space
            valid_h = (tile_size - pad_h) * scale
            valid_w = (tile_size - pad_w) * scale
            tile_out = tile_out[:valid_h, :valid_w]

            # Matching mask slice
            mask_slice = mask[:valid_h, :valid_w]

            # --- Accumulate weighted tile ---
            oy = y * scale
            ox = x * scale
            output[oy: oy + valid_h, ox: ox + valid_w] += tile_out * mask_slice
            weight[oy: oy + valid_h, ox: ox + valid_w] += mask_slice

    # Normalise by accumulated weights (safe division)
    weight = np.where(weight == 0, 1.0, weight)
    output /= weight

    logger.debug("tiling_complete", output_shape=output.shape)
    return output