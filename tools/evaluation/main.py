#!/usr/bin/env python3
"""
Widget Evaluation Pipeline
Performs widget quality evaluation and generates statistics.

Usage:
    python main.py --gt_dir <GT_DIR> --pred_dir <PRED_DIR> [OPTIONS]
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path


def run_evaluation(gt_dir: str, pred_dir: str, num_workers: int = 4, use_cuda: bool = False):
    """
    Run widget quality evaluation using eval.py

    Args:
        gt_dir: Path to ground truth directory
        pred_dir: Path to prediction directory
        num_workers: Number of worker threads
        use_cuda: Whether to use CUDA/GPU for computation
    """
    print("=" * 80)
    print("STEP 1: Running Widget Quality Evaluation")
    print("=" * 80)

    eval_script = Path(__file__).parent / "eval.py"

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

    if use_cuda:
        cmd.append("--cuda")

    print(f"Running: {' '.join(cmd)}\n")

    result = subprocess.run(cmd, capture_output=False, text=True)

    if result.returncode != 0:
        print(f"❌ Evaluation failed with return code {result.returncode}")
        sys.exit(1)

    print("\n✅ Evaluation completed successfully!\n")


def run_statistics_generation(pred_dir: str, output_dir: str):
    """
    Generate metrics statistics using analysis.py

    Args:
        pred_dir: Path to prediction directory (contains evaluation.json files)
        output_dir: Path to output directory for statistics files
    """
    print("=" * 80)
    print("STEP 2: Generating Metrics Statistics")
    print("=" * 80)

    analysis_script = Path(__file__).parent / "analysis.py"

    if not analysis_script.exists():
        print(f"❌ Error: Analysis script not found at {analysis_script}")
        sys.exit(1)

    cmd = [
        sys.executable,
        str(analysis_script),
        "--results-dir", pred_dir,
        "--output-dir", output_dir
    ]

    print(f"Running: {' '.join(cmd)}\n")

    result = subprocess.run(cmd, capture_output=False, text=True)

    if result.returncode != 0:
        print(f"❌ Statistics generation failed with return code {result.returncode}")
        sys.exit(1)

    print("\n✅ Statistics generation completed successfully!\n")


def print_summary(gt_dir: str, pred_dir: str, output_dir: str):
    """Print final summary"""
    print("=" * 80)
    print("PIPELINE COMPLETED")
    print("=" * 80)
    print(f"📂 Ground Truth Directory: {gt_dir}")
    print(f"📂 Prediction Directory: {pred_dir}")
    print(f"📂 Statistics Output: {output_dir}")
    print()

    # Check for evaluation summary
    eval_summary = Path(pred_dir) / "evaluation.xlsx"
    if eval_summary.exists():
        print(f"📊 Evaluation Summary: {eval_summary}")

    # Check for statistics outputs
    stats_file = Path(output_dir) / "metrics_stats.json"
    if stats_file.exists():
        print(f"📈 Metrics Statistics: {stats_file}")

    metrics_xlsx = Path(output_dir) / "metrics.xlsx"
    if metrics_xlsx.exists():
        print(f"📊 Metrics Excel: {metrics_xlsx}")

    print()
    print("✅ All steps completed successfully!")


def main():
    parser = argparse.ArgumentParser(
        description="Widget Evaluation Pipeline - Evaluate and generate statistics",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage (CPU)
  python main.py --gt_dir /path/to/GT --pred_dir /path/to/results

  # Use GPU for faster computation
  python main.py --gt_dir /path/to/GT --pred_dir /path/to/results --cuda

  # Custom output directory and more workers
  python main.py \\
    --gt_dir /path/to/GT \\
    --pred_dir /path/to/results \\
    --output_dir /path/to/stats \\
    --workers 8

  # Skip evaluation (if evaluation.json already exists)
  python main.py \\
    --gt_dir /path/to/GT \\
    --pred_dir /path/to/results \\
    --skip_eval
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
        help="Path to output directory for statistics (default: {pred_dir}/.analysis)"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of worker threads for evaluation (default: 4)"
    )
    parser.add_argument(
        "--skip_eval",
        action="store_true",
        help="Skip evaluation step (assumes evaluation.json files already exist)"
    )
    parser.add_argument(
        "--cuda",
        action="store_true",
        help="Use CUDA/GPU for computation (default: CPU)"
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
        output_dir = pred_dir / ".analysis"

    # Print configuration
    print("\n" + "=" * 80)
    print("Widget Quality Evaluation Pipeline")
    print("=" * 80)
    print(f"GT Directory:     {gt_dir}")
    print(f"Prediction Dir:   {pred_dir}")
    print(f"Output Dir:       {output_dir}")
    print(f"Workers:          {args.workers}")
    print(f"CUDA:             {'Enabled' if args.cuda else 'Disabled (CPU)'}")
    print("=" * 80)
    print()

    # Step 1: Run evaluation
    if not args.skip_eval:
        run_evaluation(str(gt_dir), str(pred_dir), args.workers, args.cuda)
    else:
        print("⏩ Skipping evaluation step (--skip_eval)\n")

    # Step 2: Generate statistics (always run)
    run_statistics_generation(str(pred_dir), str(output_dir))

    # Print summary
    print_summary(str(gt_dir), str(pred_dir), str(output_dir))


if __name__ == "__main__":
    main()
