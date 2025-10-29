from fastapi import File, UploadFile, Form, Request
from fastapi.responses import JSONResponse
from provider_hub import LLM, ChatMessage, prepare_image_content
from PIL import Image
import io
import json
import os
import yaml
from pathlib import Path
from datetime import datetime
import sys

from utils import (
    check_rate_limit,
    validate_model,
    validate_api_key,
    validate_file_size,
    load_default_prompt,
    load_widget2dsl_prompt,
    load_prompt2dsl_prompt,
    load_dynamic_component_prompt,
    load_dynamic_component_image_prompt,
    clean_json_response,
    clean_code_response,
)
from perception import (
    preprocess_image_for_widget,
    run_icon_detection_pipeline,
    format_icon_prompt_injection,
    detect_and_process_graphs,
    inject_graph_specs_to_prompt,
    get_available_components_list,
)
from perception.icon_extraction import normalize_icon_details

config_file = os.getenv("CONFIG_FILE", "config.yaml")
config_path = Path(__file__).parent.parent / config_file

with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

MAX_FILE_SIZE_MB = config['security']['max_file_size_mb']


async def get_default_prompt():
    return {"prompt": load_default_prompt()}

async def generate_widget(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-widget request from {client_ip}")

    import tempfile
    temp_file = None
    try:
        image_bytes = await image.read()

        file_size_error = validate_file_size(len(image_bytes))
        if file_size_error:
            return file_size_error

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_bytes, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        prompt = system_prompt if system_prompt else load_default_prompt()

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()

        model_error = validate_model(model, model_to_use, vision_models)
        if model_error:
            return model_error

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

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
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid JSON from VLM: {str(e)}",
                "raw_response": result_text if 'result_text' in locals() else ""
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass



async def generate_widget_text(
    request: Request,
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-widget-text request from {client_ip}")

    try:
        text_models = {"qwen3-max", "qwen3-coder-480b-a35b-instruct", "qwen3-coder-plus"}
        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        qwen_supported = text_models | vision_models
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()

        model_error = validate_model(model, model_to_use, qwen_supported)
        if model_error:
            return model_error

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

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
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid JSON from LLM: {str(e)}",
                "raw_response": result_text if 'result_text' in locals() else ""
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )


async def generate_component(
    request: Request,
    prompt: str = Form(...),
    suggested_width: int = Form(...),
    suggested_height: int = Form(...),
    model: str = Form(None),
    system_prompt: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-component request from {client_ip}")

    try:
        text_models = {"qwen3-max", "qwen3-coder-480b-a35b-instruct", "qwen3-coder-plus"}
        qwen_supported = text_models
        model_to_use = (model or "qwen3-max").strip()

        model_error = validate_model(model, model_to_use, qwen_supported)
        if model_error:
            return model_error

        if system_prompt:
            system_prompt_final = system_prompt
        else:
            system_prompt_final = load_dynamic_component_prompt()

        system_prompt_final = system_prompt_final.replace("{suggested_width}", str(suggested_width))
        system_prompt_final = system_prompt_final.replace("{suggested_height}", str(suggested_height))

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

        component_llm = LLM(
            model=model_to_use,
            temperature=0.7,
            max_tokens=2000,
            timeout=60,
            system_prompt=system_prompt_final,
            api_key=api_key
        )

        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": prompt}
            ]
        )]

        response = component_llm.chat(messages)
        code = clean_code_response(response.content)

        return {
            "success": True,
            "code": code,
            "raw_response": response.content
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "raw_response": response.content if 'response' in locals() else ""
            }
        )


async def generate_component_from_image(
    request: Request,
    image: UploadFile = File(...),
    suggested_width: int = Form(...),
    suggested_height: int = Form(...),
    model: str = Form(None),
    system_prompt: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-component-from-image request from {client_ip}")

    import tempfile
    temp_file = None
    try:
        image_bytes = await image.read()

        file_size_error = validate_file_size(len(image_bytes))
        if file_size_error:
            return file_size_error

        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()

        model_error = validate_model(model, model_to_use, vision_models)
        if model_error:
            return model_error

        if system_prompt:
            system_prompt_final = system_prompt
        else:
            system_prompt_final = load_dynamic_component_image_prompt()

        system_prompt_final = system_prompt_final.replace("{suggested_width}", str(suggested_width))
        system_prompt_final = system_prompt_final.replace("{suggested_height}", str(suggested_height))

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=2000,
            timeout=60,
            system_prompt=system_prompt_final,
            api_key=api_key
        )

        image_content = prepare_image_content(temp_file_path)

        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": "Please analyze this UI image and generate the React component code according to the instructions."},
                image_content
            ]
        )]

        response = vision_llm.chat(messages)
        code = response.content.strip()

        if code.startswith("```jsx") or code.startswith("```javascript"):
            code = code.split('\n', 1)[1] if '\n' in code else code
        if code.startswith("```"):
            code = code.split('\n', 1)[1] if '\n' in code else code
        if code.endswith("```"):
            code = code.rsplit('\n', 1)[0] if '\n' in code else code
        code = code.strip()

        return {
            "success": True,
            "code": code,
            "raw_response": response.content,
            "image_size": {"width": width, "height": height}
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "raw_response": response.content if 'response' in locals() else ""
            }
        )
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass


