#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vision_grounding_single_llm_memory.py (no-COCO)
- Single image in (bytes)
- Single vision-LLM call → parse → Qwen-style [0,1000] → pixel coords
- Post-process with post_process_pixel_detections
- Return: [{"bbox":[x1,y1,x2,y2], "label":"icon"}, ...]
- No filesystem I/O, no COCO conversion
"""

from __future__ import annotations
import base64
import io
import json
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from provider_hub import LLM, ChatMessage
from post_process import post_process_pixel_detections

DEFAULT_PROMPT = """
You are an expert mobile-UI understanding assistant. OUTPUT JSON ONLY. Return a single JSON array. No extra text.
INPUT
- image: Screenshot of a mobile dashboard with widgets.
KEY CONSTRAINTS
- Icon boxes must tightly include all visible strokes, including anti-aliased edge pixels; DO NOT CROP any stroke.
- **If an icon appears on a solid chip/button/FAB, annotate ONLY THE INNER PICTOGRAM as icon; do not annotate the outer container.**
- Process each image INDEPENDENTLY; do not use cross-image context.
GOAL
- Identify each widget's elements and return precise bounding boxes, assigning each detected region to exactly one class:
    1. "text"
    2. "icon"
    3. "progress_bar" (circular/linear progress rings/bars)
    4. "divider" (separators/lines/pipes)
    5. "avatar"
    6. "swipe_handle"
    7. "clock"
    8. "image" (photos/illustrations; large visual content not a simple pictogram)
    9. "graph" (sparklines, charts, heatmaps)
DEFINITIONS
- icon: small pictograms (arrows, gear, bell, share, chevrons, stock arrows, weather glyphs, etc.). Simple glyph-style logos count as icon. 
- text: readable words/numbers. Only group close, same-style text into one box.
- progress_bar: Label "progress_bar" only if BOTH are visible: a background track and a partial filled arc.
- divider: horizontal or vertical separators (≈1-3 px) or thin bars; each divider is a separate tight box.
- avatar: circular user/profile images (faces/initials). Square rounded photos → prefer image.
- swipe_handle: grabbers/handles (e.g., bottom pill), tight on the handle only.
- clock: analog face (one box).
- image: photos/illustrations; if text overlays an image, annotate only the image.
- graph: bounded plotting areas (lines/bars/pies/scatter/heatmaps/gauges).
SPECIAL RULES
- Neatly arranged components: For rows/columns of visually similar items at a common alignment (e.g., a row of icons), PREFER using the same category consistently for all items in that row/column IF they are ACTUALLY SIMILAR.
- When a progress ring/bar or icon contains text inside it, annotate BOTH:
    * the full ring/bar as "progress_bar" (include track + filled segment) or icon as "icon", and each distinct inner text with "text".
    * The inner boxes are separate from the "progress_bar" or "icon" box; overlap is allowed.
- For dividers:
    * Always annotate thin vertical lead bars that appear at the start of a line (e.g., a blue | before the title) as "divider" with a tight bounding box separate from content after it.
    * Always annotate the horizontal line BETWEEN two row/list items as "divider" with a tight bounding box. Typical thickness is 1-3 px.
    * Do not merge these divider boxes with adjacent "text" or "container" boxes; each divider is its own box.
- Maps: base map is image. Only annotate extra UI on top (chips, pins, zoom, search).
- Rows/columns of similar pictograms: Do not group multiple icons; annotate each pictogram separately, label each as an individual icon.
- Bounding box rules (integer pixels; x1<x2, y1<y2; fully inside image)
- Boxes MUST BE TIGHT and PRECISE.
- Prefer multiple small boxes over one large covering box.
- No overlaps unless elements visibly overlap.
- Do not annotate background or empty padding.
STRICT OUTPUT (JSON only)
[
  {"bbox_2d": [x1, y1, x2, y2], "label": "<class>"},
  {"bbox_2d": [x1, y1, x2, y2], "label": "<class>"}
]
VALIDATION
1. Integer coordinates; each bbox satisfies x1<x2 and y1<y2; fully inside image.
2. Icon precision checks:
    a. No icon box contains chip/button fill or padding; only the glyph strokes/shape.
    b. For icons on solid shapes, only the icon is annotated (no outer container).
3. Text grouping respected (spatially close + same style only).
4. progress_bar/graph cover entire tracks/axes.
5. For images with overlaid text: only image is annotated.
6. For maps: only extra UI is annotated, not base map content.
""".strip()

def parse_grounding_response(text: str) -> List[Dict[str, Any]]:
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
        if "bbox_2d" not in item or "label" not in item:
            raise ValueError(f"Item {i} missing 'bbox_2d' or 'label'")
        bbox = item["bbox_2d"]
        if (not isinstance(bbox, list)) or len(bbox) != 4 or not all(isinstance(v, (int, float)) for v in bbox):
            raise ValueError(f"Item {i} has invalid 'bbox_2d' (must be 4 numbers)")
        label = item["label"]
        if not isinstance(label, str):
            raise ValueError(f"Item {i} has non-string 'label'")
        out.append({"bbox_2d": bbox, "label": label})
    return out

def get_image_size_from_bytes(image_bytes: bytes) -> Tuple[int, int]:
    with Image.open(io.BytesIO(image_bytes)) as img:
        w, h = img.size
    return int(w), int(h)

def _guess_mime_from_filename(filename: Optional[str]) -> str:
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

# Qwen [0,1000] → pixel detections
def _scale_qwen_to_pixels(
    items: List[Dict[str, Any]],
    img_w: int,
    img_h: int,
    clamp_to_image: bool = True,
) -> List[Dict[str, Any]]:
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

        dets.append({
            "bbox": [x1i, y1i, x2i, y2i],
            "label": it.get("label", "icon"),
        })
    return dets

# public API
__all__ = [
    "ground_single_image_with_stages",
]


def ground_single_image_with_stages(
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
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], int, int]:
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be raw bytes")

    try:
        import sys, pathlib
        here = pathlib.Path(__file__).resolve()
        icon_dir = here.parent
        if str(icon_dir) not in sys.path:
            sys.path.insert(0, str(icon_dir))
        from image_utils import preprocess_image_bytes_if_small  # type: ignore
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
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        system_prompt="You are a screen-to-code expert. Detect bounding boxes for input widget image.",
    )
    if top_p is not None:
        llm_kwargs["top_p"] = top_p
    if thinking:
        llm_kwargs["thinking"] = True
    if provider:
        llm_kwargs["provider"] = provider
    if api_key:
        llm_kwargs["api_key"] = api_key
    if base_url:
        llm_kwargs["base_url"] = base_url
    if stream:
        llm_kwargs["stream"] = True
        if stream_options:
            llm_kwargs["stream_options"] = stream_options

    vision_llm = LLM(**llm_kwargs)
    last_err = None
    parsed_items: List[Dict[str, Any]] = []
    for attempt in range(max_retries + 1):
        try:
            if stream:
                joined: List[str] = []
                for chunk in vision_llm.chat(messages):
                    piece = getattr(chunk, "content", None)
                    if piece is None and isinstance(chunk, dict):
                        piece = chunk.get("content")
                    if piece:
                        joined.append(piece)
                content_text = "".join(joined) if joined else ""
            else:
                resp = vision_llm.chat(messages)
                content_text = getattr(resp, "content", None) if not isinstance(resp, dict) else resp.get("content", "")

            parsed_items = parse_grounding_response(content_text) if content_text else []
            break
        except Exception as e:
            last_err = e
            if attempt >= max_retries:
                parsed_items = []

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

    return parsed_items, pixel_dets_pre, pixel_dets_post, img_w, img_h
