#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
search_fused.py — Image+Text retrieval
Return: List[str] of svg filenames (deduped across queries, order-preserving).
"""

from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Any, Tuple
import json
import faiss
import numpy as np

INDEX_NAME = "SigLIP2.faiss"
TOPK = 50
TOPM = 1
ALPHA = 0.8  # fused = ALPHA * sim_img + (1-ALPHA) * sim_txt


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
    m = max(1, min(topm, len(order)))
    hits = []
    for rank in range(m):
        j = int(order[rank])
        idx = idxs[j]
        info = items[idx] if 0 <= idx < len(items) else {}
        hits.append({
            "rank": rank + 1,
            "src_svg": info.get("src_svg"),
            "component_id": info.get("component_id"),
            "aliases": info.get("aliases"),
            "score_img": float(sim_img[j]),
            "score_txt": float(sim_txt[j]),
            "score_final": float(fused[j]),
        })
    return hits

def retrieve_svg_filenames(
    *,
    lib_root: Path,
    q_ids: List[str],
    q_img_all: np.ndarray,  # (Q, D)
    q_txt_all: np.ndarray,  # (Q, D)
    topk: int = TOPK,
    topm: int = TOPM,
    alpha: float = ALPHA,
) -> List[str]:
    if q_img_all is None or q_txt_all is None:
        raise ValueError("q_img_all and q_txt_all must be provided.")
    if len(q_img_all) != len(q_txt_all) or len(q_img_all) != len(q_ids):
        raise ValueError("Length mismatch: q_ids, q_img_all, q_txt_all must align.")

    index, items, lib_img, lib_txt = load_lib(Path(lib_root))
    out: List[str] = []
    Q = len(q_ids)
    for i in range(Q):
        q_img = q_img_all[i].reshape(1, -1).astype("float32")
        q_txt = q_txt_all[i].reshape(1, -1).astype("float32")

        hits = _process_one_query(
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

        for h in hits:
            src = h.get("src_svg")
            if not src:
                continue
            name = Path(src).name
            out.append(name)

    return out
