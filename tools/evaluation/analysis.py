#!/usr/bin/env python3
"""
Analyze hard cases from widget evaluation results.
Identifies images with lowest scores compared to baseline max.
"""

import json
import argparse
import shutil
from pathlib import Path
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np


# Baseline MAX scores (12 metrics - removed deprecated metrics and composite scores)
BASELINE_MAX = {
    # Layout metrics (3)
    "MarginAsymmetry": 65.893,
    "ContentAspectDiff": 67.632,
    "AreaRatioDiff": 80.014,

    # Legibility metrics (3)
    "TextJaccard": 59.591,
    "ContrastDiff": 60.562,
    "ContrastLocalDiff": 42.875,

    # Perceptual metrics (2)
    "ssim": 70.345,
    "lp": 51.241,

    # Style metrics (3)
    "PaletteDistance": 49.084,
    "Vibrancy": 46.919,
    "PolarityConsistency": 65.088,

    # Geometry (1)
    "geo_score": 61.354,
}

# Metric categories (12 metrics - removed deprecated metrics and composite scores)
METRIC_CATEGORIES = {
    "LayoutScore": ["MarginAsymmetry", "ContentAspectDiff", "AreaRatioDiff"],
    "LegibilityScore": ["TextJaccard", "ContrastDiff", "ContrastLocalDiff"],
    "StyleScore": ["PaletteDistance", "Vibrancy", "PolarityConsistency"],
    "PerceptualScore": ["ssim", "lp"],
    "Geometry": ["geo_score"],
}

# Detailed metric documentation (only for the 12 retained metrics)
METRIC_DOCS = {
    # Layout Metrics
    "MarginAsymmetry": {
        "name": "Margin Asymmetry",
        "description": "Measures the asymmetry degree of margin differences (std/mean)",
        "measurement": "Calculate ratio of standard deviation to mean of margin differences between GT and generated",
        "improvement": "Maintain symmetry in margin ratios or follow GT's symmetry pattern; avoid random imbalanced layouts"
    },
    "ContentAspectDiff": {
        "name": "Content Aspect Ratio Difference",
        "description": "Measures logarithmic difference in content bounding box aspect ratio",
        "measurement": "Extract minimum bounding rectangle of content, compute aspect ratio, take absolute log difference",
        "improvement": "Maintain same content aspect ratio as GT; avoid stretching or compressing elements"
    },
    "AreaRatioDiff": {
        "name": "Area Ratio Difference",
        "description": "Measures difference in internal element area distribution",
        "measurement": "Calculate average area proportion of connected components, compare difference between GT and generated",
        "improvement": "Maintain relative size proportions of elements; avoid elements being too large or too small"
    },

    # Legibility Metrics
    "TextJaccard": {
        "name": "Text Jaccard Similarity",
        "description": "Measures OCR text overlap degree (semantic legibility)",
        "measurement": "Extract text using EasyOCR, compute Jaccard coefficient of word sets = |intersection| / |union|",
        "improvement": "Improve text rendering quality; ensure clear readable fonts; maintain text content integrity; improve OCR recognition accuracy"
    },
    "ContrastDiff": {
        "name": "Global Contrast Difference",
        "description": "Measures difference in overall image contrast (5-95 percentile luminance ratio)",
        "measurement": "Calculate contrast ratio between 5-95 percentile luminance, take absolute difference between GT and generated",
        "improvement": "Adjust overall brightness range; maintain similar light-dark contrast as GT; avoid overexposure or underexposure"
    },
    "ContrastLocalDiff": {
        "name": "Local Text Contrast Difference",
        "description": "Measures contrast difference within OCR-detected text regions",
        "measurement": "Calculate local contrast within OCR bounding boxes, take average difference across regions",
        "improvement": "Ensure sufficient contrast between text and background; adjust text color for clear readability"
    },

    # Perceptual Metrics
    "ssim": {
        "name": "Structural Similarity (SSIM)",
        "description": "Measures overall similarity in image structure, brightness, and contrast",
        "measurement": "Use SSIM algorithm (sliding window) to compare local structural patterns, range 0-100",
        "improvement": "Maintain similar visual structure and texture as GT; avoid blur or distortion; maintain edge sharpness"
    },
    "lp": {
        "name": "Learned Perceptual Image Patch Similarity (LPIPS, inverted)",
        "description": "Measures perceptual image similarity using deep neural networks (higher is better after inversion)",
        "measurement": "Extract features using VGG network, compute distance in feature space. Score = 100 × (1 - LPIPS_raw), where raw LPIPS is distance (lower raw = better similarity)",
        "improvement": "Maintain consistency with GT in visual style, color distribution, texture details; avoid unnatural artifacts"
    },

    # Style Metrics
    "PaletteDistance": {
        "name": "Palette Distance",
        "description": "Measures similarity of hue distribution (hue histogram)",
        "measurement": "Compute hue histogram (36 bins) in HSV space, use Earth Mover's Distance (EMD/Wasserstein distance)",
        "improvement": "Use similar color theme as GT; maintain consistency in hue distribution; avoid introducing discordant colors"
    },
    "Vibrancy": {
        "name": "Vibrancy Consistency",
        "description": "Measures similarity of color saturation distribution (visual vividness)",
        "measurement": "Compute saturation histogram in HSV space, use EMD to compare distribution consistency",
        "improvement": "Maintain similar color saturation as GT; avoid overly vibrant or overly dull color schemes"
    },
    "PolarityConsistency": {
        "name": "Polarity Consistency",
        "description": "Measures consistency of foreground/background light-dark relationship (light bg + dark text vs dark bg + light text)",
        "measurement": "Compare background median brightness with foreground (darkest 10%) brightness, determine if polarity sign matches",
        "improvement": "Maintain same light-dark style as GT (dark mode/light mode); avoid inverting foreground-background relationship"
    },

    # Geometry
    "geo_score": {
        "name": "Geometry Fidelity",
        "description": "Measures how well generated image's aspect ratio and size match GT",
        "measurement": "Calculate log differences in aspect ratio and area, use weighted exponential decay function",
        "improvement": "Strictly maintain GT's image dimensions and aspect ratio; avoid scaling distortions"
    }
}


