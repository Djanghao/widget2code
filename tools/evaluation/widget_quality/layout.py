import cv2
import numpy as np
from .utils import edge_map, margin_from_mask, load_image
import matplotlib
matplotlib.use("Agg")  # For headless servers
import matplotlib.pyplot as plt
from scipy.spatial.distance import cdist

# ==========================================================
# ----- Outer Layout Metrics -----
# ==========================================================

def compute_margin_asymmetry(mask_gt, mask_gen):
    """Variance imbalance of margins (normalized by mean)."""
    m_gt = margin_from_mask(mask_gt)
    m_gen = margin_from_mask(mask_gen)
    diffs = np.abs(np.array(m_gt) - np.array(m_gen))
    mean = np.mean(diffs)
    return 0.0 if mean < 1e-6 else float(np.std(diffs) / mean)


def compute_centroid_displacement(mask_gt, mask_gen):
    """Normalized centroid shift between GT and GEN."""
    coords_gt = np.column_stack(np.nonzero(mask_gt))
    coords_gen = np.column_stack(np.nonzero(mask_gen))
    if coords_gt.size == 0 or coords_gen.size == 0:
        return 0.0
    cy_gt, cx_gt = coords_gt.mean(axis=0)
    cy_gen, cx_gen = coords_gen.mean(axis=0)
    disp = np.sqrt((cy_gt - cy_gen)**2 + (cx_gt - cx_gen)**2)
    h, w = mask_gt.shape
    diag = np.sqrt(h**2 + w**2)
    return float(disp / diag)


def compute_content_aspect_diff(mask_gt, mask_gen):
    """Difference in content bounding-box aspect ratio."""
    if np.sum(mask_gt) == 0 or np.sum(mask_gen) == 0:
        return 0.0

    def bbox_ar(mask):
        ys, xs = np.where(mask > 0)
        h = ys.max() - ys.min() + 1
        w = xs.max() - xs.min() + 1
        return w / h if h > 0 else 1.0

    ar_gt, ar_gen = bbox_ar(mask_gt), bbox_ar(mask_gen)
    return float(abs(np.log(ar_gt / ar_gen)))


# ==========================================================
# ----- Inner Layout Metrics -----
# ==========================================================

def analyze_internal_structure(mask_gt, mask_gen, min_area=10):
    """
    Compare internal content structure (connected components).
    Returns element count difference, area ratio diff, and alignment error.
    """
    def get_components(mask):
        mask_bin = (mask > 0).astype(np.uint8)
        num, labels, stats, _ = cv2.connectedComponentsWithStats(mask_bin, connectivity=8)
        stats = stats[1:]  # skip background
        boxes = [(x, y, w, h, w*h) for x, y, w, h, area in stats if area > min_area]
        return boxes

    boxes_gt = get_components(mask_gt)
    boxes_gen = get_components(mask_gen)

    count_diff = abs(len(boxes_gt) - len(boxes_gen))

    # Area ratio difference
    areas_gt = np.array([b[4] for b in boxes_gt])
    areas_gen = np.array([b[4] for b in boxes_gen])
    if len(areas_gt) > 0 and len(areas_gen) > 0:
        area_ratio_diff = abs((areas_gen.mean() / areas_gen.sum()) - (areas_gt.mean() / areas_gt.sum()))
    else:
        area_ratio_diff = 0.0

    # Alignment (horizontal centroid alignment)
    img_h, img_w = mask_gt.shape[:2]
    gt_centers = np.array([[b[0] + b[2]/2, b[1] + b[3]/2] for b in boxes_gt])
    gen_centers = np.array([[b[0] + b[2]/2, b[1] + b[3]/2] for b in boxes_gen])
    if len(gt_centers)==0 or len(gen_centers)==0:
        align_error = 0.0
    else:
        dists = cdist(gen_centers, gt_centers)
        min_dists = np.min(dists, axis=1)
        # normalize by diagonal for scale-invariance
        diag = np.hypot(img_w, img_h)
        align_error = float(np.mean(min_dists) / diag)

    # print('align error ', align_error)
    # centers_gt = np.array([b[0] + b[2]/2 for b in boxes_gt])
    # centers_gen = np.array([b[0] + b[2]/2 for b in boxes_gen])
    # if len(centers_gt) and len(centers_gen):
    #     align_error = abs(np.mean(centers_gt - centers_gt.mean()) - np.mean(centers_gen - centers_gen.mean()))
    # else:
    #     align_error = 0.0

    # Only return the metric we need (AreaRatioDiff)
    return {
        "AreaRatioDiff": float(area_ratio_diff)
    }


# ==========================================================
# ----- Unified Layout Metric -----
# ==========================================================

