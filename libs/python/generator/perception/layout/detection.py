#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Layout Detection Module
- Detects all UI elements in widget images (icons, text, buttons, etc.)
- Single vision-LLM call → parse → Qwen-style [0,1000] → pixel coords
- Post-process with post_process_pixel_detections
- Return: [{"bbox":[x1,y1,x2,y2], "label":"Icon", "description":"..."}, ...]
"""

from __future__ import annotations
import base64
import io
import json
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from ...providers import OpenAIProvider, ChatMessage
from ..icon.post_process import post_process_pixel_detections

DEFAULT_PROMPT = """
You are an expert mobile-UI understanding assistant. OUTPUT JSON ONLY. Return a single array of objects:
{"bbox": [x1, y1, x2, y2], "label": "<class>", "description": "<text>"}.
No extra text.

DETECTION PRINCIPLE: HIGH RECALL - detect ALL elements, even if uncertain. Better to over-detect than miss elements.

ELEMENT CLASSES (by visual structure, sizes vary widely):

BASIC ELEMENTS:
- Icon: SVG pictogram/symbol with simple vector shapes. Single-color or simple gradient. Any size (small ~16px to large ~48px+). MUST tightly include ALL strokes and anti-aliased edges.
- AppLogo: Square app logo with slightly rounded corners (~22% border-radius), solid background + centered letter/symbol. Any size. Distinguished from Icon by being app brand identifier.
- Text: Any readable text - labels, numbers, titles, descriptions. Any font size, any weight, single/multi-line. Detect ALL text.
- Image: Photo, illustration, or complex artwork with realistic imagery or detailed graphics.

INTERACTIVE CONTROLS:
- Button: Rounded rectangle with background fill (usually ~8px border-radius), may contain icon OR text OR both. Has padding. May have shadow/elevation. Detect both Button AND inner icon/text separately.
- Checkbox: CIRCULAR shape (border-radius = 50%), either (1) empty with colored border, or (2) filled solid with white checkmark inside. Any size.
- Switch: Horizontal pill shape with rounded ends + circular thumb inside that slides. Pill has colored (ON) or gray (OFF) background. Thumb is circle positioned left (OFF) or right (ON). Width usually ~2× height.
- Slider: Horizontal control = thin track bar + prominent circular thumb. Track has two colors: active (from start to thumb) and inactive (thumb to end). Thumb is much larger than track thickness (usually 5× track height).

VISUAL INDICATORS (EASILY MISSED - DETECT CAREFULLY):
- Divider: Very thin line (1-2px thick) separating sections, horizontal OR vertical. Can be SOLID or DASHED pattern. Usually light gray but any color. Spans container width/height. CRITICAL: Detect ALL dividers including faint/dashed ones.
- Indicator: Narrow vertical colored bar (2-8px width, extends vertically). Solid fill, acts as status marker or accent stripe. NOTE: May appear as STACKED INDICATORS - multiple short vertical bars in a column with small gaps between them (detect each bar individually).
- ProgressBar: Horizontal bar showing percentage completion. Structure: rounded rectangle track (background) containing filled portion (foreground). Track is full width, fill width = percentage. Both parts have rounded ends. Any height (thin ~12px to thick ~24px+).
- ProgressRing: Circular/ring progress indicator. Structure: circular stroke forming partial arc (gap = remaining %). Gray background circle + colored progress arc. May contain centered icon or text. Any diameter.
- Sparkline: Tiny trend line chart - simple connected line path, NO axes, NO grid, NO labels. Just a line (sometimes with gradient fill below). Very compact inline visualization.

CHART ELEMENTS (HAVE AXES AND LABELS):
- BarChart: Vertical or horizontal rectangular bars with gaps between them. Has coordinate axes, optional grid, axis labels. Bars represent categorical data. May be single-color or multi-color (grouped/stacked).
- LineChart: Connected line path(s) with data points. Has X/Y axes, optional grid, axis labels, line connecting sequential points. Shows continuous trends.
- PieChart: Circle divided into wedge-shaped slices radiating from center. Each slice different color, represents proportion. May have labels or legend.
- RadarChart: Polygon/spider web with 3+ axes radiating from center. Radial grid lines, axis labels at endpoints, polygon shape connecting data points.
- StackedBarChart: Like BarChart but each bar composed of multiple colored segments stacked together. Segments share aligned edges within each bar.

