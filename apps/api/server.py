from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from provider_hub import LLM, ChatMessage, prepare_image_content
from provider_hub.providers.qwen import QwenProvider
from PIL import Image
import io
import json
import os
import time
import yaml
from pathlib import Path
from collections import defaultdict
from datetime import datetime

config_file = os.getenv("CONFIG_FILE", "config.yaml")
config_path = Path(__file__).parent.parent / config_file

with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

app = FastAPI()

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

allowed_origins = config['cors']['origins']

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WIDGET2DSL_PROMPT_PATH = Path(__file__).parent / "prompts" / "widget2dsl" / "widget2dsl-sf-lucide.md"
PROMPT2DSL_PROMPT_PATH = Path(__file__).parent / "prompts" / "prompt2dsl" / "prompt2dsl-sf-lucide.md"
DYNAMIC_COMPONENT_PROMPT_PATH = Path(__file__).parent / "prompts" / "dynamic" / "prompt2react" / "dynamic-component-prompt.md"
DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH = Path(__file__).parent / "prompts" / "dynamic" / "image2react" / "dynamic-component-image-prompt.md"

def load_widget2dsl_prompt():
    if WIDGET2DSL_PROMPT_PATH.exists():
        return WIDGET2DSL_PROMPT_PATH.read_text(encoding="utf-8")
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

@app.get("/api/default-prompt")
async def get_default_prompt():
    return {"prompt": load_widget2dsl_prompt()}

@app.post("/api/generate-widget")
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

        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        aspect_ratio = width / height

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        prompt = system_prompt if system_prompt else load_widget2dsl_prompt()

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-235b-a22b-instruct").strip()
        if model and model_to_use not in vision_models:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Model '{model_to_use}' is not a supported vision model for image → spec. Use one of: {sorted(vision_models)}"
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
            "aspectRatio": round(aspect_ratio, 3)
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

@app.post("/api/generate-widget-text")
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

@app.post("/api/generate-component")
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

@app.post("/api/generate-component-from-image")
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

if __name__ == "__main__":
    import uvicorn
    port = config['server']['backend_port']
    host = config['server']['host']
    uvicorn.run(app, host=host, port=port)
