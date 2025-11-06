import numpy as np

import os
os.environ["OPENBLAS_NUM_THREADS"] = "64"
os.environ["OMP_NUM_THREADS"] = "64"
os.environ["MKL_NUM_THREADS"] = "64"
os.environ["NUMEXPR_NUM_THREADS"] = "64"

def handling_style(style):
    PaletteDistance = 100 * style.get('PaletteDistance')
    Vibrancy = 100 * style.get('Vibrancy')
    PolarityConsistency = 100 * style.get('PolarityConsistency')

    style_score = (
        0.40 * PaletteDistance +     # hue palette alignment
        0.35 * Vibrancy +        # saturation mood
        0.25 * PolarityConsistency          # material/texture
    )
    
    return {"PaletteDistance": round(PaletteDistance, 3),
            "Vibrancy": round(Vibrancy, 3),
            "PolarityConsistency": round(PolarityConsistency, 3),
            "style_score": round(style_score, 3)
    }


def smooth_score(val, scale, method="exp"):
    if method == "exp":
        return 100 * np.exp(-val / scale)
    elif method == "linear":
        return 100 * max(0.0, 1 - val / scale)
    elif method == "logistic":
        return 100 / (1 + np.exp(10 * (val - scale)))

def handling_layout(layout):
    # margin_delta = np.clip(layout.get("MarginDelta", 0), 0, 20)
    # edge_crowding = np.clip(layout.get("EdgeCrowding", 0), 0, 1)
    # margin_asym = np.clip(layout.get("MarginAsymmetry", 0), 0, 1)
    # centroid_disp = np.clip(layout.get("CentroidDisplacement", 0), 0, 0.2)
    # aspect_diff = np.clip(layout.get("ContentAspectDiff", 0), 0, 0.5)
    # alignment_err = np.clip(layout.get("AlignmentError", 0), 0, 50)
    # area_ratio_diff = np.clip(layout.get("AreaRatioDiff", 0), 0, 0.2)
    # count_diff = np.clip(layout.get("ElementCountDiff", 0), 0, 10)

    # MarginDelta = 100 * (1 - layout["MarginDelta"] / 10)
    # # MarginDelta = 100 * np.exp(-layout["MarginDelta"] / 15.0)

    # EdgeCrowding = 100 * (1 - layout["EdgeCrowding"])
    # # EdgeCrowding = 100 / (1 + np.exp(10 * (layout["EdgeCrowding"] - 0.25)))

    # MarginAsymmetry = 100 * (1 - layout["MarginAsymmetry"])
    # CentroidDisplacement = 100 * (1 - layout["CentroidDisplacement"] / 0.1)
    # ContentAspectDiff = 100 * (1 - layout["ContentAspectDiff"] / 0.1)
    # AlignmentError = 100 * (1 - layout["AlignmentError"] / 20)
    # AreaRatioDiff = 100 * (1 - layout["AreaRatioDiff"] * 10)
    # ElementCountDiff = 100 * (1 - min(layout["ElementCountDiff"], 5) / 5)

    MarginDelta        = smooth_score(layout["MarginDelta"], 15, "exp")
    EdgeCrowding       = 100 * (1 - (layout["EdgeCrowding"])**0.5)
    MarginAsymmetry    = smooth_score(layout["MarginAsymmetry"], 0.5, "exp")
    CentroidDisplacement = smooth_score(layout["CentroidDisplacement"], 0.05, "exp")
    ContentAspectDiff  = smooth_score(layout["ContentAspectDiff"], 0.05, "exp")
    AlignmentError     = smooth_score(layout["AlignmentError"], 0.05, "exp")
    AreaRatioDiff      = smooth_score(layout["AreaRatioDiff"], 0.05, "exp")
    ElementCountDiff   = smooth_score(layout["ElementCountDiff"], 3, "exp")

    layout_score =  0.20 * MarginDelta + \
        0.15 * EdgeCrowding + \
        0.15 * MarginAsymmetry + \
        0.10 * CentroidDisplacement + \
        0.10 * ContentAspectDiff + \
        0.15 * AlignmentError + \
        0.10 * AreaRatioDiff + \
        0.05 * ElementCountDiff
        
    layout_score = np.clip(layout_score, 0, 100)

    return {
        "MarginDelta": round(MarginDelta, 3),
        "EdgeCrowding": round(EdgeCrowding, 3),
        "MarginAsymmetry": round(MarginAsymmetry, 3),
        "CentroidDisplacement": round(CentroidDisplacement, 3),
        "ContentAspectDiff": round(ContentAspectDiff, 3),
        "AlignmentError": round(AlignmentError, 3),
        "AreaRatioDiff": round(AreaRatioDiff, 3),
        "ElementCountDiff": round(ElementCountDiff, 3),
        "layout_score": round(layout_score, 3),
    }

