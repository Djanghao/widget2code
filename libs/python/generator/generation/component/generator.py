# -----------------------------------------------------------------------------
# File: generator.py
# Description: Dynamic component generation from prompts and images
# Author: Houston Zhang
# Date: 2025-10-30
# -----------------------------------------------------------------------------

from ...providers import OpenAIProvider, ChatMessage, prepare_image_content
from PIL import Image
import io
import os
from datetime import datetime

from ...config import GeneratorConfig
from ...exceptions import ValidationError, FileSizeError, GenerationError
from ...utils import (
    validate_model,
    validate_api_key,
    validate_file_size,
    load_dynamic_component_prompt,
    load_dynamic_component_image_prompt,
    clean_code_response,
)


async def generate_component(
    prompt: str,
    suggested_width: int,
    suggested_height: int,
    model: str,
    system_prompt: str,
    api_key: str,
    config: GeneratorConfig,
):
    print(f"[{datetime.now()}] generate-component request")

    text_models = {"qwen3-max", "qwen3-coder-480b-a35b-instruct", "qwen3-coder-plus"}
    qwen_supported = text_models
    model_to_use = (model or "qwen3-max").strip()

    validate_model(model, model_to_use, qwen_supported)

    if system_prompt:
        system_prompt_final = system_prompt
    else:
        system_prompt_final = load_dynamic_component_prompt()

    system_prompt_final = system_prompt_final.replace("{suggested_width}", str(suggested_width))
    system_prompt_final = system_prompt_final.replace("{suggested_height}", str(suggested_height))

    validate_api_key(api_key)

    component_llm = OpenAIProvider(
        model=model_to_use,
        api_key=api_key,
        base_url=config.default_base_url,
        temperature=0.7,
        max_tokens=2000,
        timeout=config.default_timeout,
        system_prompt=system_prompt_final,
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


async def generate_component_from_image(
    image_data: bytes,
    image_filename: str | None,
    suggested_width: int,
    suggested_height: int,
    model: str,
    system_prompt: str,
    api_key: str,
    config: GeneratorConfig,
):
    print(f"[{datetime.now()}] generate-component-from-image request")

    import tempfile
    temp_file = None
    try:
        validate_file_size(len(image_data), config.max_file_size_mb)

        img = Image.open(io.BytesIO(image_data))
        width, height = img.size

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            temp_file.write(image_data)
            temp_file_path = temp_file.name

        vision_models = {"qwen3-vl-235b-a22b-instruct", "qwen3-vl-235b-a22b-thinking", "qwen3-vl-plus", "qwen3-vl-flash"}
        model_to_use = (model or "qwen3-vl-flash").strip()

        validate_model(model, model_to_use, vision_models)

        if system_prompt:
            system_prompt_final = system_prompt
        else:
            system_prompt_final = load_dynamic_component_image_prompt()

        system_prompt_final = system_prompt_final.replace("{suggested_width}", str(suggested_width))
        system_prompt_final = system_prompt_final.replace("{suggested_height}", str(suggested_height))

        validate_api_key(api_key)

        vision_llm = OpenAIProvider(
            model=model_to_use,
            api_key=api_key,
            base_url=config.default_base_url,
            temperature=0.5,
            max_tokens=2000,
            timeout=config.default_timeout,
            system_prompt=system_prompt_final,
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
    finally:
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
