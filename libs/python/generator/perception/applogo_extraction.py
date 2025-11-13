import os
from pathlib import Path
from typing import Any, Dict, List, Optional

async def run_applogo_detection_pipeline(
    image_bytes: bytes,
    filename: Optional[str],
    model: str,
    api_key: str,
    layout_detections: List[Dict],  # Accept layout detection results
    img_width: int,                 # Image width
    img_height: int,                # Image height
    retrieval_topk: int = 50,
    retrieval_topm: int = 10,
    retrieval_alpha: float = 0.8,
    lib_names: Optional[List[str]] = None,
    timeout: int = 300,
) -> Dict[str, Any]:
    """
    Run applogo detection and retrieval pipeline.

    NOTE: This function receives layout detection results and filters for applogos,
    then performs retrieval using the specified applogo libraries.

    Args:
        image_bytes: Raw image bytes
        filename: Image filename
        model: Model name (kept for potential future use)
        api_key: API key (kept for potential future use)
        layout_detections: Post-processed layout detection results
        img_width: Image width in pixels
        img_height: Image height in pixels
        retrieval_topk: Top-K candidates for retrieval
        retrieval_topm: Top-M candidates to keep
        retrieval_alpha: Alpha parameter for retrieval scoring
        lib_names: AppLogo library names (e.g., ["si"])
        timeout: Timeout in seconds

    Returns:
        Dictionary with applogo retrieval results
    """
    from datetime import datetime
    from ..utils.logger import log_to_file
    from .layout import get_applogos_from_layout

    image_id = Path(filename).stem if filename else "unknown"

    per_applogo_details = []
    applogo_candidates = []
    applogo_count = 0  # Initialize to avoid NameError if try block fails

    try:
        from .icon.query_embedding import query_from_detections_with_details

        # Filter applogos from layout detections
        applogo_dets = get_applogos_from_layout(layout_detections)
        applogo_count = len(applogo_dets)

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] AppLogo grounding: {applogo_count} applogos (from layout)")

        # Resolve library roots from repo paths. If none provided, default to SI library.
        here = Path(__file__).resolve()
        repo_root = here.parents[4]  # .../llm-widget-factory
        base_embeddings_dir = repo_root / "libs" / "js" / "icons" / "embeddings"
        default_si_dir = base_embeddings_dir / "si"

        if lib_names and len(lib_names) > 0:
            candidate_roots = [base_embeddings_dir / str(name) for name in lib_names]
        else:
            candidate_roots = [default_si_dir]

        existing_roots = [p for p in candidate_roots if p.exists()]

        # Only run retrieval if applogos were detected
        if applogo_count > 0:
            if not existing_roots:
                log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] ERROR: AppLogo embedding libraries not found. Searched paths: {[str(p) for p in candidate_roots]}")
                log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] CRITICAL: AppLogo retrieval SKIPPED - applogos will use fallback display")
            else:
                try:
                    # Run the retrieval pipeline
                    import asyncio
                    svg_names, per_applogo_details = await asyncio.wait_for(
                        query_from_detections_with_details(
                            detections=layout_detections,  # Pass full layout (will be filtered internally)
                            image_bytes=image_bytes,
                            lib_roots=existing_roots,
                            filter_icon_only=True,  # Enable filtering
                            filter_label="applogo",  # Filter by applogo label
                            topk=int(retrieval_topk),
                            topm=int(retrieval_topm),
                            alpha=float(retrieval_alpha),
                            image_id=image_id,
                        ),
                        timeout=timeout
                    )

                    # Collect unique applogo candidates
                    seen = set()
                    for detail in per_applogo_details:
                        for candidate in detail.get("topCandidates", []):
                            icon_name = candidate.get("icon")
                            if icon_name and icon_name not in seen:
                                applogo_candidates.append(icon_name)
                                seen.add(icon_name)

                    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] AppLogo retrieval: {len(per_applogo_details)} applogos processed, {len(applogo_candidates)} unique candidates")

                except Exception as e:
                    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] ERROR during applogo retrieval: {str(e)}")
                    import traceback
                    log_to_file(traceback.format_exc())
        else:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] No applogos detected, skipping retrieval")

    except Exception as e:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] FATAL ERROR in applogo pipeline: {str(e)}")
        import traceback
        log_to_file(traceback.format_exc())

    return {
        "per_applogo_details": per_applogo_details,
        "applogo_candidates": applogo_candidates,
        "applogo_count": applogo_count,
    }


def format_applogo_prompt_injection(
    applogo_count: int,
    per_applogo_details: list,
    retrieval_topm: int = 10,
) -> str:
    """
    Format applogo retrieval results for prompt injection.

    Args:
        applogo_count: Total number of applogos detected
        per_applogo_details: Per-applogo retrieval details
        retrieval_topm: Top-M threshold

    Returns:
        Formatted prompt injection text
    """
    if applogo_count == 0 or not per_applogo_details:
        return ""

    lines = [
        f"## AppLogo Retrieval Constraints",
        f"",
        f"**IMPORTANT**: {applogo_count} applogo(s) detected. You MUST use the retrieved applogo candidates below.",
        f"",
        f"### Per-AppLogo Candidates (by bbox):",
        f"",
    ]

    for i, detail in enumerate(per_applogo_details):
        bbox = detail.get("bbox", [])
        caption = detail.get("caption", "")
        top_candidates = detail.get("topCandidates", [])[:retrieval_topm]

        lines.append(f"**AppLogo #{i+1}** (bbox: {bbox}):")
        if caption:
            lines.append(f"  - Caption: \"{caption}\"")

        if top_candidates:
            lines.append(f"  - Candidates (top {len(top_candidates)}):")
            for rank, candidate in enumerate(top_candidates, 1):
                icon_name = candidate.get("icon", "")
                score = candidate.get("score", 0.0)
                lines.append(f"    {rank}. `{icon_name}` (score: {score:.3f})")
        else:
            lines.append(f"  - No candidates retrieved")

        lines.append("")

    lines.extend([
        "### Selection Rules for AppLogo:",
        "1. For each detected applogo, select the BEST matching icon from its candidate list",
        "2. Use the `icon` prop with the full icon name (e.g., `\"icon\": \"si:SiGoogle\"`)",
        "3. If no good match is found, use the `name` prop with a descriptive text (e.g., `\"name\": \"MyApp\"`)",
        "4. AppLogo candidates are from brand/company icon libraries (primarily Simple Icons)",
        "",
    ])

    return "\n".join(lines)
