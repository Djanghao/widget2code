import io
from pathlib import Path
from PIL import Image

def preprocess_image_for_widget(image_bytes: bytes, min_target_edge: int = 1000) -> tuple[bytes, int, int, float]:
    try:
        from .icon.image_utils import preprocess_image_bytes_if_small
        image_bytes, (width, height), _ = preprocess_image_bytes_if_small(image_bytes, min_target_edge=min_target_edge)
    except Exception:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

    aspect_ratio = width / height
    return image_bytes, width, height, aspect_ratio
