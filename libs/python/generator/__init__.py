"""WidgetDSL Generator - AI-powered widget generation from images"""

from .config import GeneratorConfig
from .generation import (
    get_default_prompt,
    generate_widget,
    generate_widget_text,
    generate_component,
    generate_component_from_image,
    generate_widget_with_icons,
    generate_widget_full,
    BatchGenerator,
    batch_generate,
)

from . import perception
from . import utils

__all__ = [
    "GeneratorConfig",
    "get_default_prompt",
    "generate_widget",
    "generate_widget_text",
    "generate_component",
    "generate_component_from_image",
    "generate_widget_with_icons",
    "generate_widget_full",
    "BatchGenerator",
    "batch_generate",
    "perception",
    "utils",
]