LAYOUT ELEMENT:
- Container: Background shape or panel grouping other elements. Rounded rectangles, cards, clickable areas, panels. CRITICAL: Always detect BOTH Container AND all inner elements separately.

DETECTION RULES (PRIORITIZE RECALL):
1. Detect ALL instances - if unsure, include it. Missing elements is worse than false positives.
2. Tight bounding boxes with integer coords (x1<x2, y1<y2), fully inside image.
3. Icon precision: Include ALL strokes and anti-aliased edges.
4. Nested detection: If Container/Button contains Icon/Text, detect ALL layers separately.
5. Divider emphasis: Detect EVERY divider line, including faint ones, dashed ones, vertical ones.
6. Indicator variants: Detect individual indicators even in stacked groups (multiple short bars in column).
7. Shape-based distinction:
   - Checkbox = CIRCULAR (border-radius 50%)
   - Switch = PILL + circular thumb inside
   - Slider = thin track + large circular thumb
   - ProgressBar = horizontal rounded bar with two-part structure (track + fill)
   - ProgressRing = circular arc stroke
8. Size is NOT a constraint - elements can be any size.
9. No padding around bboxes. Overlap only when visually overlapping.

DESCRIPTION FORMAT:
- Icon: brief what + color. Example: "heart icon (color: #FF3B30)"
- AppLogo: app name + color. Example: "Music app (color: #FC3C44)"
- Text: exact visible text + color. Example: "Temperature 72° (color: #FFFFFF)"
- Container: shape + contents. Example: "rounded card with weather info"
- Button: appearance + content. Example: "blue button with play icon"
- Divider: orientation + style. Example: "horizontal dashed divider"
- Indicator: color + context. Example: "red status indicator bar"
- Charts: type + brief features. Example: "vertical bar chart with 5 bars"
- Others: concise description (≤10 words).

OUTPUT EXAMPLE:
[
  {"bbox": [10,200,250,350], "label": "Container", "description": "rounded card background"},
  {"bbox": [25,220,65,260], "label": "AppLogo", "description": "Calendar app (color: #FF3B30)"},
  {"bbox": [75,230,230,248], "label": "Text", "description": "Today's Schedule (color: #000000)"},
  {"bbox": [25,270,230,320], "label": "BarChart", "description": "horizontal bar chart with 5 bars"},
  {"bbox": [240,225,245,340], "label": "Indicator", "description": "blue vertical status bar"},
  {"bbox": [240,228,245,255], "label": "Indicator", "description": "blue indicator segment"},
  {"bbox": [240,260,245,287], "label": "Indicator", "description": "blue indicator segment"},
  {"bbox": [240,292,245,319], "label": "Indicator", "description": "blue indicator segment"},
  {"bbox": [15,360,235,361], "label": "Divider", "description": "horizontal solid divider"},
  {"bbox": [15,400,40,440], "label": "Icon", "description": "bell icon (color: #007AFF)"},
  {"bbox": [50,410,200,425], "label": "ProgressBar", "description": "horizontal progress 70% filled"},
  {"bbox": [210,400,270,460], "label": "ProgressRing", "description": "circular progress ring 85%"},
  {"bbox": [280,420,380,428], "label": "Slider", "description": "horizontal slider at 60%"},
  {"bbox": [390,418,410,438], "label": "Checkbox", "description": "checked circular checkbox (color: #34C759)"},
  {"bbox": [420,414,471,445], "label": "Switch", "description": "switch ON state (color: #34C759)"}
]
""".strip()

def parse_layout_response(text: str) -> List[Dict[str, Any]]:
    """Parse VLM response and extract layout detections."""
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    fenced = re.match(r"^\s*```[a-zA-Z0-9_-]*\s*(.*?)\s*```\s*$", text, re.DOTALL)
    raw = fenced.group(1) if fenced else text
    start = raw.find("["); end = raw.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON array found in text")
    data = json.loads(raw[start:end+1])
    if not isinstance(data, list):
        raise ValueError("Top-level JSON must be a list")

    out: List[Dict[str, Any]] = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Item {i} is not an object/dict")
        # Support both new format (bbox) and legacy format (bbox_2d)
        bbox_key = "bbox" if "bbox" in item else "bbox_2d"
        if bbox_key not in item or "label" not in item:
            raise ValueError(f"Item {i} missing '{bbox_key}' or 'label'")
        bbox = item[bbox_key]
        if (not isinstance(bbox, list)) or len(bbox) != 4 or not all(isinstance(v, (int, float)) for v in bbox):
            raise ValueError(f"Item {i} has invalid '{bbox_key}' (must be 4 numbers)")
        label = item["label"]
        if not isinstance(label, str):
            raise ValueError(f"Item {i} has non-string 'label'")
        # Normalize to bbox_2d for internal processing
        result = {"bbox_2d": bbox, "label": label}
        # Preserve description if present
        if "description" in item:
            result["description"] = item["description"]
        out.append(result)
    return out

def get_image_size_from_bytes(image_bytes: bytes) -> Tuple[int, int]:
    """Extract image dimensions from bytes."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        w, h = img.size
    return int(w), int(h)