def parse_args():
    parser = argparse.ArgumentParser(description="Analyze hard cases from evaluation results")
    parser.add_argument(
        "--results-dir",
        type=str,
        default="results/test-1000-qwen3vl-plus-v1.2.0",
        help="Directory containing evaluation results"
    )
    parser.add_argument(
        "--top-k-percent",
        type=float,
        default=5.0,
        help="Percentage of lowest-scoring images to identify as hard cases (default: 5.0)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="assets/hard-cases",
        help="Output directory for hard case images and analysis"
    )
    return parser.parse_args()


def load_evaluation_data(results_dir: Path) -> Dict[str, Dict]:
    """Load all evaluation.json files from result directories."""
    print(f"Loading evaluation data from {results_dir}...")

    evaluation_data = {}
    image_dirs = sorted([d for d in results_dir.iterdir() if d.is_dir() and d.name.startswith("image_")])

    for image_dir in image_dirs:
        eval_file = image_dir / "evaluation.json"
        if eval_file.exists():
            with open(eval_file, 'r') as f:
                data = json.load(f)
                image_id = data.get("id", image_dir.name.replace("image_", ""))
                evaluation_data[image_id] = {
                    "data": data,
                    "dir": image_dir
                }

    print(f"Loaded {len(evaluation_data)} evaluation files")
    return evaluation_data


def extract_metrics(eval_data: Dict) -> Dict[str, float]:
    """Extract all 23 metrics from evaluation data."""
    metrics = {}

    # Extract from nested structure
    for category, metric_list in METRIC_CATEGORIES.items():
        for metric in metric_list:
            if metric in ["layout_score", "legibility_score", "perceptual_score", "style_score"]:
                # Category scores
                if category == "LayoutScore":
                    metrics[metric] = eval_data.get("LayoutScore", {}).get(metric, 0)
                elif category == "LegibilityScore":
                    metrics[metric] = eval_data.get("LegibilityScore", {}).get(metric, 0)
                elif category == "PerceptualScore":
                    metrics[metric] = eval_data.get("PerceptualScore", {}).get(metric, 0)
                elif category == "StyleScore":
                    metrics[metric] = eval_data.get("StyleScore", {}).get(metric, 0)
            elif metric == "geo_score":
                metrics[metric] = eval_data.get("Geometry", {}).get(metric, 0)
            elif metric == "total":
                metrics[metric] = eval_data.get("OverallScore", {}).get(metric, 0)
            else:
                # Individual metrics
                if category == "LayoutScore":
                    metrics[metric] = eval_data.get("LayoutScore", {}).get(metric, 0)
                elif category == "LegibilityScore":
                    metrics[metric] = eval_data.get("LegibilityScore", {}).get(metric, 0)
                elif category == "PerceptualScore":
                    metrics[metric] = eval_data.get("PerceptualScore", {}).get(metric, 0)
                elif category == "StyleScore":
                    metrics[metric] = eval_data.get("StyleScore", {}).get(metric, 0)

    return metrics


