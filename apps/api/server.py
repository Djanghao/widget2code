from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import os
import yaml
import traceback
import widgetdsl_generator as generator
from widgetdsl_generator import GeneratorConfig

config_file = os.getenv("CONFIG_FILE", "config.yaml")
config_path = Path(__file__).parent.parent / config_file

with open(config_path, 'r') as f:
    config_dict = yaml.safe_load(f)

app = FastAPI()

allowed_origins = config_dict['cors']['origins']
gen_config = GeneratorConfig.from_dict(config_dict)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        content={"detail": str(exc), "traceback": error_traceback}
    )

@app.post("/api/generate-widget")
async def generate_widget(
    request: Request,
    image: UploadFile = File(...),
    system_prompt: str = Form(None),
    model: str = Form(None),
    api_key: str = Form(None),
):
    return await generator.generate_widget(
        request, image, system_prompt, model, api_key, gen_config
    )

@app.post("/api/generate-widget-text")
async def generate_widget_text(
    request: Request,
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    model: str = Form(None),
    api_key: str = Form(None),
):
    return await generator.generate_widget_text(
        request, system_prompt, user_prompt, model, api_key, gen_config
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
    return await generator.generate_component(
        request, prompt, suggested_width, suggested_height,
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
    return await generator.generate_component_from_image(
        request, image, suggested_width, suggested_height,
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
    return await generator.generate_widget_with_icons(
        request, image, system_prompt, model, api_key,
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
    return await generator.generate_widget_with_graph(
        request, image, system_prompt, model, api_key, gen_config
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
):
    return await generator.generate_widget_full(
        request, image, system_prompt, model, api_key,
        retrieval_topk, retrieval_topm, retrieval_alpha, gen_config
    )

if __name__ == "__main__":
    import uvicorn
    port = config_dict['server']['backend_port']
    host = config_dict['server']['host']
    uvicorn.run(app, host=host, port=port)
