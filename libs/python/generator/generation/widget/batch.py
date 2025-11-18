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

from .single import generate_widget_full, generate_single_widget
from ...config import GeneratorConfig
from ...exceptions import ValidationError, FileSizeError, GenerationError
from ...utils.logger import setup_logger, log_to_file, log_to_console, separator, Colors

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

    # Define stage hierarchy with display names and indentation
    STAGES = [
        {"key": "waiting", "display": "Waiting", "indent": 0},
        {"key": "preprocessing", "display": "1. Preprocessing", "indent": 0},
        {"key": "layout", "display": "2. Layout", "indent": 0},
        {"key": "perception", "display": "3. Perception", "indent": 0},
        {"key": "perception.icon", "display": "├─ Icon", "indent": 1, "parent": "perception"},
        {"key": "perception.applogo", "display": "├─ AppLogo", "indent": 1, "parent": "perception"},
        {"key": "perception.graph", "display": "└─ Graph", "indent": 1, "parent": "perception"},
        {"key": "color", "display": "4. Color", "indent": 0},
        {"key": "dsl", "display": "5. DSL", "indent": 0},
        {"key": "artifacts", "display": "5. Artifacts", "indent": 0},
        {"key": "render", "display": "6. Render", "indent": 0},
        {"key": "evaluation", "display": "7. Evaluation", "indent": 0},
        {"key": "done", "display": "✓ Done", "indent": 0},
        {"key": "failed", "display": "✗ Failed", "indent": 0}
    ]

    def __init__(self):
        self.lock = threading.Lock()
        # Current stage for each image: {image_id: stage_name}
        self.current_stages: Dict[str, str] = {}
        # Sub-stage tracking for parallel stages: {image_id: {substage: [start, end]}}
        self.substage_times: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
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

    def set_substage(self, image_id: str, substage: str, is_start: bool = True):
        """
        Track substages for parallel processing.

        Args:
            image_id: Image identifier
            substage: Substage key (e.g., "perception.icon", "perception.graph")
            is_start: True for start, False for end
        """
        with self.lock:
            current_time = time.time()
            if is_start:
                self.substage_times[image_id][substage] = [current_time]
            else:
                if substage in self.substage_times[image_id] and len(self.substage_times[image_id][substage]) == 1:
                    self.substage_times[image_id][substage].append(current_time)

    def start_image(self, image_id: str):
        """Mark an image as started processing."""
        with self.lock:
            self.image_start_times[image_id] = time.time()
            self.current_stages[image_id] = "waiting"

    def get_current_stage(self, image_id: str) -> str:
        """Get the current stage for an image."""
        with self.lock:
            return self.current_stages.get(image_id, "unknown")

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics for all stages and substages."""
        with self.lock:
            # Count images in each stage
            stage_counts = {stage["key"]: 0 for stage in self.STAGES}
            for stage in self.current_stages.values():
                if stage in stage_counts:
                    stage_counts[stage] += 1

            # Calculate average times for each stage (in milliseconds)
            stage_avg_times = {}
            stage_min_times = {}
            stage_max_times = {}

            for stage_def in self.STAGES:
                stage_key = stage_def["key"]
                if stage_key in ["waiting", "failed"]:
                    continue

                # Skip substages for main stage timing (they're calculated separately)
                if "parent" in stage_def:
                    continue

                all_durations = []
                for image_id, times_dict in self.stage_times.items():
                    if stage_key in times_dict and len(times_dict[stage_key]) >= 2:
                        duration = (times_dict[stage_key][1] - times_dict[stage_key][0]) * 1000  # to ms
                        all_durations.append(duration)

                if all_durations:
                    stage_avg_times[stage_key] = sum(all_durations) / len(all_durations)
                    stage_min_times[stage_key] = min(all_durations)
                    stage_max_times[stage_key] = max(all_durations)
                else:
                    stage_avg_times[stage_key] = 0
                    stage_min_times[stage_key] = 0
                    stage_max_times[stage_key] = 0

            # Calculate substage times
            substage_avg_times = {}
            substage_min_times = {}
            substage_max_times = {}

            for stage_def in self.STAGES:
                if "parent" not in stage_def:
                    continue

                substage_key = stage_def["key"]
                all_durations = []
                for image_id, substage_dict in self.substage_times.items():
                    if substage_key in substage_dict and len(substage_dict[substage_key]) >= 2:
                        duration = (substage_dict[substage_key][1] - substage_dict[substage_key][0]) * 1000
                        all_durations.append(duration)

                if all_durations:
                    substage_avg_times[substage_key] = sum(all_durations) / len(all_durations)
                    substage_min_times[substage_key] = min(all_durations)
                    substage_max_times[substage_key] = max(all_durations)
                else:
                    substage_avg_times[substage_key] = 0
                    substage_min_times[substage_key] = 0
                    substage_max_times[substage_key] = 0

            # Cumulative "entered" counts for stages (main) and substages
            # A stage/substage is considered "entered" if we recorded at least a start time.
            stage_entered_counts = {s["key"]: 0 for s in self.STAGES if "parent" not in s}
            for image_id, times_dict in self.stage_times.items():
                for stage_key, times in times_dict.items():
                    if stage_key in stage_entered_counts and len(times) >= 1:
                        stage_entered_counts[stage_key] += 1

            substage_entered_counts = {s["key"]: 0 for s in self.STAGES if "parent" in s}
            for image_id, sub_dict in self.substage_times.items():
                for sub_key, times in sub_dict.items():
                    if sub_key in substage_entered_counts and len(times) >= 1:
                        substage_entered_counts[sub_key] += 1

            # Substage "in-progress" counts: start recorded, end not yet recorded
            substage_in_progress_counts = {s["key"]: 0 for s in self.STAGES if "parent" in s}
            for image_id, sub_dict in self.substage_times.items():
                for sub_key, times in sub_dict.items():
                    if sub_key in substage_in_progress_counts and len(times) == 1:
                        substage_in_progress_counts[sub_key] += 1

            total_images = len(self.current_stages)
            active_images = total_images - stage_counts.get("done", 0) - stage_counts.get("failed", 0)

            return {
                "stage_counts": stage_counts,
                "stage_avg_times": stage_avg_times,
                "stage_min_times": stage_min_times,
                "stage_max_times": stage_max_times,
                "substage_avg_times": substage_avg_times,
                "substage_min_times": substage_min_times,
                "substage_max_times": substage_max_times,
                "stage_entered_counts": stage_entered_counts,
                "substage_entered_counts": substage_entered_counts,
                "substage_in_progress_counts": substage_in_progress_counts,
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

        # Integrated rendering settings
        self.integrated_render = os.getenv('INTEGRATED_RENDER', 'false').lower() == 'true'
        try:
            self.render_concurrency = int(os.getenv('RENDER_CONCURRENCY', str(self.concurrency)))
        except Exception:
            self.render_concurrency = self.concurrency
        self.render_semaphore: Optional[asyncio.Semaphore] = None
        self.render_tasks: List[asyncio.Task] = []
        self.render_results: List[Tuple[str, bool, str]] = []

        # Stage tracking
        self.stage_tracker = StageTracker()
        self.show_stage_table = os.getenv('SHOW_STAGE_TABLE', 'true').lower() == 'true'
        self.live_display: Optional[Live] = None
        self.display_thread: Optional[threading.Thread] = None
        self.display_running = False
        self.start_time = None

    def _create_status_table(self) -> Table:
        """Create a Rich table showing current stage statistics with hierarchy."""
        stats = self.stage_tracker.get_stats()

        table = Table(
            title="[bold cyan]Widget Generation Progress[/bold cyan]",
            box=ROUNDED,
            show_header=True,
            header_style="bold magenta",
            title_style="bold cyan",
        )

        table.add_column("Stage", style="cyan", no_wrap=False, width=25)
        table.add_column("Count", justify="right", style="green", width=8)
        table.add_column("Percent", justify="right", style="yellow", width=10)
        table.add_column("Avg Time", justify="right", style="blue", width=12)
        table.add_column("Min Time", justify="right", style="dim", width=12)
        table.add_column("Max Time", justify="right", style="dim", width=12)

        stage_counts = stats["stage_counts"]
        stage_avg_times = stats["stage_avg_times"]
        stage_min_times = stats["stage_min_times"]
        stage_max_times = stats["stage_max_times"]
        substage_avg_times = stats["substage_avg_times"]
        substage_min_times = stats["substage_min_times"]
        substage_max_times = stats["substage_max_times"]
        stage_entered_counts = stats.get("stage_entered_counts", {})
        substage_entered_counts = stats.get("substage_entered_counts", {})
        substage_in_progress_counts = stats.get("substage_in_progress_counts", {})
        total = stats["total_images"]

        for stage_def in StageTracker.STAGES:
            stage_key = stage_def["key"]
            display_name = stage_def["display"]
            indent = stage_def.get("indent", 0)
            is_substage = "parent" in stage_def

            # Apply indentation
            indent_str = "   " * indent
            stage_display = f"{indent_str}{display_name}"

            # Get count as "in-progress" to match other stages
            # - Main perception: use current stage count
            # - Substages (icon/applogo/graph): use current in-progress counts tracked by StageTracker
            # - Other substages: fall back to parent current count
            if not is_substage:
                count = stage_counts.get(stage_key, 0)
            else:
                if stage_key in ("perception.icon", "perception.applogo", "perception.graph"):
                    count = substage_in_progress_counts.get(stage_key, 0)
                else:
                    parent_key = stage_def["parent"]
                    count = stage_counts.get(parent_key, 0)

            percent = (count / total * 100) if total > 0 else 0

            # Get timing based on whether it's a substage
            if is_substage:
                avg_time = substage_avg_times.get(stage_key, 0)
                min_time = substage_min_times.get(stage_key, 0)
                max_time = substage_max_times.get(stage_key, 0)
            elif stage_key in ["waiting", "failed"]:
                avg_time = min_time = max_time = 0
            else:
                avg_time = stage_avg_times.get(stage_key, 0)
                min_time = stage_min_times.get(stage_key, 0)
                max_time = stage_max_times.get(stage_key, 0)

            avg_time_str = f"{avg_time:.0f}ms" if avg_time > 0 else "-"
            min_time_str = f"{min_time:.0f}ms" if min_time > 0 else "-"
            max_time_str = f"{max_time:.0f}ms" if max_time > 0 else "-"

            # Color coding for count
            if is_substage:
                count_style = "[dim cyan]"  # Substages are dimmed
                count_display = f"{count_style}{count}[/]"
            elif count > 0:
                if stage_key == "done":
                    count_style = "[bold green]"
                elif stage_key == "failed":
                    count_style = "[bold red]"
                else:
                    count_style = "[bold white]"
                count_display = f"{count_style}{count}[/]"
            else:
                count_style = "[dim]"
                count_display = f"{count_style}{count}[/]"

            table.add_row(
                stage_display,
                count_display,
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
        """Find image files that need processing (skip already completed, clean up failed ones)."""
        extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp'}
        all_images = []

        for ext in extensions:
            # Recursively search for images in subdirectories
            all_images.extend(self.input_dir.glob(f'**/*{ext}'))
            all_images.extend(self.input_dir.glob(f'**/*{ext.upper()}'))

        images_to_process = []

        for image_path in sorted(all_images):
            # Get relative path from input_dir to preserve subdirectory structure
            rel_path = image_path.relative_to(self.input_dir)
            # Create widget_dir preserving subdirectory: output_dir/category/widget_id
            if rel_path.parent != Path('.'):
                # Image is in a subdirectory
                widget_dir = self.output_dir / rel_path.parent / image_path.stem
            else:
                # Image is in root input_dir
                widget_dir = self.output_dir / image_path.stem
            debug_file = widget_dir / "log" / "debug.json"
            dsl_file = widget_dir / "artifacts" / "4-dsl" / "widget.json"

            should_process = True
            should_clean = False

            # Check if both debug.json shows success AND DSL file actually exists and is valid
            if debug_file.exists():
                try:
                    with open(debug_file, 'r') as f:
                        debug_data = json.load(f)
                        execution_status = debug_data.get('execution', {}).get('status', '')

                        if execution_status == 'success' and dsl_file.exists():
                            # Verify DSL file is valid and not empty
                            try:
                                # Check file size first
                                dsl_file_size = dsl_file.stat().st_size
                                if dsl_file_size == 0:
                                    should_clean = True
                                    log_to_file(f"[Reprocess] {image_path.name} - DSL file is empty (0 bytes), cleaning up")
                                else:
                                    with open(dsl_file, 'r') as dsl_f:
                                        dsl_content = json.load(dsl_f)
                                        # Check if DSL has meaningful content (not just {}, [], or null)
                                        if dsl_content and isinstance(dsl_content, dict) and len(dsl_content) > 0:
                                            should_process = False
                                            log_to_file(f"[Skip] {image_path.name} - already generated")
                                        else:
                                            should_clean = True
                                            log_to_file(f"[Reprocess] {image_path.name} - DSL file has no meaningful content, cleaning up")
                            except (json.JSONDecodeError, Exception) as dsl_e:
                                should_clean = True
                                log_to_file(f"[Reprocess] {image_path.name} - DSL file is corrupted or unreadable, cleaning up")
                        else:
                            # Failed or DSL missing - clean up and reprocess
                            should_clean = True
                            if execution_status == 'success' and not dsl_file.exists():
                                log_to_file(f"[Reprocess] {image_path.name} - status success but DSL file missing, cleaning up")
                            else:
                                log_to_file(f"[Reprocess] {image_path.name} - status is '{execution_status}', cleaning up")
                except Exception as e:
                    log_to_file(f"[Warning] Failed to read debug.json for {image_path.name}, will clean up and process")
                    should_clean = True
            elif widget_dir.exists():
                # Widget dir exists but no debug.json - something went wrong, clean up
                should_clean = True
                log_to_file(f"[Reprocess] {image_path.name} - incomplete output, cleaning up")

            # Clean up if needed
            if should_clean and widget_dir.exists():
                try:
                    shutil.rmtree(widget_dir)
                    log_to_file(f"[Cleaned] {image_path.name} - removed all previous artifacts")
                except Exception as e:
                    log_to_file(f"[Warning] Failed to clean up {widget_dir}: {str(e)}")

            if should_process:
                images_to_process.append(image_path)

        return images_to_process

    async def _render_single_widget(self, widget_dir: Path, widget_id: str):
        """Render a single widget directory using the JS renderer.

        Updates StageTracker to 'render' when starting and to 'done' or 'failed' on completion.
        Also updates internal completed/failed counters and progress bar in non-live mode.
        """
        try:
            # Move to render stage
            self.stage_tracker.set_stage(widget_id, "render")

            # Use the shell script wrapper to ensure consistent env
            cmd = ["bash", "./scripts/rendering/render-widget.sh", str(widget_dir)]

            log_to_file(f"[Render Start] [{widget_id}] cmd: {' '.join(cmd)}")

            # Spawn subprocess and capture output to run.log
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )

            stdout, _ = await proc.communicate()
            output_text = stdout.decode(errors='ignore') if stdout else ''
            if output_text:
                for line in output_text.splitlines():
                    log_to_file(f"[Render][{widget_id}] {line}")

            if proc.returncode == 0:
                log_to_file(f"[Render End] [{widget_id}] ✓ success")
                self.stage_tracker.set_stage(widget_id, "evaluation")
                try:
                    eval_cmd = [
                        "bash", "./scripts/evaluation/run_eval_single.sh", str(widget_dir)
                    ]
                    gt_dir_env = os.getenv('EVAL_GT_DIR')
                    if gt_dir_env:
                        eval_cmd.append(gt_dir_env)
                    log_to_file(f"[Eval Start] [{widget_id}] cmd: {' '.join(eval_cmd)}")
                    eval_proc = await asyncio.create_subprocess_exec(
                        *eval_cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.STDOUT,
                    )
                    out, _ = await eval_proc.communicate()
                    out_text = out.decode(errors='ignore') if out else ''
                    for line in out_text.splitlines():
                        log_to_file(f"[Eval][{widget_id}] {line}")
                    if eval_proc.returncode == 0:
                        log_to_file(f"[Eval End] [{widget_id}] ✓ success")
                        self.stage_tracker.set_stage(widget_id, "done")
                        self.completed += 1
                    else:
                        log_to_file(f"[Eval End] [{widget_id}] ✗ failed code {eval_proc.returncode}")
                        self.stage_tracker.set_stage(widget_id, "failed")
                        self.failed += 1
                        return  # Early return; progress bar updated below
                except Exception as e:
                    log_to_file(f"[Eval Error] [{widget_id}] {type(e).__name__}: {e}")
                    self.stage_tracker.set_stage(widget_id, "failed")
                    self.failed += 1
                    return
            else:
                # Failure
                self.stage_tracker.set_stage(widget_id, "failed")
                self.failed += 1
                self.render_results.append((widget_id, False, f"exit {proc.returncode}"))
                log_to_file(f"[Render End] [{widget_id}] ✗ failed with code {proc.returncode}")

            # Update progress bar if used
            if self.pbar:
                success_rate = (self.completed / (self.completed + self.failed) * 100) if (self.completed + self.failed) > 0 else 0
                self.pbar.set_postfix(success=f"{success_rate:.1f}%", failed=self.failed)
                self.pbar.update(1)

        except Exception as e:
            self.stage_tracker.set_stage(widget_id, "failed")
            self.failed += 1
            self.render_results.append((widget_id, False, str(e)))
            log_to_file(f"[Render Error] [{widget_id}] {type(e).__name__}: {e}")

    async def generate_single(self, image_path: Path) -> Tuple[Path, bool, str]:
        """
        Generate widget DSL for a single image with complete debug data and visualizations.

        This method is a thin wrapper that preserves subdirectory structure and
        delegates all artifact management to generate_single_widget from single.py.
        """
        widget_id = image_path.stem

        # Preserve subdirectory structure in output
        rel_path = image_path.relative_to(self.input_dir)
        if rel_path.parent != Path('.'):
            # Image is in a subdirectory - create parent dirs
            output_parent = self.output_dir / rel_path.parent
            output_parent.mkdir(parents=True, exist_ok=True)
            effective_output_dir = output_parent
        else:
            # Image is in root input_dir
            effective_output_dir = self.output_dir

        # Call the unified single widget generator
        success, widget_dir, error_msg = await generate_single_widget(
            image_path=image_path,
            output_dir=effective_output_dir,
            config=self.config,
            icon_lib_names=self.icon_lib_names,
            stage_tracker=self.stage_tracker,
            run_log_path=self.output_dir / "run.log",
            integrated_render=self.integrated_render,
        )

        # Schedule integrated rendering if enabled and generation succeeded
        if success and self.integrated_render and widget_dir is not None:
            # Determine widget_id (same as image stem)
            widget_id = image_path.stem
            # Lazily create render semaphore
            if self.render_semaphore is None:
                self.render_semaphore = asyncio.Semaphore(self.render_concurrency)

            async def _render_with_semaphore():
                async with self.render_semaphore:
                    await self._render_single_widget(widget_dir, widget_id)

            task = asyncio.create_task(_render_with_semaphore())
            self.render_tasks.append(task)
        else:
            # No integrated rendering (or generation failed): finalize counters now
            if success:
                self.completed += 1
            else:
                self.failed += 1

            if self.pbar:
                success_rate = (self.completed / (self.completed + self.failed) * 100) if (self.completed + self.failed) > 0 else 0
                self.pbar.set_postfix(success=f"{success_rate:.1f}%", failed=self.failed)
                self.pbar.update(1)

        return (image_path, success, error_msg or str(widget_dir))

    async def process_batch(self, images: List[Path]):
        """Process images with controlled concurrency."""
        semaphore = asyncio.Semaphore(self.concurrency)

        async def process_with_semaphore(image_path: Path):
            async with semaphore:
                return await self.generate_single(image_path)

        tasks = [process_with_semaphore(img) for img in images]
        self.results = await asyncio.gather(*tasks, return_exceptions=False)

        # If integrated rendering is enabled, wait for all render tasks to finish
        if self.integrated_render and self.render_tasks:
            await asyncio.gather(*self.render_tasks, return_exceptions=False)

    async def run(self):
        """Main execution flow."""
        import asyncio

        # Setup logging with run timestamp
        run_start_time = datetime.now().isoformat()
        setup_logger(self.output_dir / "run.log", run_start_time=run_start_time)

        # Save config.json
        config_data = {
            "widgetFactoryVersion": WIDGET_FACTORY_VERSION,
            "startTime": datetime.now().isoformat(),
            "configuration": {
                "inputDir": str(self.input_dir),
                "outputDir": str(self.output_dir),
                "runLog": str(self.output_dir / "run.log")
            },
            "pipelineSettings": {
                "layoutEnabled": self.config.enable_layout_pipeline,
                "iconEnabled": self.config.enable_icon_pipeline,
                "graphEnabled": self.config.enable_graph_pipeline,
                "colorEnabled": self.config.enable_color_pipeline
            },
            "modelSettings": {
                "defaultModel": self.config.default_model,
                "defaultEnableThinking": self.config.default_enable_thinking,
                "timeout": self.config.default_timeout,
                "stages": {
                    "layout": {
                        "model": self.config.get_layout_model(),
                        "thinking": self.config.get_layout_thinking(),
                        "override": self.config.layout_model is not None or self.config.layout_enable_thinking is not None
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
        log_to_console(f"  Default Timeout: {self.config.default_timeout}s")
        log_to_console("")

        # Show stage-specific configuration
        log_to_console("Stage Configuration:", Colors.BRIGHT_YELLOW)

        stages_info = [
            ("Layout Detection", "layout"),
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

        # Write run end marker to log file
        log_to_file("=" * 80)
        log_to_file(f"RUN END: {end_time.isoformat()}")
        log_to_file(f"Results: {self.completed}/{self.total} succeeded, {self.failed} failed")
        log_to_file("=" * 80)
        log_to_file("")

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
