from __future__ import annotations

import io
from typing import Tuple

from PIL import Image


def preprocess_image_bytes_if_small(
    image_bytes: bytes,
    *,
    min_target_edge: int = 1000,
) -> Tuple[bytes, Tuple[int, int], bool]:
    if not isinstance(image_bytes, (bytes, bytearray)):
        raise TypeError("image_bytes must be bytes")

    with Image.open(io.BytesIO(image_bytes)) as img:
        img.load()
        orig_w, orig_h = img.size
        if orig_w >= min_target_edge or orig_h >= min_target_edge:
            return bytes(image_bytes), (orig_w, orig_h), False

        long_edge = max(orig_w, orig_h)
        if long_edge <= 0:
            return bytes(image_bytes), (orig_w, orig_h), False

        scale = float(min_target_edge) / float(long_edge)
        new_w = max(1, int(round(orig_w * scale)))
        new_h = max(1, int(round(orig_h * scale)))

        up = img.convert("RGBA") if img.mode in ("P", "LA") else img.convert("RGB")
        try:
            resample_filter = Image.Resampling.LANCZOS
        except Exception:
            resample_filter = Image.LANCZOS
        up = up.resize((new_w, new_h), resample=resample_filter)

        fmt = (img.format or "").upper().strip() or "PNG"

        buf = io.BytesIO()
        save_kwargs = {}
        if fmt == "JPEG":
            fmt = "JPEG"
            save_kwargs.update(dict(quality=95, optimize=True))
        elif fmt == "PNG":
            save_kwargs.update(dict(optimize=True))
        else:
            fmt = "PNG"
            save_kwargs.update(dict(optimize=True))

        if fmt == "JPEG" and up.mode != "RGB":
            up = up.convert("RGB")

        up.save(buf, format=fmt, **save_kwargs)
        processed = buf.getvalue()
        return processed, (new_w, new_h), True

