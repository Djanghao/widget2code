from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
import os
import asyncio
import traceback
from dotenv import load_dotenv
import generator
from generator import GeneratorConfig
from generator.exceptions import ValidationError, FileSizeError, GenerationError, RateLimitError
from generator.utils.validation import check_rate_limit

root_dir = Path(__file__).parent.parent.parent
load_dotenv(root_dir / ".env")

gen_config = GeneratorConfig.from_env()

frontend_port = int(os.getenv("FRONTEND_PORT", "3060"))
allowed_origins = [f"http://localhost:{frontend_port}"]

model_cache_enabled = os.getenv("ENABLE_MODEL_CACHE", "false").lower() == "true"
use_cuda_for_retrieval = os.getenv("USE_CUDA_FOR_RETRIEVAL", "true").lower() == "true"

cached_blip2_pipe = None
cached_siglip_pipe = None
blip2_lock = None
siglip_lock = None

class EncodeTextsRequest(BaseModel):
    texts: List[str]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global cached_blip2_pipe, cached_siglip_pipe, blip2_lock, siglip_lock

    blip2_lock = asyncio.Lock()
    siglip_lock = asyncio.Lock()

    if model_cache_enabled:
        print("=" * 80)
        print("MODEL CACHING ENABLED - Loading retrieval models at startup...")
        print("=" * 80)

        from generator.perception.icon.query_caption import (
            build_blip2, load_siglip_text, BLIP2_MODEL_ID
        )
        import torch

        if use_cuda_for_retrieval and not torch.cuda.is_available():
            print("WARNING: USE_CUDA_FOR_RETRIEVAL=true but CUDA not available, falling back to CPU")

        device_name = "CUDA" if (use_cuda_for_retrieval and torch.cuda.is_available()) else "CPU"

        print(f"\nLoading BLIP2 model ({BLIP2_MODEL_ID}) on {device_name}...")
        if not use_cuda_for_retrieval:
            original_cuda = torch.cuda.is_available
            torch.cuda.is_available = lambda: False
        cached_blip2_pipe = build_blip2(BLIP2_MODEL_ID)
        if not use_cuda_for_retrieval:
            torch.cuda.is_available = original_cuda
        print(f"✓ BLIP2 model loaded on {cached_blip2_pipe[2]}")

        print(f"\nLoading SigLIP model on {device_name}...")
        if not use_cuda_for_retrieval:
            original_cuda = torch.cuda.is_available
            torch.cuda.is_available = lambda: False
        cached_siglip_pipe = load_siglip_text()
        if not use_cuda_for_retrieval:
            torch.cuda.is_available = original_cuda
        print(f"✓ SigLIP model loaded on {cached_siglip_pipe[2]}")

        print("\n" + "=" * 80)
        print("All retrieval models loaded successfully!")
        print("=" * 80 + "\n")
    else:
        print("Model caching disabled (ENABLE_MODEL_CACHE=false)")

    yield

    # Shutdown (cleanup if needed)
    pass

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": str(exc)}
    )

@app.exception_handler(FileSizeError)
async def file_size_error_handler(request: Request, exc: FileSizeError):
    return JSONResponse(
        status_code=413,
        content={"success": False, "error": str(exc)}
    )

@app.exception_handler(RateLimitError)
async def rate_limit_error_handler(request: Request, exc: RateLimitError):
    return JSONResponse(
        status_code=429,
        content={"success": False, "error": str(exc)}
    )

@app.exception_handler(GenerationError)
async def generation_error_handler(request: Request, exc: GenerationError):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc)}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_traceback = traceback.format_exc()
    print(f"\n{'='*80}")
    print(f"ERROR in {request.url.path}")
    print(f"{'='*80}")
    print(error_traceback)
    print(f"{'='*80}\n")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "traceback": error_traceback}
    )

