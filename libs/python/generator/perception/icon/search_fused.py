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
    """
    DEPRECATED: Use component_id directly instead.
    This function kept for backward compatibility.
    """
    return Path(Path(src).name).stem

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
    "retrieve_svg_filenames_from_libs_with_dual_details",
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
            name = h.get("component_id")
            if name:
                svg_names.append(name)
                h["name"] = name
                hits_with_names.append(h)

        hits_img_only_named = []
        for h in hits_img_only:
            name = h.get("component_id")
            if name:
                h["name"] = name
                hits_img_only_named.append(h)

        fused_hits_all.append(hits_with_names)
        img_only_hits_all.append(hits_img_only_named)

    return svg_names, fused_hits_all, img_only_hits_all


def retrieve_svg_filenames_from_libs_with_dual_details(
    *,
    lib_roots: List[Path],
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
    roots = [Path(r) for r in lib_roots if r]
    if not roots:
        raise ValueError("lib_roots must be a non-empty list of paths")

    libs = []
    for r in roots:
        index, items, lib_img, lib_txt = load_lib(r)
        libs.append((r, index, items, lib_img, lib_txt))

    svg_names: List[str] = []
    fused_hits_all: List[List[Dict[str, Any]]] = []
    img_only_hits_all: List[List[Dict[str, Any]]] = []

    Q = len(q_ids)
    for i in range(Q):
        q_img = q_img_all[i].reshape(1, -1).astype("float32")
        q_txt = q_txt_all[i].reshape(1, -1).astype("float32")
        faiss.normalize_L2(q_img)
        faiss.normalize_L2(q_txt)

        # Collect per-lib topK
        merged_pairs: List[Tuple[int, int]] = []  # (lib_idx, local_pos)
        per_lib_idxs: List[List[int]] = []
        per_lib_sim_img: List[np.ndarray] = []
        per_lib_sim_txt: List[np.ndarray] = []

        for lib_idx, (_root, index, items, lib_img, lib_txt) in enumerate(libs):
            K = min(int(topk), index.ntotal)
            if K <= 0:
                per_lib_idxs.append([])
                per_lib_sim_img.append(np.zeros((0,), dtype=np.float32))
                per_lib_sim_txt.append(np.zeros((0,), dtype=np.float32))
                continue
            _, I = index.search(q_img, K)
            idxs = [ii for ii in I[0].tolist() if ii != -1]
            if not idxs:
                per_lib_idxs.append([])
                per_lib_sim_img.append(np.zeros((0,), dtype=np.float32))
                per_lib_sim_txt.append(np.zeros((0,), dtype=np.float32))
                continue
            q_img_1d = q_img.reshape(-1)
            q_txt_1d = q_txt.reshape(-1)
            sim_img = lib_img[idxs] @ q_img_1d
            sim_txt = lib_txt[idxs] @ q_txt_1d
            per_lib_idxs.append(idxs)
            per_lib_sim_img.append(sim_img)
            per_lib_sim_txt.append(sim_txt)
            for j in range(len(idxs)):
                merged_pairs.append((lib_idx, j))

        if not merged_pairs:
            fused_hits_all.append([])
            img_only_hits_all.append([])
            continue

        # Build fused scores, then select global topK pool efficiently
        fused_scores: List[float] = []
        img_scores: List[float] = []
        for (lib_idx, j) in merged_pairs:
            s_img = float(per_lib_sim_img[lib_idx][j])
            s_txt = float(per_lib_sim_txt[lib_idx][j])
            img_scores.append(s_img)
            fused_scores.append(alpha * s_img + (1.0 - alpha) * s_txt)

        fused_arr = np.array(fused_scores)
        global_k = max(1, min(int(topk), len(fused_arr)))
        if len(fused_arr) > global_k:
            idx_pool = np.argpartition(-fused_arr, global_k - 1)[:global_k]
            pool_indices = idx_pool[np.argsort(-fused_arr[idx_pool])]
        else:
            pool_indices = np.argsort(-fused_arr)

        # Take fused topM from the global topK pool
        m = max(1, min(int(topm), len(pool_indices)))
        hits_fused: List[Dict[str, Any]] = []
        for rank in range(m):
            ridx = int(pool_indices[rank])
            lib_idx, local_j = merged_pairs[ridx]
            idx = per_lib_idxs[lib_idx][local_j]
            _root, _index, items, _lib_img, _lib_txt = libs[lib_idx]
            info = items[idx] if 0 <= idx < len(items) else {}
            h = {
                "rank": rank + 1,
                "src_svg": info.get("src_svg"),
                "component_id": info.get("component_id"),
                "aliases": info.get("aliases"),
                "score_img": float(per_lib_sim_img[lib_idx][local_j]),
                "score_txt": float(per_lib_sim_txt[lib_idx][local_j]),
                "score_final": float(fused_arr[ridx]),
            }
            name = h.get("component_id")
            if name:
                h["name"] = name
                svg_names.append(name)
            hits_fused.append(h)

        # Image-only Top10 from the same pool
        img_scores_arr = np.array(img_scores)
        order_img_pool = np.argsort(-img_scores_arr[pool_indices])
        m_img = min(10, len(order_img_pool))
        hits_img_only: List[Dict[str, Any]] = []
        for rank in range(m_img):
            ridx_pool = int(order_img_pool[rank])
            ridx = int(pool_indices[ridx_pool])
            lib_idx, local_j = merged_pairs[ridx]
            idx = per_lib_idxs[lib_idx][local_j]
            _root, _index, items, _lib_img, _lib_txt = libs[lib_idx]
            info = items[idx] if 0 <= idx < len(items) else {}
            h = {
                "rank": rank + 1,
                "src_svg": info.get("src_svg"),
                "component_id": info.get("component_id"),
                "aliases": info.get("aliases"),
                "score_img": float(per_lib_sim_img[lib_idx][local_j]),
            }
            name = h.get("component_id")
            if name:
                h["name"] = name
            hits_img_only.append(h)

        fused_hits_all.append(hits_fused)
        img_only_hits_all.append(hits_img_only)

    return svg_names, fused_hits_all, img_only_hits_all
