#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np


_locks: Dict[str, threading.Lock] = {}
_caches: Dict[str, Any] = {}


def _get_lock(key: str) -> threading.Lock:
    lk = _locks.get(key)
    if lk is None:
        lk = threading.Lock()
        _locks[key] = lk
    return lk


def _pick_device() -> str:
    want = (os.getenv("CACHE_DEVICE") or "auto").strip().lower()
    if want == "cpu":
        return "cpu"
    try:
        import torch  # type: ignore
        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def get_blip2(model_id: str):
    """Return (model, processor, device) for BLIP2, cached by model_id and device."""
    device = _pick_device()
    key = f"blip2::{model_id}::{device}"
    if key in _caches:
        return _caches[key]
    lk = _get_lock(key)
    with lk:
        if key in _caches:
            return _caches[key]
        from transformers import Blip2Processor, Blip2ForConditionalGeneration  # type: ignore
        import torch  # type: ignore

        torch_dtype = torch.float16 if (device == "cuda") else torch.float32
        processor = Blip2Processor.from_pretrained(model_id, use_fast=True)
        device_map = {"": 0} if device == "cuda" else {"": "cpu"}
        model = Blip2ForConditionalGeneration.from_pretrained(
            model_id,
            torch_dtype=torch_dtype,
            device_map=device_map,
            low_cpu_mem_usage=True,
        ).eval()

        tok = processor.tokenizer
        if getattr(tok, "pad_token_id", None) is None and getattr(tok, "eos_token_id", None) is not None:
            tok.pad_token_id = tok.eos_token_id
        if getattr(model, "config", None) is not None:
            model.config.pad_token_id = tok.pad_token_id
            model.config.eos_token_id = tok.eos_token_id
        if getattr(model, "generation_config", None) is not None:
            model.generation_config.pad_token_id = tok.pad_token_id
            model.generation_config.eos_token_id = tok.eos_token_id

        _caches[key] = (model, processor, device)
        return _caches[key]


def get_openclip_image(model_name: str, pretrained: str):
    """Return (model, preprocess, device) for OpenCLIP image encoder, cached by (model_name, pretrained, device)."""
    device = _pick_device()
    key = f"openclip_img::{model_name}::{pretrained}::{device}"
    if key in _caches:
        return _caches[key]
    lk = _get_lock(key)
    with lk:
        if key in _caches:
            return _caches[key]
        import open_clip  # type: ignore

        model, _, preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, device=device
        )
        model.eval()
        _caches[key] = (model, preprocess, device)
        return _caches[key]


def get_siglip_text(model_name: str, pretrained: str):
    """Return (model, tokenizer, device) for OpenCLIP text encoder, cached by (model_name, pretrained, device)."""
    device = _pick_device()
    key = f"openclip_txt::{model_name}::{pretrained}::{device}"
    if key in _caches:
        return _caches[key]
    lk = _get_lock(key)
    with lk:
        if key in _caches:
            return _caches[key]
        import open_clip  # type: ignore

        model, _, _ = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, device=device
        )
        model.eval()
        tokenizer = open_clip.get_tokenizer(model_name)
        _caches[key] = (model, tokenizer, device)
        return _caches[key]


def get_icon_lib(lib_root: Path):
    """Return (index, items, lib_img, lib_txt) cached by lib_root path."""
    root = Path(lib_root).resolve()
    key = f"iconlib::{root.as_posix()}"
    if key in _caches:
        return _caches[key]
    lk = _get_lock(key)
    with lk:
        if key in _caches:
            return _caches[key]
        import faiss  # type: ignore

        index_path = root / "indices" / "SigLIP2.faiss"
        img_path = root / "features" / "features_SigLIP2.npy"
        txt_path = root / "features" / "features_text_SigLIP2.npy"
        items_path = root / "features" / "items.json"

        index = faiss.read_index(str(index_path.as_posix()))
        lib_img = np.load(img_path).astype("float32")
        if not txt_path.exists():
            raise SystemExit("Missing features_text_SigLIP2.npy")
        lib_txt = np.load(txt_path).astype("float32")
        if not items_path.exists():
            raise SystemExit("Missing features/items.json (aligned with features rows)")
        items = json.loads(items_path.read_text(encoding="utf-8"))
        if len(items) != len(lib_img) or len(items) != len(lib_txt):
            raise SystemExit("Length mismatch among items.json, features_SigLIP2.npy, features_text_SigLIP2.npy")
        _caches[key] = (index, items, lib_img, lib_txt)
        return _caches[key]


def preload_all(*, blip2: bool = False, openclip: bool = False, siglip: bool = False, icon_lib: Path | None = None):
    """Optionally preload selected resources to reduce first-request latency."""
    if blip2:
        model_id = os.getenv("BLIP2_MODEL_ID", "Salesforce/blip2-opt-6.7b")
        try:
            get_blip2(model_id)
        except Exception:
            pass
    if openclip:
        name = os.getenv("OPENCLIP_IMAGE_MODEL", "ViT-SO400M-16-SigLIP2-384")
        pretrained = os.getenv("OPENCLIP_IMAGE_PRETRAINED", "webli")
        try:
            get_openclip_image(name, pretrained)
        except Exception:
            pass
    if siglip:
        name = os.getenv("SIGLIP_TEXT_MODEL", "ViT-SO400M-16-SigLIP2-384")
        pretrained = os.getenv("SIGLIP_TEXT_PRETRAINED", "webli")
        try:
            get_siglip_text(name, pretrained)
        except Exception:
            pass
    if icon_lib:
        try:
            get_icon_lib(icon_lib)
        except Exception:
            pass