def calculate_deltas(evaluation_data: Dict[str, Dict]) -> pd.DataFrame:
    """Calculate delta (difference) for each metric compared to baseline."""
    print("Calculating deltas from baseline...")

    rows = []
    for image_id, eval_info in evaluation_data.items():
        metrics = extract_metrics(eval_info["data"])
        row = {"image_id": image_id}

        for metric_name, baseline_value in BASELINE_MAX.items():
            current_value = metrics.get(metric_name, 0)
            delta = current_value - baseline_value
            row[f"{metric_name}"] = current_value
            row[f"{metric_name}_delta"] = delta

        row["image_dir"] = eval_info["dir"]
        rows.append(row)

    df = pd.DataFrame(rows)
    print(f"Calculated deltas for {len(df)} images")
    return df


def identify_hard_cases(df: pd.DataFrame, top_k_percent: float) -> Tuple[pd.DataFrame, Dict]:
    """Identify hard cases based on per-metric ranking."""
    print(f"Identifying hard cases (top {top_k_percent}% lowest per metric)...")

    # Track which metrics flagged each image as hard case
    hard_case_flags = {image_id: [] for image_id in df["image_id"]}

    metric_stats = {}

    for metric_name in BASELINE_MAX.keys():
        delta_col = f"{metric_name}_delta"

        # Filter: only consider images below baseline (delta < 0)
        below_baseline = df[df[delta_col] < 0].copy()

        if len(below_baseline) == 0:
            print(f"  {metric_name}: No images below baseline")
            metric_stats[metric_name] = {
                "count_below_baseline": 0,
                "hard_case_count": 0,
                "threshold": None,
            }
            continue

        # Calculate number of images to flag (top k%)
        k_count = max(1, int(len(below_baseline) * (top_k_percent / 100)))

        # Sort by delta and take worst k%
        worst_k = below_baseline.nsmallest(k_count, delta_col)
        threshold = worst_k[delta_col].max()

        # Flag these images
        for _, row in worst_k.iterrows():
            image_id = row["image_id"]
            delta_value = row[delta_col]
            hard_case_flags[image_id].append({
                "metric": metric_name,
                "delta": delta_value
            })

        metric_stats[metric_name] = {
            "count_below_baseline": len(below_baseline),
            "hard_case_count": k_count,
            "threshold": threshold,
            "min_delta": below_baseline[delta_col].min(),
            "q1": below_baseline[delta_col].quantile(0.25),
            "median": below_baseline[delta_col].median(),
            "q3": below_baseline[delta_col].quantile(0.75),
            "mean": below_baseline[delta_col].mean(),
        }

        print(f"  {metric_name}: {k_count} hard cases (threshold: {threshold:.2f})")

    # Create hard cases dataframe
    hard_cases = []
    for image_id, flags in hard_case_flags.items():
        if flags:  # Only include images flagged by at least one metric
            row = df[df["image_id"] == image_id].iloc[0].to_dict()
            row["flagged_metrics"] = [f["metric"] for f in flags]
            row["flagged_deltas"] = {f["metric"]: f["delta"] for f in flags}
            hard_cases.append(row)

    hard_cases_df = pd.DataFrame(hard_cases)

    if len(hard_cases_df) > 0:
        # Sort by overall score delta
        hard_cases_df = hard_cases_df.sort_values("total_delta")

    print(f"Total unique hard cases: {len(hard_cases_df)}")

    return hard_cases_df, metric_stats


