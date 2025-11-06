#!/usr/bin/env python3
"""
Widget Evaluation Pipeline
Performs end-to-end evaluation and hard case analysis.

Usage:
    python main.py --gt_dir <GT_DIR> --pred_dir <PRED_DIR> [OPTIONS]
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path


def run_evaluation(gt_dir: str, pred_dir: str, num_workers: int = 4):
    """
    Run widget quality evaluation using loop_OneByOne_houston.py

    Args:
        gt_dir: Path to ground truth directory
        pred_dir: Path to prediction directory
        num_workers: Number of worker threads
    """
    print("=" * 80)
    print("STEP 1: Running Widget Quality Evaluation")
    print("=" * 80)

    eval_script = Path(__file__).parent / "loop_OneByOne_houston.py"

    if not eval_script.exists():
        print(f"❌ Error: Evaluation script not found at {eval_script}")
        sys.exit(1)

    cmd = [
        sys.executable,
        str(eval_script),
        "--gt_dir", gt_dir,
        "--baseline_dir", pred_dir,
        "--workers", str(num_workers)
    ]

    print(f"Running: {' '.join(cmd)}\n")

    result = subprocess.run(cmd, capture_output=False, text=True)

    if result.returncode != 0:
        print(f"❌ Evaluation failed with return code {result.returncode}")
        sys.exit(1)

    print("\n✅ Evaluation completed successfully!\n")


def load_evaluation_summary(pred_dir: str):
    """Load evaluation_summary.json if it exists"""
    summary_file = Path(pred_dir) / "evaluation_summary.json"
    if summary_file.exists():
        with open(summary_file, 'r') as f:
            return json.load(f)
    return None


def run_hard_case_analysis(pred_dir: str, output_dir: str, top_k_percent: float = 5.0):
    """
    Run hard case analysis using analysis.py

    Args:
        pred_dir: Path to prediction directory (contains evaluation.json files)
        output_dir: Path to output directory for hard cases
        top_k_percent: Percentage of lowest-scoring images to flag as hard cases
    """
    print("=" * 80)
    print("STEP 2: Analyzing Hard Cases")
    print("=" * 80)

    analysis_script = Path(__file__).parent / "analysis.py"

    if not analysis_script.exists():
        print(f"❌ Error: Analysis script not found at {analysis_script}")
        sys.exit(1)

    cmd = [
        sys.executable,
        str(analysis_script),
        "--results-dir", pred_dir,
        "--output-dir", output_dir,
        "--top-k-percent", str(top_k_percent)
    ]

    print(f"Running: {' '.join(cmd)}\n")

    result = subprocess.run(cmd, capture_output=False, text=True)

    if result.returncode != 0:
        print(f"❌ Hard case analysis failed with return code {result.returncode}")
        sys.exit(1)

    print("\n✅ Hard case analysis completed successfully!\n")


def print_summary(gt_dir: str, pred_dir: str, output_dir: str):
    """Print final summary"""
    print("=" * 80)
    print("PIPELINE COMPLETED")
    print("=" * 80)
    print(f"📂 Ground Truth Directory: {gt_dir}")
    print(f"📂 Prediction Directory: {pred_dir}")
    print(f"📂 Hard Cases Output: {output_dir}")
    print()

    # Check for evaluation summary
    eval_summary = Path(pred_dir) / "evaluation.xlsx"
    if eval_summary.exists():
        print(f"📊 Evaluation Summary: {eval_summary}")

    # Check for hard case outputs
    report_file = Path(output_dir) / "hard_cases_analysis_report.md"
    if report_file.exists():
        print(f"📄 Analysis Report: {report_file}")

    input_dir = Path(output_dir) / "input"
    output_img_dir = Path(output_dir) / "output"
    if input_dir.exists() and output_img_dir.exists():
        input_count = len(list(input_dir.glob("*.png")))
        output_count = len(list(output_img_dir.glob("*.png")))
        print(f"🖼️  Hard Case Images: {input_count} GT + {output_count} generated")

    print()
    print("✅ All steps completed successfully!")


def main():
    parser = argparse.ArgumentParser(
        description="Widget Evaluation Pipeline - Evaluate and analyze hard cases",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python main.py --gt_dir /path/to/GT --pred_dir /path/to/results

  # Specify custom output directory and workers
  python main.py \\
    --gt_dir /path/to/GT \\
    --pred_dir /path/to/results \\
    --output_dir /path/to/hard_cases \\
    --workers 8 \\
    --top_k_percent 10.0
        """
    )

    # Required arguments
    parser.add_argument(
        "--gt_dir",
        type=str,
        required=True,
        help="Path to ground truth directory (required)"
    )
    parser.add_argument(
        "--pred_dir",
        type=str,
        required=True,
        help="Path to prediction directory (required)"
    )

    # Optional arguments
    parser.add_argument(
        "--output_dir",
        type=str,
        default=None,
        help="Path to output directory for hard cases (default: {pred_dir}/hard-cases-analysis)"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of worker threads for evaluation (default: 4)"
    )
    parser.add_argument(
        "--top_k_percent",
        type=float,
        default=5.0,
        help="Percentage of lowest-scoring images to identify as hard cases (default: 5.0)"
    )
    parser.add_argument(
        "--skip_eval",
        action="store_true",
        help="Skip evaluation step (assumes evaluation.json files already exist)"
    )
    parser.add_argument(
        "--skip_analysis",
        action="store_true",
        help="Skip hard case analysis step"
    )

    args = parser.parse_args()

    # Validate directories
    gt_dir = Path(args.gt_dir)
    pred_dir = Path(args.pred_dir)

    if not gt_dir.exists():
        print(f"❌ Error: GT directory does not exist: {gt_dir}")
        sys.exit(1)

    if not pred_dir.exists():
        print(f"❌ Error: Prediction directory does not exist: {pred_dir}")
        sys.exit(1)

    # Set output directory
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = pred_dir / "hard-cases-analysis"

    print()
    print("=" * 80)
    print("WIDGET EVALUATION PIPELINE")
    print("=" * 80)
    print(f"GT Directory:     {gt_dir}")
    print(f"Prediction Dir:   {pred_dir}")
    print(f"Output Dir:       {output_dir}")
    print(f"Workers:          {args.workers}")
    print(f"Top-k Percent:    {args.top_k_percent}%")
    print("=" * 80)
    print()

    # Step 1: Run evaluation
    if not args.skip_eval:
        run_evaluation(str(gt_dir), str(pred_dir), args.workers)
    else:
        print("⏩ Skipping evaluation step (--skip_eval)\n")

    # Step 2: Run hard case analysis
    if not args.skip_analysis:
        run_hard_case_analysis(str(pred_dir), str(output_dir), args.top_k_percent)
    else:
        print("⏩ Skipping hard case analysis step (--skip_analysis)\n")

    # Print summary
    print_summary(str(gt_dir), str(pred_dir), str(output_dir))


if __name__ == "__main__":
    main()
