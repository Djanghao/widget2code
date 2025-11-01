import os
from pathlib import Path
from typing import Optional

def run_icon_detection_pipeline(
    image_bytes: bytes,
    filename: Optional[str],
    model: str,
    api_key: str,
    retrieval_topk: int = 50,
    retrieval_topm: int = 10,
    retrieval_alpha: float = 0.8,
    lib_names: Optional[list[str]] = None,
    timeout: int = 300,
) -> dict:
    from datetime import datetime
    from ..utils.logger import log_to_file

    image_id = Path(filename).stem if filename else "unknown"

    grounding_raw = []
    grounding_pixel = []
    post_processed = []
    per_icon_details = []
    icon_candidates = []
    icon_count = 0
    img_width = 0
    img_height = 0

    try:
        from .icon.grounding import ground_single_image_with_stages
        from .icon.query_embedding import query_from_detections_with_details

        raw_dets, pixel_dets_pre, pixel_dets_post, img_width, img_height = ground_single_image_with_stages(
            image_bytes=image_bytes,
            filename=filename,
            model=model,
            api_key=api_key,
            timeout=timeout,
        )

        grounding_raw = raw_dets
        grounding_pixel = pixel_dets_pre
        post_processed = pixel_dets_post

        icon_dets = [d for d in pixel_dets_post if str(d.get("label", "")).lower() == "icon"]
        icon_count = len(icon_dets)

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ✅ Icon grounding: {icon_count} icons")

        # Resolve library roots from repo paths. If none provided, default to SF library.
        here = Path(__file__).resolve()
        repo_root = here.parents[4]  # .../llm-widget-factory
        base_embeddings_dir = repo_root / "libs" / "packages" / "icons" / "embeddings"
        default_sf_dir = base_embeddings_dir / "sf"

        if lib_names and len(lib_names) > 0:
            candidate_roots = [base_embeddings_dir / str(name) for name in lib_names]
        else:
            candidate_roots = [default_sf_dir]

        existing_roots = [p for p in candidate_roots if p.exists()]
        if existing_roots:
            svg_names, per_icon_details = query_from_detections_with_details(
                detections=pixel_dets_post,
                image_bytes=image_bytes,
                lib_roots=existing_roots,
                filter_icon_only=True,
                topk=int(retrieval_topk),
                topm=int(retrieval_topm),
                alpha=float(retrieval_alpha),
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

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ✅ Icon retrieval: {len(icon_candidates)} candidates")
    except Exception as e:
        log_to_file(f"[icon-pipeline] skipped due to: {e}")

    return {
        "grounding_raw": grounding_raw,
        "grounding_pixel": grounding_pixel,
        "post_processed": post_processed,
        "per_icon_details": per_icon_details,
        "icon_candidates": icon_candidates,
        "icon_count": icon_count,
        "img_width": img_width,
        "img_height": img_height,
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
