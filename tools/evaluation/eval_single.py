#!/usr/bin/env python3

import os
import re
import sys
import json
import argparse
from pathlib import Path


def find_gt_path(widget_dir: Path, gt_dir: Path | None) -> Path | None:
    if gt_dir and gt_dir.exists():
        m = re.search(r'(\d+)', widget_dir.name)
        if m:
            num = m.group(1)
            p = gt_dir / f'gt_{num}.png'
            if p.exists():
                return p
    return None


def evaluate_pair(gt_path: Path, widget_dir: Path) -> tuple[bool, dict | None, str | None]:
    try:
        sys.path.append(str(Path(__file__).parent))
        from widget_quality.utils import load_image, resize_to_match
        from widget_quality.perceptual import compute_perceptual
        from widget_quality.layout import compute_layout
        from widget_quality.legibility import compute_legibility
        from widget_quality.style import compute_style
        from widget_quality.geometry import compute_aspect_dimensionality_fidelity
        from widget_quality.composite import composite_score

        pred_path = widget_dir / 'output.png'
        if not pred_path.exists():
            return (False, None, f'Missing prediction image: {pred_path}')

        gt_img = load_image(str(gt_path))
        pred_img = load_image(str(pred_path))
        gen = resize_to_match(gt_img, pred_img)

        geo = compute_aspect_dimensionality_fidelity(gt_img, pred_img)
        perceptual = compute_perceptual(gt_img, gen)
        layout = compute_layout(gt_img, gen)
        legibility = compute_legibility(gt_img, gen)
        style = compute_style(gt_img, gen)

        result = composite_score(geo, perceptual, layout, legibility, style)
        result['id'] = widget_dir.name

        out_file = widget_dir / 'evaluation.json'
        out_file.write_text(json.dumps(result, indent=2))

        return (True, result, None)
    except Exception as e:
        return (False, None, str(e))


def main():
    parser = argparse.ArgumentParser(description='Evaluate a single widget directory and write evaluation.json')
    parser.add_argument('--widget_dir', required=True, type=str, help='Path to widget directory (contains output.png)')
    parser.add_argument('--gt_dir', type=str, default=None, help='Root GT directory (optional fallback)')
    args = parser.parse_args()

    widget_dir = Path(args.widget_dir)
    if not widget_dir.exists():
        print(f"❌ Error: widget_dir not found: {widget_dir}")
        sys.exit(1)

    gt_dir = Path(args.gt_dir).resolve() if args.gt_dir else None
    gt_path = find_gt_path(widget_dir, gt_dir)
    if not gt_path or not gt_path.exists():
        print(f"❌ Error: Could not find GT image for {widget_dir.name}")
        if gt_dir:
            print(f"  Searched in: {gt_dir}")
        print("  Hint: ensure debug.json has input.originalPath or pass --gt_dir")
        sys.exit(1)

    ok, result, err = evaluate_pair(gt_path, widget_dir)
    if not ok:
        print(f"❌ Evaluation failed for {widget_dir.name}: {err}")
        sys.exit(1)

    overall = result.get('OverallScore', {}).get('total')
    if overall is not None:
        print(f"✅ Evaluated {widget_dir.name}: Overall={overall:.2f}")
    else:
        print(f"✅ Evaluated {widget_dir.name}")
    sys.exit(0)


if __name__ == '__main__':
    main()
