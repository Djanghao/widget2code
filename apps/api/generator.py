from fastapi import File, UploadFile, Form, Request
from fastapi.responses import JSONResponse
from provider_hub import LLM, ChatMessage, prepare_image_content
from PIL import Image
import io
import json
import os
import time
import yaml
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import sys

# Import graph processing services
from services.graph.detection import detect_charts_in_image, should_use_graph_pipeline
from services.graph.pipeline import process_graphs_in_image, format_graph_specs_for_injection

config_file = os.getenv("CONFIG_FILE", "config.yaml")
config_path = Path(__file__).parent.parent / config_file

with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

rate_limit_storage = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = config['security']['max_requests_per_minute']
MAX_FILE_SIZE_MB = config['security']['max_file_size_mb']

def check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if now - timestamp < 60
    ]

    if len(rate_limit_storage[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
        return False

    rate_limit_storage[client_ip].append(now)
    return True

WIDGET2DSL_PROMPT_PATH = Path(__file__).parent / "prompts" / "widget2dsl" / "widget2dsl-sf-lucide.md"
WIDGET2DSL_GRAPH_PROMPT_PATH = Path(__file__).parent / "prompts" / "widget2dsl" / "widget2dsl-graph-modified.md"
PROMPT2DSL_PROMPT_PATH = Path(__file__).parent / "prompts" / "prompt2dsl" / "prompt2dsl-sf-lucide.md"
DYNAMIC_COMPONENT_PROMPT_PATH = Path(__file__).parent / "prompts" / "dynamic" / "prompt2react" / "dynamic-component-prompt.md"
DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH = Path(__file__).parent / "prompts" / "dynamic" / "image2react" / "dynamic-component-image-prompt.md"

def load_default_prompt():
    return load_widget2dsl_prompt()

def load_widget2dsl_prompt():
    if WIDGET2DSL_PROMPT_PATH.exists():
        return WIDGET2DSL_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_widget2dsl_graph_prompt():
    if WIDGET2DSL_GRAPH_PROMPT_PATH.exists():
        return WIDGET2DSL_GRAPH_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_prompt2dsl_prompt():
    if PROMPT2DSL_PROMPT_PATH.exists():
        return PROMPT2DSL_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_dynamic_component_prompt():
    if DYNAMIC_COMPONENT_PROMPT_PATH.exists():
        return DYNAMIC_COMPONENT_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_dynamic_component_image_prompt():
    if DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH.exists():
        return DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH.read_text(encoding="utf-8")
    return ""


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

        if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
                }
            )

        try:
            sys.path.insert(0, str(Path(__file__).parent / "services" / "icon"))
            from image_utils import preprocess_image_bytes_if_small
            image_bytes, (width, height), _ = preprocess_image_bytes_if_small(image_bytes, min_target_edge=1000)
        except Exception:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
        aspect_ratio = width / height

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        # Two-step graph processing pipeline starts here
        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()
        if model and model_to_use not in vision_models:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Model '{model_to_use}' is not a supported vision model for image spec. Use one of: {sorted(vision_models)}"
                }
            )

        if not api_key:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "API key is required. Please provide your DashScope API key."
                }
            )

        # Step 1: Detect chart types in the image
        print(f"[{datetime.now()}] Step 1: Detecting charts in image...")
        chart_counts = detect_charts_in_image(
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

        # Step 2: Process graphs if detected and get their specifications
        graph_specs = []
        if should_use_graph_pipeline(chart_counts):
            print(f"[{datetime.now()}] Step 2: Processing graphs...")
            graph_specs = process_graphs_in_image(
                image_bytes=image_bytes,
                filename=image.filename,
                chart_counts=chart_counts,
                provider=None,
                api_key=api_key,
                model=model_to_use,
                temperature=0.3,
                max_tokens=3000,
                timeout=60,
                max_retries=2
            )
            print(f"[{datetime.now()}] Generated {len(graph_specs)} graph specifications")

        # Step 3: Prepare the main prompt with graph specs if available
        if system_prompt:
            base_prompt = system_prompt
        else:
            base_prompt = load_widget2dsl_graph_prompt()

        # Inject graph specifications into the prompt if available
        if graph_specs:
            graph_specs_text = format_graph_specs_for_injection(graph_specs)
            enhanced_prompt = f"""{base_prompt}

PRE-GENERATED GRAPH SPECIFICATIONS:
Use the following graph specifications for accurate chart rendering. These specs replace manual visual analysis of charts.

{graph_specs_text}

When generating the WidgetDSL, incorporate these exact graph specifications to ensure pixel-perfect chart replication."""
        else:
            enhanced_prompt = base_prompt

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

        result_text = response.content.strip()

        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()

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
        if model and model_to_use not in qwen_supported:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Model '{model_to_use}' is not supported. Use one of: {sorted(qwen_supported)}"
                }
            )

        if not api_key:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "API key is required. Please provide your DashScope API key."
                }
            )

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
        result_text = response.content.strip()

        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()

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
        if model and model_to_use not in qwen_supported:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Model '{model_to_use}' is not supported. Use one of: {sorted(qwen_supported)}"
                }
            )

        if system_prompt:
            system_prompt_final = system_prompt
        else:
            system_prompt_final = load_dynamic_component_prompt()

        system_prompt_final = system_prompt_final.replace("{suggested_width}", str(suggested_width))
        system_prompt_final = system_prompt_final.replace("{suggested_height}", str(suggested_height))

        if not api_key:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "API key is required. Please provide your DashScope API key."
                }
            )

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

        if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
                }
            )

        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()
        if model and model_to_use not in vision_models:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Model '{model_to_use}' is not a supported vision model. Use one of: {sorted(vision_models)}"
                }
            )

        if system_prompt:
            system_prompt_final = system_prompt
        else:
            system_prompt_final = load_dynamic_component_image_prompt()

        system_prompt_final = system_prompt_final.replace("{suggested_width}", str(suggested_width))
        system_prompt_final = system_prompt_final.replace("{suggested_height}", str(suggested_height))

        if not api_key:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "API key is required. Please provide your DashScope API key."
                }
            )

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
    temp_file = None
    icon_candidates: list[str] = []
    icon_count: int = 0
    try:
        image_bytes = await image.read()

        if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
                }
            )

        try:
            sys.path.insert(0, str(Path(__file__).parent / "services" / "icon"))
            from image_utils import preprocess_image_bytes_if_small
            image_bytes, (width, height), _ = preprocess_image_bytes_if_small(image_bytes, min_target_edge=1000)
        except Exception:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
        aspect_ratio = width / height

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        base_prompt = system_prompt if system_prompt else load_default_prompt()

        grounding_raw = []
        grounding_pixel = []
        post_processed = []
        per_icon_details = []
        img_width = width
        img_height = height

        try:
            iconprep_dir = Path(__file__).parent / "services" / "icon"
            if str(iconprep_dir) not in sys.path:
                sys.path.insert(0, str(iconprep_dir))

            from grounding import ground_single_image_with_stages
            from query_embedding import query_from_detections_with_details

            raw_dets, pixel_dets_pre, pixel_dets_post, img_width, img_height = ground_single_image_with_stages(
                image_bytes=image_bytes,
                filename=getattr(image, 'filename', None),
                model=(model or "qwen3-vl-plus"),
                api_key=api_key,
                timeout=300,
            )

            grounding_raw = raw_dets
            grounding_pixel = pixel_dets_pre
            post_processed = pixel_dets_post

            icon_dets = [d for d in pixel_dets_post if str(d.get("label", "")).lower() == "icon"]
            icon_count = len(icon_dets)

            default_lib = Path(__file__).parent.parent.parent / "data" / "icons"
            cfg_lib = None
            try:
                cfg_lib = (config.get("icons", {}) or {}).get("lib_root")
            except Exception:
                cfg_lib = None
            env_lib = os.getenv("ICON_LIB_ROOT")
            lib_root_path = Path(env_lib or cfg_lib or default_lib)

            if lib_root_path.exists():
                svg_names, per_icon_details = query_from_detections_with_details(
                    detections=pixel_dets_post,
                    image_bytes=image_bytes,
                    lib_root=lib_root_path,
                    filter_icon_only=True,
                    topk=int(retrieval_topk),
                    topm=int(retrieval_topm),
                    alpha=float(retrieval_alpha),
                )
                ordered_unique = []
                seen = set()
                for n in svg_names:
                    s = str(n).strip()
                    if not s:
                        continue
                    if s not in seen:
                        seen.add(s)
                        ordered_unique.append(s)
                icon_candidates = ordered_unique
        except Exception as e:
            print(f"[icon-pipeline] skipped due to: {e}")

        extra_parts = []
        extra_parts.append(f"- Detected icons (via grounding): {icon_count}\n")
        if per_icon_details:
            extra_parts.append("- Per-Icon Candidate Constraints (STRICT):\n")
            extra_parts.append(
                "   1. For each detected icon, use ONLY candidates from its own list.\n"
                "   2. Each item is keyed by bbox [x1,y1,x2,y2] in pixels.\n"
                "   3. Do NOT propose any icon that is not in the list.\n"
                "   4. Prefer the closest match by SHAPE (outline/strokes), then by semantics.\n"
                "   5. If the image is low-quality or partially occluded, still choose the best candidate based on visible strokes.\n"
            )
            extra_parts.append("   6. ICON_CANDIDATES_BY_BBOX = [\n")
            for det in per_icon_details:
                bbox = det.get("bbox") or []
                names = []
                for c in det.get("topCandidates", [])[: max(1, int(retrieval_topm)) ]:
                    raw_name = str(c.get("name") or "").strip()
                    if not raw_name:
                        continue
                    if raw_name.startswith("sf:") or raw_name.startswith("lucide:"):
                        fixed = raw_name
                    elif (raw_name.lower() == raw_name) and ("." in raw_name):
                        fixed = f"sf:{raw_name}"
                    else:
                        fixed = f"lucide:{raw_name}"
                    names.append(fixed)
                if not names or not bbox or len(bbox) != 4:
                    continue
                extra_parts.append(
                    "  { \"bbox\": [" + ", ".join(str(int(round(v))) for v in bbox) + "], \"candidates\": [" + ", ".join(f'\"{n}\"' for n in names) + "] },\n"
                )
            extra_parts.append(
                "]\n"
                "   ** Matching rule: When assigning an icon name for a visual region, choose the list whose bbox most overlaps that region; pick the best match ONLY from that list.\n"
                "   ** Per-icon fallback: If ALL candidates tied to a bbox are poor matches to the crop, you may propose a better SVG outside the list for that bbox only."
            )
        else:
            extra_parts.append(
                "### SELECTION RULES (NO LIST AVAILABLE)\n"
                "No candidate list is available. Infer the most likely icon name conservatively.\n"
            )

        extra_str = "".join(extra_parts)
        if "[AVAILABLE_ICON_NAMES]" in base_prompt:
            prompt_final = base_prompt.replace("[AVAILABLE_ICON_NAMES]", extra_str)
        else:
            prompt_final = base_prompt + extra_str

        try:
            print("[icon-pipeline] " + prompt_final)
        except Exception:
            pass

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()
        if model and model_to_use not in vision_models:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Model '{model_to_use}' is not a supported vision model for image spec. Use one of: {sorted(vision_models)}"
                }
            )

        if not api_key:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "API key is required. Please provide your DashScope API key."
                }
            )

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
        result_text = response.content.strip()

        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()

        widget_spec = json.loads(result_text)
        try:
            if isinstance(widget_spec, dict) and isinstance(widget_spec.get("widget"), dict):
                widget_spec["widget"]["aspectRatio"] = round(aspect_ratio, 3)
        except Exception:
            pass

        for icon_detail in per_icon_details:
            for candidate in icon_detail.get("topCandidates", []):
                if "score_img" in candidate:
                    candidate["score_img"] = round(candidate["score_img"], 4)
                if "score_txt" in candidate:
                    candidate["score_txt"] = round(candidate["score_txt"], 4)
                if "score_final" in candidate:
                    candidate["score_final"] = round(candidate["score_final"], 4)

                raw_name = str(candidate.get("name", ""))
                if raw_name:
                    if raw_name.startswith("sf:") or raw_name.startswith("lucide:"):
                        candidate["name"] = raw_name
                    elif (raw_name.lower() == raw_name) and ("." in raw_name):
                        candidate["name"] = f"sf:{raw_name}"
                    else:
                        candidate["name"] = f"lucide:{raw_name}"

            # Also normalize image-only list if present
            for candidate in icon_detail.get("imageOnlyTop10", []):
                if "score_img" in candidate:
                    candidate["score_img"] = round(candidate["score_img"], 4)

        global_candidates = {}
        for icon_detail in per_icon_details:
            for candidate in icon_detail.get("topCandidates", []):
                prefixed_name = candidate.get("name", "")
                if not prefixed_name:
                    continue

                if prefixed_name not in global_candidates:
                    global_candidates[prefixed_name] = {
                        "name": prefixed_name,
                        "appearances": 0,
                        "totalScore": 0.0,
                        "scores": []
                    }
                global_candidates[prefixed_name]["appearances"] += 1
                global_candidates[prefixed_name]["totalScore"] += candidate.get("score_final", 0.0)
                global_candidates[prefixed_name]["scores"].append(candidate.get("score_final", 0.0))

        global_merged = []
        for name, data in global_candidates.items():
            avg_score = data["totalScore"] / max(1, data["appearances"])
            global_merged.append({
                "name": name,
                "appearances": data["appearances"],
                "avgScore": round(avg_score, 4),
                "maxScore": round(max(data["scores"]), 4) if data["scores"] else 0.0,
            })
        global_merged.sort(key=lambda x: (-x["avgScore"], -x["appearances"]))

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
