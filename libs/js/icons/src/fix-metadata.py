#!/usr/bin/env python3
"""
Quick fix for metadata.json and items.json files:
1. Fix absolute paths -> relative paths
2. Fix component_id: "Icon.XXX" -> "prefix:XXX"
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, List


def extract_library_and_filename(path_str: str) -> tuple[str, str]:
    """
    Extract library prefix and filename from path.

    Examples:
        "/home/darren/llm-widget-factory/assets/ai/AiFillHeart.svg" -> ("ai", "AiFillHeart.svg")
        "lu/LuHeart.svg" -> ("lu", "LuHeart.svg")
    """
    path = Path(path_str)
    parts = path.parts

    # Find the library part (lu, ai, sf, etc.)
    for i, part in enumerate(parts):
        if part in ["lu", "sf", "ai", "bi", "bs", "cg", "ci", "di", "fa", "fa6",
                    "fc", "fi", "gi", "go", "gr", "hi", "hi2", "im", "io", "io5",
                    "lia", "md", "pi", "rx", "ri", "si", "sl", "tb", "tfi", "ti", "vsc", "wi"]:
            # Get remaining parts after library
            remaining = parts[i:]
            return part, "/".join(remaining)

    return None, path.name


def fix_component_id(old_id: str, library: str, filename: str) -> str:
    """
    Fix component_id format.

    Examples:
        "Icon.AiFillHeart" + "ai" -> "ai:AiFillHeart"
        "Icon.BoltFill" + "sf" -> "sf:SfBoltFill"
    """
    # Remove "Icon." prefix if present
    if old_id.startswith("Icon."):
        component_name = old_id[5:]  # Remove "Icon."
    else:
        component_name = old_id

    # For SF Symbols, add Sf prefix if not present
    if library == "sf":
        if not component_name.startswith("Sf"):
            component_name = "Sf" + component_name

    return f"{library}:{component_name}"


def fix_metadata_json(file_path: Path) -> None:
    """Fix metadata.json file."""
    print(f"Fixing {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_data = {}
    fixed_count = 0

    for old_path, metadata in data.items():
        library, rel_path = extract_library_and_filename(old_path)

        if library:
            # Fix component_id
            old_comp_id = metadata.get("component_id", "")
            filename = Path(rel_path).stem
            new_comp_id = fix_component_id(old_comp_id, library, filename)

            metadata["component_id"] = new_comp_id
            new_data[rel_path] = metadata

            if old_path != rel_path or old_comp_id != new_comp_id:
                fixed_count += 1
        else:
            # Keep as-is if we can't determine library
            new_data[old_path] = metadata

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"  ✓ Fixed {fixed_count} entries")


def fix_items_json(file_path: Path) -> None:
    """Fix items.json file."""
    print(f"Fixing {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    fixed_count = 0

    for item in items:
        old_src = item.get("src_svg", "")
        library, rel_path = extract_library_and_filename(old_src)

        if library:
            # Fix src_svg path
            old_comp_id = item.get("component_id", "")
            filename = Path(rel_path).stem
            new_comp_id = fix_component_id(old_comp_id, library, filename)

            item["src_svg"] = rel_path
            item["component_id"] = new_comp_id

            if old_src != rel_path or old_comp_id != new_comp_id:
                fixed_count += 1

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"  ✓ Fixed {fixed_count} entries")


def main():
    embeddings_root = Path(__file__).parent.parent / "embeddings"

    if not embeddings_root.exists():
        print(f"Error: {embeddings_root} does not exist")
        return

    print(f"Scanning {embeddings_root}\n")

    # Find all metadata.json files
    metadata_files = list(embeddings_root.glob("*/metadata.json"))
    items_files = list(embeddings_root.glob("*/features/items.json"))

    print(f"Found {len(metadata_files)} metadata.json files")
    print(f"Found {len(items_files)} items.json files\n")

    # Fix metadata.json files
    for file in sorted(metadata_files):
        try:
            fix_metadata_json(file)
        except Exception as e:
            print(f"  ✗ Error: {e}")

    print()

    # Fix items.json files
    for file in sorted(items_files):
        try:
            fix_items_json(file)
        except Exception as e:
            print(f"  ✗ Error: {e}")

    print("\n✅ Done!")


if __name__ == "__main__":
    main()
