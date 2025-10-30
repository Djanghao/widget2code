"""Generation module for widget DSL."""

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

__all__ = [
    "get_default_prompt",
    "generate_widget",
    "generate_widget_text",
    "generate_component",
    "generate_component_from_image",
    "generate_widget_with_icons",
    "generate_widget_with_graph",
    "generate_widget_full",
]