def generate_report(df: pd.DataFrame, hard_cases_df: pd.DataFrame,
                   metric_stats: Dict, output_dir: Path, top_k_percent: float):
    """Generate markdown analysis report."""
    print("Generating analysis report...")

    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    report_lines = []
    report_lines.append("# Hard Cases Analysis Report\n")
    report_lines.append(f"**Analysis Date**: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    report_lines.append(f"**Total Images Evaluated**: {len(df)}\n")
    report_lines.append(f"**Hard Case Threshold**: Top {top_k_percent}% lowest per metric\n")
    report_lines.append(f"**Total Unique Hard Cases**: {len(hard_cases_df)}\n\n")

    # Add metrics documentation
    report_lines.append("## Metrics Documentation\n\n")
    report_lines.append("### Layout Metrics (Weight: 35%)\n\n")

    for metric_name in ["MarginDelta", "EdgeCrowding", "MarginAsymmetry", "CentroidDisplacement",
                        "ContentAspectDiff", "AlignmentError", "AreaRatioDiff", "ElementCountDiff"]:
        doc = METRIC_DOCS[metric_name]
        report_lines.append(f"#### {doc['name']}\n")
        report_lines.append(f"- **Description**: {doc['description']}\n")
        report_lines.append(f"- **Measurement**: {doc['measurement']}\n")
        report_lines.append(f"- **How to Improve**: {doc['improvement']}\n\n")

    report_lines.append("### Legibility Metrics (Weight: 25%)\n\n")
    for metric_name in ["TextJaccard", "ContrastDiff", "ContrastLocalDiff"]:
        doc = METRIC_DOCS[metric_name]
        report_lines.append(f"#### {doc['name']}\n")
        report_lines.append(f"- **Description**: {doc['description']}\n")
        report_lines.append(f"- **Measurement**: {doc['measurement']}\n")
        report_lines.append(f"- **How to Improve**: {doc['improvement']}\n\n")

    report_lines.append("### Perceptual Metrics (Weight: 20%)\n\n")
    for metric_name in ["ssim", "lp", "edgef1"]:
        doc = METRIC_DOCS[metric_name]
        report_lines.append(f"#### {doc['name']}\n")
        report_lines.append(f"- **Description**: {doc['description']}\n")
        report_lines.append(f"- **Measurement**: {doc['measurement']}\n")
        report_lines.append(f"- **How to Improve**: {doc['improvement']}\n\n")

    report_lines.append("### Style Metrics (Weight: 10%)\n\n")
    for metric_name in ["PaletteDistance", "Vibrancy", "PolarityConsistency"]:
        doc = METRIC_DOCS[metric_name]
        report_lines.append(f"#### {doc['name']}\n")
        report_lines.append(f"- **Description**: {doc['description']}\n")
        report_lines.append(f"- **Measurement**: {doc['measurement']}\n")
        report_lines.append(f"- **How to Improve**: {doc['improvement']}\n\n")

    report_lines.append("### Geometry Metric (Weight: 10%)\n\n")
    doc = METRIC_DOCS["geo_score"]
    report_lines.append(f"#### {doc['name']}\n")
    report_lines.append(f"- **Description**: {doc['description']}\n")
    report_lines.append(f"- **Measurement**: {doc['measurement']}\n")
    report_lines.append(f"- **How to Improve**: {doc['improvement']}\n\n")

    report_lines.append("### Composite Scores\n\n")
    for metric_name in ["layout_score", "legibility_score", "perceptual_score", "style_score", "total"]:
        doc = METRIC_DOCS[metric_name]
        report_lines.append(f"#### {doc['name']}\n")
        report_lines.append(f"- **Description**: {doc['description']}\n")
        report_lines.append(f"- **Calculation**: {doc['measurement']}\n")
        report_lines.append(f"- **How to Improve**: {doc['improvement']}\n\n")

    report_lines.append("---\n\n")

    # Baseline comparison
    report_lines.append("## Baseline MAX Scores\n\n")
    report_lines.append("| Metric | Baseline MAX | Current Avg | Delta |\n")
    report_lines.append("|--------|--------------|-------------|-------|\n")

    for metric_name, baseline_value in BASELINE_MAX.items():
        current_avg = df[metric_name].mean()
        delta = current_avg - baseline_value
        report_lines.append(f"| {metric_name} | {baseline_value:.3f} | {current_avg:.3f} | {delta:+.3f} |\n")

    # Quartile statistics
    report_lines.append("\n## Quartile Statistics (Delta from Baseline)\n\n")
    report_lines.append("| Metric | Count Below Baseline | Hard Cases | Min | Q1 | Median | Q3 | Mean |\n")
    report_lines.append("|--------|---------------------|------------|-----|-------|--------|-------|------|\n")

    for metric_name in BASELINE_MAX.keys():
        stats = metric_stats[metric_name]
        if stats["count_below_baseline"] > 0:
            report_lines.append(
                f"| {metric_name} | {stats['count_below_baseline']} | {stats['hard_case_count']} | "
                f"{stats['min_delta']:.2f} | {stats['q1']:.2f} | {stats['median']:.2f} | "
                f"{stats['q3']:.2f} | {stats['mean']:.2f} |\n"
            )
        else:
            report_lines.append(f"| {metric_name} | 0 | 0 | - | - | - | - | - |\n")

    # Hard cases summary
    report_lines.append("\n## Hard Cases Summary\n\n")
    report_lines.append("### By Overall Score (sorted by total_delta)\n\n")
    report_lines.append("| Rank | Image ID | Overall Score | Delta | Flagged By |\n")
    report_lines.append("|------|----------|---------------|-------|------------|\n")

    for idx, row in hard_cases_df.iterrows():
        flagged_metrics = ", ".join(row["flagged_metrics"][:5])  # Show first 5
        if len(row["flagged_metrics"]) > 5:
            flagged_metrics += f" (+{len(row['flagged_metrics'])-5} more)"
        report_lines.append(
            f"| {idx+1} | {row['image_id']} | {row['total']:.2f} | {row['total_delta']:+.2f} | {flagged_metrics} |\n"
        )

    # Detailed hard cases
    report_lines.append("\n### Detailed Hard Cases\n\n")
    for idx, row in hard_cases_df.iterrows():
        report_lines.append(f"#### Image {row['image_id']}\n\n")
        report_lines.append(f"- **Overall Score**: {row['total']:.2f} (delta: {row['total_delta']:+.2f})\n")
        report_lines.append(f"- **Flagged by {len(row['flagged_metrics'])} metrics**:\n\n")

        # Sort flagged metrics by delta (worst first)
        flagged_sorted = sorted(row["flagged_deltas"].items(), key=lambda x: x[1])

        report_lines.append("| Metric | Value | Baseline | Delta |\n")
        report_lines.append("|--------|-------|----------|-------|\n")
        for metric, delta in flagged_sorted:
            value = row[metric]
            baseline = BASELINE_MAX[metric]
            report_lines.append(f"| {metric} | {value:.2f} | {baseline:.2f} | {delta:+.2f} |\n")
        report_lines.append("\n")

    # Write report
    report_file = output_dir / "hard_cases_analysis_report.md"
    with open(report_file, 'w') as f:
        f.writelines(report_lines)

    print(f"Report saved to {report_file}")


def copy_hard_case_images(hard_cases_df: pd.DataFrame, output_dir: Path):
    """Copy and rename hard case images."""
    print("Copying hard case images...")

    # Create input and output subdirectories
    input_dir = output_dir / "input"
    output_pred_dir = output_dir / "output"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_pred_dir.mkdir(parents=True, exist_ok=True)

    for idx, row in hard_cases_df.iterrows():
        image_id = row["image_id"]
        image_dir = row["image_dir"]

        # Get top 3 worst deltas for filename
        flagged_sorted = sorted(row["flagged_deltas"].items(), key=lambda x: x[1])[:3]

        # Build metric suffix for filename
        metric_parts = []
        for metric, delta in flagged_sorted:
            # Shorten metric names for readability
            metric_short = metric.replace("_score", "").replace("_delta", "")
            metric_parts.append(f"{metric_short}:{delta:+.1f}")

        metric_suffix = "_".join(metric_parts)

        # Copy GT image to input/ with original name
        gt_src = image_dir / "input.png"
        if gt_src.exists():
            gt_dst = input_dir / f"image_{image_id}.png"
            shutil.copy2(gt_src, gt_dst)

        # Copy prediction image to output/ with metrics suffix
        pred_src = image_dir / "output.png"
        if pred_src.exists():
            pred_dst = output_pred_dir / f"image_{image_id}_[{metric_suffix}].png"
            shutil.copy2(pred_src, pred_dst)

    print(f"Copied {len(hard_cases_df)} images to {input_dir}")
    print(f"Copied {len(hard_cases_df)} images to {output_pred_dir}")


def save_summary_files(df: pd.DataFrame, hard_cases_df: pd.DataFrame,
                      metric_stats: Dict, output_dir: Path):
    """Save summary CSV and stats JSON files."""
    print("Saving summary files...")

    # Save hard cases CSV
    csv_file = output_dir / "hard_cases_summary.csv"

    # Prepare CSV data
    csv_data = hard_cases_df.copy()
    csv_data["flagged_metrics"] = csv_data["flagged_metrics"].apply(lambda x: "; ".join(x))
    csv_data = csv_data.drop(columns=["image_dir", "flagged_deltas"])

    csv_data.to_csv(csv_file, index=False)
    print(f"Saved CSV to {csv_file}")

    # Save stats JSON
    stats_file = output_dir / "metrics_stats.json"

    stats_json = {
        "baseline_max": BASELINE_MAX,
        "total_images": len(df),
        "total_hard_cases": len(hard_cases_df),
        "metric_statistics": metric_stats,
        "overall_statistics": {
            metric_name: {
                "mean": float(df[metric_name].mean()),
                "std": float(df[metric_name].std()),
                "min": float(df[metric_name].min()),
                "max": float(df[metric_name].max()),
                "mean_delta": float(df[f"{metric_name}_delta"].mean()),
            }
            for metric_name in BASELINE_MAX.keys()
        }
    }

    with open(stats_file, 'w') as f:
        json.dump(stats_json, f, indent=2)

    print(f"Saved stats to {stats_file}")

    # Save metrics.xlsx with same format as evaluation.xlsx
    metrics_xlsx = output_dir / "metrics.xlsx"

    # Extract run name from output directory
    run_name = output_dir.name

    # Prepare data rows for Excel with two-level header
    header_row1 = [None]  # First column for run name
    header_row2 = [None]  # Sub-headers
    data_row = [run_name]  # Data values

    # LayoutScore columns (only 3 metrics)
    layout_metrics = ["MarginAsymmetry", "ContentAspectDiff", "AreaRatioDiff"]
    header_row1.append('LayoutScore')
    header_row1.extend([None] * (len(layout_metrics) - 1))
    for metric in layout_metrics:
        header_row2.append(metric)
        data_row.append(round(df[metric].mean(), 3))

    # LegibilityScore columns (only 3 metrics)
    legibility_metrics = ["TextJaccard", "ContrastDiff", "ContrastLocalDiff"]
    header_row1.append('LegibilityScore')
    header_row1.extend([None] * (len(legibility_metrics) - 1))
    for metric in legibility_metrics:
        header_row2.append(metric)
        data_row.append(round(df[metric].mean(), 3))

    # PerceptualScore columns (only 2 metrics)
    perceptual_metrics = ["ssim", "lp"]
    header_row1.append('PerceptualScore')
    header_row1.extend([None] * (len(perceptual_metrics) - 1))
    for metric in perceptual_metrics:
        header_row2.append(metric)
        data_row.append(round(df[metric].mean(), 3))

    # StyleScore columns (only 3 metrics)
    style_metrics = ["PaletteDistance", "Vibrancy", "PolarityConsistency"]
    header_row1.append('StyleScore')
    header_row1.extend([None] * (len(style_metrics) - 1))
    for metric in style_metrics:
        header_row2.append(metric)
        data_row.append(round(df[metric].mean(), 3))

    # Geometry (1 metric)
    header_row1.append('Geometry')
    header_row2.append(None)
    data_row.append(round(df['geo_score'].mean(), 3))

    # Create DataFrame with all three rows
    metrics_df = pd.DataFrame([header_row1, header_row2, data_row])

    # Save to Excel without header (since headers are in the data)
    metrics_df.to_excel(metrics_xlsx, index=False, header=False)

    print(f"Saved metrics to {metrics_xlsx}")


def main():
    args = parse_args()

    results_dir = Path(args.results_dir)
    output_dir = Path(args.output_dir)

    # Load evaluation data
    evaluation_data = load_evaluation_data(results_dir)

    # Calculate deltas
    df = calculate_deltas(evaluation_data)

    # Identify hard cases
    hard_cases_df, metric_stats = identify_hard_cases(df, args.top_k_percent)

    # Generate outputs
    generate_report(df, hard_cases_df, metric_stats, output_dir, args.top_k_percent)
    copy_hard_case_images(hard_cases_df, output_dir)
    save_summary_files(df, hard_cases_df, metric_stats, output_dir)

    print("\nAnalysis complete!")
    print(f"  - Total images analyzed: {len(df)}")
    print(f"  - Unique hard cases identified: {len(hard_cases_df)}")
    print(f"  - Output directory: {output_dir}")


if __name__ == "__main__":
    main()
