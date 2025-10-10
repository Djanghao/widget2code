from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from provider_hub import LLM, ChatMessage, prepare_image_content
from PIL import Image
import io
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_PROMPT_PATH = Path(__file__).parent / "default-prompt.md"

def load_default_prompt():
    if DEFAULT_PROMPT_PATH.exists():
        return DEFAULT_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

@app.get("/api/default-prompt")
async def get_default_prompt():
    return {"prompt": load_default_prompt()}

@app.post("/api/generate-widget")
async def generate_widget(
    image: UploadFile = File(...),
    system_prompt: str = Form(None)
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

        vision_llm = LLM(
            model="qwen3-vl-plus",
            temperature=0.5,
            max_tokens=2000,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
