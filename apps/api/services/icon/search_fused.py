#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
search_fused.py — Image+Text retrieval
Return: List[str] of svg filenames (deduped across queries, order-preserving).
"""

from __future__ import annotations
from pathlib import Path
import re
from typing import List, Dict, Any, Tuple
import json
import faiss
import numpy as np

INDEX_NAME = "SigLIP2.faiss"
TOPK = 50
TOPM = 1
ALPHA = 0.8  # fused = ALPHA * sim_img + (1-ALPHA) * sim_txt


def _to_pascal(s: str) -> str:
    parts = [p for p in re.split(r"[^a-zA-Z0-9]+", s or "") if p]
    return "".join(p[:1].upper() + p[1:] for p in parts)


def _normalize_name_from_src(src: str) -> str:
    """Normalize a display name from src_svg path.
    Rules:
    - strip extension
    - ensure prefix sf: or lucide:
      - if lucide → PascalCase token (matches lucide-react keys)
      - if sf → keep dot-separated token
    - if no prefix present: dot → sf:, else lucide: with PascalCase
    """
    name = Path(src).name
    stem = Path(name).stem  # may include prefix like 'sf:moon.stars.fill'
    if ":" in stem:
        prefix, token = stem.split(":", 1)
        prefix = prefix.strip().lower()
        if prefix == "lucide":
            return f"lucide:{_to_pascal(token)}"
        if prefix == "sf":
            return f"sf:{token}"
        # unknown prefix → fall back
        stem = token
    # No explicit prefix
    if "." in stem:
        return f"sf:{stem}"
    return f"lucide:{_to_pascal(stem)}"

def load_lib(lib_root: Path) -> Tuple[Any, List[Dict[str, Any]], np.ndarray, np.ndarray]:
    lib_root = Path(lib_root)
    index = faiss.read_index(str((lib_root / "indices" / INDEX_NAME).as_posix()))
    lib_img = np.load(lib_root / "features" / "features_SigLIP2.npy").astype("float32")
    lib_txt_path = lib_root / "features" / "features_text_SigLIP2.npy"
    if not lib_txt_path.exists():
        raise SystemExit("Missing features_text_SigLIP2.npy")
    
    lib_txt = np.load(lib_txt_path).astype("float32")
    items_path = lib_root / "features" / "items.json"
    if not items_path.exists():
        raise SystemExit("Missing features/items.json (aligned with features rows)")

    items = json.loads(items_path.read_text(encoding="utf-8"))
    if len(items) != len(lib_img) or len(items) != len(lib_txt):
        raise SystemExit("Length mismatch among items.json, features_SigLIP2.npy, features_text_SigLIP2.npy")

    return index, items, lib_img, lib_txt


def _rerank_in_K(
    idxs: List[int],
    q_img_vec: np.ndarray,  # (1, D)
    q_txt_vec: np.ndarray,  # (1, D)
    lib_img: np.ndarray,    # (N, D)
    lib_txt: np.ndarray,    # (N, D)
    alpha: float
):
    q_img_1d = q_img_vec.reshape(-1)
    q_txt_1d = q_txt_vec.reshape(-1)
    sim_img = lib_img[idxs] @ q_img_1d
    sim_txt = lib_txt[idxs] @ q_txt_1d
    fused = alpha * sim_img + (1.0 - alpha) * sim_txt
    order = np.argsort(-fused)
    return order, sim_img, sim_txt, fused

def _process_one_query(
    q_img_vec: np.ndarray,        # (1, D)
    q_txt_vec: np.ndarray,        # (1, D)
    index: Any,
    lib_img: np.ndarray,
    lib_txt: np.ndarray,
    items: List[Dict[str, Any]],
    topk: int,
    topm: int,
    alpha: float,
):
    faiss.normalize_L2(q_img_vec)
    faiss.normalize_L2(q_txt_vec)
    K = min(topk, index.ntotal)
    if K <= 0:
        return []

    D, I = index.search(q_img_vec, K)
    idxs = [i for i in I[0].tolist() if i != -1]
    if not idxs:
        return []

    order, sim_img, sim_txt, fused = _rerank_in_K(idxs, q_img_vec, q_txt_vec, lib_img, lib_txt, alpha)
    # Fused (topm)
    m = max(1, min(topm, len(order)))
    hits_fused = []
    for rank in range(m):
        j = int(order[rank])
        idx = idxs[j]
        info = items[idx] if 0 <= idx < len(items) else {}
        hits_fused.append({
            "rank": rank + 1,
            "src_svg": info.get("src_svg"),
            "component_id": info.get("component_id"),
            "aliases": info.get("aliases"),
            "score_img": float(sim_img[j]),
            "score_txt": float(sim_txt[j]),
            "score_final": float(fused[j]),
        })

    # Image-only top 10 within the same topK pool
    order_img = np.argsort(-sim_img)
    m_img = min(10, len(order_img))
    hits_img_only = []
    for rank in range(m_img):
        j = int(order_img[rank])
        idx = idxs[j]
        info = items[idx] if 0 <= idx < len(items) else {}
        hits_img_only.append({
            "rank": rank + 1,
            "src_svg": info.get("src_svg"),
            "component_id": info.get("component_id"),
            "aliases": info.get("aliases"),
            "score_img": float(sim_img[j]),
        })
    return hits_fused, hits_img_only

__all__ = [
    "retrieve_svg_filenames_with_dual_details",
]


def retrieve_svg_filenames_with_dual_details(
    *,
    lib_root: Path,
    q_ids: List[str],
    q_img_all: np.ndarray,  # (Q, D)
    q_txt_all: np.ndarray,  # (Q, D)
    topk: int = TOPK,
    topm: int = TOPM,
    alpha: float = ALPHA,
) -> Tuple[List[str], List[List[Dict[str, Any]]], List[List[Dict[str, Any]]]]:
    if q_img_all is None or q_txt_all is None:
        raise ValueError("q_img_all and q_txt_all must be provided.")
    if len(q_img_all) != len(q_txt_all) or len(q_img_all) != len(q_ids):
        raise ValueError("Length mismatch: q_ids, q_img_all, q_txt_all must align.")

    index, items, lib_img, lib_txt = load_lib(Path(lib_root))
    svg_names: List[str] = []
    fused_hits_all: List[List[Dict[str, Any]]] = []
    img_only_hits_all: List[List[Dict[str, Any]]] = []
    Q = len(q_ids)
    for i in range(Q):
        q_img = q_img_all[i].reshape(1, -1).astype("float32")
        q_txt = q_txt_all[i].reshape(1, -1).astype("float32")

        hits_fused, hits_img_only = _process_one_query(
            q_img_vec=q_img,
            q_txt_vec=q_txt,
            index=index,
            lib_img=lib_img,
            lib_txt=lib_txt,
            items=items,
            topk=int(topk),
            topm=int(topm),
            alpha=float(alpha),
        )

        hits_with_names = []
        for h in hits_fused:
            src = h.get("src_svg")
            if not src:
                continue
            name = _normalize_name_from_src(src)
            svg_names.append(name)
            h["name"] = name
            hits_with_names.append(h)

        hits_img_only_named = []
        for h in hits_img_only:
            src = h.get("src_svg")
            if not src:
                continue
            name = _normalize_name_from_src(src)
            h["name"] = name
            hits_img_only_named.append(h)

        fused_hits_all.append(hits_with_names)
        img_only_hits_all.append(hits_img_only_named)

    return svg_names, fused_hits_all, img_only_hits_all
