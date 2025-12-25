import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
import pytesseract
import lpips
import torch

# -------- CONFIG --------
ref_path = "widget.png"
gen_path = "qwen.png"

# Load images
ref_img = cv2.imread(ref_path)
gen_img = cv2.imread(gen_path)

# Resize to same dimensions
h, w = ref_img.shape[:2]
gen_img = cv2.resize(gen_img, (w, h))

# -------- 1. SSIM --------
gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
gray_gen = cv2.cvtColor(gen_img, cv2.COLOR_BGR2GRAY)
ssim_score, _ = ssim(gray_ref, gray_gen, full=True)

# -------- 2. LPIPS --------
loss_fn = lpips.LPIPS(net='alex')  # or 'vgg'
to_tensor = lambda img: torch.tensor(img).permute(2,0,1).unsqueeze(0).float()/255*2 - 1
ref_tensor = to_tensor(cv2.cvtColor(ref_img, cv2.COLOR_BGR2RGB))
gen_tensor = to_tensor(cv2.cvtColor(gen_img, cv2.COLOR_BGR2RGB))
lpips_score = loss_fn(ref_tensor, gen_tensor).item()

# -------- 3. OCR Text Similarity --------
def extract_text(img):
    return pytesseract.image_to_string(img, config="--psm 6").strip()

text_ref = extract_text(ref_img)
text_gen = extract_text(gen_img)

# Simple similarity = overlap ratio
def text_similarity(a, b):
    set_a, set_b = set(a.split()), set(b.split())
    return len(set_a & set_b) / max(len(set_a | set_b), 1)

ocr_sim = text_similarity(text_ref, text_gen)

# -------- 4. Edge Map Comparison --------
edges_ref = cv2.Canny(gray_ref, 100, 200)
edges_gen = cv2.Canny(gray_gen, 100, 200)

edge_overlap = np.sum((edges_ref > 0) & (edges_gen > 0)) / np.sum(edges_ref > 0)

# -------- 5. Keypoint Matching --------
sift = cv2.SIFT_create()
kp1, des1 = sift.detectAndCompute(gray_ref, None)
kp2, des2 = sift.detectAndCompute(gray_gen, None)

bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)
matches = bf.match(des1, des2)
matches = sorted(matches, key=lambda x: x.distance)

# Matching ratio
keypoint_sim = len(matches) / max(len(kp1), len(kp2), 1)

# -------- OUTPUT --------
print(f"SSIM: {ssim_score:.4f}")
print(f"LPIPS: {lpips_score:.4f} (lower = more similar)")
print(f"OCR similarity: {ocr_sim:.4f}")
print(f"Edge overlap: {edge_overlap:.4f}")
print(f"Keypoint match ratio: {keypoint_sim:.4f}")
