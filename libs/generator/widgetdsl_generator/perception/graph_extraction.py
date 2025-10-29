from typing import Optional
from ..services.graph.detection import detect_charts_in_image, should_use_graph_pipeline
from ..services.graph.pipeline import process_graphs_in_image, format_graph_specs_for_injection

def detect_and_process_graphs(
    image_bytes: bytes,
    filename: Optional[str],
    provider: Optional[str],
    api_key: str,
    model: str,
    temperature: float,
    max_tokens: int,
    timeout: int,
    max_retries: int
) -> tuple[dict, list]:
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

    graph_specs = []
    if should_use_graph_pipeline(chart_counts):
        graph_specs = process_graphs_in_image(
            image_bytes=image_bytes,
            filename=filename,
            chart_counts=chart_counts,
            provider=provider,
            api_key=api_key,
            model=model,
            temperature=0.3,
            max_tokens=3000,
            timeout=60,
            max_retries=2
        )

    return chart_counts, graph_specs

def inject_graph_specs_to_prompt(
    base_prompt: str,
    graph_specs: list,
) -> str:
    if not graph_specs:
        if "[GRAPH_SPECS]" in base_prompt:
            return base_prompt.replace("[GRAPH_SPECS]", "**No graph components detected in the image.**")
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
