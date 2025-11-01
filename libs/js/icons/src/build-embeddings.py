#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_library_api.py — Scheme B library builder (no rendered_bw, no paths.json)
Outputs (under lib_root):
lib/
├─ indices/
│  └─ SigLIP2.faiss
├─ features/
│  ├─ features_SigLIP2.npy
│  ├─ features_text_SigLIP2.npy
│  └─ items.json              # row-aligned with features
└─ metadata.json              # optional (toggle via keep_metadata)
Notes:
- Renders SVG → outline (WHITE bg + BLACK strokes) in-memory, no PNG saved.
- Captions via BLIP2 (fallback to filename keywords).
- Image features: SigLIP2; Text features: SigLIP2 text tower.
- Single FAISS index for image features only (cosine via IP on normalized vecs).
"""

from __future__ import annotations
import io, json, re, math, warnings
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import multiprocessing as mp
import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageColor
import cairosvg, faiss, torch, open_clip, cv2, os

from transformers import Blip2Processor, Blip2ForConditionalGeneration

TARGET = 256
PAD_RATIO = 0.1
OVERSCAN_PX = 10        # extra margin around the canvas during edge extraction
SUPERSAMPLE = 3         # supersample factor for smoother SVG raster (2 or 3)
SVG_PAD_FRAC = 0.15     # expand SVG viewBox to avoid raster-time clipping
BATCH = 64
MODEL_NAME = "ViT-SO400M-16-SigLIP2-384"
PRETRAINED = "webli"
GLOB = "**/*.svg"
EDGE_THRESH = 40        # Canny low threshold; high = max(low+10, low*3)
BORDER_ERODE = 3        # 1/3/5 (odd). Alpha-border thickness (used by morph gradient)
EDGE_DILATE = 3         # 1/3/5 (odd). Canny edges dilation
CAPTION_MODEL_ID = "Salesforce/blip2-opt-6.7b"
CAPTION_BATCH = 4
MAX_NEW_TOKENS = 64
NUM_BEAMS = 4
STOPWORDS = {"icon", "icons", "ic"}

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def list_svgs(svg_dir: Path, pattern: str = GLOB) -> List[Path]:
    return sorted([p for p in svg_dir.glob(pattern) if p.suffix.lower()==".svg"])

def _extract_after_answer(text: str) -> str:
    if not text:
        return text
    idx = text.lower().find("answer:")
    return text[idx + len("answer:"):].strip() if idx != -1 else text.strip()

def svg_to_png_bytes_padded(svg_path: Path, raster_width_px: int, pad_frac: float = SVG_PAD_FRAC) -> bytes:
    text = svg_path.read_text(encoding="utf-8", errors="ignore")
    root = ET.fromstring(text)

    vb = root.get("viewBox")
    if vb:
        vals = [float(v) for v in vb.replace(",", " ").split() if v.strip()]
        if len(vals) == 4:
            x, y, w, h = vals
        else:
            x, y, w, h = 0.0, 0.0, float(root.get("width", 100)), float(root.get("height", 100))
    else:
        def _num(s: Optional[str]) -> float:
            if s is None:
                return 100.0
            try:
                return float("".join(ch for ch in s if (ch.isdigit() or ch in ".-")))
            except Exception:
                return 100.0
        w = _num(root.get("width"))
        h = _num(root.get("height"))
        x, y = 0.0, 0.0

    pad = pad_frac * max(w, h)
    new_w, new_h = w + 2 * pad, h + 2 * pad
    new_x, new_y = x - pad, y - pad

    ns = root.tag.split("}")[0].strip("{") if "}" in root.tag else "http://www.w3.org/2000/svg"
    new_attrib = dict(root.attrib)
    new_attrib["viewBox"] = f"{new_x} {new_y} {new_w} {new_h}"
    new_attrib["width"] = str(new_w)
    new_attrib["height"] = str(new_h)
    if "xmlns" not in new_attrib:
        new_attrib["xmlns"] = ns

    new_root = ET.Element(f"{{{ns}}}svg", new_attrib)
    g = ET.Element(f"{{{ns}}}g", {"transform": f"translate({pad},{pad})"})
    for child in list(root):
        root.remove(child)
        tag_local = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if tag_local in ("defs", "style", "title", "desc"):
            new_root.append(child)
        else:
            g.append(child)
    new_root.append(g)

    padded_svg = ET.tostring(new_root, encoding="utf-8", method="xml")
    return cairosvg.svg2png(bytestring=padded_svg, output_width=raster_width_px)

def to_outline_bw(png_rgba: bytes, target_size: int = TARGET, padding_ratio: float = PAD_RATIO) -> Image.Image:
    """Generate WHITE background + BLACK strokes using alpha border + Canny."""
    canvas_size = target_size + 2 * OVERSCAN_PX
    im = Image.open(io.BytesIO(png_rgba)).convert("RGBA")

    inner_final = int(round(target_size * (1.0 - 2 * padding_ratio)))
    fit = ImageOps.contain(im, (inner_final, inner_final), Image.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    off = ((canvas_size - fit.width)//2, (canvas_size - fit.height)//2)
    canvas.paste(fit, off)

    rgba = np.array(canvas)
    a = rgba[..., 3]
    rgb = rgba[..., :3]
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    sil = (a >= 128).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (BORDER_ERODE, BORDER_ERODE))
    border = cv2.morphologyEx(sil, cv2.MORPH_GRADIENT, k)

    x0, y0 = off
    x1, y1 = x0 + fit.width, y0 + fit.height
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    roi = gray[y0:y1, x0:x1]
    low = max(5, int(EDGE_THRESH))
    high = max(low + 10, int(low * 3))
    roi_pad = cv2.copyMakeBorder(roi, 1, 1, 1, 1, borderType=cv2.BORDER_REFLECT_101)
    edges_pad = cv2.Canny(roi_pad, low, high, L2gradient=True)
    edges = edges_pad[1:-1, 1:-1]
    if EDGE_DILATE > 1:
        kd = cv2.getStructuringElement(cv2.MORPH_RECT, (EDGE_DILATE, EDGE_DILATE))
        edges = cv2.dilate(edges, kd, iterations=1)

    edge_full = np.zeros_like(sil, dtype=np.uint8)
    edge_full[y0:y1, x0:x1] = edges

    k3 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    silhouette_boundary = cv2.morphologyEx(sil, cv2.MORPH_GRADIENT, k3)

    merged = cv2.bitwise_or(silhouette_boundary, edge_full)

    ys, xs = np.where(merged > 0)
    if xs.size and ys.size:
        cx = 0.5 * (xs.min() + xs.max())
        cy = 0.5 * (ys.min() + ys.max())
        ccx = (canvas_size - 1) / 2.0
        ccy = (canvas_size - 1) / 2.0
        dx = int(round(ccx - cx))
        dy = int(round(ccy - cy))
        if dx or dy:
            M = np.float32([[1, 0, dx], [0, 1, dy]])
            merged = cv2.warpAffine(merged, M, (canvas_size, canvas_size), flags=cv2.INTER_NEAREST, borderValue=0)

    tmp = np.full((canvas_size, canvas_size), 255, np.uint8)
    tmp[merged > 0] = 0

    out = tmp[OVERSCAN_PX:OVERSCAN_PX+target_size, OVERSCAN_PX:OVERSCAN_PX+target_size]
    return Image.fromarray(out).convert('RGB')

def extract_keywords_from_filename(p: Path) -> List[str]:
    name = p.stem
    name = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)
    name = re.sub(r'[.\-_]+', ' ', name)
    toks = [t.lower() for t in name.split() if t]
    toks2: List[str] = []
    for t in toks:
        toks2 += re.split(r'(?<=\d)(?=[a-zA-Z])|(?<=[a-zA-Z])(?=\d)', t)
    toks = [t for t in toks2 if t and t not in STOPWORDS]
    seen, uniq = set(), []
    for t in toks:
        if t not in seen:
            seen.add(t); uniq.append(t)
    return uniq

def filename_to_component_and_aliases(p: Path) -> Tuple[str, List[str]]:
    tokens = extract_keywords_from_filename(p)
    comp = f"Icon.{''.join(word.capitalize() for word in p.stem.split('.'))}"
    return comp, tokens

_COLOR_RE_HEX = re.compile(r'#([0-9a-fA-F]{3,8})')
_COLOR_RE_RGB = re.compile(r'rgb(a)?\s*\(\s*([0-9.\s%,]+)\s*\)')
_COLOR_RE_HSL = re.compile(r'hsl(a)?\s*\(\s*([0-9.\s%,]+)\s*\)')

def _to_hex(rgb_tuple) -> str:
    r, g, b = rgb_tuple[:3]
    return f'#{int(r):02x}{int(g):02x}{int(b):02x}'

def _parse_css_color(val: str) -> Optional[str]:
    val = val.strip()
    try:
        rgb = ImageColor.getrgb(val)
        return _to_hex(rgb)
    except Exception:
        pass
    m = _COLOR_RE_HEX.search(val)
    if m:
        raw = m.group(1)
        if len(raw) in (3, 4):
            raw = ''.join([c*2 for c in raw[:3]])
        if len(raw) >= 6:
            return f'#{raw[:6].lower()}'
    m = _COLOR_RE_RGB.search(val)
    if m:
        nums = [x.strip() for x in m.group(2).split(',')]
        if len(nums) >= 3:
            def _parse_chan(x):
                return float(x.strip('% ')) * 2.55 if '%' in x else float(x)
            try:
                r, g, b = [_parse_chan(x) for x in nums[:3]]
                return _to_hex((r, g, b))
            except Exception:
                pass
    m = _COLOR_RE_HSL.search(val)
    if m:
        try:
            parts = [x.strip('% ') for x in m.group(2).split(',')]
            if len(parts) >= 3:
                h = float(parts[0]); s = float(parts[1]) / 100.0; l = float(parts[2]) / 100.0
                c = (1 - abs(2*l - 1)) * s
                x = c * (1 - abs(((h/60) % 2) - 1))
                m0 = l - c/2
                if   0 <= h < 60:  rp,gp,bp = c,x,0
                elif 60 <= h <120: rp,gp,bp = x,c,0
                elif 120<= h <180: rp,gp,bp = 0,c,x
                elif 180<= h <240: rp,gp,bp = 0,x,c
                elif 240<= h <300: rp,gp,bp = x,0,c
                else:              rp,gp,bp = c,0,x
                r,g,b = (rp+m0)*255, (gp+m0)*255, (bp+m0)*255
                return _to_hex((r, g, b))
        except Exception:
            pass
    return None

def parse_svg_colors(svg_path: Path, max_colors: int = 6) -> List[str]:
    try:
        text = svg_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = svg_path.read_text(errors="ignore")
    colors: List[str] = []
    for attr in ("fill", "stroke"):
        for m in re.finditer(rf'{attr}\s*=\s*["\']([^"\']+)["\']', text, flags=re.I):
            hx = _parse_css_color(m.group(1))
            if hx and hx not in colors:
                colors.append(hx)
                if len(colors) >= max_colors:
                    return colors
    for m in re.finditer(r'style\s*=\s*["\']([^"\']+)["\']', text, flags=re.I):
        style = m.group(1)
        for kv in style.split(';'):
            if ':' in kv:
                k, v = kv.split(':', 1)
                if k.strip().lower() in ('fill', 'stroke'):
                    hx = _parse_css_color(v)
                    if hx and hx not in colors:
                        colors.append(hx)
                        if len(colors) >= max_colors:
                            return colors
    return colors

def build_caption_from_keywords(keywords: List[str]) -> str:
    if not keywords:
        return "generic icon"
    return " ".join(keywords + ["icon"])

class BLIP2Captioner:
    def __init__(self, model_id: str = CAPTION_MODEL_ID, multi_gpu: bool = False):
        self.enabled = True
        self.model = None
        self.processor = None
        try:
            if torch.cuda.is_available():
                if multi_gpu and torch.cuda.device_count() > 1:
                    device_map = "auto"
                    dtype = torch.float16
                    print(f"[BLIP2] Using multi-GPU across {torch.cuda.device_count()} visible GPUs")
                else:
                    device_map = {"": 0}
                    dtype = torch.float16
                    print(f"[BLIP2] Using GPU 0: {torch.cuda.get_device_name(0)}")
            else:
                device_map = {"": "cpu"}
                dtype = torch.float32
                print("[BLIP2] Using CPU")

            self.processor = Blip2Processor.from_pretrained(model_id, use_fast=False)
            self.model = Blip2ForConditionalGeneration.from_pretrained(
                model_id,
                torch_dtype=dtype,
                device_map=device_map
            ).eval()
        except Exception as e:
            warnings.warn(f"BLIP2 captioner load failed: {e}")
            self.enabled = False

    @torch.no_grad()
    def caption_image(self, img: Image.Image) -> Optional[str]:
        if not self.enabled or self.model is None or self.processor is None:
            return None
        try:
            inputs = self.processor(images=img, return_tensors="pt")
            inputs = {k: (v.to(self.model.device) if hasattr(v, "to") else v) for k, v in inputs.items()}
            gen_ids = self.model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                num_beams=NUM_BEAMS,
                do_sample=False,
            )
            text = self.processor.batch_decode(gen_ids, skip_special_tokens=True)[0].strip()
            text = _extract_after_answer(text)
            return text if text else None
        except Exception as e:
            warnings.warn(f"BLIP2 caption failed: {e}")
            return None

def load_openclip(device: Optional[str] = None, multi_gpu: bool = False):
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms(MODEL_NAME, pretrained=PRETRAINED, device=device)
    model.eval()
    if device == "cuda" and multi_gpu and torch.cuda.device_count() > 1:
        try:
            model = torch.nn.DataParallel(model)
            print(f"[OpenCLIP] DataParallel over {torch.cuda.device_count()} visible GPUs")
        except Exception:
            pass
    return model, preprocess

def load_openclip_text_tokenizer(model_name: str = MODEL_NAME):
    return open_clip.get_tokenizer(model_name)

def embed_images_from_pils(model, preprocess, pil_images: List[Image.Image]) -> np.ndarray:
    embs, batch = [], []
    with torch.no_grad():
        for im in pil_images:
            batch.append(preprocess(im.convert("RGB")))
            if len(batch) == BATCH:
                dev = next(model.parameters()).device if hasattr(model, "parameters") else torch.device("cuda" if torch.cuda.is_available() else "cpu")
                tens = torch.stack(batch).to(dev)
                encode_image = getattr(model, 'module', model).encode_image
                feat = encode_image(tens)
                feat = feat / feat.norm(dim=-1, keepdim=True)
                embs.append(feat.cpu().numpy()); batch = []
        if batch:
            dev = next(model.parameters()).device if hasattr(model, "parameters") else torch.device("cuda" if torch.cuda.is_available() else "cpu")
            tens = torch.stack(batch).to(dev)
            encode_image = getattr(model, 'module', model).encode_image
            feat = encode_image(tens)
            feat = feat / feat.norm(dim=-1, keepdim=True)
            embs.append(feat.cpu().numpy())
    return np.concatenate(embs, axis=0).astype("float32")

def embed_texts(model, tokenizer, texts: List[str]) -> np.ndarray:
    embs, batch_txt = [], []
    with torch.no_grad():
        for t in texts:
            batch_txt.append(t)
            if len(batch_txt) == BATCH:
                dev = next(model.parameters()).device if hasattr(model, "parameters") else torch.device("cuda" if torch.cuda.is_available() else "cpu")
                toks = tokenizer(batch_txt).to(dev)
                encode_text = getattr(model, 'module', model).encode_text
                feat = encode_text(toks)
                feat = feat / feat.norm(dim=-1, keepdim=True)
                embs.append(feat.cpu().numpy()); batch_txt = []
        if batch_txt:
            dev = next(model.parameters()).device if hasattr(model, "parameters") else torch.device("cuda" if torch.cuda.is_available() else "cpu")
            toks = tokenizer(batch_txt).to(dev)
            encode_text = getattr(model, 'module', model).encode_text
            feat = encode_text(toks)
            feat = feat / feat.norm(dim=-1, keepdim=True)
            embs.append(feat.cpu().numpy())
    return np.concatenate(embs, axis=0).astype("float32")

def build_faiss_cosine(vecs: np.ndarray) -> faiss.Index:
    v = vecs.astype("float32", copy=True)
    faiss.normalize_L2(v)
    index = faiss.IndexFlatIP(v.shape[1])
    index.add(v)
    return index

def _blip2_worker_run(img_bytes_list: List[bytes], model_id: str, gpu_id: Optional[int], batch: int = CAPTION_BATCH) -> List[str]:
    # Pin this worker to a single GPU BEFORE importing/using torch.cuda
    if gpu_id is not None:
        os.environ["CUDA_VISIBLE_DEVICES"] = str(gpu_id)
    try:
        from transformers import Blip2Processor, Blip2ForConditionalGeneration
        import torch as _t
        device = "cuda" if _t.cuda.is_available() else "cpu"
        dtype = _t.float16 if device == "cuda" else _t.float32
        proc = Blip2Processor.from_pretrained(model_id, use_fast=False)
        # Single-device placement to avoid accelerate warnings
        device_map = {"": 0} if device == "cuda" else {"": "cpu"}
        model = Blip2ForConditionalGeneration.from_pretrained(
            model_id, torch_dtype=dtype, device_map=device_map
        ).eval()
        # pad/eos safety
        tok = proc.tokenizer
        if getattr(tok, "pad_token_id", None) is None and getattr(tok, "eos_token_id", None) is not None:
            tok.pad_token_id = tok.eos_token_id
        if getattr(model, "config", None) is not None:
            model.config.pad_token_id = tok.pad_token_id
            model.config.eos_token_id = tok.eos_token_id
        if getattr(model, "generation_config", None) is not None:
            model.generation_config.pad_token_id = tok.pad_token_id
            model.generation_config.eos_token_id = tok.eos_token_id

        outs: List[str] = []
        with torch.no_grad():
            for i in range(0, len(img_bytes_list), batch):
                chunk = img_bytes_list[i:i+batch]
                if not chunk:
                    continue
                imgs = [Image.open(io.BytesIO(b)).convert("RGB") for b in chunk]
                inputs = proc(images=imgs, return_tensors="pt")
                if device == "cuda":
                    inputs = {k: v.to("cuda") if hasattr(v, "to") else v for k, v in inputs.items()}
                gen = model.generate(
                    **inputs,
                    max_new_tokens=MAX_NEW_TOKENS,
                    num_beams=NUM_BEAMS,
                    do_sample=False,
                )
                texts = proc.batch_decode(gen, skip_special_tokens=True)
                outs.extend([_extract_after_answer(t.strip()) for t in texts])
        return outs[:len(img_bytes_list)]
    except Exception as e:
        warnings.warn(f"BLIP2 worker on GPU {gpu_id} failed: {e}")
        return [""] * len(img_bytes_list)


def _caption_images_multiproc(color_pngs: List[bytes], gpu_ids: List[int], model_id: str = CAPTION_MODEL_ID) -> List[str]:
    if not color_pngs:
        return []
    n_workers = max(1, min(len(gpu_ids), len(color_pngs)))
    shards: List[List[bytes]] = [[] for _ in range(n_workers)]
    for i, b in enumerate(color_pngs):
        shards[i % n_workers].append(b)
    ctx = mp.get_context("spawn")
    with ctx.Pool(processes=n_workers) as pool:
        results = pool.starmap(_blip2_worker_run, [
            (shards[i], model_id, gpu_ids[i]) for i in range(n_workers)
        ])
    outs = [None] * len(color_pngs)
    positions = [0] * n_workers
    for idx in range(len(color_pngs)):
        w = idx % n_workers
        pos = positions[w]
        positions[w] += 1
        try:
            outs[idx] = results[w][pos]
        except Exception:
            outs[idx] = ""
    return [o or "" for o in outs]


def build_library_inplace(
    svg_dir: Path,
    lib_root: Path,
    *,
    keep_metadata: bool = True,
    pattern: str = GLOB,
    multi_gpu: bool = False,
    gpu_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    svg_dir = Path(svg_dir)
    lib_root = Path(lib_root)
    feat_dir = lib_root / "features"
    index_dir = lib_root / "indices"
    ensure_dir(feat_dir); ensure_dir(index_dir)

    svgs = list_svgs(svg_dir, pattern=pattern)
    if not svgs:
        raise SystemExit(f"No SVGs found in {svg_dir} with pattern {GLOB}")

    use_multi_proc_caption = bool(multi_gpu and gpu_ids and len(gpu_ids) > 1)
    capper = None if use_multi_proc_caption else BLIP2Captioner(CAPTION_MODEL_ID, multi_gpu=False)
    bw_pils: List[Image.Image] = []
    captions: List[str] = []
    items: List[Dict[str, Any]] = []
    metadata_full: Dict[str, Any] = {}
    color_pngs: List[bytes] = []

    for i, sp in enumerate(svgs, 1):
        rel = sp.relative_to(svg_dir)
        inner_final = int(round(TARGET * (1.0 - 2 * PAD_RATIO)))
        raster_w = max(inner_final * SUPERSAMPLE, TARGET)
        png_bytes = svg_to_png_bytes_padded(sp, raster_width_px=raster_w, pad_frac=SVG_PAD_FRAC)
        bw = to_outline_bw(png_bytes)
        bw_pils.append(bw)

        comp, aliases = filename_to_component_and_aliases(sp)
        colors = parse_svg_colors(sp)

        def raster_svg_to_centered_rgb(png_rgba_bytes: bytes,
                                       target: int, pad_ratio: float,
                                       bg_rgb=(0,0,0),
                                       alpha_thr: int = 1) -> Image.Image:
            im = Image.open(io.BytesIO(png_rgba_bytes)).convert("RGBA")
            arr = np.array(im)
            a = arr[..., 3]
            ys, xs = np.where(a > alpha_thr)
            if xs.size == 0 or ys.size == 0:
                inner = int(round(target * (1 - 2 * pad_ratio)))
                fit = ImageOps.contain(im, (inner, inner), Image.LANCZOS)
                canvas = Image.new("RGB", (target, target), bg_rgb)
                tmp = Image.new("RGB", fit.size, bg_rgb)
                tmp.paste(fit, mask=fit.split()[-1])
                off = ((target - fit.width)//2, (target - fit.height)//2)
                canvas.paste(tmp, off)
                return canvas
            x0, x1 = xs.min(), xs.max() + 1
            y0, y1 = ys.min(), ys.max() + 1
            x0 = max(0, x0 - 1); y0 = max(0, y0 - 1)
            x1 = min(im.width,  x1 + 1); y1 = min(im.height, y1 + 1)
            tight_rgba = im.crop((x0, y0, x1, y1))
            inner = int(round(target * (1 - 2 * pad_ratio)))
            fit = ImageOps.contain(tight_rgba, (inner, inner), Image.LANCZOS)
            fit_rgb = Image.new("RGB", fit.size, bg_rgb)
            fit_rgb.paste(fit, mask=fit.split()[-1])
            canvas = Image.new("RGB", (target, target), bg_rgb)
            off = ((target - fit.width)//2, (target - fit.height)//2)
            canvas.paste(fit_rgb, off)
            return canvas

        color_img = raster_svg_to_centered_rgb(png_bytes, target=TARGET, pad_ratio=PAD_RATIO, bg_rgb=(255, 255, 255))
        if use_multi_proc_caption:
            buf = io.BytesIO(); color_img.save(buf, format="PNG"); color_pngs.append(buf.getvalue())
            cap = ""
        else:
            cap = capper.caption_image(color_img) if (capper and capper.enabled) else None
            if not cap or not cap.strip():
                cap = build_caption_from_keywords(aliases)

        items.append({
            "src_svg": str(sp.as_posix()),
            "component_id": comp,
            "aliases": aliases,
            "caption": cap,
            "colors": colors,
        })

        if keep_metadata:
            metadata_full[str(sp.as_posix())] = {
                "component_id": comp,
                "aliases": aliases,
                "colors": colors,
                "caption": cap
            }

        if i % 500 == 0:
            print(f"[render+caption] {i}/{len(svgs)}")

    if use_multi_proc_caption and color_pngs:
        assert gpu_ids is not None
        print(f"[BLIP2] Multiprocess captioning on GPUs: {','.join(map(str,gpu_ids))}")
        caps = _caption_images_multiproc(color_pngs, gpu_ids, CAPTION_MODEL_ID)
        for idx, cap in enumerate(caps):
            if not cap or not cap.strip():
                cap = build_caption_from_keywords(items[idx]["aliases"]) if idx < len(items) else ""
            items[idx]["caption"] = cap
            if keep_metadata:
                sp = Path(items[idx]["src_svg"])
                metadata_full[str(sp.as_posix())]["caption"] = cap

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = load_openclip(device=device, multi_gpu=multi_gpu)

    embs_img = embed_images_from_pils(model, preprocess, bw_pils)
    np.save(feat_dir / "features_SigLIP2.npy", embs_img)

    tokenizer = load_openclip_text_tokenizer(MODEL_NAME)
    embs_txt = embed_texts(model, tokenizer, texts=[it["caption"] for it in items])
    np.save(feat_dir / "features_text_SigLIP2.npy", embs_txt)

    (feat_dir / "items.json").write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")

    if keep_metadata:
        (lib_root / "metadata.json").write_text(json.dumps(metadata_full, ensure_ascii=False, indent=2), encoding="utf-8")

    index_img = build_faiss_cosine(embs_img)
    faiss.write_index(index_img, str((index_dir / "SigLIP2.faiss").as_posix()))

    summary = {
        "svg_count": len(svgs),
        "features_image_shape": tuple(embs_img.shape),
        "features_text_shape": tuple(embs_txt.shape),
        "out": {
            "features_SigLIP2": str((feat_dir / "features_SigLIP2.npy").as_posix()),
            "features_text_SigLIP2": str((feat_dir / "features_text_SigLIP2.npy").as_posix()),
            "items_json": str((feat_dir / "items.json").as_posix()),
            "faiss_index": str((index_dir / "SigLIP2.faiss").as_posix()),
            "metadata_json": str((lib_root / "metadata.json").as_posix()) if keep_metadata else None,
        }
    }
    print("\n[OK] Scheme-B Library built:")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return summary

def main(argv: Optional[List[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(
        prog="build_library.py",
        description=(
            "Builds the icon embedding library (features, FAISS index, items.json).\n"
            "Input is a directory tree of SVGs; output is a lib root containing\n"
            "features/, indices/, and items.json (and optional metadata.json)."
        ),
    )
    parser.add_argument(
        "svg_dir",
        type=str,
        help="Directory containing source SVG files (scanned recursively).",
    )
    parser.add_argument(
        "lib_root",
        type=str,
        help="Output directory for the generated library (will be created).",
    )
    parser.add_argument(
        "--pattern",
        default=GLOB,
        help=f"Glob used to discover SVGs relative to svg_dir (default: {GLOB}).",
    )
    parser.add_argument(
        "--no-metadata",
        action="store_true",
        help="Skip writing metadata.json at the lib root.",
    )
    parser.add_argument(
        "--gpus",
        type=str,
        default=None,
        help="Comma-separated GPU indices to make visible (e.g., '0,1,2,3'). If provided and multiple GPUs are visible, BLIP2 will use device_map=auto and OpenCLIP image encoding will use DataParallel.",
    )

    args = parser.parse_args(argv)

    try:
        multi_gpu = False
        gpu_ids: Optional[List[int]] = None
        if args.gpus:
            parts = [s.strip() for s in str(args.gpus).split(",") if s.strip()]
            try:
                gpu_ids = [int(x) for x in parts]
            except Exception:
                gpu_ids = None
            gspec = ",".join(parts)
            os.environ["CUDA_VISIBLE_DEVICES"] = gspec
            print(f"[GPU] Restricted visible GPUs to: {gspec}")
            try:
                import torch as _t
                multi_gpu = _t.cuda.is_available() and (len(parts) > 1)
                if multi_gpu:
                    print(f"[GPU] Multi-GPU configured over {len(parts)} devices")
            except Exception:
                multi_gpu = False

        build_library_inplace(
            Path(args.svg_dir),
            Path(args.lib_root),
            keep_metadata=(not args.no_metadata),
            pattern=args.pattern,
            multi_gpu=multi_gpu,
            gpu_ids=gpu_ids,
        )
        return 0
    except SystemExit as e:
        return int(e.code) if isinstance(e.code, int) else 1
    except Exception as e:
        print(f"[ERROR] {e}")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