def _guess_mime_from_filename(filename: Optional[str]) -> str:
    """Guess MIME type from filename extension."""
    if not filename:
        return "image/png"
    name = filename.lower()
    if name.endswith(".jpg") or name.endswith(".jpeg"):
        return "image/jpeg"
    if name.endswith(".webp"):
        return "image/webp"
    if name.endswith(".gif"):
        return "image/gif"
    if name.endswith(".bmp"):
        return "image/bmp"
    if name.endswith(".tiff") or name.endswith(".tif"):
        return "image/tiff"
    return "image/png"

def prepare_image_content_from_bytes(image_bytes: bytes, filename: Optional[str]) -> Dict[str, Any]:
    """Prepare image content for VLM API."""
    mime = None
    try:
        with Image.open(io.BytesIO(image_bytes)) as im:
            fmt = (im.format or "").upper()
            if fmt == "JPEG":
                mime = "image/jpeg"
            elif fmt == "PNG":
                mime = "image/png"
            elif fmt == "WEBP":
                mime = "image/webp"
            elif fmt == "GIF":
                mime = "image/gif"
            elif fmt == "BMP":
                mime = "image/bmp"
            elif fmt in ("TIFF", "TIF"):
                mime = "image/tiff"
    except Exception:
        mime = None
    if not mime:
        mime = _guess_mime_from_filename(filename)

    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    return {"type": "image_url", "image_url": {"url": data_url}}

def _scale_qwen_to_pixels(
    items: List[Dict[str, Any]],
    img_w: int,
    img_h: int,
    clamp_to_image: bool = True,
) -> List[Dict[str, Any]]:
    """Convert Qwen [0,1000] coordinates to pixel coordinates."""
    dets: List[Dict[str, Any]] = []
    for it in items:
        rx1, ry1, rx2, ry2 = it["bbox_2d"]
        x1 = float(rx1) / 1000.0 * img_w
        y1 = float(ry1) / 1000.0 * img_h
        x2 = float(rx2) / 1000.0 * img_w
        y2 = float(ry2) / 1000.0 * img_h
        x1, x2 = sorted([x1, x2])
        y1, y2 = sorted([y1, y2])
        x1i, y1i, x2i, y2i = int(round(x1)), int(round(y1)), int(round(x2)), int(round(y2))

        if clamp_to_image:
            x1i = max(0, min(img_w - 1, x1i))
            y1i = max(0, min(img_h - 1, y1i))
            x2i = max(0, min(img_w - 1, x2i))
            y2i = max(0, min(img_h - 1, y2i))
            if x2i < x1i: x1i, x2i = x2i, x1i
            if y2i < y1i: y1i, y2i = y2i, y1i

        if (x2i - x1i) < 1 or (y2i - y1i) < 1:
            continue

        det = {
            "bbox": [x1i, y1i, x2i, y2i],
            "label": it.get("label", "unknown"),
        }
        # Preserve description if present
        if "description" in it:
            det["description"] = it["description"]
        dets.append(det)
    return dets

