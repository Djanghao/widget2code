# -----------------------------------------------------------------------------
# File: single.py
# Description: Single widget DSL generation with icon/graph enhancement
# Author: Houston Zhang
# Date: 2025-10-30
# -----------------------------------------------------------------------------

from ...providers import OpenAIProvider, ChatMessage, prepare_image_content
from PIL import Image
import io
import json
import os
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Tuple, Optional

from ...config import GeneratorConfig
from ...exceptions import ValidationError, FileSizeError, GenerationError
from ...utils import (
    validate_model,
    validate_api_key,
    validate_file_size,
    load_default_prompt,
    load_widget2dsl_prompt,
    load_prompt2dsl_prompt,
    clean_json_response,
    clean_code_response,
)
from ...utils.logger import log_to_file
from ...utils.artifact_manager import ArtifactManager
from ...perception import (
    preprocess_image_for_widget,
    run_icon_detection_pipeline,
    format_icon_prompt_injection,
    detect_and_process_graphs_from_layout,
    inject_graph_specs_to_prompt,
    get_available_components_list,
    extract_primitive_types_from_layout,
    inject_primitives_to_prompt,
)
from ...perception.icon_extraction import normalize_icon_details


async def get_default_prompt():
    return {"prompt": load_default_prompt()}


async def generate_widget_full(
    image_data: bytes,
    image_filename: str | None,
    system_prompt: str,
    retrieval_topk: int,
    retrieval_topm: int,
    retrieval_alpha: float,
    config: GeneratorConfig,
    icon_lib_names: str,
    applogo_lib_names: str = None,  # NEW: AppLogo library names
    stage_tracker=None,
    image_id: str = None,
    artifact_mgr: 'ArtifactManager' = None,
    incremental_save: bool = False,
):
    from pathlib import Path
    from datetime import datetime
    from ...utils.logger import log_to_file
    import tempfile
    import asyncio

    if image_id is None:
        image_id = Path(image_filename).stem if image_filename else "unknown"

    # Read pipeline enable flags from config
    enable_layout = config.enable_layout_pipeline
    enable_icon = config.enable_icon_pipeline
    enable_applogo = config.enable_icon_pipeline  # AppLogo uses same flag as icon
    enable_graph = config.enable_graph_pipeline
    enable_color = config.enable_color_pipeline

    temp_file = None
    try:
        validate_file_size(len(image_data), config.max_file_size_mb)

        # Update stage: preprocessing
        if stage_tracker:
            stage_tracker.set_stage(image_id, "preprocessing")

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_data, min_target_edge=1000)

        # Incremental save: preprocessed image
        if incremental_save and artifact_mgr is not None:
            try:
                artifact_mgr.save_preprocessed_image(image_bytes)
            except Exception:
                pass

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        # ========== Layout Detection (NEW: Stage 0) ==========
        if enable_layout:
            # Update stage: layout
            if stage_tracker:
                stage_tracker.set_stage(image_id, "layout")

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Layout detection started")

            from ...perception.layout import detect_layout

            # External retry wrapper: retry on empty results (raw/postProcessed) up to LAYOUT_MAX_RETRIES
            max_retries = max(0, config.get_layout_max_retries())
            attempts = 1 + max_retries

            layout_raw = []
            layout_pixel = []
            layout_post = []
            img_width = width
            img_height = height

            for attempt in range(attempts):
                layout_raw, layout_pixel, layout_post, img_width, img_height, layout_raw_text = await asyncio.wait_for(
                    detect_layout(
                        image_bytes=image_bytes,
                        filename=image_filename,
                        model=config.get_layout_model(),
                        api_key=config.get_layout_api_key(),
                        timeout=config.get_layout_timeout(),
                        thinking=config.get_layout_thinking(),
                        vl_high_resolution=config.get_layout_vl_high_resolution(),
                        max_tokens=config.get_layout_max_tokens(),
                        max_retries=0,  # keep internal retries off; we control with outer loop
                        image_id=image_id,
                    ),
                    timeout=config.get_layout_timeout()
                )

                has_any = (bool(layout_raw) and len(layout_raw) > 0) or (bool(layout_post) and len(layout_post) > 0)
                if has_any or attempt >= max_retries:
                    break

                # Visible warning when empty and we still have retries left
                log_to_file(
                    f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Warning: Layout returned 0 detections, retrying {attempt + 1}/{max_retries}"
                )

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Layout detection completed: {len(layout_post)} elements")

            # Incremental save: layout artifacts and icon crops (based on layout)
            if incremental_save and artifact_mgr is not None:
                try:
                    layout_debug_local = {
                        'raw': layout_raw or [],
                        'pixel': layout_pixel or [],
                        'postProcessed': layout_post or [],
                        'imageWidth': img_width,
                        'imageHeight': img_height,
                        'rawText': locals().get('layout_raw_text', '')
                    }
                    artifact_mgr.save_layout_artifacts(layout_debug_local, image_bytes)
                    artifact_mgr.save_icon_crops(layout_post or [], image_bytes)
                except Exception:
                    pass
        else:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: Layout detection (disabled in config)")
            layout_raw = None
            layout_pixel = None
            layout_post = None
            img_width = width
            img_height = height

        # ========== Icon & Graph Extraction (Parallel) ==========
        import time
        parallel_start = time.time()

        # Parse icon library names from JSON array, e.g., '["sf", "lucide"]'
        lib_names = None
        if icon_lib_names:
            try:
                parsed = json.loads(icon_lib_names)
                if isinstance(parsed, list):
                    lib_names = [str(name).strip() for name in parsed if str(name).strip()]
            except json.JSONDecodeError:
                pass

        # Parse applogo library names from JSON array, e.g., '["si"]'
        applogo_lib_names_parsed = None
        if applogo_lib_names:
            try:
                parsed = json.loads(applogo_lib_names)
                if isinstance(parsed, list):
                    applogo_lib_names_parsed = [str(name).strip() for name in parsed if str(name).strip()]
            except json.JSONDecodeError:
                pass

        # Wrapper functions to track substage timing
        async def track_icon_substage():
            if stage_tracker:
                stage_tracker.set_substage(image_id, "perception.icon", is_start=True)
            result = await run_icon_detection_pipeline(
                image_bytes=image_bytes,
                filename=image_filename,
                model=config.default_model,
                api_key=config.default_api_key,
                layout_detections=layout_post,
                img_width=img_width,
                img_height=img_height,
                retrieval_topk=retrieval_topk,
                retrieval_topm=retrieval_topm,
                retrieval_alpha=retrieval_alpha,
                lib_names=lib_names,
                timeout=config.get_icon_retrieval_timeout(),
            )
            if stage_tracker:
                stage_tracker.set_substage(image_id, "perception.icon", is_start=False)
            return result

        async def track_applogo_substage():
            if stage_tracker:
                stage_tracker.set_substage(image_id, "perception.applogo", is_start=True)
            from ...perception.applogo_extraction import run_applogo_detection_pipeline
            result = await run_applogo_detection_pipeline(
                image_bytes=image_bytes,
                filename=image_filename,
                model=config.default_model,
                api_key=config.default_api_key,
                layout_detections=layout_post,
                img_width=img_width,
                img_height=img_height,
                retrieval_topk=retrieval_topk,
                retrieval_topm=retrieval_topm,
                retrieval_alpha=retrieval_alpha,
                lib_names=applogo_lib_names_parsed,
                timeout=config.get_icon_retrieval_timeout(),  # Use same timeout as icon
            )
            if stage_tracker:
                stage_tracker.set_substage(image_id, "perception.applogo", is_start=False)
            return result

        async def track_graph_substage():
            if stage_tracker:
                stage_tracker.set_substage(image_id, "perception.graph", is_start=True)
            result = await detect_and_process_graphs_from_layout(
                image_bytes=image_bytes,
                filename=image_filename,
                layout_detections=layout_post,
                provider=None,
                graph_gen_api_key=config.get_graph_gen_api_key(),
                graph_gen_model=config.get_graph_gen_model(),
                graph_gen_timeout=config.get_graph_gen_timeout(),
                graph_gen_thinking=config.get_graph_gen_thinking(),
                graph_gen_max_tokens=config.get_graph_gen_max_tokens(),
            )
            if stage_tracker:
                stage_tracker.set_substage(image_id, "perception.graph", is_start=False)
            return result

        # Determine which pipelines to run
        # Icon depends on layout (needs layout_detections to filter icons)
        run_icon = enable_icon and layout_post is not None
        # AppLogo depends on layout (needs layout_detections to filter applogos)
        run_applogo = enable_applogo and layout_post is not None
        # Graph now also depends on layout (needs layout_detections to extract chart types)
        run_graph = enable_graph and layout_post is not None

        # Build task list based on enabled pipelines
        tasks = []
        task_names = []

        if run_icon:
            tasks.append(track_icon_substage())
            task_names.append("icon")
        elif not enable_icon:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: Icon detection (disabled in config)")
        else:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: Icon detection (layout disabled)")

        if run_applogo:
            tasks.append(track_applogo_substage())
            task_names.append("applogo")
        elif not enable_applogo:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: AppLogo detection (disabled in config)")
        else:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: AppLogo detection (layout disabled)")

        if run_graph:
            tasks.append(track_graph_substage())
            task_names.append("graph")
        elif not enable_graph:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: Graph detection (disabled in config)")
        else:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: Graph detection (layout disabled)")

        # Execute parallel tasks if any are enabled
        if tasks:
            # Update stage: perception (icon and graph detection run in parallel)
            if stage_tracker:
                stage_tracker.set_stage(image_id, "perception")

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Perception:Parallel] Started ({', '.join(task_names)})")

            # Use the maximum of icon and graph timeouts for parallel execution
            # Note: graph now only uses graph_gen_timeout (no separate detection phase)
            parallel_timeout = max(config.get_icon_retrieval_timeout(), config.get_graph_gen_timeout())

            results = await asyncio.wait_for(
                asyncio.gather(*tasks),
                timeout=parallel_timeout
            )

            # Parse results based on which tasks ran
            result_idx = 0
            if run_icon:
                icon_result = results[result_idx]
                result_idx += 1
            else:
                # Default empty icon result
                icon_result = {
                    "per_icon_details": [],
                    "icon_candidates": [],
                    "icon_count": 0
                }

            if run_applogo:
                applogo_result = results[result_idx]
                result_idx += 1
            else:
                # Default empty applogo result
                applogo_result = {
                    "per_applogo_details": [],
                    "applogo_candidates": [],
                    "applogo_count": 0
                }

            if run_graph:
                chart_counts, graph_specs = results[result_idx]
            else:
                # Default empty graph result
                chart_counts = {}
                graph_specs = []

            parallel_duration = time.time() - parallel_start
            icon_count = icon_result['icon_count']
            applogo_count = applogo_result['applogo_count']
            chart_count = sum(chart_counts.values()) if chart_counts else 0
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Perception:Parallel] Completed in {parallel_duration:.2f}s (Icons:{icon_count}, AppLogos:{applogo_count}, Charts:{chart_count})")
        else:
            # No perception tasks enabled
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [Perception:Parallel] No tasks to run")
            icon_result = {
                "per_icon_details": [],
                "icon_candidates": [],
                "icon_count": 0
            }
            applogo_result = {
                "per_applogo_details": [],
                "applogo_candidates": [],
                "applogo_count": 0
            }
            chart_counts = {}
            graph_specs = []

        # Extract icon results
        per_icon_details = icon_result["per_icon_details"]
        icon_candidates = icon_result["icon_candidates"]
        icon_count = icon_result["icon_count"]

        # Extract applogo results
        per_applogo_details = applogo_result["per_applogo_details"]
        applogo_candidates = applogo_result["applogo_candidates"]
        applogo_count = applogo_result["applogo_count"]

        # ========== Stage 1: Base Prompt ==========
        base_prompt = system_prompt if system_prompt else load_widget2dsl_prompt()

        # Incremental save: prompt stage 1
        if incremental_save and artifact_mgr is not None:
            try:
                artifact_mgr.save_prompts({'stage1_base': base_prompt})
            except Exception:
                pass

        # Fill in aspect ratio in base prompt
        if "[ASPECT_RATIO]" in base_prompt:
            base_prompt = base_prompt.replace("[ASPECT_RATIO]", str(round(aspect_ratio, 3)))

        # ========== Stage 2: Layout Injection (NEW) ==========
        if enable_layout and layout_post is not None:
            from ...perception.layout import format_layout_for_prompt

            layout_injection_text = format_layout_for_prompt(layout_post, img_width, img_height)
            prompt_with_layout = base_prompt

            if "[LAYOUT_INFO]" in prompt_with_layout:
                prompt_with_layout = prompt_with_layout.replace("[LAYOUT_INFO]", layout_injection_text)
            else:
                # Fallback: append at the end (aspect ratio already filled in stage 1)
                prompt_with_layout = prompt_with_layout + f"\n\n{layout_injection_text}"
        else:
            # Layout not enabled, keep placeholder as-is
            layout_injection_text = ""
            prompt_with_layout = base_prompt

        # ========== Stage 2.5: Primitive Definitions (NEW) ==========
        if enable_layout and layout_post is not None:
            # Extract detected primitive types from layout
            detected_primitives = extract_primitive_types_from_layout(layout_post)

            # Inject primitive component definitions into prompt
            prompt_with_primitives = inject_primitives_to_prompt(prompt_with_layout, detected_primitives)

            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Primitive definitions injected: {', '.join(sorted(detected_primitives)) if detected_primitives else 'none'}")
        else:
            # Layout not enabled, skip primitive injection
            detected_primitives = set()
            prompt_with_primitives = prompt_with_layout

        # ========== Stage 3: Colors (was Stage 2) ==========
        if enable_color:
            # Update stage: color
            if stage_tracker:
                stage_tracker.set_stage(image_id, "color")

            from ...perception.color_extraction import (
                detect_and_process_colors,
                inject_colors_to_prompt,
                format_color_injection
            )
            color_results = detect_and_process_colors(
                image_bytes=image_bytes,
                filename=image_filename,
                n_colors=10,
                k_clusters=8
            )
            color_injection_text = format_color_injection(color_results)
            prompt_with_colors = inject_colors_to_prompt(prompt_with_primitives, color_results)
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Color extraction completed")
        else:
            log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ⊘ SKIPPED: Color extraction (disabled in config)")
            color_results = []
            color_injection_text = ""
            prompt_with_colors = prompt_with_primitives

        # ========== Stage 4: Graphs (was Stage 3) ==========
        if enable_graph and graph_specs:
            from ...perception.graph.pipeline import format_graph_specs_for_injection
            graph_injection_text = format_graph_specs_for_injection(graph_specs)
            prompt_with_graphs = inject_graph_specs_to_prompt(prompt_with_colors, graph_specs)
        else:
            # Graph not enabled or no graphs detected, keep placeholder as-is
            graph_injection_text = ""
            prompt_with_graphs = prompt_with_colors

        # ========== Stage 5: Icons (was Stage 4) ==========
        if enable_icon and icon_count > 0:
            icon_injection_text = format_icon_prompt_injection(
                icon_count=icon_count,
                per_icon_details=per_icon_details,
                retrieval_topm=retrieval_topm,
            )

            prompt_with_icons = prompt_with_graphs
            if "[AVAILABLE_ICON_NAMES]" in prompt_with_icons:
                prompt_with_icons = prompt_with_icons.replace("[AVAILABLE_ICON_NAMES]", icon_injection_text)
            else:
                prompt_with_icons = prompt_with_graphs + "\n\n" + icon_injection_text
        else:
            # Icon not enabled or no icons detected, keep placeholder as-is
            icon_injection_text = ""
            prompt_with_icons = prompt_with_graphs

        # ========== Stage 5.5: AppLogos ==========
        if enable_applogo and applogo_count > 0:
            from ...perception.applogo_extraction import format_applogo_prompt_injection
            applogo_injection_text = format_applogo_prompt_injection(
                applogo_count=applogo_count,
                per_applogo_details=per_applogo_details,
                retrieval_topm=retrieval_topm,
            )

            prompt_with_applogos = prompt_with_icons
            if "[AVAILABLE_APPLOGO_NAMES]" in prompt_with_applogos:
                prompt_with_applogos = prompt_with_applogos.replace("[AVAILABLE_APPLOGO_NAMES]", applogo_injection_text)
            else:
                prompt_with_applogos = prompt_with_icons + "\n\n" + applogo_injection_text
        else:
            # AppLogo not enabled or no applogos detected, keep placeholder as-is
            applogo_injection_text = ""
            prompt_with_applogos = prompt_with_icons

        # ========== Stage 6: Components List (was Stage 5) ==========
        components_list = get_available_components_list(graph_specs, detected_primitives)
        prompt_final = prompt_with_applogos
        if "[AVAILABLE_COMPONENTS]" in prompt_final:
            prompt_final = prompt_final.replace("[AVAILABLE_COMPONENTS]", components_list)

        # Incremental save: prompt evolution snapshots
        if incremental_save and artifact_mgr is not None:
            try:
                snapshot = {}
                if 'prompt_with_layout' in locals():
                    snapshot['stage2_withLayout'] = locals().get('prompt_with_layout')
                if 'prompt_with_colors' in locals():
                    snapshot['stage3_withColors'] = locals().get('prompt_with_colors')
                if 'prompt_with_graphs' in locals():
                    snapshot['stage4_withGraphs'] = locals().get('prompt_with_graphs')
                if 'prompt_with_icons' in locals():
                    snapshot['stage5_withIcons'] = locals().get('prompt_with_icons')
                if 'prompt_with_applogos' in locals():
                    snapshot['stage5_5_withApplogos'] = locals().get('prompt_with_applogos')
                snapshot['stage6_final'] = prompt_final
                artifact_mgr.save_prompts(snapshot)
            except Exception:
                pass

        # Update stage: dsl
        if stage_tracker:
            stage_tracker.set_stage(image_id, "dsl")

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [DSL Generation] Started")

        vision_llm = OpenAIProvider(
            model=config.get_dsl_gen_model(),
            api_key=config.get_dsl_gen_api_key(),
            base_url=config.get_dsl_gen_base_url(),
            temperature=config.get_dsl_gen_temperature(),
            top_k=config.get_dsl_gen_top_k(),
            top_p=config.get_dsl_gen_top_p(),
            max_tokens=config.get_dsl_gen_max_tokens(),
            timeout=config.get_dsl_gen_timeout(),
            system_prompt=prompt_final,
            thinking=config.get_dsl_gen_thinking(),
            thinking_budget=config.get_dsl_gen_thinking_budget(),
            vl_high_resolution=config.get_dsl_gen_vl_high_resolution(),
        )

        image_content = prepare_image_content(temp_file_path)
        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": "Analyze this widget image and generate the WidgetDSL JSON using icon and graph constraints in the system prompt."},
                image_content
            ]
        )]

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [DSL Generation] VLM API call started (model={config.get_dsl_gen_model()}, thinking={config.get_dsl_gen_thinking()})")

        import time
        dsl_start = time.time()
        response = await asyncio.wait_for(
            vision_llm.async_chat(messages),
            timeout=config.get_dsl_gen_timeout()
        )
        dsl_duration = time.time() - dsl_start

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [DSL Generation] VLM API call completed in {dsl_duration:.2f}s")
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [DSL Generation] Parsing JSON...")

        result_text = clean_json_response(response.content)

        widget_spec = json.loads(result_text)
        try:
            if isinstance(widget_spec, dict) and isinstance(widget_spec.get("widget"), dict):
                widget_spec["widget"]["aspectRatio"] = round(aspect_ratio, 3)
        except Exception:
            pass

        per_icon_details, global_merged = normalize_icon_details(per_icon_details)

        # Incremental save: DSL file
        if incremental_save and artifact_mgr is not None and isinstance(widget_spec, dict):
            try:
                artifact_mgr.save_widget_dsl(widget_spec)
            except Exception:
                pass

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [DSL Generation] Completed in {dsl_duration:.2f}s")

        return {
            "success": True,
            "widgetDSL": widget_spec,
            "aspectRatio": round(aspect_ratio, 3),
            "preprocessedImage": {
                "bytes": image_bytes,
                "width": width,
                "height": height,
                "aspectRatio": aspect_ratio,
            },
            "layoutDebugInfo": {  # NEW: Layout detection results
                "raw": layout_raw,
                "pixel": layout_pixel,
                "postProcessed": layout_post,
                "imageWidth": img_width,
                "imageHeight": img_height,
                "rawText": layout_raw_text,
                "totalDetections": len(layout_post) if layout_post else 0,
                "promptInjection": {
                    "injectedText": layout_injection_text,
                }
            },
            "iconDebugInfo": {
                "detection": {
                    "iconCount": icon_count,
                    "imageSize": {"width": img_width, "height": img_height},
                },
                # REMOVED: grounding (now in layoutDebugInfo)
                "retrieval": {
                    "candidates": icon_candidates,
                    "perIcon": per_icon_details,
                    "globalMerged": global_merged,
                    "parameters": {
                        "topk": retrieval_topk,
                        "topm": retrieval_topm,
                        "alpha": retrieval_alpha,
                    }
                },
                "promptInjection": {
                    "injectedText": icon_injection_text,
                }
            },
            "applogoDebugInfo": {
                "detection": {
                    "applogoCount": applogo_count,
                    "imageSize": {"width": img_width, "height": img_height},
                },
                "retrieval": {
                    "candidates": applogo_candidates,
                    "perApplogo": per_applogo_details,
                    "parameters": {
                        "topk": retrieval_topk,
                        "topm": retrieval_topm,
                        "alpha": retrieval_alpha,
                    }
                },
                "promptInjection": {
                    "injectedText": applogo_injection_text,
                }
            },
            "colorDebugInfo": {
                "detection": {
                    "hasColors": len(color_results) > 0,
                    "colorCount": len(color_results),
                },
                "colors": color_results,
                "promptInjection": {
                    "injectedText": color_injection_text,
                }
            },
            "graphDebugInfo": {
                "detection": {
                    "chartCounts": chart_counts,
                    "hasGraphs": len(graph_specs) > 0,
                    "graphCount": len(graph_specs),
                },
                "specs": graph_specs,
                "promptInjection": {
                    "injectedText": graph_injection_text,
                    "fullGraphPrompt": inject_graph_specs_to_prompt("", graph_specs) if graph_specs else "",
                }
            },
            "promptDebugInfo": {
                "stage1_base": base_prompt,
                "stage2_withLayout": prompt_with_layout,      # NEW
                "stage3_withColors": prompt_with_colors,      # Renamed from stage2
                "stage4_withGraphs": prompt_with_graphs,      # Renamed from stage3
                "stage5_withIcons": prompt_with_icons,        # Renamed from stage4
                "stage5_5_withApplogos": prompt_with_applogos,  # NEW: AppLogo injection
                "stage6_final": prompt_final,                 # Renamed from stage5
                "injections": {
                    "layout": layout_injection_text,          # NEW
                    "color": color_injection_text,
                    "graph": graph_injection_text,
                    "icon": icon_injection_text,
                    "applogo": applogo_injection_text,        # NEW
                    "components": components_list,
                }
            }
        }
    except json.JSONDecodeError as e:
        raise GenerationError(f"Invalid JSON from VLM: {str(e)}")
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass

