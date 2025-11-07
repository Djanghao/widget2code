# -----------------------------------------------------------------------------
# File: single.py
# Description: Single widget DSL generation with icon/graph enhancement
# Author: Houston Zhang
# Date: 2025-10-30
# -----------------------------------------------------------------------------

from provider_hub import LLM, ChatMessage, prepare_image_content
from PIL import Image
import io
import json
import os
from datetime import datetime
import sys

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
from ...perception import (
    preprocess_image_for_widget,
    run_icon_detection_pipeline,
    format_icon_prompt_injection,
    detect_and_process_graphs,
    inject_graph_specs_to_prompt,
    get_available_components_list,
)
from ...perception.icon_extraction import normalize_icon_details


async def get_default_prompt():
    return {"prompt": load_default_prompt()}


async def generate_widget(
    image_data: bytes,
    image_filename: str | None,
    system_prompt: str,
    model: str,
    api_key: str,
    config: GeneratorConfig,
):
    print(f"[{datetime.now()}] generate-widget request")

    import tempfile
    temp_file = None
    try:
        validate_file_size(len(image_data), config.max_file_size_mb)

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_data, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        prompt = system_prompt if system_prompt else load_default_prompt()

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-flash").strip()

        validate_model(model, model_to_use, vision_models)
        validate_api_key(api_key)

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=32768,
            timeout=60,
            system_prompt=prompt,
            api_key=api_key
        )

        image_content = prepare_image_content(temp_file_path)

        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": "Please analyze this widget image and generate the WidgetDSL JSON according to the instructions."},
                image_content
            ]
        )]

        response = vision_llm.chat(messages)

        result_text = clean_json_response(response.content)

        widget_spec = json.loads(result_text)
        try:
            if isinstance(widget_spec, dict) and isinstance(widget_spec.get("widget"), dict):
                widget_spec["widget"]["aspectRatio"] = round(aspect_ratio, 3)
        except Exception:
            pass

        return {
            "success": True,
            "widgetDSL": widget_spec,
            "aspectRatio": round(aspect_ratio, 3),
            "usage": response.usage
        }
    except json.JSONDecodeError as e:
        raise GenerationError(f"Invalid JSON from VLM: {str(e)}")
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass


async def generate_widget_text(
    system_prompt: str,
    user_prompt: str,
    model: str,
    api_key: str,
    config: GeneratorConfig,
):
    print(f"[{datetime.now()}] generate-widget-text request")

    try:
        text_models = {"qwen3-max", "qwen3-coder-480b-a35b-instruct", "qwen3-coder-plus"}
        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        qwen_supported = text_models | vision_models
        model_to_use = (model or "qwen3-vl-flash").strip()

        validate_model(model, model_to_use, qwen_supported)
        validate_api_key(api_key)

        text_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=2000,
            timeout=60,
            system_prompt=system_prompt,
            api_key=api_key
        )

        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": user_prompt}
            ]
        )]

        response = text_llm.chat(messages)
        result_text = clean_json_response(response.content)

        widget_spec = json.loads(result_text)

        return {
            "success": True,
            "widgetDSL": widget_spec
        }
    except json.JSONDecodeError as e:
        raise GenerationError(f"Invalid JSON from LLM: {str(e)}")


