"""WidgetDSL Generator - AI-powered widget generation from images"""

__version__ = "0.3.0"

from .config import GeneratorConfig
from .generator import (
    get_default_prompt,
    generate_widget,
    generate_widget_text,
    generate_component,
    generate_component_from_image,
    generate_widget_with_icons,
    generate_widget_with_graph,
    generate_widget_full,
)

from . import perception
from . import services
from . import utils

__all__ = [
    "GeneratorConfig",
    "get_default_prompt",
    "generate_widget",
    "generate_widget_text",
    "generate_component",
    "generate_component_from_image",
    "generate_widget_with_icons",
    "generate_widget_with_graph",
    "generate_widget_full",
    "perception",
    "services",
    "utils",
]
