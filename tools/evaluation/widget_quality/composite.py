import numpy as np

import os
os.environ["OPENBLAS_NUM_THREADS"] = "64"
os.environ["OMP_NUM_THREADS"] = "64"
os.environ["MKL_NUM_THREADS"] = "64"
os.environ["NUMEXPR_NUM_THREADS"] = "64"

def handling_style(style):
    # Keep the same transformation logic (0-1 -> 0-100)
    PaletteDistance = 100 * style.get('PaletteDistance')
    Vibrancy = 100 * style.get('Vibrancy')
    PolarityConsistency = 100 * style.get('PolarityConsistency')

    # No longer calculate style_score composite

    return {
        "PaletteDistance": round(PaletteDistance, 3),
        "Vibrancy": round(Vibrancy, 3),
        "PolarityConsistency": round(PolarityConsistency, 3),
    }


def smooth_score(val, scale, method="exp"):
    if method == "exp":
        return 100 * np.exp(-val / scale)
    elif method == "linear":
        return 100 * max(0.0, 1 - val / scale)
    elif method == "logistic":
        return 100 / (1 + np.exp(10 * (val - scale)))

def handling_layout(layout):
    # Only calculate the 3 metrics we need, keeping the same transformation logic
    MarginAsymmetry = smooth_score(layout["MarginAsymmetry"], 0.5, "exp")
    ContentAspectDiff = smooth_score(layout["ContentAspectDiff"], 0.05, "exp")
    AreaRatioDiff = smooth_score(layout["AreaRatioDiff"], 0.05, "exp")

    # No longer calculate layout_score composite

    return {
        "MarginAsymmetry": round(MarginAsymmetry, 3),
        "ContentAspectDiff": round(ContentAspectDiff, 3),
        "AreaRatioDiff": round(AreaRatioDiff, 3),
    }

def handling_legibility(legibility):
    """
    Transform legibility metrics to 0-100 range.
    Keeps the same transformation logic as before.
    """
    # Keep the same transformation logic
    TextJaccard = 100 * np.clip(legibility.get("TextJaccard", 0), 0, 1)
    ContrastDiff = np.clip(legibility.get("ContrastDiff", 0), 0, 5)
    ContrastLocalDiff = np.clip(legibility.get("ContrastLocalDiff", 0), 0, 5)

    ContrastDiff = 100 * (1 - ContrastDiff / 5.0)
    ContrastLocalDiff = 100 * (1 - ContrastLocalDiff / 5.0)

    # No longer calculate legibility_score composite

    return {
        "TextJaccard": round(TextJaccard, 3),
        "ContrastDiff": round(ContrastDiff, 3),
        "ContrastLocalDiff": round(ContrastLocalDiff, 3),
    }


def handling_perceptual(perceptual):
    # Keep the same transformation logic (0-1 -> 0-100)
    ssim = 100 * np.clip(perceptual.get("SSIM", 0), 0, 1)
    lp = 100 * np.clip(perceptual.get("LPIPS", 0), 0, 1)   # LPIPS may slightly exceed 1

    # No longer calculate EdgeF1 and perceptual_score composite

    return {
        "ssim": round(ssim, 3),
        "lp": round(lp, 3),
    }

def composite_score(geo, perceptual, layout, legibility, style):
    """Organize metrics with transformations, no overall composite score."""

    # Call handling functions to apply transformations
    if layout != None:
        layout_score = handling_layout(layout)
    else:
        layout_score = {
            "MarginAsymmetry": 0.0,
            "ContentAspectDiff": 0.0,
            "AreaRatioDiff": 0.0
        }

    if legibility != None:
        legibility_score = handling_legibility(legibility)
    else:
        legibility_score = {
            "TextJaccard": 0.0,
            "ContrastDiff": 0.0,
            "ContrastLocalDiff": 0.0
        }

    if style != None:
        style_score = handling_style(style)
    else:
        style_score = {
            "PaletteDistance": 0.0,
            "Vibrancy": 0.0,
            "PolarityConsistency": 0.0
        }

    if perceptual != None:
        perceptual_score = handling_perceptual(perceptual)
    else:
        perceptual_score = {
            "ssim": 0.0,
            "lp": 0.0
        }

    # Geometry score (keep transformation)
    geo_score = 100 * np.clip(geo, 0, 1) if geo is not None else 0.0

    # Return structure without OverallScore
    return {
        "LayoutScore": layout_score,
        "LegibilityScore": legibility_score,
        "StyleScore": style_score,
        "PerceptualScore": perceptual_score,
        "Geometry": {"geo_score": float(geo_score)},
    }
