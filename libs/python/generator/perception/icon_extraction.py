import os
from pathlib import Path
from typing import Any, Dict, List, Optional

async def run_icon_detection_pipeline(
    image_bytes: bytes,
    filename: Optional[str],
    model: str,
    api_key: str,
    layout_detections: List[Dict],  # NEW: Accept layout detection results
    img_width: int,                 # NEW: Image width
    img_height: int,                # NEW: Image height
    retrieval_topk: int = 50,
    retrieval_topm: int = 10,
    retrieval_alpha: float = 0.8,
    lib_names: Optional[List[str]] = None,
    timeout: int = 300,
) -> Dict[str, Any]:
    """
    Run icon detection and retrieval pipeline.

    NOTE: This function no longer performs grounding. It receives layout detection
    results and filters for icons, then performs retrieval.

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
        lib_names: Icon library names
        timeout: Timeout in seconds

    Returns:
        Dictionary with icon retrieval results
    """
    from datetime import datetime
    from ..utils.logger import log_to_file
    from .layout import get_icons_from_layout

    image_id = Path(filename).stem if filename else "unknown"

    per_icon_details = []
    icon_candidates = []
    icon_count = 0  # Initialize to avoid NameError if try block fails

    try:
        from .icon.query_embedding import query_from_detections_with_details

        # Filter icons from layout detections (NEW: using layout module)
        icon_dets = get_icons_from_layout(layout_detections)
        icon_count = len(icon_dets)

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Icon grounding: {icon_count} icons (from layout)")

        # Resolve library roots from repo paths. If none provided, default to SF library.
        here = Path(__file__).resolve()
        repo_root = here.parents[4]  # .../llm-widget-factory
        base_embeddings_dir = repo_root / "libs" / "js" / "icons" / "embeddings"
        default_sf_dir = base_embeddings_dir / "sf"

        if lib_names and len(lib_names) > 0:
            candidate_roots = [base_embeddings_dir / str(name) for name in lib_names]
        else:
            candidate_roots = [default_sf_dir]

        existing_roots = [p for p in candidate_roots if p.exists()]

        # Only run retrieval if icons were detected
        if icon_count > 0:
            if not existing_roots:
                log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] ERROR: Icon embedding libraries not found. Searched paths: {[str(p) for p in candidate_roots]}")
                log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] CRITICAL: Icon retrieval SKIPPED - icons will use fallback '+' symbol")
            else:
                try:
                    svg_names, per_icon_details = await query_from_detections_with_details(
                        detections=layout_detections,  # Changed: use layout_detections directly
                        image_bytes=image_bytes,
                        lib_roots=existing_roots,
                        filter_icon_only=True,
                        topk=int(retrieval_topk),
                        topm=int(retrieval_topm),
                        alpha=float(retrieval_alpha),
                        image_id=image_id,
                    )
                    ordered_unique = []
                    seen = set()
                    for n in svg_names:
                        s = str(n).strip()
                        if not s:
                            continue
                        if s not in seen:
                            seen.add(s)
                            ordered_unique.append(s)
                    icon_candidates = ordered_unique

                    if len(icon_candidates) == 0 and icon_count > 0:
                        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] ERROR: Icon retrieval returned 0 candidates for {icon_count} detected icons")
                        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] CRITICAL: This usually means backend captioning service is not running (check port {os.getenv('BACKEND_PORT', '8010')})")
                        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] IMPACT: All icons will use fallback '+' symbol in rendered output")
                    else:
                        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Icon retrieval: {len(icon_candidates)} candidates")

                        # Check if per-icon details are empty (another failure indicator)
                        if len(per_icon_details) == 0 and icon_count > 0:
                            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⚠️  [{image_id}] WARNING: No per-icon details generated despite {icon_count} icons detected")

                except Exception as retrieval_error:
                    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] ERROR: Icon retrieval failed with exception: {type(retrieval_error).__name__}: {str(retrieval_error)}")
                    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ [{image_id}] CRITICAL: Icon retrieval FAILED - icons will use fallback '+' symbol")
                    import traceback
                    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Traceback: {traceback.format_exc()}")

    except Exception as e:
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Icon pipeline failed: {type(e).__name__}: {str(e)}")
        import traceback
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Traceback: {traceback.format_exc()}")

    return {
        "per_icon_details": per_icon_details,
        "icon_candidates": icon_candidates,
        "icon_count": icon_count,
    }

