#!/usr/bin/env python3
"""
Widget Factory Pipeline
Complete workflow: Image → WidgetDSL → React Code → PNG Screenshot

Usage:
    python pipeline.py --input image.png --output result.png
    python pipeline.py --input-dir ./images --output-dir ./results
"""

import asyncio
import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Optional
import argparse
from datetime import datetime
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent / "libs" / "generator"))
from widgetdsl_generator import generate_widget, GeneratorConfig
from widgetdsl_generator.exceptions import ValidationError, FileSizeError, GenerationError


class WidgetPipeline:
    def __init__(self, config: GeneratorConfig, api_key: str, model: str = None):
        self.config = config
        self.api_key = api_key
        self.model = model or "qwen3-vl-flash"

    async def generate_dsl(self, image_path: Path) -> dict:
        """Generate WidgetDSL from image"""
        print(f"[{datetime.now()}] Generating DSL from {image_path.name}...")

        with open(image_path, "rb") as f:
            image_data = f.read()

        try:
            result = await generate_widget(
                image_data=image_data,
                image_filename=image_path.name,
                system_prompt=None,
                model=self.model,
                api_key=self.api_key,
                config=self.config
            )

            if result.get("success"):
                print(f"✓ DSL generated successfully")
                return result
            else:
                raise GenerationError(f"Generation failed: {result.get('error')}")

        except (ValidationError, FileSizeError, GenerationError) as e:
            print(f"✗ Generation failed: {e}")
            raise

    def compile_to_jsx(self, dsl_path: Path, jsx_path: Path) -> bool:
        """Compile WidgetDSL to JSX using @widget-factory/cli"""
        print(f"[{datetime.now()}] Compiling DSL to JSX...")

        try:
            result = subprocess.run(
                ["npx", "widget-factory", "compile", str(dsl_path), str(jsx_path)],
                capture_output=True,
                text=True,
                check=True
            )

            print(result.stdout)
            return True

        except subprocess.CalledProcessError as e:
            print(f"✗ Compilation failed: {e.stderr}")
            raise GenerationError(f"Compilation failed: {e.stderr}")

    async def render_to_png(self, jsx_path: Path, output_path: Path, dev_server_url: str = "http://localhost:3060") -> bool:
        """Render JSX to PNG using @widget-factory/cli"""
        print(f"[{datetime.now()}] Rendering JSX to PNG...")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            result = subprocess.run(
                ["npx", "widget-factory", "render", str(jsx_path), str(output_path), dev_server_url],
                capture_output=True,
                text=True,
                check=True
            )

            print(result.stdout)
            return True

        except subprocess.CalledProcessError as e:
            print(f"✗ Rendering failed: {e.stderr}")
            raise GenerationError(f"Rendering failed: {e.stderr}")

    async def process_single(self, input_path: Path, output_path: Path) -> bool:
        """Process single image: Image → DSL → JSX → PNG"""
        try:
            print(f"\n{'='*60}")
            print(f"Processing: {input_path.name}")
            print(f"{'='*60}")

            # Step 1: Generate DSL
            result = await self.generate_dsl(input_path)
            widget_dsl = result.get("widgetDSL")

            # Save DSL
            dsl_path = output_path.with_suffix('.json')
            dsl_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dsl_path, 'w') as f:
                json.dump({"widget": widget_dsl}, f, indent=2)
            print(f"✓ DSL saved to {dsl_path}")

            # Step 2: Compile DSL to JSX
            jsx_path = output_path.with_suffix('.jsx')
            self.compile_to_jsx(dsl_path, jsx_path)
            print(f"✓ JSX saved to {jsx_path}")

            # Step 3: Render JSX to PNG
            await self.render_to_png(jsx_path, output_path)
            print(f"✓ PNG saved to {output_path}")

            # Step 4: Resize rendered PNG to match original image size
            with Image.open(input_path) as original_img:
                original_size = original_img.size  # (width, height)

            with Image.open(output_path) as rendered_img:
                rescaled_img = rendered_img.resize(original_size, Image.LANCZOS)
                rescaled_path = output_path.with_name(output_path.stem + "_rescaled.png")
                rescaled_img.save(rescaled_path)

            print(f"✓ Rescaled PNG saved to {rescaled_path}")

            print(f"\n✓ Pipeline completed successfully")
            return True

        except Exception as e:
            print(f"✗ Pipeline failed: {e}")
            return False

    async def process_batch(self, input_dir: Path, output_dir: Path) -> dict:
        """Process multiple images in batch"""
        input_files = list(input_dir.glob("*.png")) + list(input_dir.glob("*.jpg"))

        if not input_files:
            print(f"No images found in {input_dir}")
            return {"success": 0, "failed": 0}

        print(f"\n{'='*60}")
        print(f"Batch Processing: {len(input_files)} images")
        print(f"{'='*60}\n")

        results = {"success": 0, "failed": 0}

        for input_path in input_files:
            output_path = output_dir / f"{input_path.stem}_output.png"

            success = await self.process_single(input_path, output_path)
            if success:
                results["success"] += 1
            else:
                results["failed"] += 1

        print(f"\n{'='*60}")
        print(f"Batch Results: {results['success']} succeeded, {results['failed']} failed")
        print(f"{'='*60}\n")

        return results


async def main():
    parser = argparse.ArgumentParser(description="Widget Factory Pipeline")
    parser.add_argument("--input", type=str, help="Input image path")
    parser.add_argument("--output", type=str, help="Output PNG path")
    parser.add_argument("--input-dir", type=str, help="Input directory for batch processing")
    parser.add_argument("--output-dir", type=str, help="Output directory for batch processing")
    parser.add_argument("--model", type=str, default="qwen3-vl-flash", help="Model to use")
    parser.add_argument("--api-key", type=str, help="API key (or use DASHSCOPE_API_KEY env var)")

    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        print("Error: API key required. Use --api-key or set DASHSCOPE_API_KEY env var")
        sys.exit(1)

    # Load config
    config = GeneratorConfig.from_env()

    # Create pipeline
    pipeline = WidgetPipeline(config, api_key, args.model)

    # Process
    if args.input and args.output:
        # Single file
        input_path = Path(args.input)
        output_path = Path(args.output)

        if not input_path.exists():
            print(f"Error: Input file not found: {input_path}")
            sys.exit(1)

        success = await pipeline.process_single(input_path, output_path)
        sys.exit(0 if success else 1)

    elif args.input_dir and args.output_dir:
        # Batch processing
        input_dir = Path(args.input_dir)
        output_dir = Path(args.output_dir)

        if not input_dir.exists():
            print(f"Error: Input directory not found: {input_dir}")
            sys.exit(1)

        output_dir.mkdir(parents=True, exist_ok=True)

        results = await pipeline.process_batch(input_dir, output_dir)
        sys.exit(0 if results["failed"] == 0 else 1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
