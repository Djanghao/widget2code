#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Layout Detection Module

This module handles detection of all UI elements in widget images.
It provides:
- Layout detection (all element types: Icon, Text, Button, etc.)
- Filtering utilities (extract icons, text, etc.)
- Formatting utilities (convert to prompt text)
"""

from .detection import detect_layout, DEFAULT_PROMPT, parse_layout_response
from .utils import get_icons_from_layout, format_layout_for_prompt

__all__ = [
    "detect_layout",
    "get_icons_from_layout",
    "format_layout_for_prompt",
    "DEFAULT_PROMPT",
    "parse_layout_response",
]
