import os
import numpy as np
from widget_quality.utils import load_image, resize_to_match
from widget_quality.perceptual import compute_perceptual
from widget_quality.layout import compute_layout
from widget_quality.legibility import compute_legibility
from widget_quality.style import compute_style
from widget_quality.geometry import compute_aspect_dimensionality_fidelity
from widget_quality.composite import composite_score


def evaluate_pairs(gt_dir="GT", pred_dir="baseline"):
    """
    Load and evaluate GT–prediction pairs one by one instead of preloading all images.
    GT images follow: GT/gt_{num}.png
    Prediction images follow: baseline/{num}/pred.png
    """
    # --- Count existing GT files ---

    gt_files = [f for f in os.listdir(gt_dir) if f.startswith("gt_") and f.endswith(".png")]
    total_gt = len(gt_files)

    counts = {
        "total_gt": total_gt,
        "pred_exists": 0,
        "evaluated": 0,
        "missing_pred": 0
    }

    all_scores = []

    print(f"📂 Found {total_gt} ground truth images in '{gt_dir}'.")

    for i, gt_file in enumerate(sorted(gt_files), start=1):
        # if i == 30:
        #     break
        # try:
        num = gt_file.replace("gt_", "").replace(".png", "")
        gt_path = os.path.join(gt_dir, gt_file)
        pred_path = os.path.join(pred_dir, num, "pred.png")
        # print(pred_path)
        if not os.path.exists(pred_path):
            counts["missing_pred"] += 1
            # print(f"[{i}/{total_gt}] ⚠️ Missing prediction for {num}")
            continue

        counts["pred_exists"] += 1

        # Load pair immediately
        gt_img = load_image(gt_path)
        pred_img = load_image(pred_path)
        gen = resize_to_match(gt_img, pred_img)

        # --- Compute metrics ---
        geo = compute_aspect_dimensionality_fidelity(gt_img, pred_img)
        perceptual = compute_perceptual(gt_img, gen)
        layout = compute_layout(gt_img, gen)
        legibility = compute_legibility(gt_img, gen)
        style = compute_style(gt_img, gen)

        result = composite_score(geo, perceptual, layout, legibility, style)
        result["id"] = num
        all_scores.append(result)

        counts["evaluated"] += 1
        print(f"[{i}/{total_gt}] ✅ {num} evaluated → Overall {result['OverallScore']['total']:.2f} \
        Layout: {result['LayoutScore']['layout_score']:.2f}\
        Legibility: {result['LegibilityScore']['legibility_score']:.2f}\
        Perceptual: {result['PerceptualScore']['perceptual_score']:.2f}\
        Style: {result['StyleScore']['style_score']:.2f}\
        Geo: {result['Geometry']['geo_score']:.2f}")

        # except Exception as e:
        #     print(f"[{i}/{total_gt}] ❌ Error evaluating {gt_file}: {e}")

    # --- Summary ---
    print("\n📊 Summary:")
    print(f"  Total GT images: {counts['total_gt']}")
    print(f"  With existing predictions: {counts['pred_exists']}")
    print(f"  Missing predictions: {counts['missing_pred']}")
    print(f"  Successfully evaluated: {counts['evaluated']}")

    # --- Compute averages ---
    if all_scores:
        keys = ["LayoutScore", "LegibilityScore", "PerceptualScore", "StyleScore", "Geometry", "OverallScore"]
        avg = {}

        for k in keys:
            # Collect all metric values for this key
            vals = [s[k] for s in all_scores if k in s]

            if isinstance(vals[0], dict):  # has sub-metrics
                sub_keys = vals[0].keys()
                avg[k] = {}
                for sk in sub_keys:
                    sub_vals = [v[sk] for v in vals if sk in v]
                    avg[k][sk] = round(np.mean(sub_vals), 3)
            else:
                avg[k] = round(np.mean(vals), 3)

        # --- Print results ---
        print("\n📈 Average metrics across all evaluated pairs:")
        for k, v in avg.items():
            if isinstance(v, dict):
                print(f"  {k}:")
                for sk, sv in v.items():
                    print(f"    {sk:16s}: {sv:6.3f}")
            else:
                print(f"  {k:18s}: {v:6.3f}")
    else:
        avg = {}
        print("❌ No valid image pairs to evaluate.")

    return all_scores, avg, counts


if __name__ == "__main__":
    root_dir = "/shared/zhixiang_team/widget_research/Comparison"
    gt_dir = os.path.join(root_dir, "GT")
    # baseline_dir = os.path.join(root_dir, "Screencoder")
    baseline_dir = os.path.join(root_dir, "WidgetDSL-v1.2.0")
    # baseline_name = 'Doubao'
    # baseline_dir = os.path.join(root_dir, baseline_name + "_base")
    # baseline_dir = os.path.join(root_dir, baseline_name + "_aspect")
    # baseline_dir = os.path.join(root_dir, baseline_name + "_size")
    # baseline_dir = os.path.join(root_dir, baseline_name + "_aspect_size")
    evaluate_pairs(gt_dir, baseline_dir)
    print(baseline_dir)
