"""Widget DSL generation module."""

from .single import (
    generate_widget_text,
    generate_widget_text_with_reference,
    generate_widget_full,
    generate_single_widget,
)
from .batch import BatchGenerator, batch_generate

__all__ = [
    "generate_widget_text",
    "generate_widget_text_with_reference",
    "generate_widget_full",
    "generate_single_widget",
    "BatchGenerator",
    "batch_generate",
]
