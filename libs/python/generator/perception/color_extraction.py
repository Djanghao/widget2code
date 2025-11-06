"""
Color detection and extraction for widget images.

This module provides functionality to detect dominant colors in widget images
and format them for injection into the widget generation prompt.
"""

from pathlib import Path
from typing import List, Tuple
import tempfile
import os

from .color.color_picker import top_colors_kmeans


def detect_and_process_colors(
    image_bytes: bytes,
    filename: str,
    n_colors: int = 10,
    k_clusters: int = 8,
) -> List[Tuple[str, float]]:
    """
    Detect dominant colors in the image using k-means clustering.

    Args:
        image_bytes: Raw image bytes
        filename: Original filename (used for debugging)
        n_colors: Number of top colors to return (default: 10)
        k_clusters: Number of k-means clusters (default: 8)

    Returns:
        List of (hex_color, percentage) tuples, sorted by prominence
        Example: [("#191C1A", 53.83), ("#232926", 38.84), ...]
    """
    # Write bytes to temporary file for color_picker to process
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
        temp_file.write(image_bytes)
        temp_file_path = temp_file.name

    try:
        colors = top_colors_kmeans(
            image_path=temp_file_path,
            k=k_clusters,
            n=n_colors,
            max_pixels=200000,
            attempts=3
        )
        return colors
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


def format_color_injection(colors: List[Tuple[str, float]]) -> str:
    """
    Format color data for prompt injection.

    Args:
        colors: List of (hex_color, percentage) tuples

    Returns:
        Formatted markdown string with color palette information
    """
    if not colors:
        return "**No dominant colors detected in the image.**"

    lines = ["## Colors to Choose By Percentage"]

    for hex_color, percentage in colors:
        lines.append(f"{hex_color} — {percentage:.2f}%")

    return "\n".join(lines)


def inject_colors_to_prompt(base_prompt: str, colors: List[Tuple[str, float]]) -> str:
    """
    Inject color data into the base prompt.

    Looks for [COLOR_PALETTE] placeholder in the prompt. If found, replaces it
    with formatted color information. If not found, inserts before the Graph section.
    If no colors are detected, removes the color section entirely.

    Args:
        base_prompt: The base prompt template
        colors: List of (hex_color, percentage) tuples

    Returns:
        Modified prompt with color information injected
    """
    if not colors:
        # Remove color section if no colors detected
        import re
        pattern = r'###\s+Color Palette\s*\n\s*\[COLOR_PALETTE\]\s*\n*'
        if re.search(pattern, base_prompt):
            return re.sub(pattern, '', base_prompt)
        return base_prompt

    color_text = format_color_injection(colors)

    if "[COLOR_PALETTE]" in base_prompt:
        # Replace placeholder with color data
        return base_prompt.replace("[COLOR_PALETTE]", color_text)
    else:
        # Insert before Text section as fallback (colors should come before components that use them)
        if "### Text" in base_prompt:
            return base_prompt.replace("### Text", f"### Color Palette\n{color_text}\n\n### Text")
        else:
            # If Text section not found, append at the end
            return f"{base_prompt}\n\n### Color Palette\n{color_text}"
