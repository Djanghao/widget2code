"""Widget DSL generation module."""

from .single import (
    get_default_prompt,
    generate_widget,
    generate_widget_text,
    generate_widget_with_icons,
    generate_widget_with_graph,
    generate_widget_full,
)
from .batch import BatchGenerator, batch_generate

__all__ = [
    "get_default_prompt",
    "generate_widget",
    "generate_widget_text",
    "generate_widget_with_icons",
    "generate_widget_with_graph",
    "generate_widget_full",
    "BatchGenerator",
    "batch_generate",
]
