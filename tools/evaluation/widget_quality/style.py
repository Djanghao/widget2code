import numpy as np, cv2
from skimage.color import rgb2hsv, rgb2lab
from scipy.stats import wasserstein_distance
from scipy.optimize import linear_sum_assignment
from skimage.color import rgb2gray

# ==========================================================
#  1) Palette Distance (hue histogram EMD)
# ==========================================================
def compute_palette_distance(gt, gen, bins=36):
    hsv_gt, hsv_gen = rgb2hsv(gt), rgb2hsv(gen)
    h_gt, h_gen = hsv_gt[..., 0].ravel(), hsv_gen[..., 0].ravel()

    hist_gt, _ = np.histogram(h_gt, bins=bins, range=(0, 1), density=True)
    hist_gen, _ = np.histogram(h_gen, bins=bins, range=(0, 1), density=True)

    # Earth-Mover’s distance (1D Wasserstein)
    emd = wasserstein_distance(
        np.arange(bins), np.arange(bins),
        hist_gt / (hist_gt.sum() + 1e-6),
        hist_gen / (hist_gen.sum() + 1e-6)
    )
    score = float(np.exp(-emd / (bins * 0.08)))  # normalized, smooth decay
    return np.clip(score, 0, 1)

# ==========================================================
#  2) Dominant Palette Matching (k-means + ΔE + weights)
# ==========================================================
def compute_dominant_palette_match(gt, gen, k=4):
    from sklearn.cluster import KMeans
    lab_gt, lab_gen = rgb2lab(gt), rgb2lab(gen)

    def cluster_colors(lab, k):
        X = lab.reshape(-1, 3)
        km = KMeans(n_clusters=k, n_init=3, random_state=0).fit(X)
        centers = km.cluster_centers_
        weights = np.bincount(km.labels_) / len(km.labels_)
        return centers, weights

    c_gt, w_gt = cluster_colors(lab_gt, k)
    c_gen, w_gen = cluster_colors(lab_gen, k)

    # ΔE(CIE76) matrix between cluster centers
    dist = np.linalg.norm(c_gt[:, None, :] - c_gen[None, :, :], axis=-1)
    # combine with weight difference
    weight_cost = np.abs(w_gt[:, None] - w_gen[None, :])
    cost = 0.7 * dist / 100.0 + 0.3 * weight_cost

    row, col = linear_sum_assignment(cost)
    mean_cost = cost[row, col].mean()
    score = float(np.exp(-5 * mean_cost))  # sharper drop for mismatch
    return np.clip(score, 0, 1)

# ==========================================================
#  3) Vibrancy / Vividness Consistency
# ==========================================================
def compute_vibrancy_consistency(gt, gen, bins=30):
    hsv_gt, hsv_gen = rgb2hsv(gt), rgb2hsv(gen)
    s_gt, s_gen = hsv_gt[..., 1].ravel(), hsv_gen[..., 1].ravel()
    hist_gt, _ = np.histogram(s_gt, bins=bins, range=(0, 1), density=True)
    hist_gen, _ = np.histogram(s_gen, bins=bins, range=(0, 1), density=True)
    emd = wasserstein_distance(
        np.arange(bins), np.arange(bins),
        hist_gt / (hist_gt.sum() + 1e-6),
        hist_gen / (hist_gen.sum() + 1e-6)
    )
    score = float(np.exp(-emd / (bins * 0.05)))
    return np.clip(score, 0, 1)

# ==========================================================
#  4) Background Type Match (solid / gradient / photo)
# ==========================================================


def compute_polarity_consistency(gt, gen):
    L_gt = rgb2gray(gt)
    L_gen = rgb2gray(gen)
    # Approx background = mode region luminance
    bg_gt = np.median(L_gt)
    bg_gen = np.median(L_gen)
    # Approx foreground = mean of top 10% brightest or darkest pixels (edges/text)
    fg_gt = np.mean(np.sort(L_gt.ravel())[:int(0.1*L_gt.size)])
    fg_gen = np.mean(np.sort(L_gen.ravel())[:int(0.1*L_gen.size)])
    pol_gt = np.sign(bg_gt - fg_gt)
    pol_gen = np.sign(bg_gen - fg_gen)
    score = 1.0 if pol_gt == pol_gen else 0.0
    # soften slightly based on magnitude difference
    diff = abs((bg_gt - fg_gt) - (bg_gen - fg_gen))
    score *= np.exp(-diff * 5)
    return float(np.clip(score, 0, 1))


# ==========================================================
#  5) Composite Style Fidelity 
# ==========================================================
def compute_style(gt, gen):
    p_dist = compute_palette_distance(gt, gen)
    vib     = compute_vibrancy_consistency(gt, gen)
    polarity = compute_polarity_consistency(gt, gen)
    return {
        "PaletteDistance": p_dist,
        "Vibrancy": vib,
        "PolarityConsistency": polarity,
    }
