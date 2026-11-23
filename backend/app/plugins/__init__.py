from app.plugins.registry import registry
from app.plugins.upscale_plugin import UpscalePlugin
from app.plugins.denoise_plugin import DenoisePlugin
from app.plugins.sharpen_plugin import SharpenPlugin

# Explicit registration of production plugins
registry.register(UpscalePlugin())
registry.register(DenoisePlugin())
registry.register(SharpenPlugin())

__all__ = ["registry"]