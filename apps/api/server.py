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
import time
import threading
from datetime import datetime
from dotenv import load_dotenv

# Load .env BEFORE importing generator to ensure rate limiter gets correct config
root_dir = Path(__file__).parent.parent.parent
load_dotenv(root_dir / ".env")

import generator
from generator import GeneratorConfig
from generator.exceptions import ValidationError, FileSizeError, GenerationError, RateLimitError
from generator.utils.validation import check_rate_limit
from generator.generation.widget import generate_widget_full

gen_config = GeneratorConfig.from_env()

frontend_port = int(os.getenv("FRONTEND_PORT", "3060"))
allowed_origins = [f"http://localhost:{frontend_port}"]

model_cache_enabled = os.getenv("ENABLE_MODEL_CACHE", "false").lower() == "true"
use_cuda_for_retrieval = os.getenv("USE_CUDA_FOR_RETRIEVAL", "true").lower() == "true"

cached_blip2_pipe = None
cached_siglip_pipe = None
cached_siglip_image_pipe = None
blip2_lock = None
siglip_lock = None
siglip_image_lock = None

class EncodeTextsRequest(BaseModel):
    texts: List[str]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global cached_blip2_pipe, cached_siglip_pipe, cached_siglip_image_pipe, blip2_lock, siglip_lock, siglip_image_lock

    blip2_lock = asyncio.Lock()
    siglip_lock = asyncio.Lock()
    siglip_image_lock = asyncio.Lock()

    if model_cache_enabled:
        print("=" * 80)
        print("MODEL CACHING ENABLED - Loading retrieval models at startup...")
        print("=" * 80)

        from generator.perception.icon.query_caption import (
            load_blip2, load_siglip_text, BLIP2_MODEL_ID
        )
        import torch

        if use_cuda_for_retrieval and not torch.cuda.is_available():
            print("WARNING: USE_CUDA_FOR_RETRIEVAL=true but CUDA not available, falling back to CPU")

        device = "cuda" if (use_cuda_for_retrieval and torch.cuda.is_available()) else "cpu"
        device_name = device.upper()

        print(f"\nLoading BLIP2 model ({BLIP2_MODEL_ID}) on {device_name}...")
        cached_blip2_pipe = load_blip2(device=device)
        print(f"✓ BLIP2 model loaded on {cached_blip2_pipe[2]}")

        print(f"\nLoading SigLIP text model on {device_name}...")
        cached_siglip_pipe = load_siglip_text(device=device)
        print(f"✓ SigLIP text model loaded on {cached_siglip_pipe[2]}")

        print(f"\nLoading SigLIP image model on {device_name}...")
        from generator.perception.icon.query_embedding import load_siglip_image
        model, preprocess, device_used = load_siglip_image(device=device)
        cached_siglip_image_pipe = (model, preprocess, device_used)
        print(f"✓ SigLIP image model loaded on {cached_siglip_image_pipe[2]}")

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
    import torch

    health_info = {
        "status": "ok",
        "service": "Widget Factory API",
        "model_cache_enabled": model_cache_enabled,
        "cuda_available": torch.cuda.is_available(),
        "cuda_enabled_in_config": use_cuda_for_retrieval,
    }

    if model_cache_enabled:
        health_info["models"] = {
            "blip2_loaded": cached_blip2_pipe is not None,
            "siglip_text_loaded": cached_siglip_pipe is not None,
            "siglip_image_loaded": cached_siglip_image_pipe is not None,
        }

        if cached_blip2_pipe:
            health_info["models"]["blip2_device"] = cached_blip2_pipe[2]

        if cached_siglip_pipe:
            health_info["models"]["siglip_text_device"] = cached_siglip_pipe[2]

        if cached_siglip_image_pipe:
            health_info["models"]["siglip_image_device"] = cached_siglip_image_pipe[2]

    return health_info

# DEPRECATED: This endpoint has been removed as part of the generate refactor
# The underlying function generate_widget() no longer exists
# Use /api/generate-widget-full instead for full pipeline generation
# @app.post("/api/generate-widget")
# async def generate_widget(
#     request: Request,
#     image: UploadFile = File(...),
#     system_prompt: str = Form(None),
#     model: str = Form(None),
#     api_key: str = Form(None),
# ):
#     raise HTTPException(status_code=410, detail="Endpoint deprecated. Use /api/generate-widget-full instead.")


