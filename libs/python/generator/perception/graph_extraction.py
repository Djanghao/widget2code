from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime
from .graph.pipeline import (
    extract_chart_counts_from_layout,
    extract_chart_detections_from_layout,
    process_graphs_in_image,
    format_graph_specs_for_injection
)
from ..utils.logger import log_to_file

async def detect_and_process_graphs_from_layout(
    image_bytes: bytes,
    filename: Optional[str],
    layout_detections: List[Dict[str, Any]],
    provider: Optional[str],
    graph_gen_api_key: str,
    graph_gen_model: str,
    graph_gen_timeout: int = 600,
    graph_gen_thinking: bool = False,
    graph_gen_max_tokens: Optional[int] = None,
) -> tuple[dict, list]:
    """
    Extract chart information from layout detections and generate graph specifications.

    Args:
        image_bytes: Raw image bytes
        filename: Optional filename
        layout_detections: Layout detection results (must contain 'label', 'bbox', 'description' fields)
        provider: LLM provider
        graph_gen_api_key: API key for graph generation
        graph_gen_model: Model for graph generation
        graph_gen_timeout: Timeout for graph generation
        graph_gen_thinking: Enable thinking mode for graph generation

    Returns:
        Tuple of (chart_counts, graph_specs)
    """
    image_id = Path(filename).stem if filename else "unknown"

    # Extract chart counts and complete detections from layout
    chart_counts = extract_chart_counts_from_layout(layout_detections)
    chart_detections = extract_chart_detections_from_layout(layout_detections)

    total_charts = sum(chart_counts.values()) if chart_counts else 0
    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Detection] Extracted from layout: {total_charts} charts")

    graph_specs = []
    if chart_detections:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] Started")
        graph_specs = await process_graphs_in_image(
            image_bytes=image_bytes,
            filename=filename,
            chart_detections=chart_detections,
            provider=provider,
            api_key=graph_gen_api_key,
            model=graph_gen_model,
            temperature=0.3,
            max_tokens=graph_gen_max_tokens if graph_gen_max_tokens is not None else 10000,
            timeout=graph_gen_timeout,
            thinking=graph_gen_thinking,
            max_retries=0
        )
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Graph Generation] Completed: {len(graph_specs)} specs")

    return chart_counts, graph_specs

def inject_graph_specs_to_prompt(
    base_prompt: str,
    graph_specs: list,
) -> str:
    if not graph_specs:
        if "[GRAPH_SPECS]" in base_prompt:
            # Remove the entire ### Graph section when no graphs are detected
            # This prevents VLM from thinking "Graph" is an available component
            import re
            # Match "### Graph\n[GRAPH_SPECS]\n" with optional whitespace
            pattern = r'###\s+Graph\s*\n\s*\[GRAPH_SPECS\]\s*\n'
            if re.search(pattern, base_prompt):
                return re.sub(pattern, '', base_prompt)
            # Fallback: just remove the placeholder
            return base_prompt.replace("[GRAPH_SPECS]", "")
        return base_prompt

    graph_specs_text = format_graph_specs_for_injection(graph_specs)

    if "[GRAPH_SPECS]" in base_prompt:
        return base_prompt.replace("[GRAPH_SPECS]", graph_specs_text)
    else:
        return f"{base_prompt}\n\n{graph_specs_text}"

def get_available_components_list(graph_specs: list = None, detected_primitives: set = None) -> str:
    """
    Generate a list of available component names, including detected primitives and graphs.

    Args:
        graph_specs: List of graph specifications (for adding graph types)
        detected_primitives: Set of detected primitive component types

    Returns:
        Comma-separated string of component names
    """
    # Start with detected primitives if provided, otherwise use default base components
    if detected_primitives:
        all_components = sorted(detected_primitives)
    else:
        # Fallback to hardcoded list if primitives not provided
        all_components = [
            "Text", "Icon", "Image", "Checkbox", "Sparkline",
            "MapImage", "AppLogo", "Divider", "Indicator"
        ]

    # Add detected graph types
    if graph_specs:
        graph_types = [spec.get("type") for spec in graph_specs if spec.get("type")]
        all_components = all_components + graph_types

    return ", ".join(all_components)
