# -----------------------------------------------------------------------------
# File: batch.py
# Description: Batch widget generation with configurable concurrency control
# Author: Houston Zhang
# Date: 2025-10-30
# -----------------------------------------------------------------------------

import asyncio
import json
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict, Any
from tqdm import tqdm

from .single import generate_widget_full
from ...config import GeneratorConfig
from ...exceptions import ValidationError, FileSizeError, GenerationError
from ...utils.logger import setup_logger, log_to_file, log_to_console, separator, Colors
from ...utils.visualization import draw_grounding_visualization, crop_icon_region, save_retrieval_svgs

try:
    import json
    root_package_json = Path(__file__).parent.parent.parent.parent.parent.parent / "package.json"
    if root_package_json.exists():
        with open(root_package_json) as f:
            package_data = json.load(f)
            WIDGET_FACTORY_VERSION = package_data.get("version", "unknown")
    else:
        WIDGET_FACTORY_VERSION = "unknown"
except Exception:
    WIDGET_FACTORY_VERSION = "unknown"


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
        self.config = GeneratorConfig.from_env()
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        self.model = model or self.config.default_model
        self.icon_lib_names = icon_lib_names

        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.total = 0
        self.completed = 0
        self.failed = 0
        self.results = []
        self.pbar = None

    def find_images_to_process(self) -> List[Path]:
        """Find image files that need processing (skip already completed)."""
        extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp'}
        all_images = []

        for ext in extensions:
            all_images.extend(self.input_dir.glob(f'*{ext}'))
            all_images.extend(self.input_dir.glob(f'*{ext.upper()}'))

        images_to_process = []

        for image_path in sorted(all_images):
            widget_id = image_path.stem
            widget_dir = self.output_dir / widget_id
            debug_file = widget_dir / "log" / "debug.json"

            should_process = True

            if debug_file.exists():
                try:
                    with open(debug_file, 'r') as f:
                        debug_data = json.load(f)
                        execution_status = debug_data.get('execution', {}).get('status', '')

                        if execution_status == 'success':
                            should_process = False
                            log_to_file(f"[Skip] {image_path.name} - already generated")
                except Exception as e:
                    log_to_file(f"[Warning] Failed to read debug.json for {image_path.name}, will process")

            if should_process:
                images_to_process.append(image_path)

        return images_to_process

    def _save_widget_log(self, widget_id: str, log_file: Path):
        """Extract logs for this widget from run.log and save to widget's log file"""
        try:
            run_log_file = self.output_dir / "run.log"
            if not run_log_file.exists():
                return

            # Read run.log and extract lines for this widget
            with open(run_log_file, 'r') as f:
                lines = f.readlines()

            # Filter lines that contain this widget_id
            widget_logs = [line for line in lines if f"[{widget_id}]" in line]

            if widget_logs:
                with open(log_file, 'w') as f:
                    f.writelines(widget_logs)
        except Exception:
            # If log extraction fails, just skip it
            pass

    async def generate_single(self, image_path: Path) -> Tuple[Path, bool, str]:
        """Generate widget DSL for a single image with complete debug data and visualizations."""
        widget_id = image_path.stem
        widget_dir = self.output_dir / widget_id
        widget_dir.mkdir(parents=True, exist_ok=True)

        # Create directory structure
        artifacts_dir = widget_dir / "artifacts"
        log_dir = widget_dir / "log"
        prompts_dir = widget_dir / "prompts"

        preprocess_dir = artifacts_dir / "1-preprocess"
        grounding_dir = artifacts_dir / "2-grounding"
        grounding_crops_dir = grounding_dir / "crops"
        retrieval_dir = artifacts_dir / "3-retrieval"
        dsl_dir = artifacts_dir / "4-dsl"

        artifacts_dir.mkdir(parents=True, exist_ok=True)
        log_dir.mkdir(parents=True, exist_ok=True)
        prompts_dir.mkdir(parents=True, exist_ok=True)
        preprocess_dir.mkdir(parents=True, exist_ok=True)
        grounding_dir.mkdir(parents=True, exist_ok=True)
        grounding_crops_dir.mkdir(parents=True, exist_ok=True)
        retrieval_dir.mkdir(parents=True, exist_ok=True)
        dsl_dir.mkdir(parents=True, exist_ok=True)

        # Prepare file paths
        widget_file = dsl_dir / "widget.json"
        debug_file = log_dir / "debug.json"
        log_file = log_dir / "log"

        start_time = datetime.now()

        try:
            log_to_file(f"[{start_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] 🚀 START")

            # Read image data
            with open(image_path, 'rb') as f:
                image_data = f.read()

            # Get image size and dimensions
            image_size = image_path.stat().st_size
            try:
                from PIL import Image
                with Image.open(image_path) as img:
                    image_dims = {"width": img.width, "height": img.height}
            except:
                image_dims = None

            # 1. Save input image to root and artifacts
            input_file = widget_dir / "input.png"
            shutil.copy2(image_path, input_file)

            original_in_preprocess = preprocess_dir / "1.1-original.png"
            shutil.copy2(image_path, original_in_preprocess)

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] 🔄 DSL generation started")

            # 2. Generate widget DSL with full debug info
            result = await generate_widget_full(
                image_data=image_data,
                image_filename=image_path.name,
                system_prompt=None,
                model=self.model,
                api_key=self.api_key,
                retrieval_topk=self.config.retrieval_topk,
                retrieval_topm=self.config.retrieval_topm,
                retrieval_alpha=self.config.retrieval_alpha,
                config=self.config,
                icon_lib_names=self.icon_lib_names,
            )

            # Extract data from result
            widget_dsl = result.get('widgetDSL', result) if isinstance(result, dict) else result
            icon_debug = result.get('iconDebugInfo', {}) if isinstance(result, dict) else {}
            graph_debug = result.get('graphDebugInfo', {}) if isinstance(result, dict) else {}
            prompt_debug = result.get('promptDebugInfo', {}) if isinstance(result, dict) else {}
            preprocessed_info = result.get('preprocessedImage', {}) if isinstance(result, dict) else {}

            # Save widget DSL
            with open(widget_file, 'w') as f:
                json.dump(widget_dsl, f, indent=2)

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] DSL generation finished")
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] Generating visualizations...")

            # 2. Save preprocessed image
            preprocessed_bytes = preprocessed_info.get('bytes')
            if preprocessed_bytes:
                with open(preprocess_dir / "1.2-preprocessed.png", 'wb') as f:
                    f.write(preprocessed_bytes)

            # 3. Generate grounding visualization
            grounding_detections = icon_debug.get('grounding', {}).get('postProcessed', [])
            if grounding_detections:
                grounding_viz = draw_grounding_visualization(image_data, grounding_detections)
                with open(grounding_dir / "grounding.png", 'wb') as f:
                    f.write(grounding_viz)

            # 4. Crop icon regions
            icon_detections = [d for d in grounding_detections if d.get('label') == 'icon']
            for idx, det in enumerate(icon_detections):
                crop_bytes = crop_icon_region(image_data, det['bbox'])
                with open(grounding_crops_dir / f"icon-{idx+1}.png", 'wb') as f:
                    f.write(crop_bytes)

            # 5. Save retrieval SVGs
            svg_source_dirs = [
                Path(__file__).parents[4] / "libs" / "js" / "icons" / "svg"
            ]

            per_icon = icon_debug.get('retrieval', {}).get('perIcon', [])
            for icon_data in per_icon:
                icon_idx = icon_data.get('index', 0)
                top_candidates = icon_data.get('topCandidates', [])
                if top_candidates:
                    save_retrieval_svgs(
                        retrieval_results=top_candidates,
                        icon_index=icon_idx,
                        output_dir=retrieval_dir,
                        svg_source_dirs=svg_source_dirs,
                        top_n=10
                    )

            # 6. Save prompts
            if prompt_debug:
                for stage_name, prompt_text in prompt_debug.items():
                    if isinstance(prompt_text, str) and stage_name.startswith('stage'):
                        # Map stage names to numbered files
                        stage_map = {
                            'stage1_base': '1-base.md',
                            'stage2_withGraphs': '2-with-graphs.md',
                            'stage3_withIcons': '3-with-icons.md',
                            'stage4_final': '4-final.md'
                        }
                        filename = stage_map.get(stage_name)
                        if filename:
                            with open(prompts_dir / filename, 'w') as f:
                                f.write(prompt_text)

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            log_to_file(f"[{end_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] Visualizations saved")

            # Count icons and graphs
            icon_count = icon_debug.get('detection', {}).get('iconCount', 0)
            graph_count = graph_debug.get('detection', {}).get('graphCount', 0)

            # Build file lists
            icon_crop_files = [f"artifacts/2-grounding/crops/icon-{i+1}.png" for i in range(len(icon_detections))]

            retrieval_files = {}
            for icon_data in per_icon:
                icon_idx = icon_data.get('index', 0)
                icon_dir = retrieval_dir / f"icon-{icon_idx+1}"
                if icon_dir.exists():
                    svg_files = sorted(icon_dir.glob("*.svg"))
                    retrieval_files[f"icon-{icon_idx+1}"] = [
                        f"artifacts/3-retrieval/icon-{icon_idx+1}/{f.name}" for f in svg_files
                    ]

            # Create comprehensive debug.json
            debug_data = {
                "widgetId": widget_id,
                "widgetFactoryVersion": WIDGET_FACTORY_VERSION,
                "execution": {
                    "startTime": start_time.isoformat(),
                    "endTime": end_time.isoformat(),
                    "duration": duration,
                    "status": "success"
                },
                "input": {
                    "filename": image_path.name,
                    "originalPath": str(image_path.absolute()),
                    "fileSizeBytes": image_size,
                    "dimensions": image_dims,
                    "preprocessed": {
                        "width": preprocessed_info.get('width'),
                        "height": preprocessed_info.get('height'),
                        "aspectRatio": preprocessed_info.get('aspectRatio')
                    }
                },
                "config": {
                    "model": self.model,
                    "timeout": self.config.timeout,
                    "iconLibraries": json.loads(self.icon_lib_names),
                    "retrieval": {
                        "topK": self.config.retrieval_topk,
                        "topM": self.config.retrieval_topm,
                        "alpha": self.config.retrieval_alpha
                    }
                },
                "steps": {
                    "iconGrounding": icon_debug.get('grounding', {}),
                    "iconRetrieval": icon_debug.get('retrieval', {}),
                    "iconDetection": icon_debug.get('detection', {}),
                    "graphDetection": graph_debug.get('detection', {}),
                    "graphSpecs": graph_debug.get('specs', []),
                    "promptConstruction": prompt_debug
                },
                "output": {
                    "widgetDSL": {
                        "saved": "artifacts/4-dsl/widget.json"
                    },
                    "statistics": {
                        "iconsDetected": icon_count,
                        "graphsDetected": graph_count
                    }
                },
                "files": {
                    "input": "input.png",
                    "output": "output.png",
                    "artifacts": {
                        "1_preprocess": {
                            "original": "artifacts/1-preprocess/1.1-original.png",
                            "preprocessed": "artifacts/1-preprocess/1.2-preprocessed.png" if preprocessed_bytes else None
                        },
                        "2_grounding": {
                            "visualization": "artifacts/2-grounding/grounding.png" if grounding_detections else None,
                            "crops": icon_crop_files
                        },
                        "3_retrieval": retrieval_files,
                        "4_dsl": {
                            "widget": "artifacts/4-dsl/widget.json"
                        }
                    },
                    "log": {
                        "execution": "log/log",
                        "debug": "log/debug.json"
                    },
                    "prompts": {
                        "1_base": "prompts/1-base.md" if (prompts_dir / "1-base.md").exists() else None,
                        "2_withGraphs": "prompts/2-with-graphs.md" if (prompts_dir / "2-with-graphs.md").exists() else None,
                        "3_withIcons": "prompts/3-with-icons.md" if (prompts_dir / "3-with-icons.md").exists() else None,
                        "4_final": "prompts/4-final.md" if (prompts_dir / "4-final.md").exists() else None
                    }
                },
                "metadata": {
                    "pipeline": "generation"
                }
            }

            # Save debug.json
            with open(debug_file, 'w') as f:
                json.dump(debug_data, f, indent=2)

            # Extract and save widget-specific log
            self._save_widget_log(widget_id, log_file)

            self.completed += 1
            log_to_file(f"[{end_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] ✅ COMPLETED ({duration:.1f}s)")

            # Update progress bar
            if self.pbar:
                success_rate = (self.completed / (self.completed + self.failed) * 100) if (self.completed + self.failed) > 0 else 0
                self.pbar.set_postfix(success=f"{success_rate:.1f}%", failed=self.failed)
                self.pbar.update(1)

            return (image_path, True, str(widget_dir))

        except Exception as e:
            self.failed += 1
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            error_msg = f"{type(e).__name__}: {str(e)}"

            # Create error debug.json
            debug_data = {
                "widgetId": widget_id,
                "widgetFactoryVersion": WIDGET_FACTORY_VERSION,
                "execution": {
                    "startTime": start_time.isoformat(),
                    "endTime": end_time.isoformat(),
                    "duration": duration,
                    "status": "failed"
                },
                "input": {
                    "filename": image_path.name,
                    "originalPath": str(image_path.absolute()),
                    "fileSizeBytes": image_path.stat().st_size if image_path.exists() else None
                },
                "config": {
                    "model": self.model,
                    "timeout": self.config.timeout,
                    "iconLibraries": json.loads(self.icon_lib_names),
                    "retrieval": {
                        "topK": self.config.retrieval_topk,
                        "topM": self.config.retrieval_topm,
                        "alpha": self.config.retrieval_alpha
                    }
                },
                "error": {
                    "message": str(e),
                    "type": type(e).__name__
                },
                "files": {
                    "input": "input.png" if (widget_dir / "input.png").exists() else None,
                    "log": {
                        "debug": "log/debug.json"
                    },
                    "artifacts": {
                        "1_preprocess": {
                            "original": "artifacts/1-preprocess/1.1-original.png" if (preprocess_dir / "1.1-original.png").exists() else None
                        }
                    }
                },
                "metadata": {
                    "pipeline": "generation"
                }
            }

            # Save debug.json
            with open(debug_file, 'w') as f:
                json.dump(debug_data, f, indent=2)

            log_to_file(f"[{end_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] ❌ FAILED - {error_msg}")

            # Update progress bar
            if self.pbar:
                success_rate = (self.completed / (self.completed + self.failed) * 100) if (self.completed + self.failed) > 0 else 0
                self.pbar.set_postfix(success=f"{success_rate:.1f}%", failed=self.failed)
                self.pbar.update(1)

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
        # Setup logging
        setup_logger(self.output_dir / "run.log")

        # Save config.json
        config_data = {
            "widgetFactoryVersion": WIDGET_FACTORY_VERSION,
            "startTime": datetime.now().isoformat(),
            "configuration": {
                "inputDir": str(self.input_dir),
                "outputDir": str(self.output_dir),
                "runLog": str(self.output_dir / "run.log")
            },
            "modelSettings": {
                "model": self.model,
                "timeout": self.config.timeout
            },
            "retrievalSettings": {
                "topK": self.config.retrieval_topk,
                "topM": self.config.retrieval_topm,
                "alpha": self.config.retrieval_alpha,
                "iconLibraries": json.loads(self.icon_lib_names)
            },
            "processingSettings": {
                "concurrency": self.concurrency,
                "maxFileSizeMB": self.config.max_file_size_mb,
                "maxRequestsPerMinute": self.config.max_requests_per_minute
            }
        }

        with open(self.output_dir / "config.json", 'w') as f:
            json.dump(config_data, f, indent=2)

        # Log initial config (show in console)
        log_to_console(separator(), Colors.CYAN)
        log_to_console("Widget Factory - Batch Generation", Colors.BOLD + Colors.BRIGHT_CYAN)
        log_to_console(separator(), Colors.CYAN)
        log_to_console(f"Widget Factory Version: {WIDGET_FACTORY_VERSION}", Colors.BRIGHT_WHITE)
        log_to_console(f"Start Time: {datetime.now().isoformat()}", Colors.BRIGHT_WHITE)
        log_to_console("")
        log_to_console("Configuration:", Colors.BRIGHT_YELLOW)
        log_to_console(f"  Input Directory: {self.input_dir}")
        log_to_console(f"  Output Directory: {self.output_dir}")
        log_to_console(f"  Run Log: {self.output_dir / 'run.log'}", Colors.DIM)
        log_to_console("")
        log_to_console("Model Settings:", Colors.BRIGHT_YELLOW)
        log_to_console(f"  Model: {self.model}", Colors.BRIGHT_MAGENTA)
        log_to_console(f"  Timeout: {self.config.timeout}s")
        log_to_console("")
        log_to_console("Retrieval Settings:", Colors.BRIGHT_YELLOW)
        log_to_console(f"  Top-K: {self.config.retrieval_topk}")
        log_to_console(f"  Top-M: {self.config.retrieval_topm}")
        log_to_console(f"  Alpha: {self.config.retrieval_alpha}")
        log_to_console(f"  Icon Libraries: {self.icon_lib_names}")
        log_to_console("")
        log_to_console("Processing Settings:", Colors.BRIGHT_YELLOW)
        log_to_console(f"  Concurrency: {self.concurrency}", Colors.BRIGHT_GREEN)
        log_to_console(f"  Max File Size: {self.config.max_file_size_mb}MB")
        log_to_console(f"  Max Requests/Min: {self.config.max_requests_per_minute}")
        log_to_console(separator(), Colors.CYAN)

        if not self.api_key:
            log_to_console("Error: DASHSCOPE_API_KEY not found in environment", Colors.BRIGHT_RED)
            raise ValueError("API key not found")

        images = self.find_images_to_process()
        self.total = len(images)

        if self.total == 0:
            log_to_console("No images to process", Colors.YELLOW)
            return

        log_to_console(f"Processing {self.total} images", Colors.BRIGHT_GREEN)

        start_time = datetime.now()

        # Initialize progress bar (always show)
        self.pbar = tqdm(
            total=self.total,
            desc="Generating widgets",
            unit="img"
        )

        try:
            await self.process_batch(images)
        finally:
            if self.pbar:
                self.pbar.close()

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        # Log final summary (show in console)
        log_to_console("")
        log_to_console(separator(), Colors.CYAN)
        log_to_console(f"End Time: {end_time.isoformat()}", Colors.BRIGHT_WHITE)
        log_to_console(f"Total Duration: {duration:.1f}s", Colors.BRIGHT_WHITE)
        log_to_console(f"Average Time: {duration/self.total:.1f}s/image" if self.total > 0 else "", Colors.BRIGHT_WHITE)

        success_color = Colors.BRIGHT_GREEN if self.failed == 0 else Colors.BRIGHT_YELLOW if self.completed > 0 else Colors.BRIGHT_RED
        log_to_console(f"Results: {self.completed}/{self.total} succeeded, {self.failed} failed", success_color)
        log_to_console(separator(), Colors.CYAN)

        if self.failed > 0:
            log_to_console("")
            log_to_console("Failed images:", Colors.BRIGHT_RED)
            for image_path, success, msg in self.results:
                if not success:
                    log_to_console(f"  • {image_path.name} - {msg}", Colors.RED)


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
        model: Model to use (defaults to DEFAULT_MODEL from config)
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
