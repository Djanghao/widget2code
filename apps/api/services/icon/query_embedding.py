#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
query_from_coco_api.py — in-memory COCO → crops → SigLIP img embeds → caption+retrieve svgs

Changes in this version:
  - Outline generation aligned with library side: overscan + ROI reflect padding + morphological gradient + robust Canny
  - Alpha threshold uses >= 128
  - BORDER_ERODE default 3
"""

from __future__ import annotations
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import io
import numpy as np
import torch
import cv2
from PIL import Image, ImageOps
import open_clip

from query_caption import caption_embed_and_retrieve_svgs, caption_embed_and_retrieve_svgs_with_details

MODEL_NAME = "ViT-SO400M-16-SigLIP2-384"
PRETRAINED = "webli"

TARGET = 256
PAD_RATIO = 0.1
EXPAND_RATIO = 0.15

ALPHA_THR = 128              # alpha >= 128 counts as foreground
OVERSCAN_PX = 10             # extra border to prevent edge clipping
EDGE_THRESH = 60
BORDER_ERODE = 3             # use 3 for more coherent alpha boundary strokes
EDGE_DILATE = 3
EDGE_BORDER_SUPPRESS = 4     # suppress Canny responses near ROI borders
MIN_COMPONENT_AREA_FRAC = 0.0008

def crop_with_bbox(img: Image.Image, bbox: Tuple[float, float, float, float]) -> Optional[Image.Image]:
    x, y, w, h = bbox
    cx, cy = x + w / 2.0, y + h / 2.0
    w2, h2 = w * (1 + EXPAND_RATIO), h * (1 + EXPAND_RATIO)
    x0 = int(max(0, round(cx - w2 / 2.0)))
    y0 = int(max(0, round(cy - h2 / 2.0)))
    x1 = int(min(img.width,  round(cx + w2 / 2.0)))
    y1 = int(min(img.height, round(cy + h2 / 2.0)))
    if x1 <= x0 or y1 <= y0:
        return None
    return img.crop((x0, y0, x1, y1))

def _fit_center_rgba_with_overscan(
    crop_rgba: Image.Image,
    target: int = TARGET,
    pad_ratio: float = PAD_RATIO,
    overscan_px: int = OVERSCAN_PX,
) -> tuple[Image.Image, tuple[int, int, int, int], tuple[int, int, int, int]]:
    big = target + 2 * overscan_px
    inner = int(round(target * (1 - 2 * pad_ratio)))
    fit = ImageOps.contain(crop_rgba, (inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    off = ((big - fit.width) // 2, (big - fit.height) // 2)
    canvas.paste(fit, off)
    x0, y0 = off
    x1, y1 = x0 + fit.width, y0 + fit.height
    vx0, vy0 = overscan_px, overscan_px
    vx1, vy1 = big - overscan_px, big - overscan_px
    return canvas, (x0, y0, x1, y1), (vx0, vy0, vx1, vy1)

def to_outline_bw(
    crop: Image.Image,
    target: int = TARGET,
    pad_ratio: float = PAD_RATIO,
    edge_thresh: int = EDGE_THRESH,
    border_erode: int = BORDER_ERODE,
    edge_dilate: int = EDGE_DILATE,
    edge_border_suppress: int = EDGE_BORDER_SUPPRESS,
    overscan_px: int = OVERSCAN_PX,
    alpha_thr: int = ALPHA_THR,
) -> Image.Image:
    canvas_rgba, (fx0, fy0, fx1, fy1), (vx0, vy0, vx1, vy1) = _fit_center_rgba_with_overscan(
        crop.convert("RGBA"), target=target, pad_ratio=pad_ratio, overscan_px=overscan_px
    )
    rgba = np.array(canvas_rgba)
    a = rgba[..., 3]
    rgb = rgba[..., :3]
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    sil = (a >= alpha_thr).astype(np.uint8) * 255
    alpha_roi = a[fy0:fy1, fx0:fx1]
    has_alpha_structure = (
        alpha_roi.size > 0
        and (alpha_roi.min() < alpha_thr)
        and (alpha_roi.max() >= alpha_thr)
        and np.any((alpha_roi > 0) & (alpha_roi < 255))
    )
    if has_alpha_structure:
        k_border = cv2.getStructuringElement(
            cv2.MORPH_RECT, (max(1, border_erode), max(1, border_erode))
        )
        alpha_edge = cv2.morphologyEx(sil, cv2.MORPH_GRADIENT, k_border)
        r = int(edge_border_suppress)
        if r > 0:
            alpha_edge[:fy0 + r, :] = 0
            alpha_edge[fy1 - r:, :] = 0
            alpha_edge[:, :fx0 + r] = 0
            alpha_edge[:, fx1 - r:] = 0
    else:
        alpha_edge = np.zeros_like(sil, dtype=np.uint8)

    # Canny on ROI with reflect padding
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    roi = gray[fy0:fy1, fx0:fx1]
    if roi.size == 0:
        out = np.full((target, target), 255, np.uint8)
        return Image.fromarray(out, mode="L").convert("RGB")

    roi_pad = cv2.copyMakeBorder(roi, 1, 1, 1, 1, borderType=cv2.BORDER_REFLECT_101)
    low = max(5, int(edge_thresh))
    high = max(low + 10, int(low * 3))
    edges = cv2.Canny(roi_pad, low, high, L2gradient=True)
    edges = edges[1:-1, 1:-1]

    # Suppress responses near ROI border
    r = int(edge_border_suppress)
    if r > 0 and edges.size:
        edges[:r, :] = 0
        edges[-r:, :] = 0
        edges[:, :r] = 0
        edges[:, -r:] = 0

    if edge_dilate > 1:
        k_edge = cv2.getStructuringElement(cv2.MORPH_RECT, (edge_dilate, edge_dilate))
        edges = cv2.dilate(edges, k_edge, iterations=1)

    # Merge alpha boundary and Canny edges back to the big canvas
    edge_full = np.zeros_like(sil, dtype=np.uint8)
    edge_full[fy0:fy1, fx0:fx1] = edges
    merged = cv2.add(edge_full, alpha_edge)

    # Optional small-component removal (robust for real screenshots)
    if MIN_COMPONENT_AREA_FRAC > 0:
        bin_ = (merged > 0).astype(np.uint8)
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(bin_, connectivity=8)
        area_thr = int(MIN_COMPONENT_AREA_FRAC * ((target + 2 * overscan_px) ** 2))
        keep = np.zeros_like(bin_)
        for lab in range(1, num_labels):
            if stats[lab, cv2.CC_STAT_AREA] >= area_thr:
                keep[labels == lab] = 1
        merged = (keep * 255).astype(np.uint8)

    # White background, black strokes; then crop away the overscan band
    out_big = np.full_like(sil, 255, np.uint8)
    out_big[merged > 0] = 0
    out_valid = out_big[vy0:vy1, vx0:vx1]  # (target, target)
    return Image.fromarray(out_valid, mode="L").convert("RGB")

def _load_image_model(device: str):
    model, _, preprocess = open_clip.create_model_and_transforms(
        MODEL_NAME, pretrained=PRETRAINED, device=device
    )
    model.eval()
    return model, preprocess

def _batch_encode_pils(model, preprocess, pil_images: List[Image.Image], device: str, batch: int = 64) -> np.ndarray:
    zs: List[np.ndarray] = []
    with torch.no_grad():
        for i in range(0, len(pil_images), batch):
            chunk = pil_images[i:i + batch]
            if not chunk:
                continue
            xs = [preprocess(im.convert("RGB")) for im in chunk]
            x = torch.stack(xs, dim=0).to(device)      # (B,3,H,W)
            z = model.encode_image(x)                  # (B,D)
            z = z / z.norm(dim=-1, keepdim=True)
            zs.append(z.float().cpu().numpy())
    if not zs:
        raise RuntimeError("No valid images to encode.")
    return np.vstack(zs).astype("float32")

def query_from_detections_in_memory(
    *,
    detections: List[Dict[str, Any]],
    image_bytes: bytes,
    lib_root: Path,
    filter_icon_only: bool = True,
    topk: int = 50,
    topm: int = 10,
    alpha: float = 0.8,
) -> List[str]:
    if not detections:
        return []

    base_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    color_pils: List[Image.Image] = []
    outline_pils: List[Image.Image] = []

    for det in detections:
        if filter_icon_only and str(det.get("label", "")).lower() != "icon":
            continue
        bbox = det.get("bbox")
        if not bbox or len(bbox) != 4:
            continue
        x1, y1, x2, y2 = map(float, bbox)
        if x2 < x1:
            x1, x2 = x2, x1
        if y2 < y1:
            y1, y2 = y2, y1
        w = max(1.0, x2 - x1)
        h = max(1.0, y2 - y1)
        crop = crop_with_bbox(base_img, (x1, y1, w, h))
        if crop is None:
            continue
        color_pils.append(crop.convert("RGB"))
        outline_pils.append(to_outline_bw(crop))

    if not color_pils:
        return []

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = _load_image_model(device)
    q_img_all = _batch_encode_pils(model, preprocess, outline_pils, device=device, batch=64)

    crops_bytes: List[bytes] = []
    for im in color_pils:
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        crops_bytes.append(buf.getvalue())

    svg_names = caption_embed_and_retrieve_svgs(
        lib_root=lib_root,
        q_img_all=q_img_all,
        crops_bytes=crops_bytes,
        topk=topk,
        topm=topm,
        alpha=alpha,
    )
    return svg_names


def query_from_detections_with_details(
    *,
    detections: List[Dict[str, Any]],
    image_bytes: bytes,
    lib_root: Path,
    filter_icon_only: bool = True,
    topk: int = 50,
    topm: int = 10,
    alpha: float = 0.8,
) -> Tuple[List[str], List[Dict[str, Any]]]:
    if not detections:
        return [], []

    base_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    color_pils: List[Image.Image] = []
    outline_pils: List[Image.Image] = []
    icon_detections: List[Dict[str, Any]] = []

    for det in detections:
        if filter_icon_only and str(det.get("label", "")).lower() != "icon":
            continue
        bbox = det.get("bbox")
        if not bbox or len(bbox) != 4:
            continue
        x1, y1, x2, y2 = map(float, bbox)
        if x2 < x1:
            x1, x2 = x2, x1
        if y2 < y1:
            y1, y2 = y2, y1
        w = max(1.0, x2 - x1)
        h = max(1.0, y2 - y1)
        crop = crop_with_bbox(base_img, (x1, y1, w, h))
        if crop is None:
            continue
        color_pils.append(crop.convert("RGB"))
        outline_pils.append(to_outline_bw(crop))
        icon_detections.append(det)

    if not color_pils:
        return [], []

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = _load_image_model(device)
    q_img_all = _batch_encode_pils(model, preprocess, outline_pils, device=device, batch=64)

    crops_bytes: List[bytes] = []
    for im in color_pils:
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        crops_bytes.append(buf.getvalue())

    svg_names, captions, all_hits = caption_embed_and_retrieve_svgs_with_details(
        lib_root=lib_root,
        q_img_all=q_img_all,
        crops_bytes=crops_bytes,
        topk=topk,
        topm=topm,
        alpha=alpha,
    )

    per_icon_details: List[Dict[str, Any]] = []
    for i, det in enumerate(icon_detections):
        per_icon_details.append({
            "index": i,
            "bbox": det.get("bbox"),
            "label": det.get("label"),
            "caption": captions[i] if i < len(captions) else "",
            "topCandidates": all_hits[i] if i < len(all_hits) else []
        })

    return svg_names, per_icon_details
