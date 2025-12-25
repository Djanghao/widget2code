import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from widget_quality.utils import load_image, resize_to_match
from widget_quality.perceptual import compute_perceptual, set_device
from widget_quality.layout import compute_layout
from widget_quality.legibility import compute_legibility
from widget_quality.style import compute_style
from widget_quality.geometry import compute_aspect_dimensionality_fidelity
from widget_quality.composite import composite_score


def convert_to_serializable(obj):
    """
    Convert numpy types to Python native types for JSON serialization.
    """
    if isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    else:
        return obj


def evaluate_single_pair(gt_file, gt_dir, pred_dir):
    """
    Evaluate a single GT-prediction pair.
    Supports two directory structures:
      - image_{num}/output.png  (old structure)
      - {num}/pred.png          (new structure)
    Returns (success, result_dict, error_message)
    """
    try:
        num = gt_file.replace("gt_", "").replace(".png", "")
        gt_path = os.path.join(gt_dir, gt_file)

        # Try different prediction file locations in order of priority
        possible_paths = [
            # Old structure: image_{num}/output.png
            (os.path.join(pred_dir, f"image_{num}"), "output.png"),
            # New structure: {num}/pred.png
            (os.path.join(pred_dir, num), "pred.png"),
            # New structure alternative: {num}/output.png
            (os.path.join(pred_dir, num), "output.png"),
        ]

        pred_path = None
        image_folder = None

        for folder, filename in possible_paths:
            candidate_path = os.path.join(folder, filename)
            if os.path.exists(candidate_path):
                pred_path = candidate_path
                image_folder = folder
                break

        if pred_path is None:
            return (False, None, f"Missing prediction for {num}")

        # Load pair
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

        # Save evaluation.json in the image folder
        evaluation_path = os.path.join(image_folder, "evaluation.json")
        with open(evaluation_path, 'w') as f:
            json.dump(convert_to_serializable(result), f, indent=2)

        return (True, result, None)

    except Exception as e:
        num = gt_file.replace("gt_", "").replace(".png", "")
        return (False, None, f"Error evaluating {num}: {str(e)}")


