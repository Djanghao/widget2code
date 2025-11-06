import os
import csv
import numpy as np
from PIL import Image
from widget_quality_metrics import compute_quality_score
from lpips import LPIPS
from tqdm import tqdm
import torch

def load_and_count_images(root_dir):
    """
    Iterates through subfolders in root_dir following the format image_{n},
    loads 'source.png' and '1-minimal.png' when available.
    Returns:
        data (list of dict): Each dict contains image pair info.
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
                source_img = Image.open(source_path).convert("RGB")
                prediction_img = Image.open(pred_path).convert("RGB")
                folder_id = int(folder.split("_")[1]) if "_" in folder else folder
                data.append({
                    "id": folder_id,
                    "source_path": source_path,
                    "prediction_path": pred_path,
                    "source_img": source_img,
                    "prediction_img": prediction_img
                })
            except Exception as e:
                print(f"⚠️ Error reading images in {folder}: {e}")

    # Summary
    print("📊 Summary:")
    print(f"  📁 Total folders: {counts['total_folders']}")
    print(f"  🟢 With source.png: {counts['with_source']}")
    print(f"  🟣 With 1-minimal.png: {counts['with_minimal']}")
    print(f"  ✅ With both: {counts['with_both']}")
    print(f"  ❌ Missing one or both: {counts['total_folders'] - counts['with_both']}")
    print(f"  Loaded {len(data)} pairs successfully.")
    return data, counts


def evaluate_all_pairs(root_dir, output_csv="widget_quality_results.csv"):
    """
    Loop through all valid image pairs, compute metrics, and save results.
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    loss_fn = LPIPS(net="alex").to(device)  # load once on GPU if available

    image_pairs, stats = load_and_count_images(root_dir)
    all_results = []

    # 🔹 Wrap iterable with tqdm for progress bar
    for i, entry in enumerate(
        tqdm(
            sorted(image_pairs, key=lambda x: x["id"]),
            desc="Evaluating widget pairs",
            total=len(image_pairs),
            ncols=100,
            colour="cyan",
        )
    ):
        # update progress bar postfix instead of print
        # tqdm.write(f"🔍 Pair {i+1}/{len(image_pairs)} (ID: {entry['id']})")
        
        
        gt = np.asarray(entry["source_img"]) / 255.0
        pred = np.asarray(entry["prediction_img"]) / 255.0

        result = compute_quality_score(gt, pred, loss_fn)
        result["id"] = entry["id"]
        all_results.append(result)

        # if i == 450:
        #     break

    # Compute dataset-level summary
    # avg_scores = {
    # k: np.mean([r[k] for r in all_results if r[k] is not None])
    # for k in all_results[0]
    # if k != "id"}

    # print("\n📈 Dataset Average Scores:")
    # for k, v in avg_scores.items():
    #     print(f"{k:14s}: {v:.3f}")

    avg_scores = {}

    # Loop over each key in the first result dictionary
    for k in all_results[0]:
        # Skip the "id" field
        if k == "id":
            continue

        # Collect all values for this key across all result dictionaries
        values = []
        # print('checking K', k)
        for r in all_results:
            if r[k]!= None:
                values.append(r[k])
                # print(values[-1])
        print(len(values))
        # Compute the mean of those values
        mean_value = np.mean(values)

        # Store it in the result dictionary
        avg_scores[k] = mean_value

    print("\n📈 Dataset Average Scores:")
    for k, v in avg_scores.items():
        print(f"{k:14s}: {v:.3f}")

    # avg_scores = {k: np.var([r[k] for r in all_results]) for k in all_results[0] if k != "id"}
    # print("\n📈 Dataset Average Scores:")
    # for k, v in avg_scores.items():
    #     print(f"{k:14s}: {v:.3f}")

    # avg_scores = {k: np.std([r[k] for r in all_results]) for k in all_results[0] if k != "id"}
    # print("\n📈 Dataset Average Scores:")
    # for k, v in avg_scores.items():
    #     print(f"{k:14s}: {v:.3f}")

    # Save to CSV
    # out_path = os.path.join(root_dir, output_csv)
    # with open(out_path, "w", newline="") as f:
    #     writer = csv.DictWriter(f, fieldnames=list(all_results[0].keys()))
    #     writer.writeheader()
    #     writer.writerows(all_results)
    # print(f"\n💾 Results saved to: {out_path}")

    return all_results, avg_scores


if __name__ == "__main__":
    root_path = '/shared/zhixiang_team/houston/workspace/widget-research/baselines/baselines-apis/results'

    root_dir = os.path.join(root_path, '20251004-232801-qwen3vl-plus-test-1000-html-no-size-minimal')
    # root_dir = os.path.join(root_path, '20251004-232757-qwen3vl-plus-test-1000-html-no-size-minimal-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251004-232753-qwen3vl-plus-test-1000-html-no-size-minimal-cal-size')
    # root_dir = os.path.join(root_path, '20251004-232749-qwen3vl-plus-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')

    # root_dir = os.path.join(root_path, '20251004-232749-qwen3vl-plus-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251003-193331-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251003-193321-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal-cal-size')
    # root_dir = os.path.join(root_path, '20251003-193309-qwen3vl-235b-a22b-instruct-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')

    # root_dir = os.path.join(root_path, '20251002-221603-doubao1.6-test-1000-html-no-size-minimal')
    # root_dir = os.path.join(root_path, '20251002-221518-doubao1.6-test-1000-html-no-size-minimal-cal-aspect-ratio')
    # root_dir = os.path.join(root_path, '20251002-221457-doubao1.6-test-1000-html-no-size-minimal-cal-size')
    # root_dir = os.path.join(root_path, '20251002-221358-doubao1.6-test-1000-html-no-size-minimal-cal-size-cal-aspect-ratio')    

    results, averages = evaluate_all_pairs(root_dir)
    print('Method name: ', root_dir.split('/')[-1])
    