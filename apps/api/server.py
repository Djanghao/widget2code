from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from provider_hub import LLM, ChatMessage, prepare_image_content
from provider_hub.providers.qwen import QwenProvider
from PIL import Image
import io
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_PROMPT_PATH = Path(__file__).parent / "default-prompt.md"
DYNAMIC_COMPONENT_PROMPT_PATH = Path(__file__).parent / "dynamic-component-prompt.md"
DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH = Path(__file__).parent / "dynamic-component-image-prompt.md"

def load_default_prompt():
    if DEFAULT_PROMPT_PATH.exists():
        return DEFAULT_PROMPT_PATH.read_text(encoding="utf-8")
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
    return {"prompt": load_default_prompt()}

@app.post("/api/generate-widget")
async def generate_widget(
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
):
    import tempfile
    temp_file = None
    try:
        image_bytes = await image.read()

        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        aspect_ratio = width / height

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name

        prompt = system_prompt if system_prompt else load_default_prompt()

        # Determine model (vision-only for widget2spec)
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

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=32768,
            timeout=60,
            system_prompt=prompt
        )

        image_content = prepare_image_content(temp_file_path)

        messages = [ChatMessage(
            role="user",
            content=[
                {"type": "text", "text": "Please analyze this widget image and generate the WidgetSpec JSON according to the instructions."},
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
            "widgetSpec": widget_spec,
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
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    model: str = Form(None),
):
    try:
        # Allow both text and multimodal Qwen models
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

        text_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=2000,
            timeout=60,
            system_prompt=system_prompt
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
            "widgetSpec": widget_spec
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
    prompt: str = Form(...),
    suggested_width: int = Form(...),
    suggested_height: int = Form(...),
    model: str = Form(None),
    system_prompt: str = Form(None),
):
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

        component_llm = LLM(
            model=model_to_use,
            temperature=0.7,
            max_tokens=2000,
            timeout=60,
            system_prompt=system_prompt_final
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
    image: UploadFile = File(...),
    suggested_width: int = Form(...),
    suggested_height: int = Form(...),
    model: str = Form(None),
    system_prompt: str = Form(None),
):
    import tempfile
    temp_file = None
    try:
        image_bytes = await image.read()

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

        vision_llm = LLM(
            model=model_to_use,
            temperature=0.5,
            max_tokens=2000,
            timeout=60,
            system_prompt=system_prompt_final
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
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