def evaluate_pairs(gt_dir="GT", pred_dir="baseline", num_workers=4):
    """
    Load and evaluate GT–prediction pairs using multithreading.
    GT images follow: GT/gt_{num}.png
    Prediction images follow: baseline/image_{num}/output.png

    Args:
        gt_dir: Path to ground truth directory
        pred_dir: Path to prediction directory
        num_workers: Number of worker threads (default: 4)
    """
    # --- Clean up old evaluation files ---
    print("🧹 Cleaning up old evaluation files...")
    cleaned_count = 0

    # Clean evaluation.xlsx in run folder
    excel_path = os.path.join(pred_dir, "evaluation.xlsx")
    if os.path.exists(excel_path):
        os.remove(excel_path)
        cleaned_count += 1

    # Clean evaluation.json in each image folder
    for item in os.listdir(pred_dir):
        item_path = os.path.join(pred_dir, item)
        if os.path.isdir(item_path) and item.startswith("image_"):
            eval_file = os.path.join(item_path, "evaluation.json")
            if os.path.exists(eval_file):
                os.remove(eval_file)
                cleaned_count += 1

    if cleaned_count > 0:
        print(f"   Cleaned {cleaned_count} old evaluation files.\n")

    # --- Count existing GT files ---
    gt_files = [f for f in os.listdir(gt_dir) if f.startswith("gt_") and f.endswith(".png")]
    gt_files = sorted(gt_files)
    total_gt = len(gt_files)

    counts = {
        "total_gt": total_gt,
        "pred_exists": 0,
        "evaluated": 0,
        "missing_pred": 0,
        "errors": 0
    }

    all_scores = []
    lock = Lock()

    print(f"📂 Found {total_gt} ground truth images in '{gt_dir}'.")
    print(f"🚀 Using {num_workers} worker threads for parallel processing.\n")

    # Process files in parallel
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        # Submit all tasks
        future_to_file = {
            executor.submit(evaluate_single_pair, gt_file, gt_dir, pred_dir): (i, gt_file)
            for i, gt_file in enumerate(gt_files, start=1)
        }

        # Process completed tasks
        for future in as_completed(future_to_file):
            i, gt_file = future_to_file[future]
            success, result, error_msg = future.result()

            with lock:
                if success:
                    counts["pred_exists"] += 1
                    counts["evaluated"] += 1
                    all_scores.append(result)

                    print(f"[{i}/{total_gt}] ✅ {result['id']} evaluated → "
                          f"Geo={result['Geometry']['geo_score']:.2f}")
                else:
                    if "Missing prediction" in error_msg:
                        counts["missing_pred"] += 1
                    else:
                        counts["errors"] += 1
                        print(f"[{i}/{total_gt}] ❌ {error_msg}")

    # --- Summary ---
    print("\n📊 Summary:")
    print(f"  Total GT images: {counts['total_gt']}")
    print(f"  With existing predictions: {counts['pred_exists']}")
    print(f"  Missing predictions: {counts['missing_pred']}")
    print(f"  Errors during evaluation: {counts['errors']}")
    print(f"  Successfully evaluated: {counts['evaluated']}")

    # --- Compute averages ---
    if all_scores:
        keys = ["LayoutScore", "LegibilityScore", "StyleScore", "PerceptualScore", "Geometry"]
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

        # --- Save average metrics to Excel in run folder ---
        # Prepare data rows for Excel with two-level header
        header_row1 = [None]  # First column for run name
        header_row2 = [None]  # Sub-headers
        data_row = []  # Data values

        # Extract run folder name
        run_name = os.path.basename(pred_dir)
        data_row.append(run_name)

        # LayoutScore columns (only 3 metrics)
        if 'LayoutScore' in avg and isinstance(avg['LayoutScore'], dict):
            layout_metrics = ['MarginAsymmetry', 'ContentAspectDiff', 'AreaRatioDiff']
            header_row1.append('LayoutScore')
            header_row1.extend([None] * (len(layout_metrics) - 1))
            for metric in layout_metrics:
                header_row2.append(metric)
                data_row.append(round(avg['LayoutScore'].get(metric, 0), 3))

        # LegibilityScore columns (only 3 metrics)
        if 'LegibilityScore' in avg and isinstance(avg['LegibilityScore'], dict):
            legibility_metrics = ['TextJaccard', 'ContrastDiff', 'ContrastLocalDiff']
            header_row1.append('LegibilityScore')
            header_row1.extend([None] * (len(legibility_metrics) - 1))
            for metric in legibility_metrics:
                header_row2.append(metric)
                data_row.append(round(avg['LegibilityScore'].get(metric, 0), 3))

        # StyleScore columns (only 3 metrics)
        if 'StyleScore' in avg and isinstance(avg['StyleScore'], dict):
            style_metrics = ['PaletteDistance', 'Vibrancy', 'PolarityConsistency']
            header_row1.append('StyleScore')
            header_row1.extend([None] * (len(style_metrics) - 1))
            for metric in style_metrics:
                header_row2.append(metric)
                data_row.append(round(avg['StyleScore'].get(metric, 0), 3))

        # PerceptualScore columns (only 2 metrics)
        if 'PerceptualScore' in avg and isinstance(avg['PerceptualScore'], dict):
            perceptual_metrics = ['ssim', 'lp']
            header_row1.append('PerceptualScore')
            header_row1.extend([None] * (len(perceptual_metrics) - 1))
            for metric in perceptual_metrics:
                header_row2.append(metric)
                data_row.append(round(avg['PerceptualScore'].get(metric, 0), 3))

        # Geometry (1 metric)
        if 'Geometry' in avg and isinstance(avg['Geometry'], dict):
            header_row1.append('Geometry')
            header_row2.append(None)
            data_row.append(round(avg['Geometry']['geo_score'], 3))

        # Create DataFrame with all three rows
        df = pd.DataFrame([header_row1, header_row2, data_row])

        # Save to Excel without header (since headers are in the data)
        excel_path = os.path.join(pred_dir, "evaluation.xlsx")
        df.to_excel(excel_path, index=False, header=False)

        print(f"\n💾 Average metrics saved to: {excel_path}")

    else:
        avg = {}
        print("❌ No valid image pairs to evaluate.")

    return all_scores, avg, counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Evaluate widget quality metrics between GT and prediction images.')
    parser.add_argument('--gt_dir', type=str,
                        default="GT",
                        help='Path to ground truth directory (default: GT)')
    parser.add_argument('--baseline_dir', type=str, required=True,
                        help='Path to baseline/prediction directory (required)')
    parser.add_argument('--workers', type=int, default=4,
                        help='Number of worker threads for parallel processing (default: 4)')
    parser.add_argument('--cuda', action='store_true',
                        help='Use CUDA/GPU for computation (default: CPU)')

    args = parser.parse_args()

    # Set device for perceptual metrics (LPIPS)
    set_device(use_cuda=args.cuda)

    # Check if directories exist
    if not os.path.exists(args.gt_dir):
        print(f"❌ Error: GT directory does not exist: {args.gt_dir}")
        sys.exit(1)

    if not os.path.exists(args.baseline_dir):
        print(f"❌ Error: Baseline directory does not exist: {args.baseline_dir}")
        sys.exit(1)

    print(f"📁 GT Directory: {args.gt_dir}")
    print(f"📁 Baseline Directory: {args.baseline_dir}")
    print()

    evaluate_pairs(args.gt_dir, args.baseline_dir, num_workers=args.workers)
    print(f"\n✅ Evaluation complete for: {args.baseline_dir}")
