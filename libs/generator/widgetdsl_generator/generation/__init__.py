"""Generation module for widget DSL and dynamic components."""

from .component import (
    generate_component,
    generate_component_from_image,
)

from .widget import (
    get_default_prompt,
    generate_widget,
    generate_widget_text,
    generate_widget_with_icons,
    generate_widget_with_graph,
    generate_widget_full,
)

__all__ = [
    "generate_component",
    "generate_component_from_image",
    "get_default_prompt",
    "generate_widget",
    "generate_widget_text",
    "generate_widget_with_icons",
    "generate_widget_with_graph",
    "generate_widget_full",
]
