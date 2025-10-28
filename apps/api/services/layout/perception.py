#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Layout Perception Service

Analyzes widget screenshots and extracts pure layout structure.
Output: Tree-text format describing container hierarchy and element types.
"""

from __future__ import annotations
import base64
import io
from typing import Any, Dict, Optional, Tuple
from PIL import Image

from provider_hub import LLM, ChatMessage


LAYOUT_PERCEPTION_PROMPT = """
Describe the layout structure of this widget in plain English.

Focus on:
- How many rows or columns
- What's in each row/column
- Size ratios between elements (use numbers like 1:2:3)
- If there are nested structures (rows within columns, or columns within rows)

Example 1 - Stock list:
"The widget has 6 rows. Each row has 3 columns with ratio 2:1:1.

The first column (ratio 2) contains 2 rows:
- Row 1: An icon and a text side by side
- Row 2: One text

The second column (ratio 1) contains a chart.

The third column (ratio 1) contains 2 rows:
- Row 1: One text
- Row 2: One text"

Example 2 - Calendar:
"The widget has 3 rows.

Row 1: One text (day name)
Row 2: One text (date number), larger than row 1
Row 3: Has 2 columns with ratio 1:10
  - Column 1: A vertical colored bar
  - Column 2: Has 3 texts stacked vertically (event title, location, time)"

Example 3 - Weather:
"The widget has 3 rows.

Row 1: Has 2 columns with ratio 3:1
  - Column 1: Location text
  - Column 2: Small icon

Row 2: One large text (temperature)

Row 3: Has 2 rows
  - Row 1: Icon and text side by side
  - Row 2: One text"

Now describe the layout of this widget. Don't mention colors or actual content, just structure.
""".strip()


def get_image_size_from_bytes(image_bytes: bytes) -> Tuple[int, int]:
    """Get image dimensions from bytes."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        w, h = img.size
    return int(w), int(h)


def _guess_mime_from_filename(filename: Optional[str]) -> str:
    """Guess MIME type from filename."""
    if not filename:
        return "image/png"
    name = filename.lower()
    if name.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if name.endswith(".webp"):
        return "image/webp"
    if name.endswith(".gif"):
        return "image/gif"
    if name.endswith(".bmp"):
        return "image/bmp"
    if name.endswith((".tiff", ".tif")):
        return "image/tiff"
    return "image/png"


def prepare_image_content_from_bytes(
    image_bytes: bytes, filename: Optional[str]
) -> Dict[str, Any]:
    """Prepare image content dict for LLM."""
    mime = None
    try:
        with Image.open(io.BytesIO(image_bytes)) as im:
            fmt = (im.format or "").upper()
            mime_map = {
                "JPEG": "image/jpeg",
                "PNG": "image/png",
                "WEBP": "image/webp",
                "GIF": "image/gif",
                "BMP": "image/bmp",
                "TIFF": "image/tiff",
                "TIF": "image/tiff",
            }
            mime = mime_map.get(fmt)
    except Exception:
        mime = None

    if not mime:
        mime = _guess_mime_from_filename(filename)

    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    return {"type": "image_url", "image_url": {"url": data_url}}


def perceive_layout(
    *,
    image_bytes: bytes,
    filename: Optional[str] = None,
    prompt: str = LAYOUT_PERCEPTION_PROMPT,
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model: str = "qwen-vl-plus",
    temperature: float = 0.3,
    top_p: Optional[float] = None,
    max_tokens: int = 2000,
    timeout: int = 60,
) -> Tuple[str, int, int]:
    """
    Perceive layout structure from widget screenshot.

    Args:
        image_bytes: Raw image bytes
        filename: Optional filename for MIME type detection
        prompt: Custom prompt (defaults to LAYOUT_PERCEPTION_PROMPT)
        provider: LLM provider (e.g., "qwen", "openai")
        api_key: API key for provider
        base_url: Base URL for provider
        model: Model name
        temperature: Sampling temperature (lower = more deterministic)
        top_p: Nucleus sampling parameter
        max_tokens: Max tokens in response
        timeout: Request timeout in seconds

    Returns:
        Tuple of (layout_tree_text, image_width, image_height)

    Example:
        >>> layout_text, w, h = perceive_layout(image_bytes=img_bytes)
        >>> print(layout_text)
        col
          └─ row (repeat=6)
             ├─ col [ratio=2]
             ...
    """
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be raw bytes")

    # Get image size
    img_w, img_h = get_image_size_from_bytes(image_bytes)

    # Prepare messages
    image_content = prepare_image_content_from_bytes(image_bytes, filename)
    messages = [
        ChatMessage(
            role="user",
            content=[{"type": "text", "text": prompt}, image_content],
        )
    ]

    # Prepare LLM kwargs
    llm_kwargs: Dict[str, Any] = dict(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        system_prompt="You are a UI layout analysis expert.",
    )
    if top_p is not None:
        llm_kwargs["top_p"] = top_p
    if provider:
        llm_kwargs["provider"] = provider
    if api_key:
        llm_kwargs["api_key"] = api_key
    if base_url:
        llm_kwargs["base_url"] = base_url

    # Call LLM
    vision_llm = LLM(**llm_kwargs)
    resp = vision_llm.chat(messages)

    # Extract content
    if hasattr(resp, "content"):
        layout_text = resp.content
    elif isinstance(resp, dict):
        layout_text = resp.get("content", "")
    else:
        layout_text = str(resp)

    # Clean up response (remove markdown code blocks if present)
    layout_text = layout_text.strip()
    if layout_text.startswith("```"):
        lines = layout_text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        layout_text = "\n".join(lines).strip()

    return layout_text, img_w, img_h


__all__ = [
    "perceive_layout",
    "LAYOUT_PERCEPTION_PROMPT",
]
