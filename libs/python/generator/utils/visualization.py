# -----------------------------------------------------------------------------
# File: visualization.py
# Description: Visualization utilities for batch generation
# Author: Houston Zhang
# Date: 2025-11-01
# -----------------------------------------------------------------------------

from PIL import Image, ImageDraw, ImageFont
import io
from pathlib import Path
from typing import List, Dict
import shutil


BBOX_COLORS = {
    'icon': '#FF3B30',
    'text': '#34C759',
    'graph': '#007AFF',
    'button': '#FF9500',
    'image': '#AF52DE',
    'default': '#8E8E93'
}

BBOX_WIDTHS = {
    'icon': 3,
    'text': 2,
    'graph': 3,
    'button': 2,
    'image': 3,
    'default': 2
}

# Solid line for icon and graph, dashed for others
BBOX_STYLES = {
    'icon': 'solid',
    'graph': 'solid',
    'image': 'solid',
    'text': 'dashed',
    'button': 'dashed',
    'default': 'dashed'
}


def _draw_dashed_rectangle(draw, bbox, color, width, dash_length=8):
    """Draw a dashed rectangle"""
    x1, y1, x2, y2 = bbox

    # Top edge
    for x in range(int(x1), int(x2), dash_length * 2):
        draw.line([(x, y1), (min(x + dash_length, x2), y1)], fill=color, width=width)

    # Right edge
    for y in range(int(y1), int(y2), dash_length * 2):
        draw.line([(x2, y), (x2, min(y + dash_length, y2))], fill=color, width=width)

    # Bottom edge
    for x in range(int(x1), int(x2), dash_length * 2):
        draw.line([(x, y2), (min(x + dash_length, x2), y2)], fill=color, width=width)

    # Left edge
    for y in range(int(y1), int(y2), dash_length * 2):
        draw.line([(x1, y), (x1, min(y + dash_length, y2))], fill=color, width=width)


def _draw_legend(draw, img_width, img_height, labels_used):
    """Draw a semi-transparent legend in the corner"""
    if not labels_used:
        return

    padding = 12
    line_height = 24
    box_size = 16
    gap = 8
    text_offset = box_size + gap

    legend_labels = sorted(labels_used)
    legend_height = padding * 2 + len(legend_labels) * line_height
    legend_width = 140

    # Position in top-right corner
    legend_x = img_width - legend_width - 20
    legend_y = 20

    # Draw semi-transparent background
    overlay = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rounded_rectangle(
        [legend_x, legend_y, legend_x + legend_width, legend_y + legend_height],
        radius=8,
        fill=(255, 255, 255, 220)
    )

    # Draw legend items
    for i, label in enumerate(legend_labels):
        y = legend_y + padding + i * line_height
        color = BBOX_COLORS.get(label, BBOX_COLORS['default'])
        rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
        style = BBOX_STYLES.get(label, 'dashed')

        # Draw color box
        box_x = legend_x + padding
        box_y = y + 4

        if style == 'solid':
            overlay_draw.rectangle(
                [box_x, box_y, box_x + box_size, box_y + box_size],
                outline=rgb,
                width=2
            )
        else:
            # Draw dashed box in legend
            _draw_dashed_rectangle(overlay_draw,
                [box_x, box_y, box_x + box_size, box_y + box_size],
                rgb, 2, 4)

        # Draw label text
        overlay_draw.text(
            (box_x + text_offset, y + 2),
            label,
            fill=(0, 0, 0, 255)
        )

    return overlay


