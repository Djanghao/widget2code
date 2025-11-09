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

def generate_graph_prompt(chart_counts: Dict[str, int]) -> str:
    """Generate a combined prompt for all detected charts."""
    chart_descriptions = []

    for chart_type, count in chart_counts.items():
        if count > 0:
            if count == 1:
                chart_descriptions.append(f"1 {chart_type}")
            else:
                chart_descriptions.append(f"{count} {chart_type}s")

    if not chart_descriptions:
        return ""

    # Load common instructions
    common_prompt = load_common_prompt()

    # Build prompt with loaded chart-specific instructions
    prompt_parts = [
        common_prompt,
        "",
        f"This image contains: {', '.join(chart_descriptions)}",
        "",
        "For each chart detected, generate a detailed WidgetDSL specification according to the following guidelines:",
        ""
    ]

    for chart_type, count in chart_counts.items():
        if count > 0:
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
    chart_counts: Dict[str, int],
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

    Returns a list of graph specifications ready for injection into WidgetDSL.
    """
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be raw bytes")

    # Check if any charts were detected
    if not any(count > 0 for count in chart_counts.values()):
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

    total_charts = sum(chart_counts.values())
    if has_logger:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] Started ({total_charts} charts)")

    start_time = time.time()

    # Generate the combined graph prompt
    graph_prompt = generate_graph_prompt(chart_counts)
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