def handling_legibility(legibility):
    """
    Compute overall legibility score (0–100) from component metrics.
    Emphasizes text fidelity and contrast similarity.
    """
    TextJaccard = 100 * np.clip(legibility.get("TextJaccard", 0), 0, 1)
    ContrastDiff = np.clip(legibility.get("ContrastDiff", 0), 0, 5)
    ContrastLocalDiff = np.clip(legibility.get("ContrastLocalDiff", 0), 0, 5)

    ContrastDiff = 100 * (1 - ContrastDiff / 5.0)
    ContrastLocalDiff = 100 * (1 - ContrastLocalDiff / 5.0)

    legibility_score = 0.6 * TextJaccard + 0.25 * ContrastDiff + 0.15 * ContrastLocalDiff

    legibility_score = float(np.clip(legibility_score, 0, 100))
    # print(TextJaccard, ContrastDiff)
    return {
        "TextJaccard": round(TextJaccard, 3),
        "ContrastDiff": round(ContrastDiff, 3),
        "ContrastLocalDiff": round(ContrastLocalDiff, 3),
        "legibility_score": round(legibility_score, 3),
    }


def handling_perceptual(perceptual):
    ssim = 100 * np.clip(perceptual.get("SSIM", 0), 0, 1)
    lp = 100 * np.clip(perceptual.get("LPIPS", 0), 0, 1)   # LPIPS may slightly exceed 1
    edgef1 = 100 * np.clip(perceptual.get("EdgeF1", 0), 0, 1)
    perceptual_score = 0.45 * ssim + 0.35 * (1 - lp) + 0.20 * edgef1
    perceptual_score = np.clip(perceptual_score, 0, 100)

    return {
        "ssim": round(ssim, 3),
        "lp": round(lp, 3),
        "edgef1": round(edgef1, 3),
        "perceptual_score": round(perceptual_score, 3),
    }

def composite_score(geo, perceptual, layout, legibility, style):
    """Robust weighted 0–100 overall score (clamped for stability)."""
    

    geo = np.clip(geo, 0, 1)


    if layout != None:
        layout_score = handling_layout(layout)
    else:
        layout_score = {'layout_score':0}

    if legibility != None:
        legibility_score = handling_legibility(legibility)
    else:
        legibility_score = {'legibility_score':0}

    if style != None:
        style_score = handling_style(style)
    else: 
        style_score = {'style_score':0}

    if perceptual != None:
        perceptual_score = handling_perceptual(perceptual)
    else:
        perceptual_score = {'perceptual_score':0}
    
    geo_score = 100 * geo
    geo_score = np.clip(geo_score, 0, 100)

    # --- Weighted total ---
    total = (
        0.35 * layout_score["layout_score"] +
        0.25 * legibility_score["legibility_score"] +
        0.20 * perceptual_score["perceptual_score"] +
        0.10 * style_score["style_score"] +
        0.10 * geo_score
    )
    total = np.clip(total, 0, 100)

    # --- Round to 3 decimals ---
    return {
        "LayoutScore": layout_score,
        "LegibilityScore": legibility_score,
        "PerceptualScore": perceptual_score,
        "StyleScore": style_score,
        "Geometry": {"geo_score": geo_score},
        "OverallScore": {"total": total}
    }
