#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Graph Detection Service

Simple classification service to detect chart types in images.
Returns count and types of charts without requiring bounding boxes.
"""

from __future__ import annotations
import base64
import io
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from provider_hub import LLM, ChatMessage

# Supported chart types from WidgetDSL
SUPPORTED_CHART_TYPES = [
    "LineChart",
    "BarChart",
    "PieChart",
    "RadarChart",
    "StackedBarChart",
    "ProgressBar",
    "ProgressRing",
    "Sparkline"
]

# Graph detection prompt file path
GRAPH_DETECTION_PROMPT_PATH = Path(__file__).parent.parent.parent / "prompts" / "graph" / "graph-detection-prompt.md"

def load_graph_detection_prompt() -> str:
    """Load graph detection prompt from markdown file."""
    if GRAPH_DETECTION_PROMPT_PATH.exists():
        return GRAPH_DETECTION_PROMPT_PATH.read_text(encoding="utf-8").strip()
    return "You are a chart detection expert. Analyze this image and identify chart types."

def parse_graph_detection_response(text: str) -> Dict[str, int]:
    """Parse the graph detection response and return chart counts."""
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    # Try to extract JSON from response
    fenced = re.match(r"^\s*```(?:json)?\s*(.*?)\s*```\s*$", text, re.DOTALL)
    raw = fenced.group(1) if fenced else text.strip()

    try:
        data = json.loads(raw)
        if not isinstance(data, dict) or "charts" not in data:
            raise ValueError("Response must contain a 'charts' object")

        charts = data["charts"]
        if not isinstance(charts, dict):
            raise ValueError("'charts' must be an object")

        # Validate and normalize chart counts
        result = {chart_type: 0 for chart_type in SUPPORTED_CHART_TYPES}
        for chart_type, count in charts.items():
            if chart_type in SUPPORTED_CHART_TYPES:
                result[chart_type] = int(count) if isinstance(count, (int, str)) and str(count).isdigit() else 0

        return result
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}")

def get_image_size_from_bytes(image_bytes: bytes) -> Tuple[int, int]:
    """Get image dimensions from bytes."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        w, h = img.size
    return int(w), int(h)

def prepare_image_content_from_bytes(image_bytes: bytes, filename: Optional[str] = None) -> Dict[str, Any]:
    """Prepare image content for LLM API."""
    mime = "image/png"  # Default
    if filename:
        name = filename.lower()
        if name.endswith((".jpg", ".jpeg")):
            mime = "image/jpeg"
        elif name.endswith(".webp"):
            mime = "image/webp"
        elif name.endswith(".gif"):
            mime = "image/gif"
        elif name.endswith(".bmp"):
            mime = "image/bmp"
        elif name.endswith((".tiff", ".tif")):
            mime = "image/tiff"

    b64 = base64.b64encode(image_bytes).decode("ascii")
    return {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}

def detect_charts_in_image(
    *,
    image_bytes: bytes,
    filename: Optional[str] = None,
    # LLM config
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model: str = "qwen3-vl-plus",
    temperature: float = 0.1,  # Lower temp for more consistent detection
    max_tokens: int = 500,
    timeout: int = 30,
    thinking: bool = False,
    max_retries: int = 2,
) -> Dict[str, int]:
    """
    Detect chart types and counts in an image.

    Returns a dictionary with chart types as keys and counts as values.
    Example: {"LineChart": 1, "BarChart": 2, "PieChart": 0, ...}
    """
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be raw bytes")

    # Load the graph detection prompt dynamically
    graph_detection_prompt = load_graph_detection_prompt()

    # Prepare image content
    image_content = prepare_image_content_from_bytes(image_bytes, filename)
    messages = [
        ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": graph_detection_prompt},
                image_content
            ]
        )
    ]

    # Configure LLM
    llm_kwargs: Dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "timeout": timeout,
        "system_prompt": "You are a chart detection expert. Count and classify charts in images.",
    }

    if provider:
        llm_kwargs["provider"] = provider
    if api_key:
        llm_kwargs["api_key"] = api_key
    if base_url:
        llm_kwargs["base_url"] = base_url
    if thinking:
        llm_kwargs["thinking"] = True

    # Call LLM with retries
    vision_llm = LLM(**llm_kwargs)
    last_err = None
    chart_counts = {chart_type: 0 for chart_type in SUPPORTED_CHART_TYPES}

    for attempt in range(max_retries + 1):
        try:
            resp = vision_llm.chat(messages)
            content_text = getattr(resp, "content", None) if not isinstance(resp, dict) else resp.get("content", "")

            if content_text:
                chart_counts = parse_graph_detection_response(content_text)
            break

        except Exception as e:
            last_err = e
            if attempt >= max_retries:
                # Return zero counts on failure
                chart_counts = {chart_type: 0 for chart_type in SUPPORTED_CHART_TYPES}

    return chart_counts

def get_detected_charts_summary(chart_counts: Dict[str, int]) -> str:
    """Generate a human-readable summary of detected charts."""
    detected_charts = [f"{count} {chart_type}" for chart_type, count in chart_counts.items() if count > 0]

    if not detected_charts:
        return "No charts detected"

    return ", ".join(detected_charts)

def should_use_graph_pipeline(chart_counts: Dict[str, int]) -> bool:
    """Determine if the graph pipeline should be used based on detected charts."""
    return any(count > 0 for count in chart_counts.values())