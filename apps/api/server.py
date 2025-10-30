from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import sys
import os
import traceback
from dotenv import load_dotenv

repo_root = Path(__file__).resolve().parents[2]
generator_lib = repo_root / "libs" / "generator"
if str(generator_lib) not in sys.path:
    sys.path.insert(0, str(generator_lib))

import widgetdsl_generator as generator
from widgetdsl_generator import GeneratorConfig
from widgetdsl_generator.exceptions import ValidationError, FileSizeError, GenerationError, RateLimitError
from widgetdsl_generator.utils.validation import check_rate_limit

# Load environment variables from root .env file
load_dotenv(repo_root / ".env")

# Load generator config from environment variables
gen_config = GeneratorConfig.from_env()

# Load CORS config from environment
frontend_port = int(os.getenv("FRONTEND_PORT", "3060"))
allowed_origins = [f"http://localhost:{frontend_port}"]

app = FastAPI()

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
    retrieval_topk: int = Form(50),
    retrieval_topm: int = Form(10),
    retrieval_alpha: float = Form(0.8),
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
    retrieval_topk: int = Form(50),
    retrieval_topm: int = Form(10),
    retrieval_alpha: float = Form(0.8),
    icon_lib_names: str = Form(None),
):
    client_ip = request.client.host
    if not check_rate_limit(client_ip, gen_config.max_requests_per_minute):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    image_data = await image.read()
    return await generator.generate_widget_full(
        image_data, image.filename, system_prompt, model, api_key,
        retrieval_topk, retrieval_topm, retrieval_alpha, gen_config, icon_lib_names
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8010"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
