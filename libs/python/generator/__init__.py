"""WidgetDSL Generator - AI-powered widget generation from images"""

from .config import GeneratorConfig
from .generation import (
    generate_widget_text,
    generate_widget_text_with_reference,
    generate_component,
    generate_component_from_image,
    generate_widget_full,
    generate_single_widget,
    BatchGenerator,
    batch_generate,
)

from . import perception
from . import utils

__all__ = [
    "GeneratorConfig",
    "generate_widget_text",
    "generate_widget_text_with_reference",
    "generate_component",
    "generate_component_from_image",
    "generate_widget_full",
    "generate_single_widget",
    "BatchGenerator",
    "batch_generate",
    "perception",
    "utils",
]
