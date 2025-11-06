import os
from PIL import Image



def load_and_count_images(root_dir):
    """
    Iterates through subfolders in root_dir following the format image_{n},
    loads 'source.png' and '1-minimal.png' when available, and counts how many
    folders have each.

    Returns:
        data (list of dict): Each dict contains image pair info.
        counts (dict): Summary counts for folder and file existence.
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

        # Define paths
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

                # Store valid pair
                try:
                    folder_id = int(folder.split("_")[1])
                except (IndexError, ValueError):
                    folder_id = folder

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
    print(f"  📁 Total image_{{}} folders: {counts['total_folders']}")
    print(f"  🟢 With source.png: {counts['with_source']}")
    print(f"  🟣 With 1-minimal.png: {counts['with_minimal']}")
    print(f"  ✅ With both images: {counts['with_both']}")
    print(f"  ❌ Missing one or both: {counts['total_folders'] - counts['with_both']}")
    print(f"  Loaded {len(data)} image pairs successfully.")

    return data, counts


# Example usage
if __name__ == "__main__":
    root_path = '/shared/zhixiang_team/houston/workspace/widget-research/baselines/baselines-apis/results'
    root_dir = os.path.join(root_path, '20251004-232801-qwen3vl-plus-test-1000-html-no-size-minimal')
    all_images, stats = load_and_count_images(root_dir)
