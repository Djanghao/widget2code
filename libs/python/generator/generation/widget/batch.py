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
import threading
import time
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional
from collections import defaultdict
from tqdm import tqdm

from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.box import ROUNDED

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


class StageTracker:
    """Thread-safe tracker for image processing stages."""

    STAGES = [
        "waiting",
        "preprocessing",
        "layout",
        "icon/graph",
        "color",
        "dsl",
        "render",
        "done",
        "failed"
    ]

    def __init__(self):
        self.lock = threading.Lock()
        # Current stage for each image: {image_id: stage_name}
        self.current_stages: Dict[str, str] = {}
        # Stage timing: {image_id: {stage_name: [start_time, end_time]}}
        self.stage_times: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
        # Overall timing: {image_id: start_time}
        self.image_start_times: Dict[str, float] = {}

    def set_stage(self, image_id: str, stage: str):
        """Update the current stage for an image."""
        with self.lock:
            current_time = time.time()

            # Record end time for previous stage
            if image_id in self.current_stages:
                old_stage = self.current_stages[image_id]
                if old_stage in self.stage_times[image_id] and len(self.stage_times[image_id][old_stage]) == 1:
                    # Only append end time if we have start time but no end time yet
                    self.stage_times[image_id][old_stage].append(current_time)

            # Update to new stage
            self.current_stages[image_id] = stage

            # Record start time for new stage
            if stage not in ["done", "failed"]:
                self.stage_times[image_id][stage] = [current_time]
            else:
                # For done/failed, record both start and end
                self.stage_times[image_id][stage] = [current_time, current_time]

    def start_image(self, image_id: str):
        """Mark an image as started processing."""
        with self.lock:
            self.image_start_times[image_id] = time.time()
            self.current_stages[image_id] = "waiting"

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics for all stages."""
        with self.lock:
            # Count images in each stage
            stage_counts = {stage: 0 for stage in self.STAGES}
            for stage in self.current_stages.values():
                if stage in stage_counts:
                    stage_counts[stage] += 1

            # Calculate average times for each stage (in milliseconds)
            stage_avg_times = {}
            stage_min_times = {}
            stage_max_times = {}

            for stage in self.STAGES:
                if stage in ["waiting", "failed"]:
                    continue

                all_durations = []
                for image_id, times_dict in self.stage_times.items():
                    if stage in times_dict and len(times_dict[stage]) >= 2:
                        duration = (times_dict[stage][1] - times_dict[stage][0]) * 1000  # to ms
                        all_durations.append(duration)

                if all_durations:
                    stage_avg_times[stage] = sum(all_durations) / len(all_durations)
                    stage_min_times[stage] = min(all_durations)
                    stage_max_times[stage] = max(all_durations)
                else:
                    stage_avg_times[stage] = 0
                    stage_min_times[stage] = 0
                    stage_max_times[stage] = 0

            total_images = len(self.current_stages)
            active_images = total_images - stage_counts.get("done", 0) - stage_counts.get("failed", 0)

            return {
                "stage_counts": stage_counts,
                "stage_avg_times": stage_avg_times,
                "stage_min_times": stage_min_times,
                "stage_max_times": stage_max_times,
                "total_images": total_images,
                "active_images": active_images,
                "completed": stage_counts.get("done", 0),
                "failed": stage_counts.get("failed", 0),
            }


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
        self.icon_lib_names = icon_lib_names

        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.total = 0
        self.completed = 0
        self.failed = 0
        self.results = []
        self.pbar = None

        # Stage tracking
        self.stage_tracker = StageTracker()
        self.show_stage_table = os.getenv('SHOW_STAGE_TABLE', 'true').lower() == 'true'
        self.live_display: Optional[Live] = None
        self.display_thread: Optional[threading.Thread] = None
        self.display_running = False
        self.start_time = None

    def _create_status_table(self) -> Table:
        """Create a Rich table showing current stage statistics."""
        stats = self.stage_tracker.get_stats()

        table = Table(
            title="[bold cyan]Widget Generation Progress[/bold cyan]",
            box=ROUNDED,
            show_header=True,
            header_style="bold magenta",
            title_style="bold cyan",
        )

        table.add_column("Stage", style="cyan", no_wrap=True, width=15)
        table.add_column("Count", justify="right", style="green", width=8)
        table.add_column("Percent", justify="right", style="yellow", width=10)
        table.add_column("Avg Time", justify="right", style="blue", width=12)
        table.add_column("Min Time", justify="right", style="dim", width=12)
        table.add_column("Max Time", justify="right", style="dim", width=12)

        stage_counts = stats["stage_counts"]
        stage_avg_times = stats["stage_avg_times"]
        stage_min_times = stats["stage_min_times"]
        stage_max_times = stats["stage_max_times"]
        total = stats["total_images"]

        # Stage name mapping for display
        stage_names = {
            "waiting": "Waiting",
            "preprocessing": "Preprocessing",
            "layout": "Layout",
            "icon/graph": "Icon/Graph",
            "color": "Color",
            "dsl": "DSL",
            "render": "Render",
            "done": "Done",
            "failed": "Failed"
        }

        for stage in StageTracker.STAGES:
            count = stage_counts.get(stage, 0)
            percent = (count / total * 100) if total > 0 else 0

            if stage in ["waiting", "failed"]:
                avg_time_str = "-"
                min_time_str = "-"
                max_time_str = "-"
            else:
                avg_time = stage_avg_times.get(stage, 0)
                min_time = stage_min_times.get(stage, 0)
                max_time = stage_max_times.get(stage, 0)

                avg_time_str = f"{avg_time:.0f}ms" if avg_time > 0 else "-"
                min_time_str = f"{min_time:.0f}ms" if min_time > 0 else "-"
                max_time_str = f"{max_time:.0f}ms" if max_time > 0 else "-"

            # Color coding for count
            if count > 0:
                if stage == "done":
                    count_style = "[bold green]"
                elif stage == "failed":
                    count_style = "[bold red]"
                else:
                    count_style = "[bold white]"
            else:
                count_style = "[dim]"

            table.add_row(
                stage_names[stage],
                f"{count_style}{count}[/]",
                f"{percent:.1f}%",
                avg_time_str,
                min_time_str,
                max_time_str
            )

        # Summary row
        success_rate = (stats["completed"] / (stats["completed"] + stats["failed"]) * 100) if (stats["completed"] + stats["failed"]) > 0 else 0

        # Calculate uptime and ETA
        if self.start_time:
            elapsed = time.time() - self.start_time
            elapsed_str = time.strftime("%H:%M:%S", time.gmtime(elapsed))

            if stats["completed"] > 0 and stats["active_images"] > 0:
                avg_time_per_image = elapsed / stats["completed"]
                eta_seconds = avg_time_per_image * stats["active_images"]
                eta_str = time.strftime("%H:%M:%S", time.gmtime(eta_seconds))
            else:
                eta_str = "--:--:--"
        else:
            elapsed_str = "00:00:00"
            eta_str = "--:--:--"

        table.add_section()
        table.add_row(
            "[bold]SUMMARY[/bold]",
            f"[bold]{total}[/bold]",
            "",
            "",
            "",
            ""
        )

        # Add summary info as caption
        summary_text = (
            f"[bold]Active:[/bold] {stats['active_images']} | "
            f"[bold green]Completed:[/bold green] {stats['completed']} | "
            f"[bold red]Failed:[/bold red] {stats['failed']} | "
            f"[bold yellow]Success Rate:[/bold yellow] {success_rate:.1f}%\n"
            f"[bold]Uptime:[/bold] {elapsed_str} | "
            f"[bold]ETA:[/bold] {eta_str}"
        )
        table.caption = summary_text

        return table

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

        # Initialize stage tracking for this image
        self.stage_tracker.start_image(widget_id)

        # Create directory structure
        artifacts_dir = widget_dir / "artifacts"
        log_dir = widget_dir / "log"
        prompts_dir = widget_dir / "prompts"

        preprocess_dir = artifacts_dir / "1-preprocess"
        layout_dir = artifacts_dir / "2-layout"  # Renamed from 2-grounding
        layout_crops_dir = layout_dir / "icon-crops"  # Renamed from crops
        retrieval_dir = artifacts_dir / "3-retrieval"
        dsl_dir = artifacts_dir / "4-dsl"

        artifacts_dir.mkdir(parents=True, exist_ok=True)
        log_dir.mkdir(parents=True, exist_ok=True)
        prompts_dir.mkdir(parents=True, exist_ok=True)
        preprocess_dir.mkdir(parents=True, exist_ok=True)
        layout_dir.mkdir(parents=True, exist_ok=True)
        layout_crops_dir.mkdir(parents=True, exist_ok=True)
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
                retrieval_topk=self.config.retrieval_topk,
                retrieval_topm=self.config.retrieval_topm,
                retrieval_alpha=self.config.retrieval_alpha,
                config=self.config,
                icon_lib_names=self.icon_lib_names,
                stage_tracker=self.stage_tracker,
                image_id=widget_id,
            )

            # Extract data from result
            widget_dsl = result.get('widgetDSL', result) if isinstance(result, dict) else result
            layout_debug = result.get('layoutDebugInfo', {}) if isinstance(result, dict) else {}  # NEW
            icon_debug = result.get('iconDebugInfo', {}) if isinstance(result, dict) else {}
            graph_debug = result.get('graphDebugInfo', {}) if isinstance(result, dict) else {}
            prompt_debug = result.get('promptDebugInfo', {}) if isinstance(result, dict) else {}
            preprocessed_info = result.get('preprocessedImage', {}) if isinstance(result, dict) else {}

            # Save widget DSL
            with open(widget_file, 'w') as f:
                json.dump(widget_dsl, f, indent=2)

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] DSL generation finished")

            # Update stage: render (saving artifacts and visualizations)
            self.stage_tracker.set_stage(widget_id, "render")

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] Generating visualizations...")

            # 2. Save preprocessed image
            preprocessed_bytes = preprocessed_info.get('bytes')
            if preprocessed_bytes:
                with open(preprocess_dir / "1.2-preprocessed.png", 'wb') as f:
                    f.write(preprocessed_bytes)

            # 3. Save layout data (NEW: replaces grounding data)
            label_counts = {}  # Initialize outside if block to avoid NameError

            if layout_debug:
                raw_detections = layout_debug.get('raw', [])
                pixel_detections = layout_debug.get('pixel', [])
                post_processed = layout_debug.get('postProcessed', [])

                # Count detections by label
                for det in post_processed:
                    label = det.get('label', 'unknown')
                    label_counts[label] = label_counts.get(label, 0) + 1

                layout_data = {
                    "metadata": {
                        "imageWidth": layout_debug.get('imageWidth'),
                        "imageHeight": layout_debug.get('imageHeight'),
                        "totalDetections": len(post_processed),
                        "detectionsByLabel": label_counts,
                        "generatedAt": datetime.now().isoformat()
                    },
                    "detections": {
                        "raw": raw_detections,
                        "pixel": pixel_detections,
                        "postProcessed": post_processed
                    }
                }
                with open(layout_dir / "layout-data.json", 'w') as f:
                    json.dump(layout_data, f, indent=2)

            # 4. Generate layout visualization
            # Use preprocessed image because bbox coordinates are based on preprocessed dimensions
            layout_detections = layout_debug.get('postProcessed', [])
            visualization_image = preprocessed_bytes if preprocessed_bytes else image_data
            if layout_detections:
                layout_viz = draw_grounding_visualization(visualization_image, layout_detections)
                with open(layout_dir / "layout-visualization.png", 'wb') as f:
                    f.write(layout_viz)

            # 5. Crop icon regions
            # Use preprocessed image because bbox coordinates are based on preprocessed dimensions
            icon_detections = [d for d in layout_detections if d.get('label', '').lower() == 'icon']
            for idx, det in enumerate(icon_detections):
                bbox = det.get('bbox')
                if bbox and len(bbox) == 4:
                    try:
                        crop_bytes = crop_icon_region(visualization_image, bbox)
                        with open(layout_crops_dir / f"icon-{idx+1}.png", 'wb') as f:
                            f.write(crop_bytes)
                    except Exception as e:
                        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] Warning: Failed to crop icon {idx+1}: {str(e)}")

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
                        # Map stage names to numbered files (NEW: updated for 6 stages)
                        stage_map = {
                            'stage1_base': '1-base.md',
                            'stage2_withLayout': '2-with-layout.md',  # NEW
                            'stage3_withColors': '3-with-colors.md',  # Renamed from 2
                            'stage4_withGraphs': '4-with-graphs.md',  # Renamed from 3
                            'stage5_withIcons': '5-with-icons.md',    # Renamed from 4
                            'stage6_final': '6-final.md'              # Renamed from 5
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

            # Build file lists (only include files that were actually created)
            icon_crop_files = [
                f"artifacts/2-layout/icon-crops/icon-{i+1}.png"
                for i in range(len(icon_detections))
                if (layout_crops_dir / f"icon-{i+1}.png").exists()
            ]

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
                    "model": self.config.default_model,
                    "timeout": self.config.timeout,
                    "iconLibraries": json.loads(self.icon_lib_names),
                    "retrieval": {
                        "topK": self.config.retrieval_topk,
                        "topM": self.config.retrieval_topm,
                        "alpha": self.config.retrieval_alpha
                    }
                },
                "steps": {
                    "layoutDetection": {  # NEW: Layout detection
                        "totalElements": layout_debug.get('totalDetections', 0),
                        "elementsByType": label_counts,
                        "imageSize": {
                            "width": layout_debug.get('imageWidth'),
                            "height": layout_debug.get('imageHeight')
                        }
                    },
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
                        "2_layout": {  # Renamed from 2_grounding
                            "data": "artifacts/2-layout/layout-data.json",
                            "visualization": "artifacts/2-layout/layout-visualization.png" if layout_detections else None,
                            "iconCrops": icon_crop_files
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
                        "2_withLayout": "prompts/2-with-layout.md" if (prompts_dir / "2-with-layout.md").exists() else None,  # NEW
                        "3_withColors": "prompts/3-with-colors.md" if (prompts_dir / "3-with-colors.md").exists() else None,  # Renamed
                        "4_withGraphs": "prompts/4-with-graphs.md" if (prompts_dir / "4-with-graphs.md").exists() else None,  # Renamed
                        "5_withIcons": "prompts/5-with-icons.md" if (prompts_dir / "5-with-icons.md").exists() else None,    # Renamed
                        "6_final": "prompts/6-final.md" if (prompts_dir / "6-final.md").exists() else None                   # Renamed
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

            # Mark as done in stage tracker
            self.stage_tracker.set_stage(widget_id, "done")

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
                    "model": self.config.default_model,
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

            # Mark as failed in stage tracker
            self.stage_tracker.set_stage(widget_id, "failed")

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
        import asyncio
        import concurrent.futures

        # ========== Configure Thread Pool ==========
        # Read MAX_THREAD_POOL_WORKERS from environment, or auto-calculate
        max_workers = int(os.getenv('MAX_THREAD_POOL_WORKERS', 0))
        if max_workers <= 0:
            # Auto-calculate: concurrency * 2 (for icon+graph parallel) + buffer
            max_workers = self.concurrency * 2 + 50

        # Create thread pool executor
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers,
            thread_name_prefix="widget_worker"
        )

        # Set as default executor for asyncio
        loop = asyncio.get_running_loop()
        loop.set_default_executor(executor)
        # ========== Thread Pool Configured ==========

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
                "defaultModel": self.config.default_model,
                "defaultEnableThinking": self.config.default_enable_thinking,
                "timeout": self.config.timeout,
                "stages": {
                    "layout": {
                        "model": self.config.get_layout_model(),
                        "thinking": self.config.get_layout_thinking(),
                        "override": self.config.layout_model is not None or self.config.layout_enable_thinking is not None
                    },
                    "graphDetection": {
                        "model": self.config.get_graph_det_model(),
                        "thinking": self.config.get_graph_det_thinking(),
                        "override": self.config.graph_det_model is not None or self.config.graph_det_enable_thinking is not None
                    },
                    "graphGeneration": {
                        "model": self.config.get_graph_gen_model(),
                        "thinking": self.config.get_graph_gen_thinking(),
                        "override": self.config.graph_gen_model is not None or self.config.graph_gen_enable_thinking is not None
                    },
                    "dslGeneration": {
                        "model": self.config.get_dsl_gen_model(),
                        "thinking": self.config.get_dsl_gen_thinking(),
                        "override": self.config.dsl_gen_model is not None or self.config.dsl_gen_enable_thinking is not None
                    }
                }
            },
            "retrievalSettings": {
                "topK": self.config.retrieval_topk,
                "topM": self.config.retrieval_topm,
                "alpha": self.config.retrieval_alpha,
                "iconLibraries": json.loads(self.icon_lib_names)
            },
            "processingSettings": {
                "concurrency": self.concurrency,
                "threadPoolSize": max_workers,
                "maxFileSizeMB": self.config.max_file_size_mb
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
        log_to_console(f"  Default Model: {self.config.default_model}", Colors.BRIGHT_MAGENTA)
        log_to_console(f"  Default Thinking: {self.config.default_enable_thinking}")
        log_to_console(f"  Timeout: {self.config.timeout}s")
        log_to_console("")

        # Show stage-specific configuration
        log_to_console("Stage Configuration:", Colors.BRIGHT_YELLOW)

        stages_info = [
            ("Layout Detection", "layout"),
            ("Graph Detection", "graph_det"),
            ("Graph Generation", "graph_gen"),
            ("DSL Generation", "dsl_gen"),
        ]

        for stage_name, stage_prefix in stages_info:
            model = getattr(self.config, f'get_{stage_prefix}_model')()
            thinking = getattr(self.config, f'get_{stage_prefix}_thinking')()

            log_to_console(f"  {stage_name}:")
            log_to_console(f"    Model: {model}")
            log_to_console(f"    Thinking: {thinking}")
        log_to_console("")
        log_to_console("Retrieval Settings:", Colors.BRIGHT_YELLOW)
        log_to_console(f"  Top-K: {self.config.retrieval_topk}")
        log_to_console(f"  Top-M: {self.config.retrieval_topm}")
        log_to_console(f"  Alpha: {self.config.retrieval_alpha}")
        log_to_console(f"  Icon Libraries: {self.icon_lib_names}")
        log_to_console("")
        log_to_console("Processing Settings:", Colors.BRIGHT_YELLOW)
        log_to_console(f"  Concurrency: {self.concurrency}", Colors.BRIGHT_GREEN)
        log_to_console(f"  Thread Pool Size: {max_workers}", Colors.BRIGHT_GREEN)
        log_to_console(f"  Max File Size: {self.config.max_file_size_mb}MB")
        log_to_console("")

        log_to_console(separator(), Colors.CYAN)

        # Check if API key is configured
        if not self.config.default_api_key:
            log_to_console("Error: DEFAULT_API_KEY not found in .env", Colors.BRIGHT_RED)
            raise ValueError("API key not found")

        images = self.find_images_to_process()
        self.total = len(images)

        if self.total == 0:
            log_to_console("No images to process", Colors.YELLOW)
            return

        log_to_console(f"Processing {self.total} images", Colors.BRIGHT_GREEN)
        log_to_console("")

        self.start_time = time.time()
        start_time = datetime.now()

        # Use Rich Live table if enabled, otherwise use tqdm
        if self.show_stage_table:
            console = Console()

            # Create live display context
            with Live(self._create_status_table(), console=console, refresh_per_second=1, transient=False) as live:
                self.live_display = live

                # Create background update thread
                def update_display():
                    while self.display_running:
                        try:
                            live.update(self._create_status_table())
                            time.sleep(1)  # Update every second
                        except Exception:
                            pass

                self.display_running = True
                self.display_thread = threading.Thread(target=update_display, daemon=True)
                self.display_thread.start()

                try:
                    await self.process_batch(images)
                finally:
                    self.display_running = False
                    if self.display_thread:
                        self.display_thread.join(timeout=2)
                    # Final update to show completion
                    live.update(self._create_status_table())
                    # Clean up thread pool
                    executor.shutdown(wait=True)
        else:
            # Fallback to tqdm
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
                # Clean up thread pool
                executor.shutdown(wait=True)

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
        concurrency: Number of images to process in parallel (default: from CONCURRENCY env var)
        api_key: API key (ignored, uses DEFAULT_API_KEY from .env)
        model: Model name (ignored, uses DEFAULT_MODEL from .env)
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
