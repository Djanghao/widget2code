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
    check_rate_limit,
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
    model: str,
    api_key: str,
    retrieval_topk: int,
    retrieval_topm: int,
    retrieval_alpha: float,
    config: GeneratorConfig,
    icon_lib_names: str,
):
    from pathlib import Path
    image_id = Path(image_filename).stem if image_filename else "unknown"

    import tempfile
    import asyncio
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
                model=(model or "qwen3-vl-flash"),
                api_key=api_key,
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
                api_key=api_key,
                model=model_to_use,
                temperature=0.1,
                max_tokens=500,
                timeout=config.timeout,
                max_retries=2,
            )
        )

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] ✅ Parallel extraction: Icons:{icon_result['icon_count']}, Charts:{sum(chart_counts.values()) if chart_counts else 0}")

        grounding_raw = icon_result["grounding_raw"]
        grounding_pixel = icon_result["grounding_pixel"]
        post_processed = icon_result["post_processed"]
        per_icon_details = icon_result["per_icon_details"]
        icon_candidates = icon_result["icon_candidates"]
        icon_count = icon_result["icon_count"]
        img_width = icon_result["img_width"]
        img_height = icon_result["img_height"]

        # Step 1: Base prompt
        base_prompt = system_prompt if system_prompt else load_widget2dsl_prompt()

        # Step 2: Add graph specs
        from ...perception.graph.pipeline import format_graph_specs_for_injection
        graph_injection_text = format_graph_specs_for_injection(graph_specs) if graph_specs else ""

        prompt_with_graphs = inject_graph_specs_to_prompt(base_prompt, graph_specs)

        # Step 3: Add icon specs
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

        # Step 4: Add available components list
        components_list = get_available_components_list(graph_specs)
        prompt_final = prompt_with_icons
        if "[AVAILABLE_COMPONENTS]" in prompt_final:
            prompt_final = prompt_final.replace("[AVAILABLE_COMPONENTS]", components_list)

        log_to_file(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [{image_id}] 🔄 VLM generation started")

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
                {"type": "text", "text": "Analyze this widget image and generate the WidgetDSL JSON using icon and graph constraints in the system prompt."},
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
            "preprocessedImage": {
                "bytes": image_bytes,
                "width": width,
                "height": height,
                "aspectRatio": aspect_ratio,
            },
            "iconDebugInfo": {
                "detection": {
                    "iconCount": icon_count,
                    "imageSize": {"width": img_width, "height": img_height},
                },
                "grounding": {
                    "raw": grounding_raw,
                    "pixel": grounding_pixel,
                    "postProcessed": post_processed,
                },
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
                "stage2_withGraphs": prompt_with_graphs,
                "stage3_withIcons": prompt_with_icons,
                "stage4_final": prompt_final,
                "injections": {
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