# PREVIOUSLY DEPRECATED: This endpoint had previously been removed as part of the generate refactor, but re-added back in to support synthetic generation
@app.post("/api/generate-widget-text")
async def generate_widget_text(
    request: Request,
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    model: str = Form(None),
    api_key: str = Form(None),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    # Fallback to environment variable if api_key not provided
    api_key_to_use = api_key or os.getenv('DASHSCOPE_API_KEY')
    # Fallback to config default model if not provided
    model_to_use = model or gen_config.default_model

    if not api_key_to_use:
        raise HTTPException(status_code=400, detail="API key is required. Set DASHSCOPE_API_KEY in .env or provide api_key in request")

    return await generator.generate_widget_text(
        system_prompt, user_prompt, model_to_use, api_key_to_use, gen_config
    )

@app.post("/api/generate-widget-text-with-reference")
async def generate_widget_text_with_reference(
    request: Request,
    reference_image: UploadFile = File(...),
    system_prompt: str = Form(None),
    user_prompt: str = Form(...),
    model: str = Form(None),
    api_key: str = Form(None),
):
    """
    Generate widget from text prompt with reference image for style guidance.

    Args:
        reference_image: Reference widget image for style inspiration
        system_prompt: Optional custom system prompt (defaults to with-reference template)
        user_prompt: Widget description
        model: Optional model name (defaults to qwen3-vl-flash)
        api_key: Optional API key (defaults to env DASHSCOPE_API_KEY)
    """
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    # Fallback to environment variable if api_key not provided
    api_key_to_use = api_key or os.getenv('DASHSCOPE_API_KEY')
    # Fallback to config default model if not provided
    model_to_use = model or gen_config.default_model

    # Read reference image data
    reference_image_data = await reference_image.read()

    return await generator.generate_widget_text_with_reference(
        system_prompt, user_prompt, reference_image_data, reference_image.filename,
        model_to_use, api_key_to_use, gen_config
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
    if not check_rate_limit(client_ip, gen_config.requests_per_minute):
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
    if not check_rate_limit(client_ip, gen_config.requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    return await generator.generate_component_from_image(
        image_data, image.filename, suggested_width, suggested_height,
        model, system_prompt, api_key, gen_config
    )

# DEPRECATED: This endpoint has been removed as part of the generate refactor
# The underlying function generate_widget_with_icons() no longer exists
# Use /api/generate-widget-full instead for full pipeline generation with icons
# @app.post("/api/generate-widget-icons")
# async def generate_widget_icons(
#     request: Request,
#     image: UploadFile = File(...),
#     system_prompt: str = Form(None),
#     model: str = Form(None),
#     api_key: str = Form(None),
#     retrieval_topk: int = Form(gen_config.retrieval_topk),
#     retrieval_topm: int = Form(gen_config.retrieval_topm),
#     retrieval_alpha: float = Form(gen_config.retrieval_alpha),
# ):
#     raise HTTPException(status_code=410, detail="Endpoint deprecated. Use /api/generate-widget-full instead.")

@app.post("/api/generate-widget-full")
async def generate_widget_full_endpoint(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
    retrieval_topk: int = Form(gen_config.retrieval_topk),
    retrieval_topm: int = Form(gen_config.retrieval_topm),
    retrieval_alpha: float = Form(gen_config.retrieval_alpha),
    icon_lib_names: str = Form(None),
    applogo_lib_names: str = Form(None),  # NEW: AppLogo library names
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    # Use environment variable defaults if not provided
    if icon_lib_names is None:
        icon_lib_names = os.getenv('ICON_LIB_NAMES', '["sf", "lucide"]')
    if applogo_lib_names is None:
        applogo_lib_names = os.getenv('APPLOGO_LIB_NAMES', '["si"]')

    image_data = await image.read()
    result = await generate_widget_full(
        image_data, image.filename, system_prompt,
        retrieval_topk, retrieval_topm, retrieval_alpha, gen_config, icon_lib_names, applogo_lib_names
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
    start_time = time.time()
    request_id = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    thread_id = threading.current_thread().ident

    if not model_cache_enabled or cached_blip2_pipe is None:
        raise HTTPException(
            status_code=503,
            detail="Model caching not enabled. Set ENABLE_MODEL_CACHE=true"
        )

    from generator.perception.icon.query_caption import caption_from_bytes_list

    crops_bytes = [await crop.read() for crop in crops]
    num_crops = len(crops_bytes)

    print(f"[{request_id}] 🖼️  BLIP2 REQUEST | Thread: {thread_id} | Images: {num_crops}")

    async with blip2_lock:
        lock_acquired_time = time.time()
        wait_time = lock_acquired_time - start_time
        print(f"[{request_id}] 🔒 BLIP2 LOCK ACQUIRED | Wait: {wait_time:.2f}s")

        captions = await asyncio.to_thread(
            caption_from_bytes_list, crops_bytes, cached_blip2_pipe
        )

        process_time = time.time() - lock_acquired_time
        print(f"[{request_id}] ✅ BLIP2 COMPLETED | Process: {process_time:.2f}s | Total: {time.time()-start_time:.2f}s")

    return {"success": True, "captions": captions}

@app.post("/api/encode-texts")
async def encode_texts(
    request: Request,
    body: EncodeTextsRequest,
):
    start_time = time.time()
    request_id = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    thread_id = threading.current_thread().ident

    if not model_cache_enabled or cached_siglip_pipe is None:
        raise HTTPException(
            status_code=503,
            detail="Model caching not enabled. Set ENABLE_MODEL_CACHE=true"
        )

    from generator.perception.icon.query_caption import encode_texts_siglip
    import numpy as np

    num_texts = len(body.texts)
    print(f"[{request_id}] 📝 SigLIP-TEXT REQUEST | Thread: {thread_id} | Texts: {num_texts}")

    model, tokenizer, device = cached_siglip_pipe

    async with siglip_lock:
        lock_acquired_time = time.time()
        wait_time = lock_acquired_time - start_time
        print(f"[{request_id}] 🔒 SigLIP-TEXT LOCK ACQUIRED | Wait: {wait_time:.2f}s")

        embeddings = await asyncio.to_thread(
            encode_texts_siglip, model, tokenizer, device, body.texts
        )

        process_time = time.time() - lock_acquired_time
        print(f"[{request_id}] ✅ SigLIP-TEXT COMPLETED | Process: {process_time:.2f}s | Total: {time.time()-start_time:.2f}s")

    return {"success": True, "embeddings": embeddings.tolist()}

@app.post("/api/encode-images")
async def encode_images(
    request: Request,
    images: List[UploadFile] = File(...),
):
    """
    Batch encode images to vectors using SigLIP image encoder.

    Args:
        images: List of image files (outline images)

    Returns:
        JSON with success status and embeddings array (N, 1152)
    """
    start_time = time.time()
    request_id = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    thread_id = threading.current_thread().ident

    if not model_cache_enabled or cached_siglip_image_pipe is None:
        raise HTTPException(
            status_code=503,
            detail="Model caching not enabled. Set ENABLE_MODEL_CACHE=true"
        )

    from generator.perception.icon.query_embedding import batch_encode_pils
    from PIL import Image
    import io

    # Read uploaded images
    pil_images = []
    for img_file in images:
        img_bytes = await img_file.read()
        pil_images.append(Image.open(io.BytesIO(img_bytes)))

    num_images = len(pil_images)
    print(f"[{request_id}] 🎨 SigLIP-IMAGE REQUEST | Thread: {thread_id} | Images: {num_images}")

    model, preprocess, device = cached_siglip_image_pipe

    async with siglip_image_lock:
        lock_acquired_time = time.time()
        wait_time = lock_acquired_time - start_time
        print(f"[{request_id}] 🔒 SigLIP-IMAGE LOCK ACQUIRED | Wait: {wait_time:.2f}s")

        embeddings = await asyncio.to_thread(
            batch_encode_pils, model, preprocess, pil_images, device, 64
        )

        process_time = time.time() - lock_acquired_time
        print(f"[{request_id}] ✅ SigLIP-IMAGE COMPLETED | Process: {process_time:.2f}s | Total: {time.time()-start_time:.2f}s")

    return {"success": True, "embeddings": embeddings.tolist()}

@app.get("/api/dsl-batches")
async def list_dsl_batches():
    """
    List all available DSL batch files from the generator results directory.
    Returns a list of batch files grouped by run ID.
    """
    try:
        results_dir = root_dir / "libs" / "js" / "mutator" / "results"
        
        if not results_dir.exists():
            return {"success": True, "batches": []}
        
        batches = []
        for run_dir in sorted(results_dir.glob("run-*"), reverse=True):
            if run_dir.is_dir():
                for batch_file in sorted(run_dir.glob("*-batch-*.json")):
                    # Get file stats
                    stats = batch_file.stat()
                    size_mb = stats.st_size / (1024 * 1024)
                    
                    batches.append({
                        "runId": run_dir.name,
                        "filename": batch_file.name,
                        "path": f"{run_dir.name}/{batch_file.name}",
                        "sizeMB": round(size_mb, 2),
                        "modified": stats.st_mtime
                    })
        
        return {"success": True, "batches": batches}
    except Exception as e:
        print(f"Error listing DSL batches: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/dsl-batches/{run_id}/{filename}")
async def get_dsl_batch(run_id: str, filename: str):
    """
    Get a specific DSL batch file by run ID and filename.
    Returns the JSON content of the batch file.
    """
    try:
        # Validate path components to prevent directory traversal
        if ".." in run_id or ".." in filename:
            raise HTTPException(status_code=400, detail="Invalid path")
        
        batch_path = root_dir / "libs" / "js" / "mutator" / "results" / run_id / filename
        
        if not batch_path.exists():
            raise HTTPException(status_code=404, detail="Batch file not found")
        
        if not batch_path.is_file():
            raise HTTPException(status_code=400, detail="Invalid file")
        
        # Read and return the JSON file
        import json
        with open(batch_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reading DSL batch: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8010"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
