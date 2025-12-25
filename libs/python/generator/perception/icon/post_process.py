#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
adjust_pixel_bboxes_memory.py
- Single image, in-memory.
- Input detections are NOT COCO; they are a list of dicts with pixel boxes:
  [{"bbox":[x1,y1,x2,y2], "label":"icon"}, ...]
- This module adjusts bboxes using local image cues (morphology + Canny),
  returns the same structure with refined pixel boxes.
"""

from __future__ import annotations
from typing import Dict, List, Tuple, Optional, Any
import json
import numpy as np
import cv2

def clamp_box(box: Tuple[int,int,int,int], W: int, H: int) -> Tuple[int,int,int,int]:
    x1, y1, x2, y2 = box
    x1 = int(round(x1)); y1 = int(round(y1)); x2 = int(round(x2)); y2 = int(round(y2))
    x1 = max(0, min(W - 1, x1))
    y1 = max(0, min(H - 1, y1))
    x2 = max(0, min(W - 1, x2))
    y2 = max(0, min(H - 1, y2))
    if x2 < x1: x1, x2 = x2, x1
    if y2 < y1: y1, y2 = y2, y1
    return x1, y1, x2, y2

def union_boxes(b1: Tuple[int,int,int,int], b2: Tuple[int,int,int,int]) -> Tuple[int,int,int,int]:
    x1 = min(b1[0], b2[0]); y1 = min(b1[1], b2[1])
    x2 = max(b1[2], b2[2]); y2 = max(b1[3], b2[3])
    return (x1, y1, x2, y2)

def box_area(box: Tuple[int,int,int,int]) -> int:
    x1,y1,x2,y2 = box
    return max(0, x2 - x1 + 1) * max(0, y2 - y1 + 1)

def iou(boxA: Tuple[int,int,int,int], boxB: Tuple[int,int,int,int]) -> float:
    xa1, ya1, xa2, ya2 = boxA
    xb1, yb1, xb2, yb2 = boxB
    xi1 = max(xa1, xb1); yi1 = max(ya1, yb1)
    xi2 = min(xa2, xb2); yi2 = min(ya2, yb2)
    if xi2 < xi1 or yi2 < yi1: return 0.0
    inter = (xi2 - xi1 + 1) * (yi2 - yi1 + 1)
    union = box_area(boxA) + box_area(boxB) - inter
    return inter / union if union > 0 else 0.0

def detect_foreground_bbox(crop_bgr: np.ndarray,
                           min_area_ratio: float = 0.001,
                           max_foreground_ratio: float = 0.95,
                           min_kernel: int = 3) -> Optional[Tuple[int,int,int,int]]:
    h, w = crop_bgr.shape[:2]
    if h == 0 or w == 0:
        return None
    area = w * h
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
    blur_k = 3 if min(w,h) < 100 else 5
    gray = cv2.GaussianBlur(gray, (blur_k, blur_k), 0)

    th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY_INV, 11, 2)
    edges = cv2.Canny(gray, 50, 150)

    ksize = max(min_kernel, int(round(min(w, h) / 100)) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (ksize, ksize))
    mask = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask = cv2.bitwise_or(mask, cv2.dilate(edges, kernel, iterations=1))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    nonzero = int(np.count_nonzero(mask))
    frac = nonzero / float(area)
    if frac > max_foreground_ratio:
        return None

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    min_area = max(1, min_area_ratio * area)
    useful = [c for c in contours if cv2.contourArea(c) >= min_area]
    if not useful:
        contours_sorted = sorted(contours, key=cv2.contourArea, reverse=True)
        if contours_sorted and cv2.contourArea(contours_sorted[0]) >= 0.5 * min_area:
            useful = [contours_sorted[0]]
        else:
            return None

    all_pts = np.vstack([c.reshape(-1,2) for c in useful])
    hull = cv2.convexHull(all_pts)
    x, y, cw, ch = cv2.boundingRect(hull)
    return (x, y, x + cw - 1, y + ch - 1)

def adjust_box_with_image(img_bgr: np.ndarray,
                          pred_box: Tuple[int,int,int,int],
                          margin_pct: float = 0.5,
                          min_area_ratio: float = 0.0005,
                          fallback_expand_pct: float = 0.15,
                          max_global_expand_ratio: float = 0.35,
                          require_iou_increase: bool = True) -> Tuple[int,int,int,int]:
    H, W = img_bgr.shape[:2]
    x1,y1,x2,y2 = pred_box
    x1, y1, x2, y2 = int(round(x1)), int(round(y1)), int(round(x2)), int(round(y2))
    bw = max(1, x2 - x1 + 1); bh = max(1, y2 - y1 + 1)

    mx = int(round(bw * margin_pct)); my = int(round(bh * margin_pct))
    cx1 = max(0, x1 - mx); cy1 = max(0, y1 - my)
    cx2 = min(W-1, x2 + mx); cy2 = min(H-1, y2 + my)

    crop = img_bgr[cy1:cy2+1, cx1:cx2+1].copy()
    fg_bbox = detect_foreground_bbox(crop, min_area_ratio=min_area_ratio)
    if fg_bbox is not None:
        fx1, fy1, fx2, fy2 = fg_bbox
        fg_box_global = (cx1 + fx1, cy1 + fy1, cx1 + fx2, cy1 + fy2)
        new_box = union_boxes(pred_box, fg_box_global)
        new_area = box_area(new_box)
        if new_area / float(W * H) > max_global_expand_ratio:
            center_x = (x1 + x2) / 2.0; center_y = (y1 + y2) / 2.0
            max_allowed_area = max_global_expand_ratio * W * H
            ar = bw / float(bh)
            new_h = int(round((max_allowed_area / ar) ** 0.5))
            new_w = int(round(new_h * ar))
            ex = max(0, int(round(new_w / 2))); ey = max(0, int(round(new_h / 2)))
            candidate = (int(center_x - ex), int(center_y - ey), int(center_x + ex), int(center_y + ey))
            candidate = clamp_box(candidate, W, H)
            if require_iou_increase and iou(candidate, pred_box) <= iou(pred_box, pred_box):
                ex2 = int(round(bw * fallback_expand_pct)); ey2 = int(round(bh * fallback_expand_pct))
                return clamp_box((x1-ex2, y1-ey2, x2+ex2, y2+ey2), W, H)
            return candidate
        return clamp_box(new_box, W, H)

    ex = int(round(bw * fallback_expand_pct)); ey = int(round(bh * fallback_expand_pct))
    return clamp_box((x1 - ex, y1 - ey, x2 + ex, y2 + ey), W, H)

def post_process_pixel_detections(
    *,
    detections: List[Dict[str, Any]],
    image_bytes: bytes,
    margin_pct: float = 0.2,
    min_area_ratio: float = 0.0005,
    fallback_expand_pct: float = 0.15,
    clamp_to_image: bool = True,
) -> List[Dict[str, Any]]:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        print("[WARN] cv2.imdecode failed; return original detections.")
        return detections

    H, W = img.shape[:2]
    out: List[Dict[str, Any]] = []
    for det in detections:
        bx = det.get("bbox")
        if not (isinstance(bx, (list, tuple)) and len(bx) == 4):
            out.append(det)
            continue

        x1, y1, x2, y2 = map(float, bx)
        x1, y1, x2, y2 = int(round(x1)), int(round(y1)), int(round(x2)), int(round(y2))
        if x2 < x1: x1, x2 = x2, x1
        if y2 < y1: y1, y2 = y2, y1
        if clamp_to_image:
            x1 = max(0, min(W - 1, x1)); y1 = max(0, min(H - 1, y1))
            x2 = max(0, min(W - 1, x2)); y2 = max(0, min(H - 1, y2))
            if x2 < x1: x1, x2 = x2, x1
            if y2 < y1: y1, y2 = y2, y1

        new_x1, new_y1, new_x2, new_y2 = adjust_box_with_image(
            img_bgr=img,
            pred_box=(x1, y1, x2, y2),
            margin_pct=margin_pct,
            min_area_ratio=min_area_ratio,
            fallback_expand_pct=fallback_expand_pct,
        )

        det_new = dict(det)
        det_new["bbox"] = [int(new_x1), int(new_y1), int(new_x2), int(new_y2)]
        out.append(det_new)

    return out