async def generate_single_widget(
    image_path: Path | str,
    output_dir: Path | str,
    config: Optional[GeneratorConfig] = None,
    icon_lib_names: str = '["sf", "lucide"]',
    stage_tracker = None,
    run_log_path: Optional[Path] = None,
    integrated_render: bool = False,
    incremental_save: bool = True,
) -> Tuple[bool, Optional[Path], Optional[str]]:
    """
    Generate a single widget with complete artifacts and debug information.

    This is a high-level wrapper around generate_widget_full that handles
    all file system operations, artifact creation, and debug information.

    Args:
        image_path: Path to input image file
        output_dir: Directory where widget folder will be created
        config: Generator configuration (defaults to env config)
        icon_lib_names: Icon library names as JSON array string
        stage_tracker: Optional stage tracker for batch processing
        run_log_path: Optional path to global run.log for log extraction

    Returns:
        Tuple of (success: bool, widget_dir: Path, error_msg: str)
        - success: True if generation succeeded
        - widget_dir: Path to the created widget directory
        - error_msg: Error message if failed, None if succeeded

    Example:
        >>> success, widget_dir, error = await generate_single_widget(
        ...     image_path="input.png",
        ...     output_dir="./output",
        ...     config=GeneratorConfig.from_env()
        ... )
        >>> if success:
        ...     print(f"Generated: {widget_dir}/artifacts/4-dsl/widget.json")
    """
    # Convert to Path objects
    image_path = Path(image_path)
    output_dir = Path(output_dir)

    # Use default config if not provided
    if config is None:
        config = GeneratorConfig.from_env()

    # Create widget directory (preserve subdirectory structure if needed)
    widget_id = image_path.stem
    widget_dir = output_dir / widget_id
    widget_dir.mkdir(parents=True, exist_ok=True)

    # Initialize artifact manager
    artifact_mgr = ArtifactManager(widget_dir, widget_id, config)

    # Setup directories
    artifact_mgr.setup_directories()

    # Update stage tracker if provided
    if stage_tracker:
        stage_tracker.start_image(widget_id)
        stage_tracker.set_stage(widget_id, "preprocessing")

    start_time = datetime.now()

    try:
        log_to_file(f"[{start_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] 🚀 START")

        # Read image data
        with open(image_path, 'rb') as f:
            image_data = f.read()

        # Get image size and dimensions
        image_size = image_path.stat().st_size
        try:
            with Image.open(image_path) as img:
                image_dims = {"width": img.width, "height": img.height}
        except:
            image_dims = None

        # Save input image
        artifact_mgr.save_input_image(image_path)

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] 🔄 DSL generation started")

        # Generate widget DSL with full debug info
        result = await generate_widget_full(
            image_data=image_data,
            image_filename=image_path.name,
            system_prompt=None,
            retrieval_topk=config.retrieval_topk,
            retrieval_topm=config.retrieval_topm,
            retrieval_alpha=config.retrieval_alpha,
            config=config,
            icon_lib_names=icon_lib_names,
            stage_tracker=stage_tracker,
            image_id=widget_id,
            artifact_mgr=artifact_mgr,
            incremental_save=incremental_save,
        )

        # Check if generation was successful
        if not result.get('success', True):
            error_msg = result.get('error', 'Unknown error')
            raise GenerationError(error_msg)

        # Extract data from result
        widget_dsl = result.get('widgetDSL', result) if isinstance(result, dict) else result
        layout_debug = result.get('layoutDebugInfo') if isinstance(result, dict) else None
        icon_debug = result.get('iconDebugInfo') if isinstance(result, dict) else None
        graph_debug = result.get('graphDebugInfo') if isinstance(result, dict) else None
        prompt_debug = result.get('promptDebugInfo') if isinstance(result, dict) else None
        preprocessed_info = result.get('preprocessedImage') if isinstance(result, dict) else None

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] DSL generation finished")

        # Update stage: artifacts (only if not saving incrementally)
        if stage_tracker and not incremental_save:
            stage_tracker.set_stage(widget_id, "artifacts")

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] Generating visualizations...")

        # Save all artifacts (only if not already saved incrementally)
        if not incremental_save:
            preprocessed_bytes = preprocessed_info.get('bytes') if preprocessed_info else None
            if preprocessed_bytes:
                artifact_mgr.save_preprocessed_image(preprocessed_bytes)

            # Save layout artifacts
            visualization_image = preprocessed_bytes if preprocessed_bytes else image_data
            artifact_mgr.save_layout_artifacts(layout_debug, visualization_image)

            # Save icon crops
            layout_detections = (layout_debug.get('postProcessed') or []) if layout_debug else []
            artifact_mgr.save_icon_crops(layout_detections, visualization_image)

            # Save retrieval artifacts
            artifact_mgr.save_retrieval_artifacts(icon_debug)

            # Save prompts
            artifact_mgr.save_prompts(prompt_debug)

            # Save widget DSL
            artifact_mgr.save_widget_dsl(widget_dsl)

        end_time = datetime.now()

        log_to_file(f"[{end_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] Visualizations saved")

        # Create and save debug.json
        debug_data = artifact_mgr.create_debug_json(
            start_time=start_time,
            end_time=end_time,
            image_path=image_path,
            image_size=image_size,
            image_dims=image_dims,
            result=result,
            icon_lib_names=icon_lib_names,
            error=None
        )
        artifact_mgr.save_debug_json(debug_data)

        # Extract and save widget-specific log
        if run_log_path:
            artifact_mgr.save_widget_log(run_log_path)

        # Mark as done in stage tracker (only when not using integrated rendering)
        if stage_tracker and not integrated_render:
            stage_tracker.set_stage(widget_id, "done")

        duration = (end_time - start_time).total_seconds()
        log_to_file(f"[{end_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] ✅ COMPLETED ({duration:.1f}s)")

        return (True, widget_dir, None)

    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        error_msg = f"{type(e).__name__}: {str(e)}"

        # Create error debug.json
        debug_data = artifact_mgr.create_debug_json(
            start_time=start_time,
            end_time=end_time,
            image_path=image_path,
            image_size=image_path.stat().st_size if image_path.exists() else 0,
            image_dims=None,
            result={},
            icon_lib_names=icon_lib_names,
            error=e
        )
        artifact_mgr.save_debug_json(debug_data)

        # Mark as failed in stage tracker
        if stage_tracker:
            stage_tracker.set_stage(widget_id, "failed")
        
        log_to_file(f"[{end_time.strftime('%Y-%m-%d %H:%M:%S')}] [{widget_id}] ❌ FAILED - {error_msg}")

        return (False, widget_dir, error_msg)
