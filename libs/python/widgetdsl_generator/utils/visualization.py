# -----------------------------------------------------------------------------
# File: visualization.py
# Description: Visualization utilities for batch generation
# Author: Houston Zhang
# Date: 2025-11-01
# -----------------------------------------------------------------------------

from PIL import Image, ImageDraw
import io
from pathlib import Path
from typing import List, Dict
import shutil


BBOX_COLORS = {
    'icon': '#FF3B30',
    'text': '#34C759',
    'graph': '#007AFF',
    'button': '#FF9500',
    'default': '#8E8E93'
}

BBOX_WIDTHS = {
    'icon': 4,
    'text': 2,
    'graph': 2,
    'button': 2,
    'default': 2
}


def draw_grounding_visualization(
    image_bytes: bytes,
    detections: List[Dict],
    output_format: str = 'PNG'
) -> bytes:
    """
    Draw grounding detection boxes on image

    Args:
        image_bytes: Original image bytes
        detections: List of detections, each contains bbox and label
            e.g. [{"bbox": [x1, y1, x2, y2], "label": "icon"}]
        output_format: Output format, 'PNG' or 'JPEG'

    Returns:
        Image bytes with bounding boxes drawn
    """
    img = Image.open(io.BytesIO(image_bytes))
    draw = ImageDraw.Draw(img, 'RGBA')

    grouped = {}
    for det in detections:
        label = det.get('label', 'default')
        if label not in grouped:
            grouped[label] = []
        grouped[label].append(det)

    draw_order = ['text', 'graph', 'button', 'default', 'icon']

    for label in draw_order:
        if label not in grouped:
            continue

        color = BBOX_COLORS.get(label, BBOX_COLORS['default'])
        width = BBOX_WIDTHS.get(label, BBOX_WIDTHS['default'])

        for det in grouped[label]:
            bbox = det.get('bbox', [])
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox

            draw.rectangle(
                [x1, y1, x2, y2],
                outline=color,
                width=width
            )

            if label == 'icon':
                rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
                rgba = rgb + (32,)
                draw.rectangle(
                    [x1, y1, x2, y2],
                    fill=rgba
                )

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

    icon_dir = output_dir / f"icon_{icon_index}"
    icon_dir.mkdir(parents=True, exist_ok=True)

    render_script = Path(__file__).parents[4] / "libs" / "packages" / "icons" / "src" / "render-icon.js"

    if not render_script.exists():
        return

    for rank, result in enumerate(retrieval_results[:top_n], start=1):
        try:
            component_id = result.get('component_id', '')
            icon_name = result.get('name', '')

            if not component_id or not icon_name:
                continue

            src_svg = result.get('src_svg', '')
            if src_svg:
                library = Path(src_svg).parent.name
            else:
                continue

            if library == 'sf':
                component_name = 'Icon' + ''.join(word.capitalize() for word in icon_name.split('.'))
            else:
                component_name = library.capitalize() + icon_name.replace('-', ' ').title().replace(' ', '')

            result_process = subprocess.run(
                ['node', str(render_script), library, component_name],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result_process.returncode == 0 and result_process.stdout:
                svg_content = result_process.stdout

                dest_filename = f"{rank}_{library}-{icon_name}.svg"
                dest_path = icon_dir / dest_filename

                with open(dest_path, 'w') as f:
                    f.write(svg_content)

        except Exception:
            continue
