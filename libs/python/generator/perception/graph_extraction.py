from typing import Optional
from pathlib import Path
from datetime import datetime
from .graph.detection import detect_charts_in_image, should_use_graph_pipeline
from .graph.pipeline import process_graphs_in_image, format_graph_specs_for_injection
from ..utils.logger import log_to_file

def detect_and_process_graphs(
    image_bytes: bytes,
    filename: Optional[str],
    provider: Optional[str],
    api_key: str,  # For graph detection
    model: str,
    temperature: float,
    max_tokens: int,
    timeout: int,
    max_retries: int,
    graph_gen_api_key: Optional[str] = None,  # For graph generation (optional)
) -> tuple[dict, list]:
    image_id = Path(filename).stem if filename else "unknown"

    chart_counts = detect_charts_in_image(
        image_bytes=image_bytes,
        filename=filename,
        provider=provider,
        api_key=api_key,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        max_retries=max_retries
    )

    total_charts = sum(chart_counts.values()) if chart_counts else 0
    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Graph detection: {total_charts} charts")

    graph_specs = []
    if should_use_graph_pipeline(chart_counts):
        # Use dedicated graph_gen_api_key if provided, otherwise fallback to api_key
        gen_key = graph_gen_api_key if graph_gen_api_key else api_key
        graph_specs = process_graphs_in_image(
            image_bytes=image_bytes,
            filename=filename,
            chart_counts=chart_counts,
            provider=provider,
            api_key=gen_key,  # Use dedicated key for graph generation
            model=model,
            temperature=0.3,
            max_tokens=3000,
            timeout=60,
            max_retries=2
        )
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Graph generation: {len(graph_specs)} specs")

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

def get_available_components_list(graph_specs: list = None) -> str:
    """Generate a list of available component names, including detected graphs."""
    base_components = [
        "Text", "Icon", "Image", "Checkbox", "Sparkline",
        "MapImage", "AppLogo", "Divider", "Indicator"
    ]

    if graph_specs:
        graph_types = [spec.get("type") for spec in graph_specs if spec.get("type")]
        all_components = base_components + graph_types
    else:
        all_components = base_components

    return ", ".join(all_components)