async def detect_layout(
    *,
    image_bytes: bytes,
    filename: Optional[str] = None,
    prompt: str = DEFAULT_PROMPT,
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model: str = "qwen3-vl-plus",
    temperature: float = 0.7,
    top_p: Optional[float] = None,
    max_tokens: int = 2000,
    timeout: int = 60,
    thinking: bool = False,
    stream: bool = False,
    stream_options: Optional[Dict[str, Any]] = None,
    clamp_to_image: bool = True,
    max_retries: int = 3,
    pp_margin_pct: float = 0.2,
    pp_min_area_ratio: float = 0.0005,
    pp_fallback_expand_pct: float = 0.15,
    image_id: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], int, int]:
    """
    Detect layout elements in a widget image.

    Args:
        image_bytes: Raw image bytes
        filename: Optional filename (for logging)
        prompt: Detection prompt (defaults to DEFAULT_PROMPT)
        provider: LLM provider
        api_key: API key
        base_url: API base URL
        model: Model name
        temperature: Sampling temperature
        top_p: Nucleus sampling parameter
        max_tokens: Maximum response tokens
        timeout: Request timeout in seconds
        thinking: Enable thinking mode
        stream: Enable streaming
        stream_options: Stream options
        clamp_to_image: Clamp boxes to image bounds
        max_retries: Maximum retry attempts
        pp_margin_pct: Post-process margin percentage
        pp_min_area_ratio: Minimum area ratio for filtering
        pp_fallback_expand_pct: Fallback expansion percentage
        image_id: Optional image identifier (for logging)

    Returns:
        Tuple of (parsed_items, pixel_dets_pre, pixel_dets_post, img_w, img_h):
            - parsed_items: Raw detections (bbox_2d in [0,1000])
            - pixel_dets_pre: Pixel coordinates (pre-processing)
            - pixel_dets_post: Post-processed detections (final)
            - img_w: Image width
            - img_h: Image height
    """
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be raw bytes")

    # Extract image_id from filename if not provided
    if not image_id and filename:
        from pathlib import Path
        image_id = Path(filename).stem

    # Import logging utilities
    from datetime import datetime
    try:
        from ...utils.logger import log_to_file
        has_logger = True
    except:
        has_logger = False

    overall_start = time.time()

    if has_logger and image_id:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] Started")

    try:
        from ..icon.image_utils import preprocess_image_bytes_if_small
    except Exception:
        preprocess_image_bytes_if_small = None  # type: ignore
    if preprocess_image_bytes_if_small is not None:
        try:
            image_bytes, (img_w, img_h), _ = preprocess_image_bytes_if_small(image_bytes, min_target_edge=1000)
        except Exception:
            img_w, img_h = get_image_size_from_bytes(image_bytes)
    else:
        img_w, img_h = get_image_size_from_bytes(image_bytes)

    image_content = prepare_image_content_from_bytes(image_bytes, filename)
    messages = [ChatMessage(role="user",
                            content=[{"type": "text", "text": prompt}, image_content])]

    llm_kwargs: Dict[str, Any] = dict(
        model=model,
        api_key=api_key if api_key else "",
        base_url=base_url if base_url else "https://dashscope.aliyuncs.com/compatible-mode/v1",
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        system_prompt="You are a screen-to-code expert. Detect bounding boxes for input widget image.",
    )
    if top_p is not None:
        llm_kwargs["top_p"] = top_p
    if thinking:
        llm_kwargs["thinking"] = True

    vision_llm = OpenAIProvider(**llm_kwargs)
    last_err = None
    parsed_items: List[Dict[str, Any]] = []

    if has_logger and image_id:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] VLM API call started (model={model})")

    vlm_start = time.time()

    for attempt in range(max_retries + 1):
        try:
            resp = await vision_llm.async_chat(messages)
            content_text = getattr(resp, "content", None) if not isinstance(resp, dict) else resp.get("content", "")

            parsed_items = parse_layout_response(content_text) if content_text else []
            break
        except Exception as e:
            last_err = e
            if attempt >= max_retries:
                parsed_items = []

    vlm_duration = time.time() - vlm_start

    if has_logger and image_id:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] VLM API call completed in {vlm_duration:.2f}s")
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] Parsing response...")
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] Raw detections: {len(parsed_items)}")

    pixel_dets_pre = _scale_qwen_to_pixels(
        items=parsed_items,
        img_w=img_w,
        img_h=img_h,
        clamp_to_image=clamp_to_image,
    )

    pixel_dets_post = post_process_pixel_detections(
        detections=pixel_dets_pre,
        image_bytes=image_bytes,
        margin_pct=pp_margin_pct,
        min_area_ratio=pp_min_area_ratio,
        fallback_expand_pct=pp_fallback_expand_pct,
        clamp_to_image=True,
    )

    total_detections = len(pixel_dets_post)
    overall_duration = time.time() - overall_start

    if has_logger and image_id:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] Post-processed detections: {total_detections}")
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Layout Detection] Completed in {overall_duration:.2f}s")

    return parsed_items, pixel_dets_pre, pixel_dets_post, img_w, img_h


__all__ = [
    "detect_layout",
    "DEFAULT_PROMPT",
    "parse_layout_response",
]