def draw_grounding_visualization(
    image_bytes: bytes,
    detections: List[Dict],
    output_format: str = 'PNG'
) -> bytes:
    """
    Draw grounding detection boxes on image with legend

    Args:
        image_bytes: Original image bytes
        detections: List of detections, each contains bbox and label
            e.g. [{"bbox": [x1, y1, x2, y2], "label": "icon"}]
        output_format: Output format, 'PNG' or 'JPEG'

    Returns:
        Image bytes with bounding boxes and legend drawn
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')
    draw = ImageDraw.Draw(img, 'RGBA')

    grouped = {}
    labels_used = set()
    for det in detections:
        # Normalize label to lowercase for consistent lookup
        label = det.get('label', 'default').lower()
        labels_used.add(label)
        if label not in grouped:
            grouped[label] = []
        grouped[label].append(det)

    # Draw order: dashed elements first, then solid (so icon/graph are on top)
    # Separate labels by style for drawing order
    solid_labels = [lbl for lbl in grouped.keys() if BBOX_STYLES.get(lbl, 'dashed') == 'solid']
    dashed_labels = [lbl for lbl in grouped.keys() if BBOX_STYLES.get(lbl, 'dashed') == 'dashed']

    # Draw dashed first, then solid (so solid appears on top)
    all_labels = dashed_labels + solid_labels

    for label in all_labels:
        color = BBOX_COLORS.get(label, BBOX_COLORS['default'])
        width = BBOX_WIDTHS.get(label, BBOX_WIDTHS['default'])
        style = BBOX_STYLES.get(label, 'dashed')
        rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))

        for det in grouped[label]:
            bbox = det.get('bbox', [])
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox

            if style == 'solid':
                draw.rectangle(
                    [x1, y1, x2, y2],
                    outline=rgb,
                    width=width
                )
            else:
                _draw_dashed_rectangle(draw, [x1, y1, x2, y2], rgb, width)

    # Draw legend
    legend_overlay = _draw_legend(draw, img.width, img.height, labels_used)
    if legend_overlay:
        img = Image.alpha_composite(img, legend_overlay)

    # Convert back to RGB for JPEG or if needed
    if output_format.upper() == 'JPEG':
        img = img.convert('RGB')

    output = io.BytesIO()
    img.save(output, format=output_format)
    return output.getvalue()


def crop_icon_region(
    image_bytes: bytes,
    bbox: List[float]
) -> bytes:
    """
    Crop icon region from image

    Args:
        image_bytes: Original image bytes
        bbox: [x1, y1, x2, y2]

    Returns:
        Cropped image bytes
    """
    img = Image.open(io.BytesIO(image_bytes))
    x1, y1, x2, y2 = [int(v) for v in bbox]

    cropped = img.crop((x1, y1, x2, y2))

    output = io.BytesIO()
    cropped.save(output, format='PNG')
    return output.getvalue()


def save_retrieval_svgs(
    retrieval_results: List[Dict],
    icon_index: int,
    output_dir: Path,
    svg_source_dirs: List[Path],
    top_n: int = 10
):
    """
    Save retrieval result SVG files to specified folder

    Dynamically render React icon components to SVG by calling Node.js script

    Args:
        retrieval_results: Retrieval results (topCandidates)
            e.g. [{"name": "plus", "component_id": "Icon.Plus", "rank": 1, "score_final": 0.89}]
        icon_index: Icon index
        output_dir: Output directory (images/4_retrieval/)
        svg_source_dirs: SVG source directories (unused, kept for compatibility)
        top_n: Save top N results
    """
    import subprocess
    import os

    icon_dir = output_dir / f"icon-{icon_index + 1}"
    icon_dir.mkdir(parents=True, exist_ok=True)

    render_script = Path(__file__).parents[4] / "libs" / "js" / "icons" / "src" / "render-icon.js"

    if not render_script.exists():
        return

    for rank, result in enumerate(retrieval_results[:top_n], start=1):
        try:
            component_id = result.get('component_id', '')
            if not component_id or ':' not in component_id:
                continue

            library, component_name = component_id.split(':', 1)

            result_process = subprocess.run(
                ['node', str(render_script), library, component_name],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result_process.returncode == 0 and result_process.stdout:
                svg_content = result_process.stdout
                dest_filename = f"{rank}-{component_id}.svg"
                dest_path = icon_dir / dest_filename

                with open(dest_path, 'w') as f:
                    f.write(svg_content)

        except Exception:
            continue
