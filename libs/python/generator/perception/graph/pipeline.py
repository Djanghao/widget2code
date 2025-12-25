#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Graph Processing Pipeline

Generates chart-specific prompts and processes them to create detailed graph specifications
for injection into the main WidgetDSL generation.
"""

from __future__ import annotations
import base64
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from ...providers import OpenAIProvider, ChatMessage

# Chart prompt files path
GRAPHS_PROMPT_DIR = Path(__file__).parent.parent.parent / "prompts" / "graphs"

def load_chart_prompt(chart_type: str) -> str:
    """Load chart-specific prompt from markdown file."""
    prompt_file = GRAPHS_PROMPT_DIR / f"{chart_type.lower()}.md"
    if prompt_file.exists():
        return prompt_file.read_text(encoding="utf-8").strip()
    return f"Generate a WidgetDSL specification for a {chart_type} component in this image."

def load_common_prompt() -> str:
    """Load common instructions for all chart processing."""
    common_file = GRAPHS_PROMPT_DIR / "common.md"
    if common_file.exists():
        return common_file.read_text(encoding="utf-8").strip()
    return "You are a WidgetDSL graph specification expert. Analyze this image and generate detailed specifications for the charts shown."

def extract_chart_counts_from_layout(layout_detections: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Extract chart types and counts from layout detection results.

    Args:
        layout_detections: List of layout detections with 'label' field

    Returns:
        Dictionary with chart types as keys and counts as values
    """
    # Chart types that we support
    chart_types = {
        "BarChart", "StackedBarChart", "LineChart", "PieChart",
        "RadarChart", "ProgressBar", "ProgressRing", "Sparkline"
    }

    # Count each chart type
    chart_counts = {chart_type: 0 for chart_type in chart_types}

    for detection in layout_detections:
        label = detection.get("label", "")
        if label in chart_types:
            chart_counts[label] += 1

    return chart_counts

