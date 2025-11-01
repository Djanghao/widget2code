# -----------------------------------------------------------------------------
# File: cli.py
# Description: CLI entry points for widget generation (single and batch)
# Author: Houston Zhang
# Date: 2025-10-30
# -----------------------------------------------------------------------------

import sys
import json
import asyncio
import argparse
from pathlib import Path


def main():
    """CLI entry point for widget generation."""
    if len(sys.argv) < 2:
        print("Usage: generate-widget <image-path> [output-path]")
        print("Example: generate-widget input.png [output.json]")
        sys.exit(1)

    image_path = sys.argv[1]

    # Optional output path - defaults to same directory, same name with .json extension
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        input_file = Path(image_path)
        output_path = str(input_file.with_suffix('.json'))

    if not Path(image_path).exists():
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)

    from generator import generate_widget_full
    from generator.config import GeneratorConfig
    import os

    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()

        config = GeneratorConfig.from_env()
        result = asyncio.run(generate_widget_full(
            image_data=image_data,
            image_filename=Path(image_path).name,
            system_prompt=None,
            model=os.getenv('DEFAULT_MODEL', 'qwen3-vl-flash'),
            api_key=os.getenv('DASHSCOPE_API_KEY'),
            retrieval_topk=config.retrieval_topk,
            retrieval_topm=config.retrieval_topm,
            retrieval_alpha=config.retrieval_alpha,
            config=config,
            icon_lib_names=os.getenv('ICON_LIB_NAMES', '["sf", "lucide"]'),
        ))

        dsl_to_save = result.get('widgetDSL', result) if isinstance(result, dict) else result
        with open(output_path, 'w') as f:
            json.dump(dsl_to_save, f, indent=2)

        print(f"Widget generated successfully: {output_path}")
    except Exception as e:
        print(f"Error generating widget: {e}")
        sys.exit(1)


def batch_main():
    """CLI entry point for batch widget generation."""
    import os

    parser = argparse.ArgumentParser(
        description='Batch generate WidgetDSL from multiple images',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  generate-widget-batch ./images ./output
  generate-widget-batch ./images ./output --concurrency 5
  generate-widget-batch ./images ./output -c 2 --model qwen3-vl-plus
  generate-widget-batch ./images ./output --icon-libs '["lucide"]'
        """
    )

    parser.add_argument('input_dir', type=str, help='Input directory containing images')
    parser.add_argument('output_dir', type=str, help='Output directory for generated DSL files')
    parser.add_argument(
        '-c', '--concurrency',
        type=int,
        default=3,
        help='Number of images to process in parallel (default: 3)'
    )
    parser.add_argument(
        '-m', '--model',
        type=str,
        default=os.getenv('DEFAULT_MODEL', 'qwen3-vl-flash'),
        help='Model to use (default: from DEFAULT_MODEL env or qwen3-vl-flash)'
    )
    parser.add_argument(
        '--icon-libs',
        type=str,
        default=os.getenv('ICON_LIB_NAMES', '["sf", "lucide"]'),
        help='Icon libraries as JSON array (default: from ICON_LIB_NAMES env or ["sf", "lucide"])'
    )
    parser.add_argument(
        '--api-key',
        type=str,
        help='API key (defaults to DASHSCOPE_API_KEY env var)'
    )

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    if not input_dir.exists():
        print(f"Error: Input directory not found: {input_dir}")
        sys.exit(1)

    if not input_dir.is_dir():
        print(f"Error: Input path is not a directory: {input_dir}")
        sys.exit(1)

    from generator.generation.widget import batch_generate

    try:
        asyncio.run(batch_generate(
            input_dir=str(input_dir),
            output_dir=str(output_dir),
            concurrency=args.concurrency,
            api_key=args.api_key,
            model=args.model,
            icon_lib_names=args.icon_libs,
        ))
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
