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

# Default to CPU (can be changed with set_device)
device = torch.device("cpu")
lpips_vgg = None

def set_device(use_cuda=False):
    """Set the device for LPIPS computation. Call this before running evaluation.

    Args:
        use_cuda: If True, use CUDA if available. If False, use CPU.
    """
    global device, lpips_vgg

    if use_cuda and torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")

    # Initialize LPIPS model on the correct device
    lpips_vgg = LPIPS(net="vgg").to(device)
    print(f"[Perceptual] Using device: {device}")

# Initialize with CPU by default
set_device(use_cuda=False)



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

    # Only return SSIM and LPIPS (EdgeF1 removed)
    return {
        "SSIM": ssim_val,
        "LPIPS": lp
    }