def format_icon_prompt_injection(
    icon_count: int,
    per_icon_details: list,
    retrieval_topm: int = 10,
) -> str:
    extra_parts = []
    extra_parts.append(f"- Detected icons (via grounding): {icon_count}\n")

    if per_icon_details:
        extra_parts.append("- Per-Icon Candidate Constraints (STRICT):\n")
        extra_parts.append(
            "   1. For each detected icon, use ONLY candidates from its own list.\n"
            "   2. Each item is keyed by bbox [x1,y1,x2,y2] in pixels.\n"
            "   3. Do NOT propose any icon that is not in the list.\n"
            "   4. Prefer the closest match by SHAPE (outline/strokes), then by semantics.\n"
            "   5. If the image is low-quality or partially occluded, still choose the best candidate based on visible strokes.\n"
        )
        extra_parts.append("   6. ICON_CANDIDATES_BY_BBOX = [\n")
        for det in per_icon_details:
            bbox = det.get("bbox") or []
            names = []
            for c in det.get("topCandidates", [])[: max(1, int(retrieval_topm)) ]:
                raw_name = str(c.get("name") or "").strip()
                if not raw_name:
                    continue
                # Use the name exactly as it appears from retrieval.
                # Assumes filenames already carry the correct pack prefix (e.g., "lucide:Eye").
                names.append(raw_name)
            if not names or not bbox or len(bbox) != 4:
                continue
            extra_parts.append(
                "  { \"bbox\": [" + ", ".join(str(int(round(v))) for v in bbox) + "], \"candidates\": [" + ", ".join(f'\"{n}\"' for n in names) + "] },\n"
            )
        extra_parts.append(
            "]\n"
            "   ** Matching rule: When assigning an icon name for a visual region, choose the list whose bbox most overlaps that region; pick the best match ONLY from that list.\n"
            "   ** Per-icon fallback: If ALL candidates tied to a bbox are poor matches to the crop, you may propose a better SVG outside the list for that bbox only."
        )
    else:
        extra_parts.append(
            "### SELECTION RULES (NO LIST AVAILABLE)\n"
            "No candidate list is available. Infer the most likely icon name conservatively.\n"
        )

    return "".join(extra_parts)

def normalize_icon_details(per_icon_details: list) -> tuple[list, list]:
    for icon_detail in per_icon_details:
        for candidate in icon_detail.get("topCandidates", []):
            if "score_img" in candidate:
                candidate["score_img"] = round(candidate["score_img"], 4)
            if "score_txt" in candidate:
                candidate["score_txt"] = round(candidate["score_txt"], 4)
            if "score_final" in candidate:
                candidate["score_final"] = round(candidate["score_final"], 4)

            raw_name = str(candidate.get("name", ""))
            if raw_name:
                # Preserve the retrieved name verbatim; do not force-add prefixes.
                candidate["name"] = raw_name

        for candidate in icon_detail.get("imageOnlyTop10", []):
            if "score_img" in candidate:
                candidate["score_img"] = round(candidate["score_img"], 4)

    global_candidates = {}
    for icon_detail in per_icon_details:
        for candidate in icon_detail.get("topCandidates", []):
            prefixed_name = candidate.get("name", "")
            if not prefixed_name:
                continue

            if prefixed_name not in global_candidates:
                global_candidates[prefixed_name] = {
                    "name": prefixed_name,
                    "appearances": 0,
                    "totalScore": 0.0,
                    "scores": []
                }
            global_candidates[prefixed_name]["appearances"] += 1
            global_candidates[prefixed_name]["totalScore"] += candidate.get("score_final", 0.0)
            global_candidates[prefixed_name]["scores"].append(candidate.get("score_final", 0.0))

    global_merged = []
    for name, data in global_candidates.items():
        avg_score = data["totalScore"] / max(1, data["appearances"])
        global_merged.append({
            "name": name,
            "appearances": data["appearances"],
            "avgScore": round(avg_score, 4),
            "maxScore": round(max(data["scores"]), 4) if data["scores"] else 0.0,
        })
    global_merged.sort(key=lambda x: (-x["avgScore"], -x["appearances"]))

    return per_icon_details, global_merged