async def generate_widget_with_icons(
    image_data: bytes,
    image_filename: str | None,
    system_prompt: str,
    model: str,
    api_key: str,
    retrieval_topk: int,
    retrieval_topm: int,
    retrieval_alpha: float,
    config: GeneratorConfig,
):
    print(f"[{datetime.now()}] generate-widget-full request")

    import tempfile
    temp_file = None
    try:
        validate_file_size(len(image_data), config.max_file_size_mb)

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_data, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        base_prompt = system_prompt if system_prompt else load_default_prompt()

        icon_result = run_icon_detection_pipeline(
            image_bytes=image_bytes,
            filename=image_filename,
            model=(model or "qwen3-vl-flash"),
            api_key=api_key,
            retrieval_topk=retrieval_topk,
            retrieval_topm=retrieval_topm,
            retrieval_alpha=retrieval_alpha,
            timeout=config.timeout,
        )

        grounding_raw = icon_result["grounding_raw"]
        grounding_pixel = icon_result["grounding_pixel"]
        post_processed = icon_result["post_processed"]
        per_icon_details = icon_result["per_icon_details"]
        icon_candidates = icon_result["icon_candidates"]
        icon_count = icon_result["icon_count"]
        img_width = icon_result["img_width"]
        img_height = icon_result["img_height"]

        extra_str = format_icon_prompt_injection(
            icon_count=icon_count,
            per_icon_details=per_icon_details,
            retrieval_topm=retrieval_topm,
        )

        if "[AVAILABLE_ICON_NAMES]" in base_prompt:
            prompt_final = base_prompt.replace("[AVAILABLE_ICON_NAMES]", extra_str)
        else:
            prompt_final = base_prompt + extra_str

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-flash").strip()

        validate_model(model, model_to_use, vision_models)
        validate_api_key(api_key)

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=32768,
            timeout=config.timeout,
            system_prompt=prompt_final,
            api_key=api_key
        )

        image_content = prepare_image_content(temp_file_path)
        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": "Analyze this widget image and generate the WidgetDSL JSON using constraints and icon hints in the system prompt."},
                image_content
            ]
        )]

        response = vision_llm.chat(messages)
        result_text = clean_json_response(response.content)

        widget_spec = json.loads(result_text)
        try:
            if isinstance(widget_spec, dict) and isinstance(widget_spec.get("widget"), dict):
                widget_spec["widget"]["aspectRatio"] = round(aspect_ratio, 3)
        except Exception:
            pass

        per_icon_details, global_merged = normalize_icon_details(per_icon_details)

        return {
            "success": True,
            "widgetDSL": widget_spec,
            "aspectRatio": round(aspect_ratio, 3),
            "iconCandidates": icon_candidates,
            "iconCount": icon_count,
            "iconDebugInfo": {
                "imageSize": {"width": img_width, "height": img_height},
                "grounding": {
                    "raw": grounding_raw,
                    "pixel": grounding_pixel
                },
                "postProcessed": post_processed,
                "retrievals": {
                    "perIcon": per_icon_details,
                    "globalMerged": global_merged
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


async def generate_widget_with_graph(
    image_data: bytes,
    image_filename: str | None,
    system_prompt: str,
    model: str,
    api_key: str,
    config: GeneratorConfig,
):
    print(f"[{datetime.now()}] generate-widget request")

    import tempfile
    temp_file = None
    try:
        validate_file_size(len(image_data), config.max_file_size_mb)

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_data, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-flash").strip()

        validate_model(model, model_to_use, vision_models)
        validate_api_key(api_key)

        print(f"[{datetime.now()}] Step 1: Detecting charts in image...")
        chart_counts, graph_specs = detect_and_process_graphs(
            image_bytes=image_bytes,
            filename=image_filename,
            provider=None,
            api_key=api_key,
            model=model_to_use,
            temperature=0.1,
            max_tokens=500,
            timeout=30,
            max_retries=2
        )

        print(f"[{datetime.now()}] Detected charts: {chart_counts}")
        if graph_specs:
            print(f"[{datetime.now()}] Step 2: Processing graphs... Generated {len(graph_specs)} graph specifications")

        base_prompt = system_prompt if system_prompt else load_widget2dsl_prompt()
        enhanced_prompt = inject_graph_specs_to_prompt(base_prompt, graph_specs)

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=32768,
            timeout=60,
            system_prompt=enhanced_prompt,
            api_key=api_key
        )

        image_content = prepare_image_content(temp_file_path)

        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": "Please analyze this widget image and generate the WidgetDSL JSON according to the instructions."},
                image_content
            ]
        )]

        response = vision_llm.chat(messages)

        result_text = clean_json_response(response.content)

        widget_spec = json.loads(result_text)
        try:
            if isinstance(widget_spec, dict) and isinstance(widget_spec.get("widget"), dict):
                widget_spec["widget"]["aspectRatio"] = round(aspect_ratio, 3)
        except Exception:
            pass

        return {
            "success": True,
            "widgetDSL": widget_spec,
            "aspectRatio": round(aspect_ratio, 3),
            "usage": response.usage
        }
    except json.JSONDecodeError as e:
        raise GenerationError(f"Invalid JSON from VLM: {str(e)}")
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass


