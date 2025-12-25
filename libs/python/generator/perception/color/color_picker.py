import cv2
import numpy as np
from typing import List, Tuple
import os

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Convert an (R,G,B) tuple of ints [0..255] to a hex string like '#rrggbb'."""
    return "#{:02x}{:02x}{:02x}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def top_colors_exact(image_path: str, n: int = 10, max_pixels: int = None) -> List[Tuple[str, float]]:
    """
    Count exact pixel colors and return top n colors with their percentage.
    - image_path: path to image
    - n: how many top colors to return
    - max_pixels: if set, randomly sample up to max_pixels from the image for speed
    """
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not open image: {image_path}")

    # Convert BGR(A) -> RGB(A)
    if img.shape[2] == 4:
        # BGRA -> RGBA
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGBA)
        # filter out fully transparent pixels (alpha == 0)
        alpha = img[:, :, 3]
        mask = alpha > 0
        if not np.any(mask):
            raise ValueError("Image contains only fully transparent pixels.")
        rgb = img[:, :, :3][mask]
    else:
        # BGR -> RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        rgb = img.reshape(-1, 3)

    # optionally sample for speed
    total_pixels = rgb.shape[0]
    if max_pixels is not None and total_pixels > max_pixels:
        # random sample without replacement
        idx = np.random.choice(total_pixels, size=max_pixels, replace=False)
        rgb = rgb[idx]
        total_pixels = rgb.shape[0]

    # get unique colors and counts
    # np.unique on axis=0
    colors, counts = np.unique(rgb.reshape(-1, 3), axis=0, return_counts=True)
    # sort by counts descending
    order = np.argsort(counts)[::-1]
    colors = colors[order]
    counts = counts[order]

    results = []
    for i in range(min(n, len(colors))):
        hexcol = rgb_to_hex(tuple(colors[i]))
        pct = float(counts[i]) / float(total_pixels) * 100.0
        results.append((hexcol, pct))

    return results

def top_colors_kmeans(image_path: str, k: int = 8, n: int = None, max_pixels: int = 200000, attempts: int = 3) -> List[Tuple[str, float]]:
    """
    Use k-means color quantization to get top k colors.
    - k: number of clusters (colors) to find
    - n: how many top colors to return (defaults to k)
    - max_pixels: sample up to this many pixels for kmeans speed
    - attempts: number of kmeans attempts
    """
    if n is None:
        n = k

    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Could not open image: {image_path}")

    # Convert BGR(A) -> RGB(A)
    if img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGBA)
        alpha = img[:, :, 3]
        mask = alpha > 0
        if not np.any(mask):
            raise ValueError("Image contains only fully transparent pixels.")
        rgb = img[:, :, :3][mask]
    else:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        rgb = img.reshape(-1, 3)

    total_pixels = rgb.shape[0]

    # sample for speed if necessary
    if total_pixels > max_pixels:
        idx = np.random.choice(total_pixels, size=max_pixels, replace=False)
        sample = rgb[idx].astype(np.float32)
    else:
        sample = rgb.astype(np.float32)

    # prepare for OpenCV kmeans (float32, samples x channels)
    Z = sample.reshape((-1, 3))

    # criteria = (type, max_iter, epsilon)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    flags = cv2.KMEANS_PP_CENTERS
    compactness, labels, centers = cv2.kmeans(Z, k, None, criteria, attempts, flags)

    # assign all pixels (not just sample) to nearest center to get accurate counts
    # compute distances between each pixel and each center
    centers = centers.astype(np.uint8)
    # compute labels for all pixels (in one go)
    # For memory: do in chunks if total_pixels is huge
    pix = rgb.astype(np.int32)
    centers_int = centers.astype(np.int32)
    # distances: (num_pixels, k)
    # Use broadcasting to compute squared distances
    diffs = pix[:, None, :] - centers_int[None, :, :]    # shape (num_pixels, k, 3)
    dists = np.sum(diffs * diffs, axis=2)               # shape (num_pixels, k)
    assigned = np.argmin(dists, axis=1)                 # shape (num_pixels,)

    # count occurrences
    unique_centers, counts = np.unique(assigned, return_counts=True)
    # Make list of (center_color, count)
    center_counts = []
    for idx_center, cnt in zip(unique_centers, counts):
        center_counts.append((tuple(centers[idx_center]), int(cnt)))

    # sort by count desc
    center_counts.sort(key=lambda x: x[1], reverse=True)

    results = []
    for i in range(min(n, len(center_counts))):
        center_color, cnt = center_counts[i]
        hexcol = rgb_to_hex(center_color)
        pct = float(cnt) / float(total_pixels) * 100.0
        results.append((hexcol, pct))

    return results

# Example usage:
if __name__ == "__main__":
    for i in range(1940, 1950):
        IMAGE = f"/home/taozhang/tmp/image_{i}/input.png"
        if os.path.exists(IMAGE):
            print(f"Processing {IMAGE}:")
            print("\nTop 8 colors by k-means (quantized):")
            for hexc, pct in top_colors_kmeans(IMAGE, k=8, n=8):
                print(f"{hexc} — {pct:.2f}%")
            print("--------------------------------")

        else:
            print(f"Image {i} does not exist")
    IMAGE = "photo.jpg"   # <-- change to your file