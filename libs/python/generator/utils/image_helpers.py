# -----------------------------------------------------------------------------
# File: image_helpers.py
# Description: Image utility functions for vision model integration
# -----------------------------------------------------------------------------

import base64
import io
import os
from typing import Dict, Any, Optional

from PIL import Image


def prepare_image_content_from_bytes(image_bytes: bytes, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Convert image bytes to the format expected by vision models.

    Args:
        image_bytes: Raw image bytes
        filename: Optional filename for MIME type inference

    Returns:
        Dict with type='image_url' and a base64-encoded data URL
    """
    mime = None

    # Try to detect MIME type from image data
    try:
        with Image.open(io.BytesIO(image_bytes)) as im:
            fmt = (im.format or "").upper()
            mime_map = {
                "JPEG": "image/jpeg",
                "PNG": "image/png",
                "WEBP": "image/webp",
                "GIF": "image/gif",
                "BMP": "image/bmp",
                "TIFF": "image/tiff",
                "TIF": "image/tiff",
            }
            mime = mime_map.get(fmt)
    except Exception:
        pass

    # Fallback to filename-based detection
    if not mime and filename:
        ext = os.path.splitext(filename)[1].lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".bmp": "image/bmp",
            ".tif": "image/tiff",
            ".tiff": "image/tiff",
        }
        mime = mime_map.get(ext, "image/png")

    # Final fallback
    if not mime:
        mime = "image/png"

    # Encode to base64 data URL
    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"

    return {"type": "image_url", "image_url": {"url": data_url}}