def compute_layout(gt, gen):
    """
    Compute combined outer + inner layout metrics.
    Returns a dict with all sub-metrics.
    """
    # --- Edge detection & dilation ---
    e_gt, e_gen = edge_map(gt), edge_map(gen)
    kernel = np.ones((3, 3), np.uint8)
    mask_gt = cv2.dilate(e_gt, kernel)
    mask_gen = cv2.dilate(e_gen, kernel)

    # print(e_gt.shape, e_gen.shape, mask_gt.shape, mask_gen.shape)
    # --- Outer metrics ---
    m_gt, m_gen = margin_from_mask(mask_gt), margin_from_mask(mask_gen)
    margin_delta = np.mean(np.abs(np.array(m_gt) - np.array(m_gen)))

    h, w = e_gen.shape
    band = int(0.05 * max(h, w))
    edge_band = np.zeros_like(e_gen)
    edge_band[:band, :], edge_band[-band:, :] = 1, 1
    edge_band[:, :band], edge_band[:, -band:] = 1, 1
    crowd_rate = np.sum((mask_gen > 0) & (edge_band > 0)) / (np.sum(mask_gen > 0) + 1e-6)

    margin_asym = compute_margin_asymmetry(mask_gt, mask_gen)
    centroid_disp = compute_centroid_displacement(mask_gt, mask_gen)
    aspect_diff = compute_content_aspect_diff(mask_gt, mask_gen)

    # --- Inner metrics ---
    inner = analyze_internal_structure(mask_gt, mask_gen)

    # Return only the 3 metrics we need: MarginAsymmetry, ContentAspectDiff, AreaRatioDiff
    return {
        "MarginAsymmetry": float(margin_asym),
        "ContentAspectDiff": float(aspect_diff),
        "AreaRatioDiff": inner["AreaRatioDiff"]
    }



# def visualize_bbox_comparison(gt, gen, mask_gt, mask_gen, save_path="bbox_compare.png", figsize=(10,5)):
#     fig, axes = plt.subplots(1, 2, figsize=figsize)
#     for ax, img, mask, title in zip(
#         axes,
#         [gt, gen],
#         [mask_gt, mask_gen],
#         ["Ground Truth", "Generated"]
#     ):
#         vis = (img * 255).astype(np.uint8)
#         mask_bin = (mask > 0).astype(np.uint8)
#         num, _, stats, _ = cv2.connectedComponentsWithStats(mask_bin, connectivity=8)
#         for i in range(1, num):
#             x, y, w, h, area = stats[i]
#             if area < 10:
#                 continue
#             cv2.rectangle(vis, (x, y), (x+w, y+h), (255,0,0), 2)
#         # ax.imshow(cv2.cvtColor(vis, cv2.COLOR_BGR2RGB))
#         ax.imshow(vis)
#         ax.set_title(title)
#         ax.axis("off")
#     plt.tight_layout()
#     plt.savefig(save_path, dpi=150)
#     plt.close()
#     print(f"🖼️ Saved GT vs GEN bounding box comparison → {save_path}")


# def visualize_bounding_boxes(image, mask, save_path="bbox_debug.png", figsize=(6,6), color_gt=(0,255,0), color_gen=(255,0,0)):
#     """
#     Visualize connected-component bounding boxes on the widget image.

#     Args:
#         image (np.ndarray): RGB float or uint8 image (H,W,3)
#         mask (np.ndarray): Binary mask (H,W) where 1/255 indicates content.
#         save_path (str): Path to save visualization.
#         figsize (tuple): Matplotlib figure size.
#         color_gt (tuple): Box color (BGR) for GT-style boxes.
#         color_gen (tuple): Box color (BGR) for GEN-style boxes.

#     Returns:
#         None. Saves visualization to `save_path`.
#     """
#     # Prepare image for OpenCV drawing
#     img_vis = (image.copy() * 255).astype(np.uint8) if image.max() <= 1.0 else image.copy()

#     # Ensure binary mask
#     mask_bin = (mask > 0).astype(np.uint8)

#     # Extract connected components
#     num, labels, stats, _ = cv2.connectedComponentsWithStats(mask_bin, connectivity=8)

#     # Draw bounding boxes
#     for i in range(1, num):  # skip background (label 0)
#         x, y, w, h, area = stats[i]
#         if area < 10:  # skip very small noise blobs
#             continue
#         cv2.rectangle(img_vis, (x, y), (x + w, y + h), color_gen, 2)

#     # Draw contour of overall mask
#     contours, _ = cv2.findContours(mask_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
#     cv2.drawContours(img_vis, contours, -1, color_gt, 1)

#     # Plot & save
#     plt.figure(figsize=figsize)
#     # plt.imshow(cv2.cvtColor(img_vis, cv2.COLOR_BGR2RGB))
#     plt.imshow(img_vis)
#     plt.axis("off")
#     plt.title("Bounding Boxes of Detected Elements")
#     plt.tight_layout()
#     plt.savefig(save_path, dpi=150)
#     plt.close()
#     print(f"🖼️ Saved bounding box visualization → {save_path}")


if __name__ == "__main__":
    gt = load_image("./widget_samples/widget.png")
    gen = load_image("./widget_samples/qwen.png")

    e_gt, e_gen = edge_map(gt), edge_map(gen)
    kernel = np.ones((3, 3), np.uint8)
    mask_gt = cv2.dilate(e_gt, kernel)
    mask_gen = cv2.dilate(e_gen, kernel)
    visualize_bbox_comparison(gt, gen, mask_gt, mask_gen, save_path="bbox_compare.png", figsize=(10,5))
