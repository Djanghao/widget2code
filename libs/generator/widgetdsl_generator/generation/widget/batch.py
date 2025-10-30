# -----------------------------------------------------------------------------
# File: batch.py
# Description: Batch widget generation with configurable concurrency control
# Author: Houston Zhang
# Date: 2025-10-30
# -----------------------------------------------------------------------------

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Tuple

from .single import generate_widget_full
from ...config import GeneratorConfig
from ...exceptions import ValidationError, FileSizeError, GenerationError


class BatchGenerator:
    """Batch generator for processing multiple widget images in parallel."""

    def __init__(
        self,
        input_dir: Path,
        output_dir: Path,
        concurrency: int = 3,
        api_key: str = None,
        model: str = None,
        icon_lib_names: str = '["sf", "lucide"]',
    ):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.concurrency = concurrency
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        self.model = model or "qwen3-vl-flash"
        self.icon_lib_names = icon_lib_names
        self.config = GeneratorConfig()

        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.total = 0
        self.completed = 0
        self.failed = 0
        self.results = []

    def find_images(self) -> List[Path]:
        """Find all image files in input directory."""
        extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp'}
        images = []

        for ext in extensions:
            images.extend(self.input_dir.glob(f'*{ext}'))
            images.extend(self.input_dir.glob(f'*{ext.upper()}'))

        return sorted(images)

    async def generate_single(self, image_path: Path) -> Tuple[Path, bool, str]:
        """Generate widget DSL for a single image."""
        output_file = self.output_dir / f"{image_path.stem}.json"

        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing: {image_path.name}")

            with open(image_path, 'rb') as f:
                image_data = f.read()

            result = await generate_widget_full(
                image_data=image_data,
                image_filename=image_path.name,
                system_prompt=None,
                model=self.model,
                api_key=self.api_key,
                retrieval_topk=50,
                retrieval_topm=10,
                retrieval_alpha=0.8,
                config=self.config,
                icon_lib_names=self.icon_lib_names,
            )

            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)

            self.completed += 1
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Success: {image_path.name} -> {output_file.name}")
            return (image_path, True, str(output_file))

        except Exception as e:
            self.failed += 1
            error_msg = f"{type(e).__name__}: {str(e)}"
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Failed: {image_path.name} - {error_msg}")
            return (image_path, False, error_msg)

    async def process_batch(self, images: List[Path]):
        """Process images with controlled concurrency."""
        semaphore = asyncio.Semaphore(self.concurrency)

        async def process_with_semaphore(image_path: Path):
            async with semaphore:
                return await self.generate_single(image_path)

        tasks = [process_with_semaphore(img) for img in images]
        self.results = await asyncio.gather(*tasks, return_exceptions=False)

    async def run(self):
        """Main execution flow."""
        print(f"\n{'='*60}")
        print(f"Batch Widget Generation")
        print(f"{'='*60}")
        print(f"Input:       {self.input_dir}")
        print(f"Output:      {self.output_dir}")
        print(f"Concurrency: {self.concurrency}")
        print(f"Model:       {self.model}")
        print(f"Icon libs:   {self.icon_lib_names}")
        print(f"{'='*60}\n")

        if not self.api_key:
            print("Error: DASHSCOPE_API_KEY not found in environment")
            raise ValueError("API key not found")

        images = self.find_images()
        self.total = len(images)

        if self.total == 0:
            print(f"No images found in {self.input_dir}")
            return

        print(f"Found {self.total} images to process\n")

        start_time = datetime.now()

        await self.process_batch(images)

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"\n{'='*60}")
        print(f"Batch Complete")
        print(f"{'='*60}")
        print(f"Total:     {self.total}")
        print(f"Success:   {self.completed} ({self.completed/self.total*100:.1f}%)")
        print(f"Failed:    {self.failed} ({self.failed/self.total*100:.1f}%)")
        print(f"Duration:  {duration:.1f}s ({duration/self.total:.1f}s per image)")
        print(f"{'='*60}\n")

        if self.failed > 0:
            print("Failed images:")
            for image_path, success, msg in self.results:
                if not success:
                    print(f"  - {image_path.name}: {msg}")
            print()


async def batch_generate(
    input_dir: str,
    output_dir: str,
    concurrency: int = 3,
    api_key: str = None,
    model: str = None,
    icon_lib_names: str = '["sf", "lucide"]',
):
    """
    Batch generate WidgetDSL from multiple images.

    Args:
        input_dir: Input directory containing images
        output_dir: Output directory for generated DSL files
        concurrency: Number of images to process in parallel (default: 3)
        api_key: API key (defaults to DASHSCOPE_API_KEY env var)
        model: Model to use (default: qwen3-vl-flash)
        icon_lib_names: Icon libraries as JSON array string (default: '["sf", "lucide"]')
    """
    generator = BatchGenerator(
        input_dir=Path(input_dir),
        output_dir=Path(output_dir),
        concurrency=concurrency,
        api_key=api_key,
        model=model,
        icon_lib_names=icon_lib_names,
    )

    await generator.run()
