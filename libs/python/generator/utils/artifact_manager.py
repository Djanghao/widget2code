# -----------------------------------------------------------------------------
# File: artifact_manager.py
# Description: Unified artifact management for widget generation
# Author: Houston Zhang
# Date: 2025-11-16
# -----------------------------------------------------------------------------

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List

from ..config import GeneratorConfig
from .visualization import draw_grounding_visualization, crop_icon_region, save_retrieval_svgs


class ArtifactManager:
    """Manages all artifacts and debug information for widget generation."""

    def __init__(self, widget_dir: Path, widget_id: str, config: GeneratorConfig):
        """
        Initialize the artifact manager.

        Args:
            widget_dir: Root directory for this widget's artifacts
            widget_id: Unique identifier for the widget
            config: Generator configuration
        """
        self.widget_dir = widget_dir
        self.widget_id = widget_id
        self.config = config

        # Directory paths
        self.artifacts_dir = widget_dir / "artifacts"
        self.log_dir = widget_dir / "log"
        self.prompts_dir = widget_dir / "prompts"

        self.preprocess_dir = self.artifacts_dir / "1-preprocess"
        self.layout_dir = self.artifacts_dir / "2-layout"
        self.layout_crops_dir = self.layout_dir / "icon-crops"
        self.retrieval_dir = self.artifacts_dir / "3-retrieval"
        self.dsl_dir = self.artifacts_dir / "4-dsl"

    def setup_directories(self) -> Dict[str, Path]:
        """
        Create all necessary directories for artifacts.

        Returns:
            Dictionary mapping directory names to paths
        """
        # Create base directories (always needed)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
        self.preprocess_dir.mkdir(parents=True, exist_ok=True)
        self.dsl_dir.mkdir(parents=True, exist_ok=True)

        # Conditionally create pipeline-specific directories
        if self.config.enable_layout_pipeline:
            self.layout_dir.mkdir(parents=True, exist_ok=True)
            if self.config.enable_icon_pipeline:
                self.layout_crops_dir.mkdir(parents=True, exist_ok=True)

        if self.config.enable_icon_pipeline:
            self.retrieval_dir.mkdir(parents=True, exist_ok=True)

        return {
            "artifacts": self.artifacts_dir,
            "log": self.log_dir,
            "prompts": self.prompts_dir,
            "preprocess": self.preprocess_dir,
            "layout": self.layout_dir,
            "layout_crops": self.layout_crops_dir,
            "retrieval": self.retrieval_dir,
            "dsl": self.dsl_dir,
        }

    def save_input_image(self, image_path: Path):
        """
        Copy input image to widget directory.

        Args:
            image_path: Path to input image file
        """
        import shutil

        # Save to root
        input_file = self.widget_dir / "input.png"
        shutil.copy2(image_path, input_file)

        # Save to preprocess artifacts
        original_in_preprocess = self.preprocess_dir / "1.1-original.png"
        shutil.copy2(image_path, original_in_preprocess)

    def save_preprocessed_image(self, image_bytes: bytes):
        """
        Save preprocessed image.

        Args:
            image_bytes: Preprocessed image data
        """
        if image_bytes:
            with open(self.preprocess_dir / "1.2-preprocessed.png", 'wb') as f:
                f.write(image_bytes)

    def save_layout_artifacts(
        self,
        layout_debug: Optional[Dict[str, Any]],
        image_bytes: bytes
    ):
        """
        Save layout detection artifacts including data and visualization.

        Args:
            layout_debug: Layout debug information from generate_widget_full
            image_bytes: Preprocessed image for visualization
        """
        if not layout_debug or not self.config.enable_layout_pipeline:
            return

        raw_detections = layout_debug.get('raw') or []
        pixel_detections = layout_debug.get('pixel') or []
        post_processed = layout_debug.get('postProcessed') or []

        # Count detections by label
        label_counts = {}
        for det in post_processed:
            label = det.get('label', 'unknown')
            label_counts[label] = label_counts.get(label, 0) + 1

        # Save layout data JSON
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
        with open(self.layout_dir / "layout-data.json", 'w') as f:
            json.dump(layout_data, f, indent=2)

        # Generate layout visualization
        if post_processed:
            layout_viz = draw_grounding_visualization(image_bytes, post_processed)
            with open(self.layout_dir / "layout-visualization.png", 'wb') as f:
                f.write(layout_viz)

        # Save raw model response text if available
        raw_text = layout_debug.get('rawText') if isinstance(layout_debug, dict) else None
        try:
            if raw_text is not None:
                with open(self.layout_dir / "llm-response.txt", 'w', encoding='utf-8') as f:
                    f.write(str(raw_text))
        except Exception:
            # Best-effort; ignore failures
            pass

    def save_icon_crops(
        self,
        layout_detections: List[Dict[str, Any]],
        image_bytes: bytes
    ):
        """
        Crop and save icon regions from layout detections.

        Args:
            layout_detections: Post-processed layout detections
            image_bytes: Preprocessed image to crop from
        """
        if not self.config.enable_layout_pipeline or not self.config.enable_icon_pipeline:
            return

        if not layout_detections:
            return

        # Filter icon detections
        icon_detections = [d for d in layout_detections if d.get('label', '').lower() == 'icon']

        for idx, det in enumerate(icon_detections):
            bbox = det.get('bbox')
            if bbox and len(bbox) == 4:
                try:
                    crop_bytes = crop_icon_region(image_bytes, bbox)
                    with open(self.layout_crops_dir / f"icon-{idx+1}.png", 'wb') as f:
                        f.write(crop_bytes)
                except Exception as e:
                    from .logger import log_to_file
                    log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{self.widget_id}] Warning: Failed to crop icon {idx+1}: {str(e)}")

    def save_retrieval_artifacts(self, icon_debug: Optional[Dict[str, Any]]):
        """
        Save icon retrieval SVG artifacts.

        Args:
            icon_debug: Icon debug information from generate_widget_full
        """
        if not self.config.enable_icon_pipeline or not icon_debug:
            return

        svg_source_dirs = [
            Path(__file__).parents[4] / "libs" / "js" / "icons" / "svg"
        ]

        per_icon = (icon_debug.get('retrieval') or {}).get('perIcon', [])
        for icon_data in per_icon:
            icon_idx = icon_data.get('index', 0)
            top_candidates = icon_data.get('topCandidates') or []
            if top_candidates:
                save_retrieval_svgs(
                    retrieval_results=top_candidates,
                    icon_index=icon_idx,
                    output_dir=self.retrieval_dir,
                    svg_source_dirs=svg_source_dirs,
                    top_n=10
                )

    def save_prompts(self, prompt_debug: Optional[Dict[str, Any]]):
        """
        Save all prompt evolution stages.

        Args:
            prompt_debug: Prompt debug information from generate_widget_full
        """
        if not prompt_debug:
            return

        # Map stage names to numbered files
        stage_map = {
            'stage1_base': '1-base.md',
            'stage2_withLayout': '2-with-layout.md',
            'stage3_withColors': '3-with-colors.md',
            'stage4_withGraphs': '4-with-graphs.md',
            'stage5_withIcons': '5-with-icons.md',
            'stage5_5_withApplogos': '5.5-with-applogos.md',
            'stage6_final': '6-final.md'
        }

        for stage_name, prompt_text in prompt_debug.items():
            if isinstance(prompt_text, str) and stage_name.startswith('stage'):
                filename = stage_map.get(stage_name)
                if filename:
                    with open(self.prompts_dir / filename, 'w') as f:
                        f.write(prompt_text)

    def save_widget_dsl(self, widget_dsl: Dict[str, Any]):
        """
        Save the generated WidgetDSL JSON.

        Args:
            widget_dsl: Generated widget DSL
        """
        widget_file = self.dsl_dir / "widget.json"
        with open(widget_file, 'w') as f:
            json.dump(widget_dsl, f, indent=2)

    def create_debug_json(
        self,
        start_time: datetime,
        end_time: datetime,
        image_path: Path,
        image_size: int,
        image_dims: Optional[Dict[str, int]],
        result: Dict[str, Any],
        icon_lib_names: str,
        error: Optional[Exception] = None
    ) -> Dict[str, Any]:
        """
        Create comprehensive debug.json structure.

        Args:
            start_time: Execution start time
            end_time: Execution end time
            image_path: Input image path
            image_size: Input image file size in bytes
            image_dims: Input image dimensions {width, height}
            result: Result from generate_widget_full
            icon_lib_names: Icon library names JSON string
            error: Exception if generation failed

        Returns:
            Debug data dictionary
        """
        try:
            from json import loads as json_loads
            icon_libs = json_loads(icon_lib_names)
        except:
            icon_libs = ["sf", "lucide"]

        try:
            from pathlib import Path as PathLib
            root_package_json = PathLib(__file__).parent.parent.parent.parent.parent.parent / "package.json"
            if root_package_json.exists():
                with open(root_package_json) as f:
                    package_data = json_loads(f.read())
                    version = package_data.get("version", "unknown")
            else:
                version = "unknown"
        except:
            version = "unknown"

        duration = (end_time - start_time).total_seconds()
        status = "failed" if error else "success"

        debug_data = {
            "widgetId": self.widget_id,
            "widgetFactoryVersion": version,
            "execution": {
                "startTime": start_time.isoformat(),
                "endTime": end_time.isoformat(),
                "duration": duration,
                "status": status
            },
            "input": {
                "filename": image_path.name,
                "originalPath": str(image_path.absolute()),
                "fileSizeBytes": image_size,
                "dimensions": image_dims
            },
            "config": {
                "model": self.config.default_model,
                "timeout": self.config.default_timeout,
                "iconLibraries": icon_libs,
                "retrieval": {
                    "topK": self.config.retrieval_topk,
                    "topM": self.config.retrieval_topm,
                    "alpha": self.config.retrieval_alpha
                },
                "pipelinesEnabled": {
                    "layout": self.config.enable_layout_pipeline,
                    "icon": self.config.enable_icon_pipeline,
                    "graph": self.config.enable_graph_pipeline,
                    "color": self.config.enable_color_pipeline
                }
            }
        }

        if error:
            debug_data["error"] = {
                "message": str(error),
                "type": type(error).__name__
            }
            debug_data["files"] = {
                "input": "input.png" if (self.widget_dir / "input.png").exists() else None,
                "log": {"debug": "log/debug.json"},
                "artifacts": {
                    "1_preprocess": {
                        "original": "artifacts/1-preprocess/1.1-original.png" if (self.preprocess_dir / "1.1-original.png").exists() else None
                    }
                }
            }
            debug_data["metadata"] = {"pipeline": "generation"}
            return debug_data

        # Success case - extract all debug info
        preprocessed_info = result.get('preprocessedImage') or {}
        layout_debug = result.get('layoutDebugInfo') or {}
        icon_debug = result.get('iconDebugInfo') or {}
        applogo_debug = result.get('applogoDebugInfo') or {}
        color_debug = result.get('colorDebugInfo') or {}
        graph_debug = result.get('graphDebugInfo') or {}
        prompt_debug = result.get('promptDebugInfo') or {}

        # Add preprocessed info
        debug_data["input"]["preprocessed"] = {
            "width": preprocessed_info.get('width'),
            "height": preprocessed_info.get('height'),
            "aspectRatio": preprocessed_info.get('aspectRatio')
        }

        # Count detections
        layout_detections = (layout_debug.get('postProcessed') or []) if layout_debug else []
        label_counts = {}
        for det in layout_detections:
            label = det.get('label', 'unknown')
            label_counts[label] = label_counts.get(label, 0) + 1

        icon_count = (icon_debug.get('detection') or {}).get('iconCount', 0) if icon_debug else 0
        graph_count = (graph_debug.get('detection') or {}).get('graphCount', 0) if graph_debug else 0

        # Build steps section
        debug_data["steps"] = {
            "layoutDetection": {
                "enabled": self.config.enable_layout_pipeline,
                "totalElements": layout_debug.get('totalDetections', 0) if layout_debug else None,
                "elementsByType": label_counts if self.config.enable_layout_pipeline else {},
                "imageSize": {
                    "width": layout_debug.get('imageWidth') if layout_debug else None,
                    "height": layout_debug.get('imageHeight') if layout_debug else None
                }
            },
            "iconRetrieval": {
                "enabled": self.config.enable_icon_pipeline,
                **((icon_debug.get('retrieval') or {}) if icon_debug else {})
            },
            "iconDetection": {
                "enabled": self.config.enable_icon_pipeline,
                **((icon_debug.get('detection') or {}) if icon_debug else {})
            },
            "applogoRetrieval": {
                "enabled": self.config.enable_icon_pipeline,
                **((applogo_debug.get('retrieval') or {}) if applogo_debug else {})
            },
            "applogoDetection": {
                "enabled": self.config.enable_icon_pipeline,
                **((applogo_debug.get('detection') or {}) if applogo_debug else {})
            },
            "graphDetection": {
                "enabled": self.config.enable_graph_pipeline,
                **((graph_debug.get('detection') or {}) if graph_debug else {})
            },
            "graphSpecs": (graph_debug.get('specs') or []) if graph_debug else [],
            "colorExtraction": {
                "enabled": self.config.enable_color_pipeline,
                "colorCount": len(color_debug.get('colors') or []) if color_debug else 0
            },
            "promptConstruction": prompt_debug
        }

        # Build output section
        debug_data["output"] = {
            "widgetDSL": {"saved": "artifacts/4-dsl/widget.json"},
            "statistics": {
                "iconsDetected": icon_count if self.config.enable_icon_pipeline else None,
                "graphsDetected": graph_count if self.config.enable_graph_pipeline else None
            }
        }

        # Build files section
        icon_detections = [d for d in layout_detections if d.get('label', '').lower() == 'icon']
        icon_crop_files = [
            f"artifacts/2-layout/icon-crops/icon-{i+1}.png"
            for i in range(len(icon_detections))
            if (self.layout_crops_dir / f"icon-{i+1}.png").exists()
        ]

        retrieval_files = {}
        per_icon = (icon_debug.get('retrieval') or {}).get('perIcon', []) if icon_debug else []
        for icon_data in per_icon:
            icon_idx = icon_data.get('index', 0)
            icon_dir = self.retrieval_dir / f"icon-{icon_idx+1}"
            if icon_dir.exists():
                svg_files = sorted(icon_dir.glob("*.svg"))
                retrieval_files[f"icon-{icon_idx+1}"] = [
                    f"artifacts/3-retrieval/icon-{icon_idx+1}/{f.name}" for f in svg_files
                ]

        debug_data["files"] = {
            "input": "input.png",
            "artifacts": {
                "1_preprocess": {
                    "original": "artifacts/1-preprocess/1.1-original.png",
                    "preprocessed": "artifacts/1-preprocess/1.2-preprocessed.png" if preprocessed_info.get('bytes') else None
                },
                "2_layout": {
                    "data": "artifacts/2-layout/layout-data.json" if self.config.enable_layout_pipeline else None,
                    "visualization": "artifacts/2-layout/layout-visualization.png" if (self.config.enable_layout_pipeline and layout_detections) else None,
                    "iconCrops": icon_crop_files if (self.config.enable_layout_pipeline and self.config.enable_icon_pipeline) else []
                } if self.config.enable_layout_pipeline else None,
                "3_retrieval": retrieval_files if self.config.enable_icon_pipeline else None,
                "4_dsl": {
                    "widget": "artifacts/4-dsl/widget.json"
                }
            },
            "log": {
                "execution": "log/log",
                "debug": "log/debug.json"
            },
            "prompts": {
                "1_base": "prompts/1-base.md" if (self.prompts_dir / "1-base.md").exists() else None,
                "2_withLayout": "prompts/2-with-layout.md" if (self.prompts_dir / "2-with-layout.md").exists() else None,
                "3_withColors": "prompts/3-with-colors.md" if (self.prompts_dir / "3-with-colors.md").exists() else None,
                "4_withGraphs": "prompts/4-with-graphs.md" if (self.prompts_dir / "4-with-graphs.md").exists() else None,
                "5_withIcons": "prompts/5-with-icons.md" if (self.prompts_dir / "5-with-icons.md").exists() else None,
                "6_final": "prompts/6-final.md" if (self.prompts_dir / "6-final.md").exists() else None
            }
        }

        debug_data["metadata"] = {"pipeline": "generation"}

        return debug_data

    def save_debug_json(self, debug_data: Dict[str, Any]):
        """
        Save debug.json file.

        Args:
            debug_data: Debug data dictionary
        """
        debug_file = self.log_dir / "debug.json"
        with open(debug_file, 'w') as f:
            json.dump(debug_data, f, indent=2)

    def save_widget_log(self, run_log_path: Optional[Path]):
        """
        Extract widget-specific log from run.log.

        Args:
            run_log_path: Path to the global run.log file
        """
        if not run_log_path or not run_log_path.exists():
            return

        try:
            log_file = self.log_dir / "log"

            # Read run.log and extract lines for this widget
            with open(run_log_path, 'r') as f:
                lines = f.readlines()

            # Filter lines that contain this widget_id
            widget_logs = [line for line in lines if f"[{self.widget_id}]" in line]

            if widget_logs:
                with open(log_file, 'w') as f:
                    f.writelines(widget_logs)
        except Exception:
            # If log extraction fails, just skip it
            pass
