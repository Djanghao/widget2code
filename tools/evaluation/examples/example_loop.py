import os
import numpy as np
from PIL import Image

# === Import all your modules ===
from widget_quality.utils import load_image, resize_to_match
from widget_quality.perceptual import compute_perceptual
from widget_quality.layout import compute_layout
from widget_quality.legibility import compute_legibility
from widget_quality.style import compute_style
from widget_quality.geometry import compute_aspect_dimensionality_fidelity
from widget_quality.composite import composite_score


def load_and_count_images(root_dir):
    """
    Iterates through subfolders in root_dir following the format image_{n},
    loads 'source.png' and '1-minimal.png' when available, and counts how many
    folders have each.
    """
    data = []
    counts = {
        "total_folders": 0,
        "with_source": 0,
        "with_minimal": 0,
        "with_both": 0
    }

    for folder in os.listdir(root_dir):
        if not folder.startswith("image_"):
            continue

        subdir = os.path.join(root_dir, folder)
        if not os.path.isdir(subdir):
            continue

        counts["total_folders"] += 1

        source_path = os.path.join(subdir, "source.png")
        pred_path = os.path.join(subdir, "html-no-size", "1-minimal.png")

        has_source = os.path.exists(source_path)
        has_minimal = os.path.exists(pred_path)

        if has_source:
            counts["with_source"] += 1
        if has_minimal:
            counts["with_minimal"] += 1

        if has_source and has_minimal:
            counts["with_both"] += 1
            try:
                source_img = load_image(source_path)
                pred_img = load_image(pred_path)

                folder_id = folder.split("_")[1] if "_" in folder else folder
                data.append({
                    "id": folder_id,
                    "source_path": source_path,
                    "prediction_path": pred_path,
                    "source_img": source_img,
                    "prediction_img": pred_img
                })
            except Exception as e:
                print(f"⚠️ Error reading images in {folder}: {e}")

    print("📊 Summary:")
    print(f"  📁 Total image_{{}} folders: {counts['total_folders']}")
    print(f"  🟢 With source.png: {counts['with_source']}")
    print(f"  🟣 With 1-minimal.png: {counts['with_minimal']}")
    print(f"  ✅ With both images: {counts['with_both']}")
    print(f"  ❌ Missing one or both: {counts['total_folders'] - counts['with_both']}")
    print(f"  Loaded {len(data)} image pairs successfully.")

    return data, counts


def evaluate_all_pairs(root_dir):
    """
    Run all widget quality metrics over all valid pairs and compute average results.
    """
    pairs, stats = load_and_count_images(root_dir)

    all_scores = []

    for i, item in enumerate(pairs, start=1):
        gt = item["source_img"]
        gen_raw = item["prediction_img"]
        gen = resize_to_match(gt, gen_raw)  # resize for pixel-wise metrics
        # print(gen.dtype, gen.shape, gen.max())
        # exit()
        try:
            # Compute metrics
            geo = compute_aspect_dimensionality_fidelity(gt, gen_raw)  # use raw before resize
            print('geo')
            perceptual = compute_perceptual(gt, gen)
            print('perceptual')
            layout = compute_layout(gt, gen)  # 100， 589
            print('layout')
            legibility = compute_legibility(gt, gen)
            print('legibility')
            # style = compute_style(gt, gen)
            # print('style')
            style = None
            # print(f"[{i}/{len(pairs)}]")

            result = composite_score(geo, perceptual, layout, legibility, style)

            result["id"] = item["id"]
            all_scores.append(result)

            print(f"[{i}/{len(pairs)}] ✅ {item['id']} → Overall {result['OverallScore']:.2f}")

        except Exception as e:
            print(f"[{i}/{len(pairs)}] ⚠️ Error evaluating {item['id']}: {e}")

    # Compute averaged results
    if not all_scores:
        print("❌ No valid image pairs to evaluate.")
        return None

    keys = ["LayoutScore", "LegibilityScore", "PerceptualScore", "StyleScore", "Geometry", "OverallScore"]
    avg = {k: np.mean([s[k] for s in all_scores]) for k in keys}
    avg = {k: round(v, 3) for k, v in avg.items()}

    print("\n📈 Average metrics across all pairs:")
    for k, v in avg.items():
        print(f"  {k:18s}: {v:6.3f}")

    return all_scores, avg


# === Example usage ===
if __name__ == "__main__":
    root_path = '/shared/zhixiang_team/houston/workspace/widget-research/baselines/baselines-apis/results'

    # root_dir = os.path.join(root_path, '20251004-232801-qwen3vl-plus-test-1000-html-no-size-minimal')
    root_dir = os.path.join(root_path, '20251004-232757-qwen3vl-plus-test-1000-html-no-size-minimal-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251004-232753-qwen3vl-plus-test-1000-html-no-size-minimal-cal-size')
    # root_dir = os.path.join(root_path, '20251004-232749-qwen3vl-plus-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')

    # root_dir = os.path.join(root_path, '20251003-193339-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal')
    # root_dir = os.path.join(root_path, '20251003-193331-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251003-193321-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal-cal-size')
    # root_dir = os.path.join(root_path, '20251003-193309-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')

    # root_dir = os.path.join(root_path, '20251002-221603-doubao1.6-test-1000-html-no-size-minimal')
    # root_dir = os.path.join(root_path, '20251002-221518-doubao1.6-test-1000-html-no-size-minimal-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251002-221457-doubao1.6-test-1000-html-no-size-minimal-cal-size')
    # root_dir = os.path.join(root_path, '20251002-221358-doubao1.6-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')    

    results, averages = evaluate_all_pairs(root_dir)
