"""Generation module for widget DSL and dynamic components."""

from .component import (
    generate_component,
    generate_component_from_image,
)

from .widget import (
    get_default_prompt,
    generate_widget_full,
    generate_single_widget,
    BatchGenerator,
    batch_generate,
)

__all__ = [
    "generate_component",
    "generate_component_from_image",
    "get_default_prompt",
    "generate_widget_full",
    "generate_single_widget",
    "BatchGenerator",
    "batch_generate",
]
