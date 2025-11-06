# import numpy as np, torch
# from skimage.metrics import structural_similarity as ssim
# from .utils import edge_map, lab_color_diff
# from lpips import LPIPS

# lpips_vgg = LPIPS(net="vgg")

# def compute_perceptual(gt, gen):
#     """Return SSIM, LPIPS, Edge-F1, ΔE."""
#     # SSIM
#     ssim_val = ssim(gt, gen, channel_axis=2, data_range=1.0)
#     # LPIPS
#     gt_t = torch.tensor(gt).permute(2,0,1).unsqueeze(0).float()
#     gen_t = torch.tensor(gen).permute(2,0,1).unsqueeze(0).float()
#     lp = float(lpips_vgg(gt_t, gen_t).item())
#     # Edge-F1
#     e_gt, e_gen = edge_map(gt), edge_map(gen)
#     inter = np.sum((e_gt > 0) & (e_gen > 0))
#     f1 = 2*inter / (np.sum(e_gt>0) + np.sum(e_gen>0) + 1e-6)
#     # ΔE
#     delta_e_mean, delta_e_95 = lab_color_diff(gt, gen)
#     return {
#         "SSIM": ssim_val,
#         "LPIPS": lp,
#         "EdgeF1": f1,
#         "DeltaE_mean": delta_e_mean,
#         "DeltaE_95": delta_e_95
#     }


import torch
from lpips import LPIPS
from skimage.metrics import structural_similarity as ssim
from skimage.feature import canny
from scipy.ndimage import distance_transform_edt
import numpy as np
import cv2

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
lpips_vgg = LPIPS(net="vgg").to(device)



def compute_soft_edge_f1(gt_gray, pr_gray, sigma=1.0, tol=2):
    e1 = canny(gt_gray, sigma=sigma)
    e2 = canny(pr_gray, sigma=sigma)

    # distance transform for tolerance
    dt1 = distance_transform_edt(~e1)
    dt2 = distance_transform_edt(~e2)

    tp = np.sum((e1 & (dt2 <= tol)) | (e2 & (dt1 <= tol)))
    fp = np.sum(e2 & (dt1 > tol))
    fn = np.sum(e1 & (dt2 > tol))

    prec = tp / (tp + fp + 1e-6)
    rec = tp / (tp + fn + 1e-6)
    f1 = 2 * prec * rec / (prec + rec + 1e-6)
    return float(f1)

def compute_perceptual(gt, gen):
    """Compute perceptual metrics efficiently with GPU LPIPS."""
    # SSIM
    ssim_val = ssim(gt, gen, channel_axis=2, data_range=1.0)

    # LPIPS (GPU)
    gt_t = torch.tensor(gt).permute(2,0,1).unsqueeze(0).float().to(device)
    gen_t = torch.tensor(gen).permute(2,0,1).unsqueeze(0).float().to(device)
    with torch.no_grad():
        lp = float(lpips_vgg(gt_t, gen_t).item())
        # lp = 0.5

    # Edge-F1
    gray_gt = cv2.cvtColor((gt*255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    gray_gen = cv2.cvtColor((gen*255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    f1 = edge_f1 = compute_soft_edge_f1(gray_gt, gray_gen)

    return {
        "SSIM": ssim_val,
        "LPIPS": lp,
        "EdgeF1": f1
    }
