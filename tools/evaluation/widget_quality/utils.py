import cv2
import numpy as np
from PIL import Image
import pytesseract
from skimage.color import rgb2lab
from skimage.metrics import structural_similarity as ssim

def load_image(path):
    """Load image as normalized RGB float array."""
    img = Image.open(path).convert("RGB")
    return np.asarray(img) / 255.0

def to_gray(img):
    return cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)

def lab_color_diff(img1, img2):
    """Mean and 95p ΔE (CIEDE2000)."""
    lab1, lab2 = rgb2lab(img1), rgb2lab(img2)
    diff = np.sqrt(np.sum((lab1 - lab2) ** 2, axis=-1))
    return float(np.mean(diff)), float(np.percentile(diff, 95))

def edge_map(img):
    gray = to_gray(img)
    return cv2.Canny(gray, 100, 200)

# def margin_from_mask(mask):
#     """Return distances from content to edges (top, right, bottom, left)."""
#     rows, cols = np.where(mask > 0)
#     h, w = mask.shape
#     return [rows.min(), w - cols.max(), h - rows.max(), cols.min()]

def margin_from_mask(mask):
    """Return distances from content to edges (top, right, bottom, left)."""
    rows, cols = np.where(mask > 0)
    h, w = mask.shape

    # If mask has no content, return full margins (i.e., everything is empty)
    if len(rows) == 0 or len(cols) == 0:
        return [h, w, h, w]  # or [0, 0, 0, 0] depending on your desired behavior

    return [rows.min(), w - cols.max(), h - rows.max(), cols.min()]

def resize_to_match(gt, gen):
    """Resize generated image to GT size while preserving aspect ratio."""
    h_gt, w_gt = gt.shape[:2]
    h_gen, w_gen = gen.shape[:2]
    # Direct resize to match GT exactly
    gen_resized = cv2.resize(gen, (w_gt, h_gt), interpolation=cv2.INTER_AREA)
    return gen_resized