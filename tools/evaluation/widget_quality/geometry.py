import numpy as np

def compute_aspect_dimensionality_fidelity(gt_img, gen_img, alpha=0.6, beta=0.4, decay=3.0):
    """
    Measures how well the generated widget preserves the aspect ratio and relative size of the GT.

    Returns:
        float in [0, 1], where 1 = perfect match.
    """
    h_gt, w_gt = gt_img.shape[:2]
    h_gen, w_gen = gen_img.shape[:2]

    ar_gt, ar_gen = w_gt / h_gt, w_gen / h_gen
    area_gt, area_gen = w_gt * h_gt, w_gen * h_gen

    # log-relative errors (symmetrical)
    ar_diff = abs(np.log(ar_gt / ar_gen))
    area_diff = abs(np.log(area_gen / area_gt))

    # smoother exponential decay rather than linear
    aspect_score = np.exp(-decay * ar_diff)
    size_score = np.exp(-decay * area_diff)

    # weighted harmonic mean emphasizes agreement on both
    score = (alpha * aspect_score + beta * size_score)
    return float(np.clip(score, 0.0, 1.0))