#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Primitive Component Loader

Dynamically loads primitive component definitions based on layout grounding results.
Only includes component prompts for primitives that are actually detected in the image.
"""

from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List, Set

# Primitive prompt files path
PRIMITIVES_PROMPT_DIR = Path(__file__).parent.parent.parent / "prompts" / "primitives"


def load_primitive_prompt(primitive_type: str) -> str:
    """
    Load primitive component definition from markdown file.

    Args:
        primitive_type: Component type name (e.g., "Text", "Icon", "Button")

    Returns:
        Component definition string from the markdown file, or empty string if not found
    """
    prompt_file = PRIMITIVES_PROMPT_DIR / f"{primitive_type.lower()}.md"
    if prompt_file.exists():
        return prompt_file.read_text(encoding="utf-8").strip()
    return ""


def extract_primitive_types_from_layout(layout_detections: List[Dict[str, Any]]) -> Set[str]:
    """
    Extract primitive component types from layout detection results.

    Filters out graph/chart types since they are handled separately by the graph pipeline.

    Args:
        layout_detections: List of layout detections with 'label' field

    Returns:
        Set of primitive component type names that were detected
    """
    # Graph/chart types that are handled separately
    graph_types = {
        "BarChart", "StackedBarChart", "LineChart", "PieChart",
        "RadarChart", "ProgressBar", "ProgressRing", "Sparkline"
    }

    # All supported primitive types
    primitive_types = {
        "Text", "Icon", "Button", "Image", "Checkbox",
        "MapImage", "AppLogo", "Divider", "Indicator",
        "Slider", "Switch", "Container"
    }

    detected_primitives = set()

    for detection in layout_detections:
        label = detection.get("label", "")

        # Include only if it's a primitive type and not a graph type
        if label in primitive_types and label not in graph_types:
            detected_primitives.add(label)

    return detected_primitives


def build_primitives_definitions(detected_primitives: Set[str]) -> str:
    """
    Build component definitions section by loading prompts for detected primitives.

    Args:
        detected_primitives: Set of primitive component types detected in the image

    Returns:
        Combined string with all component definitions, or empty string if none detected
    """
    if not detected_primitives:
        return ""

    # Always include Container definition as it's fundamental to layout
    types_to_load = detected_primitives.copy()
    types_to_load.add("Container")

    # Sort for consistent ordering
    sorted_types = sorted(types_to_load)

    definitions = []
    for primitive_type in sorted_types:
        prompt = load_primitive_prompt(primitive_type)
        if prompt:
            definitions.append(prompt)

    if not definitions:
        return ""

    # Join with double newline for separation
    return "\n\n".join(definitions)


def inject_primitives_to_prompt(base_prompt: str, detected_primitives: Set[str]) -> str:
    """
    Inject primitive component definitions into the base prompt.

    Args:
        base_prompt: Base prompt template with [PRIMITIVE_DEFINITIONS] placeholder
        detected_primitives: Set of detected primitive types

    Returns:
        Prompt with primitive definitions injected or placeholder removed
    """
    primitives_text = build_primitives_definitions(detected_primitives)

    if primitives_text:
        # Replace placeholder with actual definitions
        return base_prompt.replace("[PRIMITIVE_DEFINITIONS]", primitives_text)
    else:
        # Remove placeholder if no primitives detected
        return base_prompt.replace("[PRIMITIVE_DEFINITIONS]", "")