@app.get("/health")
async def health():
    """Health check endpoint for service availability monitoring."""
    health_info = {
        "status": "ok",
        "service": "Widget Factory API",
        "model_cache_enabled": model_cache_enabled,
    }

    if model_cache_enabled:
        health_info["models"] = {
            "blip2_loaded": cached_blip2_pipe is not None,
            "siglip_loaded": cached_siglip_pipe is not None,
        }

        if cached_blip2_pipe:
            health_info["models"]["blip2_device"] = cached_blip2_pipe[2]

        if cached_siglip_pipe:
            health_info["models"]["siglip_device"] = cached_siglip_pipe[2]

    health_info["cuda_available"] = use_cuda_for_retrieval

    return health_info

@app.post("/api/generate-widget")
async def generate_widget(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    return await generator.generate_widget(
        image_data, image.filename, system_prompt, model, api_key, gen_config
    )

@app.post("/api/generate-widget-text")
async def generate_widget_text(
    request: Request,
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    return await generator.generate_widget_text(
        system_prompt, user_prompt, model, api_key, gen_config
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
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    return await generator.generate_component(
        prompt, suggested_width, suggested_height,
        model, system_prompt, api_key, gen_config
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
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    return await generator.generate_component_from_image(
        image_data, image.filename, suggested_width, suggested_height,
        model, system_prompt, api_key, gen_config
    )

@app.post("/api/generate-widget-icons")
async def generate_widget_icons(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
    retrieval_topk: int = Form(gen_config.retrieval_topk),
    retrieval_topm: int = Form(gen_config.retrieval_topm),
    retrieval_alpha: float = Form(gen_config.retrieval_alpha),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    return await generator.generate_widget_with_icons(
        image_data, image.filename, system_prompt, model, api_key,
        retrieval_topk, retrieval_topm, retrieval_alpha, gen_config
    )

@app.post("/api/generate-widget-graph")
async def generate_widget_graph(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    return await generator.generate_widget_with_graph(
        image_data, image.filename, system_prompt, model, api_key, gen_config
    )

@app.post("/api/generate-widget-full")
async def generate_widget_full(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
    retrieval_topk: int = Form(gen_config.retrieval_topk),
    retrieval_topm: int = Form(gen_config.retrieval_topm),
    retrieval_alpha: float = Form(gen_config.retrieval_alpha),
    icon_lib_names: str = Form(None),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    result = await generator.generate_widget_full(
        image_data, image.filename, system_prompt, model, api_key,
        retrieval_topk, retrieval_topm, retrieval_alpha, gen_config, icon_lib_names
    )

    # Remove binary data before JSON serialization to prevent UTF-8 decode error
    if "preprocessedImage" in result and "bytes" in result["preprocessedImage"]:
        del result["preprocessedImage"]["bytes"]

    return result

@app.post("/api/extract-icon-captions")
async def extract_icon_captions(
    request: Request,
    crops: List[UploadFile] = File(...),
):
    if not model_cache_enabled or cached_blip2_pipe is None:
        raise HTTPException(
            status_code=503,
            detail="Model caching not enabled. Set ENABLE_MODEL_CACHE=true"
        )

    from generator.perception.icon.query_caption import caption_from_bytes_list

    crops_bytes = [await crop.read() for crop in crops]

    async with blip2_lock:
        captions = await asyncio.to_thread(
            caption_from_bytes_list, crops_bytes, cached_blip2_pipe
        )

    return {"success": True, "captions": captions}

@app.post("/api/encode-texts")
async def encode_texts(
    request: Request,
    body: EncodeTextsRequest,
):
    if not model_cache_enabled or cached_siglip_pipe is None:
        raise HTTPException(
            status_code=503,
            detail="Model caching not enabled. Set ENABLE_MODEL_CACHE=true"
        )

    from generator.perception.icon.query_caption import encode_texts_siglip
    import numpy as np

    model, tokenizer, device = cached_siglip_pipe

    async with siglip_lock:
        embeddings = await asyncio.to_thread(
            encode_texts_siglip, model, tokenizer, device, body.texts
        )

    return {"success": True, "embeddings": embeddings.tolist()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8010"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
