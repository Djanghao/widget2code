#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
query_caption.py — BLIP2 caption (bytes) → SigLIP text embedding (in-memory) → retrieve_svg_filenames
Inputs (all in-memory for queries):
    - lib_root: Path
    - q_img_all: np.ndarray (Q, D)
    - crops_bytes: List[bytes]
Outputs:
    - List[str]
"""

from __future__ import annotations
from typing import List, Optional, Tuple, Dict, Any
from pathlib import Path
import io
import os
import numpy as np
import torch
from PIL import Image
import open_clip
from transformers import Blip2Processor, Blip2ForConditionalGeneration

from .search_fused import (
    retrieve_svg_filenames_with_dual_details,
    retrieve_svg_filenames_from_libs_with_dual_details,
)

BLIP2_MODEL_ID = "Salesforce/blip2-opt-6.7b"
BLIP2_MAX_NEW_TOKENS = 32
BLIP2_NUM_BEAMS = 4
SIGLIP_MODEL_NAME = "ViT-SO400M-16-SigLIP2-384"
SIGLIP_PRETRAINED = "webli"
EMB_BATCH = 64

def build_blip2(model_id: str = BLIP2_MODEL_ID):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32
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
    return model, processor, device

def caption_from_bytes_list(crops_bytes: List[bytes],
                            pipe: Tuple[Blip2ForConditionalGeneration, Blip2Processor, str]) -> List[str]:
    model, processor, device = pipe
    caps: List[str] = []
    with torch.no_grad():
        for b in crops_bytes:
            image = Image.open(io.BytesIO(b)).convert("RGB")
            inputs = processor(images=image, return_tensors="pt")
            inputs = {k: (v.to(model.device) if hasattr(v, "to") else v) for k, v in inputs.items()}
            out_ids = model.generate(
                **inputs,
                max_new_tokens=BLIP2_MAX_NEW_TOKENS,
                num_beams=BLIP2_NUM_BEAMS,
                do_sample=False,
            )
            text = processor.tokenizer.batch_decode(out_ids, skip_special_tokens=True)[0].strip()
            caps.append(text)
    return caps

def load_siglip_text():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, _ = open_clip.create_model_and_transforms(
        SIGLIP_MODEL_NAME, pretrained=SIGLIP_PRETRAINED, device=device
    )
    model.eval()
    tokenizer = open_clip.get_tokenizer(SIGLIP_MODEL_NAME)
    return model, tokenizer, device

def encode_texts_siglip(model, tokenizer, device: str, texts: List[str]) -> np.ndarray:
    embs: List[np.ndarray] = []
    batch: List[str] = []
    with torch.no_grad():
        for t in texts:
            batch.append(t)
            if len(batch) == EMB_BATCH:
                toks = tokenizer(batch).to(device)
                feat = model.encode_text(toks)
                feat = feat / feat.norm(dim=-1, keepdim=True)
                embs.append(feat.detach().cpu().numpy())
                batch = []
        if batch:
            toks = tokenizer(batch).to(device)
            feat = model.encode_text(toks)
            feat = feat / feat.norm(dim=-1, keepdim=True)
            embs.append(feat.detach().cpu().numpy())
    return np.concatenate(embs, axis=0).astype("float32")

# Public API
__all__ = [
    "caption_embed_and_retrieve_svgs_with_dual_details",
]


def caption_embed_and_retrieve_svgs_with_dual_details(
    *,
    lib_roots: List[Path],
    q_img_all: np.ndarray,
    crops_bytes: List[bytes],
    topk: int = 50,
    topm: int = 10,
    alpha: float = 0.8,
) -> Tuple[List[str], List[str], List[List[Dict[str, Any]]], List[List[Dict[str, Any]]]]:
    if q_img_all is None or not isinstance(q_img_all, np.ndarray):
        raise ValueError("q_img_all must be a numpy array of precomputed image embeddings.")
    if len(crops_bytes) != len(q_img_all):
        raise ValueError(f"Length mismatch: len(crops_bytes)={len(crops_bytes)} vs len(q_img_all)={len(q_img_all)}")

    blip2_pipe = build_blip2(BLIP2_MODEL_ID)
    captions = caption_from_bytes_list(crops_bytes, blip2_pipe)

    tmodel, tokenizer, tdevice = load_siglip_text()
    q_txt_all = encode_texts_siglip(tmodel, tokenizer, tdevice, captions)

    q_ids = [f"q{i:04d}" for i in range(len(crops_bytes))]

    if len(lib_roots) == 1:
        svg_names, hits_fused_all, hits_img_only_all = retrieve_svg_filenames_with_dual_details(
            lib_root=lib_roots[0],
            q_ids=q_ids,
            q_img_all=q_img_all.astype("float32"),
            q_txt_all=q_txt_all.astype("float32"),
            topk=topk,
            topm=topm,
            alpha=alpha,
        )
    else:
        svg_names, hits_fused_all, hits_img_only_all = retrieve_svg_filenames_from_libs_with_dual_details(
            lib_roots=lib_roots,
            q_ids=q_ids,
            q_img_all=q_img_all.astype("float32"),
            q_txt_all=q_txt_all.astype("float32"),
            topk=topk,
            topm=topm,
            alpha=alpha,
        )
    return svg_names, captions, hits_fused_all, hits_img_only_all