async def generate_widget_with_icons(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
    retrieval_topk: int = Form(50),
    retrieval_topm: int = Form(10),
    retrieval_alpha: float = Form(0.8),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-widget-full request from {client_ip}")

    import tempfile
    temp_file = None
    try:
        image_bytes = await image.read()

        file_size_error = validate_file_size(len(image_bytes))
        if file_size_error:
            return file_size_error

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_bytes, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        base_prompt = system_prompt if system_prompt else load_default_prompt()

        icon_result = run_icon_detection_pipeline(
            image_bytes=image_bytes,
            filename=getattr(image, 'filename', None),
            model=(model or "qwen3-vl-plus"),
            api_key=api_key,
            retrieval_topk=retrieval_topk,
            retrieval_topm=retrieval_topm,
            retrieval_alpha=retrieval_alpha,
            timeout=300,
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
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()

        model_error = validate_model(model, model_to_use, vision_models)
        if model_error:
            return model_error

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=32768,
            timeout=300,
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
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid JSON from VLM: {str(e)}",
                "raw_response": result_text if 'result_text' in locals() else ""
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass


async def generate_widget_with_graph(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-widget request from {client_ip}")

    import tempfile
    temp_file = None
    try:
        image_bytes = await image.read()

        file_size_error = validate_file_size(len(image_bytes))
        if file_size_error:
            return file_size_error

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_bytes, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()

        model_error = validate_model(model, model_to_use, vision_models)
        if model_error:
            return model_error

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

        print(f"[{datetime.now()}] Step 1: Detecting charts in image...")
        chart_counts, graph_specs = detect_and_process_graphs(
            image_bytes=image_bytes,
            filename=image.filename,
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

        # Step 4: Generate the final WidgetDSL with enhanced prompt
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
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid JSON from VLM: {str(e)}",
                "raw_response": result_text if 'result_text' in locals() else ""
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass

async def generate_widget_full(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
    retrieval_topk: int = Form(50),
    retrieval_topm: int = Form(10),
    retrieval_alpha: float = Form(0.8),
):
    client_ip = request.client.host

    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Rate limit exceeded. Please try again later."
            }
        )

    print(f"[{datetime.now()}] generate-widget-full request from {client_ip}")

    import tempfile
    import asyncio
    temp_file = None
    try:
        image_bytes = await image.read()

        file_size_error = validate_file_size(len(image_bytes))
        if file_size_error:
            return file_size_error

        image_bytes, width, height, aspect_ratio = preprocess_image_for_widget(image_bytes, min_target_edge=1000)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()

        model_error = validate_model(model, model_to_use, vision_models)
        if model_error:
            return model_error

        api_key_error = validate_api_key(api_key)
        if api_key_error:
            return api_key_error

        print(f"[{datetime.now()}] Starting parallel extraction: icons and graphs...")

        async def run_icon_extraction():
            return run_icon_detection_pipeline(
                image_bytes=image_bytes,
                filename=getattr(image, 'filename', None),
                model=(model or "qwen3-vl-plus"),
                api_key=api_key,
                retrieval_topk=retrieval_topk,
                retrieval_topm=retrieval_topm,
                retrieval_alpha=retrieval_alpha,
                timeout=300,
            )

        async def run_graph_extraction():
            return detect_and_process_graphs(
                image_bytes=image_bytes,
                filename=getattr(image, 'filename', None),
                provider=None,
                api_key=api_key,
                model=model_to_use,
                temperature=0.1,
                max_tokens=500,
                timeout=30,
                max_retries=2
            )

        icon_result, (chart_counts, graph_specs) = await asyncio.gather(
            run_icon_extraction(),
            run_graph_extraction()
        )

        print(f"[{datetime.now()}] Parallel extraction completed")
        print(f"  - Icons detected: {icon_result['icon_count']}")
        print(f"  - Charts detected: {chart_counts}")

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
        from services.graph.pipeline import format_graph_specs_for_injection
        graph_injection_text = format_graph_specs_for_injection(graph_specs) if graph_specs else ""

        has_placeholder = "[GRAPH_SPECS]" in base_prompt
        print(f"[{datetime.now()}] Graph specs placeholder found: {has_placeholder}")

        prompt_with_graphs = inject_graph_specs_to_prompt(base_prompt, graph_specs)

        placeholder_replaced = "[GRAPH_SPECS]" not in prompt_with_graphs
        if graph_specs:
            print(f"[{datetime.now()}] Injected {len(graph_specs)} graph specifications, placeholder replaced: {placeholder_replaced}")
        else:
            print(f"[{datetime.now()}] No graphs detected, placeholder replaced with notice: {placeholder_replaced}")

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
            print(f"[{datetime.now()}] Injected available components list: {components_list}")

        print(f"[{datetime.now()}] Generating WidgetDSL with icons and graph constraints...")

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=32768,
            timeout=300,
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
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Invalid JSON from VLM: {str(e)}",
                "raw_response": result_text if 'result_text' in locals() else ""
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
