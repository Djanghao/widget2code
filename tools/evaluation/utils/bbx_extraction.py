
import cv2, numpy as np
from PIL import Image
import pytesseract
from skimage.color import rgb2lab
from skimage.metrics import structural_similarity as ssim
import matplotlib
matplotlib.use("Agg")  # For headless servers
import matplotlib.pyplot as plt

def to_gray(img):
    return cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)

def load_image(path):
    """Load image as normalized RGB float array."""
    img = Image.open(path).convert("RGB")
    return np.asarray(img) / 255.0

def lab_color_diff(img1, img2):
    """Mean and 95p ΔE (CIEDE2000)."""
    lab1, lab2 = rgb2lab(img1), rgb2lab(img2)
    diff = np.sqrt(np.sum((lab1 - lab2) ** 2, axis=-1))
    return float(np.mean(diff)), float(np.percentile(diff, 95))

def edge_map(img):
    gray = to_gray(img)
    return cv2.Canny(gray, 100, 200)


def visualize_bounding_boxes(image, mask, save_path="bbox_debug.png", figsize=(6,6), color_gt=(0,255,0), color_gen=(255,0,0)):

    # Prepare image for OpenCV drawing
    img_vis = (image.copy() * 255).astype(np.uint8) if image.max() <= 1.0 else image.copy()

    # Ensure binary mask
    mask_bin = (mask > 0).astype(np.uint8)

    # Extract connected components
    num, labels, stats, _ = cv2.connectedComponentsWithStats(mask_bin, connectivity=8)

    # Draw bounding boxes
    for i in range(1, num):  # skip background (label 0)
        x, y, w, h, area = stats[i]
        if area < 10:  # skip very small noise blobs
            continue
        cv2.rectangle(img_vis, (x, y), (x + w, y + h), color_gen, 2)

    # Draw contour of overall mask
    contours, _ = cv2.findContours(mask_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(img_vis, contours, -1, color_gt, 1)

    # Plot & save
    plt.figure(figsize=figsize)
    # plt.imshow(cv2.cvtColor(img_vis, cv2.COLOR_BGR2RGB))
    plt.imshow(img_vis)
    plt.axis("off")
    plt.title("Bounding Boxes of Detected Elements")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"🖼️ Saved bounding box visualization → {save_path}")


if __name__ == "__main__":

    gt = load_image("./widget_samples/widget.png")
    gen = load_image("./widget_samples/qwen.png")

    e_gt, e_gen = edge_map(gt), edge_map(gen)
    kernel = np.ones((3, 3), np.uint8)
    mask_gt = cv2.dilate(e_gt, kernel)
    mask_gen = cv2.dilate(e_gen, kernel)
    visualize_bounding_boxes(gt, mask_gt, save_path='gt_box_1.png')
    visualize_bounding_boxes(gen, mask_gen, save_path='gen_box_1.png')