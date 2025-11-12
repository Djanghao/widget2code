#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Layout Utilities
- Filter and format layout detection results
"""

from typing import Dict, List


def get_icons_from_layout(layout_detections: List[Dict]) -> List[Dict]:
    """
    Filter icon elements from layout detections.

    Args:
        layout_detections: List of detection dictionaries

    Returns:
        List of icon detections only
    """
    return [
        d for d in layout_detections
        if d.get("label", "").lower() == "icon"
    ]


def format_layout_for_prompt(
    detections: List[Dict],
    img_width: int,
    img_height: int
) -> str:
    """
    Format layout detection results for prompt injection.

    Args:
        detections: Post-processed detection results
        img_width: Image width in pixels
        img_height: Image height in pixels

    Returns:
        Formatted text for prompt injection

    Example output:
        ## Detected UI Elements
        Total: 23 elements detected (Image size: 1000x1000)

        ### Elements by Type:
        - Icon: 8
        - Text: 12
        - Button: 3

        ### Complete Element List:
        1. Icon [10, 20, 60, 70] - "bell icon (color: #FFFFFF)"
        2. Text [80, 25, 200, 60] - "Settings (color: #000000)"
        3. Button [70, 15, 210, 75] - "rectangular button with icon and text"
        ...
    """
    # Count elements by label
    label_counts: Dict[str, int] = {}
    for det in detections:
        label = det.get('label', 'unknown')
        label_counts[label] = label_counts.get(label, 0) + 1

    # Build formatted text
    lines = [
        "## Detected UI Elements",
        f"Total: {len(detections)} elements detected (Image size: {img_width}x{img_height})",
        "",
        "### Elements by Type:",
    ]

    # Sort by count (descending) then by label name
    for label, count in sorted(label_counts.items(), key=lambda x: (-x[1], x[0])):
        lines.append(f"- {label}: {count}")

    lines.append("")
    lines.append("### Complete Element List:")

    # Add widget boundary as reference (normalized coordinates [0,1000])
    aspect_ratio = round(img_width / img_height, 3) if img_height > 0 else 1.0
    lines.append(f"0. Widget [0, 0, 1000, 1000] - \"entire widget boundary (aspect ratio: {aspect_ratio})\"")

    # List all detections with details
    for idx, det in enumerate(detections, 1):
        bbox = det.get('bbox', [])
        label = det.get('label', 'unknown')
        desc = det.get('description', '')

        # Format bbox
        bbox_str = f"[{', '.join(map(str, bbox))}]" if bbox else "[]"

        # Build line
        if desc:
            lines.append(f"{idx}. {label} {bbox_str} - \"{desc}\"")
        else:
            lines.append(f"{idx}. {label} {bbox_str}")

    # Add instruction to use these components in DSL generation
    lines.append("")
    lines.append("### DSL Generation Requirement:")
    lines.append("When generating the WidgetDSL, you MUST use the detected elements above as components in your output. Each detected element should correspond to a component in the DSL structure (Icon → Icon component, Text → Text component, Button → Button component, etc.). Ensure all detected elements are represented in the final widget structure.")

    return '\n'.join(lines)


__all__ = [
    "get_icons_from_layout",
    "format_layout_for_prompt",
]
