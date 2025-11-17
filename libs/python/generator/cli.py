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
    """CLI entry point for single widget generation."""
    if len(sys.argv) < 3:
        print("Usage: generate-widget <image-path> <output-dir>")
        print("Example: generate-widget input.png ./output")
        print("")
        print("Note: This will create output-dir/image-name/ with full artifacts")
        print("      The DSL will be at output-dir/image-name/artifacts/4-dsl/widget.json")
        sys.exit(1)

    image_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not Path(image_path).exists():
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)

    from generator.generation.widget import generate_single_widget
    from generator.config import GeneratorConfig
    import os

    try:
        config = GeneratorConfig.from_env()

        success, widget_dir, error = asyncio.run(generate_single_widget(
            image_path=image_path,
            output_dir=output_dir,
            config=config,
            icon_lib_names=os.getenv('ICON_LIB_NAMES', '["sf", "lucide"]'),
        ))

        if success:
            dsl_path = widget_dir / "artifacts" / "4-dsl" / "widget.json"
            print(f"✓ Widget generated successfully!")
            print(f"  Widget directory: {widget_dir}")
            print(f"  DSL file: {dsl_path}")
            print(f"  Debug info: {widget_dir / 'log' / 'debug.json'}")
        else:
            print(f"✗ Widget generation failed: {error}")
            sys.exit(1)
    except Exception as e:
        print(f"Error generating widget: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def batch_main():
    """CLI entry point for batch widget generation."""
    import os
    from generator.config import GeneratorConfig

    # Load config to get default concurrency
    config = GeneratorConfig.from_env()

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
        default=config.concurrency,
        help=f'Number of images to process in parallel (default: {config.concurrency} from CONCURRENCY env)'
    )
    parser.add_argument(
        '-m', '--model',
        type=str,
        default=None,
        help='Model name (ignored, uses DEFAULT_MODEL from .env)'
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
        default=None,
        help='API key (ignored, uses DEFAULT_API_KEY from .env)'
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
