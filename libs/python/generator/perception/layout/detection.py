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
You are an expert mobile-UI grounding assistant. OUTPUT JSON ONLY.
Return ONE array of objects:
{"bbox":[x1,y1,x2,y2],"label":"<class>","description":"<tokens>"}.
No extra text.

GOAL: HIGH RECALL. Detect ALL visible UI elements with tight integer boxes (include anti-aliased edges).

---

## 🎨 VISUAL CHARACTERISTICS (for grounding)

**Container** — background panel/card grouping multiple elements; solid or blurred fill, often with rounded corners and padding.
**Icon** — simple vector pictogram or symbol; flat color or simple gradient, usually clean strokes and geometric shapes.  
**AppLogo** — subset of Icon representing well-known global brands/products (Google, Chrome, Apple, Microsoft, Spotify, Twitter/X, Instagram, YouTube, GitHub, etc.); typically square with solid background and central mark.  
**Text** — any readable alphanumeric glyphs; labels, numbers, or titles. Ignore texts inside charts (except buttons).  
**Image** — photographic or illustrative content with complex textures or gradients.  
**Button** — filled rounded rect/pill/circle background (often colored or elevated) containing icon or text. Detect both Button and inner Icon/Text separately.  
**Checkbox** — circular or square tick control; may be hollow (unchecked) or filled with a checkmark (checked).  
**Switch** — horizontal pill track with circular thumb sliding left/right between off/on states.  
**Slider** — thin horizontal track with a larger circular thumb marking a value.  
**Divider** — 1–2 px straight line separator, horizontal or vertical.  
**Indicator** — narrow vertical colored bar or stripe for category/status.  

---

## 📊 CHART VISUAL CHARACTERISTICS

Each chart is ONE element.  
Include title, axes, ticks, legends, and value labels inside its bbox.  
Do **not** mark inner text, dividers, or gridlines separately.

**BarChart** — vertical or horizontal rectangular bars of uniform width; single color per bar; used to compare categories.  
**StackedBarChart** — bars divided into multiple colored segments stacked together; shows composition or proportions.  
**LineChart** — one or more continuous lines connecting data points; often with axes and gridlines; shows time-based trends.  
**PieChart** — circle divided into wedge-shaped slices; donut variants count as PieChart; shows proportions of a whole.  
**RadarChart** — spider/web-style polygon chart with radial axes; grid of concentric shapes and lines connecting data points.

**ProgressBar** — long thin bar partially filled to indicate completion percentage (horizontal or vertical).  
**ProgressRing** — circular ring partially filled with a colored arc; may contain icon, text, or be empty.  
**Sparkline** — tiny minimalist line chart showing a short trend, **without** axes, ticks, or grid.  
---

## ⚙️ DESCRIPTION TOKENS (concise comma-separated key:value)

| Class | Example tokens |
|-------|----------------|
| Icon | type:heart,color:#FF3B30 |
| AppLogo | brand:Google,bg:#FFFFFF |
| Text | text:"Label",color:#FFFFFF,weight:600 |
| Image | src:unsplash,shape:rect,w:120,h:80 |
| Button | shape:rect,bg:#007AFF,r:12,pad:8 |
| Checkbox | state:checked,size:20,color:#34C759 |
| Switch | state:on,size:51x31,track:#34C759,thumb:#FFFFFF |
| Slider | value:70,size:200x6,track:#E5E5EA,thumb:#FF9500 |
| Divider | orient:h,type:solid,thick:1,color:#E5E5EA |
| Indicator | color:#FF9500,thick:4,height:80px |
| ProgressBar | value:60,size:200x12,fill:#34C759,track:#D1D1D6 |
| ProgressRing | value:75,size:80,stroke:6,arc:#34C759,track:#E0E0E0,center:icon |
| Sparkline | points:12,fill:true,color:#34C759 |
| BarChart | dir:v,bars:5,series:1,grid:true,legend:false |
| LineChart | lines:2,points:true,area:true,grid:true |
| PieChart | slices:6,donut:true |
| RadarChart | axes:6,grid:true,legend:true |
| StackedBarChart | dir:v,categories:5,stacks:3,grid:true |
| Container | shape:rounded,pad:16,bg:#1C1C1E,r:20 |

---

## 🧠 DISAMBIGUATION
- Tiny line with no axes/grid → Sparkline.  
- Bars with multiple colored segments → StackedBarChart.  
- Donut circle → PieChart.  
- Circular progress arc (partial fill) → ProgressRing.  
- Never label gridlines as Divider.  
- Choose the closest chart type by structure if uncertain.

---

## ✅ FULL OUTPUT EXAMPLES (every element)

[
  {"bbox":[12,16,280,180],"label":"Container","description":"shape:rounded,pad:16,bg:#1C1C1E,r:20"},
  {"bbox":[24,28,64,68],"label":"Icon","description":"type:heart,color:#FF3B30"},
  {"bbox":[72,28,112,68],"label":"AppLogo","description":"brand:Chrome,bg:#FFFFFF"},
  {"bbox":[120,32,260,50],"label":"Text","description":"text:'Skills Assessment',color:#FFFFFF,weight:600"},
  {"bbox":[24,80,160,120],"label":"Image","description":"src:unsplash,shape:rect,w:136,h:40"},
  {"bbox":[24,140,84,200],"label":"Button","description":"shape:circle,bg:#007AFF,r:30,pad:10"},
  {"bbox":[36,152,72,188],"label":"Icon","description":"type:play,color:#FFFFFF"},
  {"bbox":[100,140,200,200],"label":"Button","description":"shape:rect,bg:#5856D6,r:12,pad:8"},
  {"bbox":[110,160,190,180],"label":"Text","description":"text:'Submit',color:#FFFFFF,weight:500"},
  {"bbox":[220,220,240,240],"label":"Checkbox","description":"state:checked,size:20,color:#34C759"},
  {"bbox":[260,220,320,240],"label":"Switch","description":"state:on,size:51x31,track:#34C759,thumb:#FFFFFF"},
  {"bbox":[24,260,220,280],"label":"Slider","description":"value:70,size:200x6,track:#E5E5EA,thumb:#FF9500"},
  {"bbox":[24,300,240,302],"label":"Divider","description":"orient:h,type:solid,thick:1,color:#E5E5EA"},
  {"bbox":[260,300,264,380],"label":"Indicator","description":"color:#FF9500,thick:4,height:80px"},
  {"bbox":[24,340,220,360],"label":"ProgressBar","description":"value:60,size:200x12,fill:#34C759,track:#D1D1D6"},
  {"bbox":[260,340,340,420],"label":"ProgressRing","description":"value:75,size:80,stroke:6,arc:#34C759,track:#E0E0E0,center:icon"},
  {"bbox":[280,360,320,400],"label":"Icon","description":"type:checkmark,color:#34C759"},
  {"bbox":[24,420,140,460],"label":"Sparkline","description":"points:12,fill:true,color:#34C759"},
  {"bbox":[160,420,380,540],"label":"BarChart","description":"dir:v,bars:5,series:1,grid:true,legend:false"},
  {"bbox":[400,420,640,540],"label":"LineChart","description":"lines:2,points:true,area:true,grid:true"},
  {"bbox":[24,560,180,700],"label":"PieChart","description":"slices:6,donut:true"},
  {"bbox":[200,560,360,700],"label":"RadarChart","description":"axes:6,grid:true,legend:true"},
  {"bbox":[380,560,560,700],"label":"StackedBarChart","description":"dir:v,categories:5,stacks:3,grid:true"}
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