def extract_chart_detections_from_layout(layout_detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract complete chart detection information from layout detection results.

    Args:
        layout_detections: List of layout detections with 'label', 'bbox', 'description' fields

    Returns:
        List of chart detections with type, bbox, and description
    """
    # Chart types that we support
    chart_types = {
        "BarChart", "StackedBarChart", "LineChart", "PieChart",
        "RadarChart", "ProgressBar", "ProgressRing", "Sparkline"
    }

    chart_detections = []

    for detection in layout_detections:
        label = detection.get("label", "")
        if label in chart_types:
            chart_detections.append({
                "type": label,
                "bbox": detection.get("bbox", []),
                "description": detection.get("description", "")
            })

    return chart_detections

def generate_graph_prompt(chart_detections: List[Dict[str, Any]]) -> str:
    """
    Generate a combined prompt for all detected charts with layout grounding information.

    Args:
        chart_detections: List of chart detections with 'type', 'bbox', 'description' fields

    Returns:
        Combined prompt string with layout information
    """
    if not chart_detections:
        return ""

    # Load common instructions
    common_prompt = load_common_prompt()

    # Build chart list with grounding information
    chart_list = []
    for i, detection in enumerate(chart_detections, 1):
        chart_type = detection.get("type", "Unknown")
        bbox = detection.get("bbox", [])
        description = detection.get("description", "")

        bbox_str = f"[{bbox[0]}, {bbox[1]}, {bbox[2]}, {bbox[3]}]" if len(bbox) == 4 else "unknown"
        desc_str = f" ({description})" if description else ""

        chart_list.append(f"  {i}. {chart_type} at bbox {bbox_str}{desc_str}")

    # Group by chart type for guidelines
    chart_types = {}
    for detection in chart_detections:
        chart_type = detection.get("type", "Unknown")
        chart_types[chart_type] = chart_types.get(chart_type, 0) + 1

    # Build prompt with loaded chart-specific instructions
    prompt_parts = [
        common_prompt,
        "",
        "## DETECTED CHARTS (from layout grounding):",
        "",
        *chart_list,
        "",
        "## IMPORTANT:",
        "- Use the bbox coordinates to identify the chart location in the image",
        "- The description provides visual characteristics detected during layout analysis",
        "- Focus on extracting precise data values, colors, labels, and styling",
        "- Generate specifications in the same order as listed above",
        "",
        "## CHART TYPE GUIDELINES:",
        ""
    ]

    for chart_type, count in chart_types.items():
        chart_prompt = load_chart_prompt(chart_type)
        if chart_prompt:
            prompt_parts.append(f"--- {chart_type} (x{count}) ---")
            prompt_parts.append(chart_prompt)
            prompt_parts.append("")

    return "\n".join(prompt_parts)

def parse_graph_spec_response(text: str) -> List[Dict[str, Any]]:
    """Parse the graph specification response from the LLM."""
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    # Try to extract JSON from response
    fenced = re.match(r"^\s*```(?:json)?\s*(.*?)\s*```\s*$", text, re.DOTALL)
    raw = fenced.group(1) if fenced else text.strip()

    try:
        data = json.loads(raw)
        if not isinstance(data, dict) or "graphs" not in data:
            raise ValueError("Response must contain a 'graphs' array")

        graphs = data["graphs"]
        if not isinstance(graphs, list):
            raise ValueError("'graphs' must be an array")

        # Validate each graph specification
        result = []
        for i, graph in enumerate(graphs):
            if not isinstance(graph, dict):
                raise ValueError(f"Graph {i} must be an object")

            if "type" not in graph or "spec" not in graph:
                raise ValueError(f"Graph {i} missing 'type' or 'spec'")

            result.append({
                "type": str(graph["type"]),
                "spec": graph["spec"]
            })

        return result
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}")

async def process_graphs_in_image(
    *,
    image_bytes: bytes,
    filename: Optional[str] = None,
    chart_detections: List[Dict[str, Any]],
    # LLM config
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    model: str = "qwen3-vl-plus",
    temperature: float = 0.3,  # Slightly higher for creative details
    max_tokens: int = 3000,
    timeout: int = 60,
    thinking: bool = False,
    max_retries: int = 2,
) -> List[Dict[str, Any]]:
    """
    Process detected charts in an image and generate detailed graph specifications.

    Args:
        image_bytes: Raw image bytes
        filename: Optional filename
        chart_detections: List of chart detections with 'type', 'bbox', 'description' fields
        ... (LLM config parameters)

    Returns:
        List of graph specifications ready for injection into WidgetDSL.
    """
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be raw bytes")

    # Check if any charts were detected
    if not chart_detections:
        return []

    # Extract image_id for logging
    import time
    from datetime import datetime
    image_id = Path(filename).stem if filename else "unknown"

    try:
        from ...utils.logger import log_to_file
        has_logger = True
    except (ImportError, Exception):
        has_logger = False

    total_charts = len(chart_detections)
    if has_logger:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] Started ({total_charts} charts)")

    start_time = time.time()

    # Generate the combined graph prompt with layout information
    graph_prompt = generate_graph_prompt(chart_detections)
    if not graph_prompt:
        return []

    # Prepare image content
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
    image_content = {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}

    messages = [
        ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": graph_prompt},
                image_content
            ]
        )
    ]

    # Configure LLM
    llm_kwargs: Dict[str, Any] = {
        "model": model,
        "api_key": api_key if api_key else "",
        "base_url": base_url if base_url else "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "temperature": temperature,
        "max_tokens": max_tokens,
        "timeout": timeout,
        "system_prompt": "You are a WidgetDSL graph specification expert. Generate detailed, pixel-perfect specifications for charts.",
    }

    if thinking:
        llm_kwargs["thinking"] = True

    # Call LLM with retries
    vision_llm = OpenAIProvider(**llm_kwargs)
    last_err = None
    graph_specs = []

    if has_logger:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] VLM API call started (model={model}, thinking={thinking})")

    vlm_start = time.time()

    for attempt in range(max_retries + 1):
        try:
            resp = await vision_llm.async_chat(messages)
            content_text = getattr(resp, "content", None) if not isinstance(resp, dict) else resp.get("content", "")

            if content_text:
                graph_specs = parse_graph_spec_response(content_text)
            break

        except Exception as e:
            last_err = e
            if attempt >= max_retries:
                # Return empty specs on failure
                graph_specs = []

    vlm_duration = time.time() - vlm_start
    total_duration = time.time() - start_time

    if has_logger:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] VLM API call completed in {vlm_duration:.2f}s")
        spec_count = len(graph_specs)
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] Completed in {total_duration:.2f}s ({spec_count} specs generated)")

    return graph_specs

def format_graph_specs_for_injection(graph_specs: List[Dict[str, Any]]) -> str:
    """Format graph specifications for injection into the main WidgetDSL prompt."""
    if not graph_specs:
        return ""

    formatted_parts = []

    for i, graph in enumerate(graph_specs):
        graph_type = graph.get('type', 'Unknown')
        spec = graph.get('spec', {})

        formatted_parts.append(f"#### {graph_type} (Detected)")
        formatted_parts.append(f"**PRE-GENERATED SPECIFICATION** - Use the following exact specification in your WidgetDSL:")
        formatted_parts.append("```json")
        formatted_parts.append(json.dumps(spec, indent=2))
        formatted_parts.append("```")
        formatted_parts.append("")

    return "\n".join(formatted_parts)