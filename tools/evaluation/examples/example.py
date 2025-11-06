from widget_quality.utils import *
from widget_quality.perceptual import compute_perceptual
from widget_quality.layout import compute_layout, visualize_bbox_comparison, visualize_bounding_boxes
from widget_quality.legibility import compute_legibility, ocr_text_easyocr, visualize_ocr_boxes
from widget_quality.style import compute_style
from widget_quality.composite import composite_score
from widget_quality.geometry import compute_aspect_dimensionality_fidelity


res = {}
gt = load_image("./widget_samples/widget.png")
gen = load_image("./widget_samples/qwen.png")


# e_gt, e_gen = edge_map(gt), edge_map(gen)
# kernel = np.ones((3, 3), np.uint8)
# mask_gt = cv2.dilate(e_gt, kernel)
# mask_gen = cv2.dilate(e_gen, kernel)
# visualize_bbox_comparison(gt, gen, mask_gt, mask_gen, save_path="bbox_compare.png", figsize=(10,5))
# visualize_bounding_boxes(gt, mask_gt, save_path='gt_box.png')
# visualize_bounding_boxes(gen, mask_gen, save_path='gen_box.png')

txt, results = ocr_text_easyocr(gen)
visualize_ocr_boxes(gen, results, save_path="easyocr_vis_1.png")

# res["geo"] = compute_aspect_dimensionality_fidelity(gt, gen)

# gen = resize_to_match(gt, gen)

# res["perceptual"] = compute_perceptual(gt, gen)
# res["layout"] = compute_layout(gt, gen)
# res["legibility"] = compute_legibility(gt, gen)
# res["style"] = compute_style(gt, gen)

# score = composite_score(**res)
# print(score)