async def generate_widget_full(
    image_data: bytes,
    image_filename: str | None,
    system_prompt: str,
    retrieval_topk: int,
    retrieval_topm: int,
    retrieval_alpha: float,
    config: GeneratorConfig,
    icon_lib_names: str,
):
    from pathlib import Path
    from datetime import datetime
    from ...utils.logger import log_to_file
    import tempfile
    import asyncio

    image_id = Path(image_filename).stem if image_filename else "unknown"

    temp_file = None
    try:
        validate_file_size(len(image_data), config.max_file_size_mb)

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_data, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        # ========== Layout Detection (NEW: Stage 0) ==========
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Layout detection started")

        from ...perception.layout import detect_layout

        layout_raw, layout_pixel, layout_post, img_width, img_height = await asyncio.to_thread(
            detect_layout,
            image_bytes=image_bytes,
            filename=image_filename,
            model=config.get_layout_model(),
            api_key=config.get_layout_api_key(),
            timeout=config.timeout,
            thinking=config.get_layout_thinking(),
            image_id=image_id,
        )

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Layout detection completed: {len(layout_post)} elements")

        # ========== Icon & Graph Extraction (Parallel) ==========
        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] 🔄 Parallel extraction started")

        # Parse icon library names from JSON array, e.g., '["sf", "lucide"]'
        lib_names = None
        if icon_lib_names:
            try:
                parsed = json.loads(icon_lib_names)
                if isinstance(parsed, list):
                    lib_names = [str(name).strip() for name in parsed if str(name).strip()]
            except json.JSONDecodeError:
                pass

        icon_result, (chart_counts, graph_specs) = await asyncio.gather(
            asyncio.to_thread(
                run_icon_detection_pipeline,
                image_bytes=image_bytes,
                filename=image_filename,
                model=config.default_model,  # Icon detection uses default model
                api_key=config.default_api_key,  # Icon retrieval is local, but parameter kept for compatibility
                layout_detections=layout_post,
                img_width=img_width,
                img_height=img_height,
                retrieval_topk=retrieval_topk,
                retrieval_topm=retrieval_topm,
                retrieval_alpha=retrieval_alpha,
                lib_names=lib_names,
                timeout=config.timeout,
            ),
            asyncio.to_thread(
                detect_and_process_graphs,
                image_bytes=image_bytes,
                filename=image_filename,
                provider=None,
                api_key=config.get_graph_det_api_key(),
                model=config.get_graph_det_model(),
                temperature=0.1,
                max_tokens=500,
                timeout=config.timeout,
                max_retries=2,
                graph_gen_api_key=config.get_graph_gen_api_key(),
                graph_det_thinking=config.get_graph_det_thinking(),
                graph_gen_thinking=config.get_graph_gen_thinking(),
                graph_det_model=config.get_graph_det_model(),
                graph_gen_model=config.get_graph_gen_model(),
            )
        )

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] Parallel extraction: Icons:{icon_result['icon_count']}, Charts:{sum(chart_counts.values()) if chart_counts else 0}")

        # Extract icon results (NEW: no longer includes grounding data)
        per_icon_details = icon_result["per_icon_details"]
        icon_candidates = icon_result["icon_candidates"]
        icon_count = icon_result["icon_count"]

        # ========== Stage 1: Base Prompt ==========
        base_prompt = system_prompt if system_prompt else load_widget2dsl_prompt()

        # Fill in aspect ratio in base prompt
        if "[ASPECT_RATIO]" in base_prompt:
            base_prompt = base_prompt.replace("[ASPECT_RATIO]", str(round(aspect_ratio, 3)))

        # ========== Stage 2: Layout Injection (NEW) ==========
        from ...perception.layout import format_layout_for_prompt

        layout_injection_text = format_layout_for_prompt(layout_post, img_width, img_height)
        prompt_with_layout = base_prompt

        if "[LAYOUT_INFO]" in prompt_with_layout:
            prompt_with_layout = prompt_with_layout.replace("[LAYOUT_INFO]", layout_injection_text)
        else:
            # Fallback: append at the end (aspect ratio already filled in stage 1)
            prompt_with_layout = prompt_with_layout + f"\n\n{layout_injection_text}"

        # ========== Stage 3: Colors (was Stage 2) ==========
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
        prompt_with_colors = inject_colors_to_prompt(prompt_with_layout, color_results)

        # ========== Stage 4: Graphs (was Stage 3) ==========
        from ...perception.graph.pipeline import format_graph_specs_for_injection
        graph_injection_text = format_graph_specs_for_injection(graph_specs) if graph_specs else ""

        prompt_with_graphs = inject_graph_specs_to_prompt(prompt_with_colors, graph_specs)

        # ========== Stage 5: Icons (was Stage 4) ==========
        icon_injection_text = format_icon_prompt_injection(
            icon_count=icon_count,
            per_icon_details=per_icon_details,
            retrieval_topm=retrieval_topm,
        )

        prompt_with_icons = prompt_with_graphs
        if "[AVAILABLE_ICON_NAMES]" in prompt_with_icons:
            prompt_with_icons = prompt_with_icons.replace("[AVAILABLE_ICON_NAMES]", icon_injection_text)
        else:
            prompt_with_icons = prompt_with_icons + "\n\n" + icon_injection_text

        # ========== Stage 6: Components List (was Stage 5) ==========
        components_list = get_available_components_list(graph_specs)
        prompt_final = prompt_with_icons
        if "[AVAILABLE_COMPONENTS]" in prompt_final:
            prompt_final = prompt_final.replace("[AVAILABLE_COMPONENTS]", components_list)

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] [DSL Generation] Started")

        vision_llm = LLM(
            model=config.get_dsl_gen_model(),
            temperature=0.5,
            max_tokens=32768,
            timeout=config.timeout,
            thinking=config.get_dsl_gen_thinking(),
            system_prompt=prompt_final,
            api_key=config.get_dsl_gen_api_key()
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
        response = await asyncio.to_thread(vision_llm.chat, messages)
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
                "totalDetections": len(layout_post),
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
                "stage6_final": prompt_final,                 # Renamed from stage5
                "injections": {
                    "layout": layout_injection_text,          # NEW
                    "color": color_injection_text,
                    "graph": graph_injection_text,
                    "icon": icon_injection_text,
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
