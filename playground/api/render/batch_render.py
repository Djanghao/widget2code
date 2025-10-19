from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
import base64
import aiofiles
from pathlib import Path
import json

from .renderer import get_renderer

router = APIRouter()

class WidgetSpec(BaseModel):
    widget: Dict[str, Any]

class RenderRequest(BaseModel):
    spec: WidgetSpec
    output_name: Optional[str] = None
    save_output: bool = True
    timeout: int = Field(default=30000, ge=5000, le=120000)

class BatchRenderRequest(BaseModel):
    specs: List[WidgetSpec]
    output_dir: Optional[str] = None
    save_output: bool = True
    max_workers: int = Field(default=4, ge=1, le=10)
    timeout: int = Field(default=30000, ge=5000, le=120000)

class RenderResult(BaseModel):
    success: bool
    png_base64: Optional[str] = None
    jsx: Optional[str] = None
    spec: Optional[WidgetSpec] = None
    width: Optional[int] = None
    height: Optional[int] = None
    error: Optional[str] = None
    output_path: Optional[str] = None

@router.post("/render-single", response_model=RenderResult)
async def render_single(request: RenderRequest):
    try:
        renderer = await get_renderer(max_workers=1)

        result = await renderer.render_widget(
            spec=request.spec.model_dump(),
            timeout=request.timeout
        )

        output_path = None
        if request.save_output:
            output_dir = Path(__file__).parent.parent.parent.parent / "output"
            output_dir.mkdir(exist_ok=True)

            name = request.output_name or f"widget_{result['width']}x{result['height']}"

            png_path = output_dir / f"{name}.png"
            png_data = base64.b64decode(result['png'])
            async with aiofiles.open(png_path, 'wb') as f:
                await f.write(png_data)

            jsx_path = output_dir / f"{name}.jsx"
            async with aiofiles.open(jsx_path, 'w', encoding='utf-8') as f:
                await f.write(result['jsx'])

            spec_path = output_dir / f"{name}.json"
            async with aiofiles.open(spec_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(result['spec'], indent=2))

            output_path = str(output_dir / name)

        return RenderResult(
            success=True,
            png_base64=result['png'],
            jsx=result['jsx'],
            spec=WidgetSpec(**result['spec']),
            width=result['width'],
            height=result['height'],
            output_path=output_path
        )

    except Exception as e:
        return RenderResult(
            success=False,
            error=str(e)
        )

@router.post("/render-batch")
async def render_batch(request: BatchRenderRequest):
    try:
        renderer = await get_renderer(max_workers=request.max_workers)

        specs = [spec.model_dump() for spec in request.specs]

        results = await renderer.render_batch(
            specs=specs,
            timeout=request.timeout
        )

        output_paths = []
        processed_results = []

        for i, result_item in enumerate(results):
            if not result_item['success']:
                processed_results.append({
                    "index": i,
                    "success": False,
                    "error": result_item['error']
                })
                continue

            result = result_item['data']

            output_path = None
            if request.save_output:
                output_dir = Path(request.output_dir) if request.output_dir else (
                    Path(__file__).parent.parent.parent.parent / "output"
                )
                output_dir.mkdir(exist_ok=True)

                name = f"widget_{i}_{result['width']}x{result['height']}"

                png_path = output_dir / f"{name}.png"
                png_data = base64.b64decode(result['png'])
                async with aiofiles.open(png_path, 'wb') as f:
                    await f.write(png_data)

                jsx_path = output_dir / f"{name}.jsx"
                async with aiofiles.open(jsx_path, 'w', encoding='utf-8') as f:
                    await f.write(result['jsx'])

                spec_path = output_dir / f"{name}.json"
                async with aiofiles.open(spec_path, 'w', encoding='utf-8') as f:
                    await f.write(json.dumps(result['spec'], indent=2))

                output_path = str(output_dir / name)
                output_paths.append(output_path)

            processed_results.append({
                "index": i,
                "success": True,
                "width": result['width'],
                "height": result['height'],
                "output_path": output_path
            })

        return {
            "success": True,
            "total": len(request.specs),
            "completed": sum(1 for r in processed_results if r['success']),
            "failed": sum(1 for r in processed_results if not r['success']),
            "results": processed_results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
