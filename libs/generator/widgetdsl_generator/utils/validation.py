import time
from collections import defaultdict
from fastapi.responses import JSONResponse

rate_limit_storage = defaultdict(list)

def check_rate_limit(client_ip: str, max_requests_per_minute: int) -> bool:
    now = time.time()
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if now - timestamp < 60
    ]

    if len(rate_limit_storage[client_ip]) >= max_requests_per_minute:
        return False

    rate_limit_storage[client_ip].append(now)
    return True

def validate_model(model: str, model_to_use: str, supported_models: set) -> JSONResponse | None:
    if model and model_to_use not in supported_models:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Model '{model_to_use}' is not supported. Use one of: {sorted(supported_models)}"
            }
        )
    return None

def validate_api_key(api_key: str) -> JSONResponse | None:
    if not api_key:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "API key is required. Please provide your DashScope API key."
            }
        )
    return None

def validate_file_size(file_size: int, max_size_mb: int) -> JSONResponse | None:
    if file_size > max_size_mb * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content={
                "success": False,
                "error": f"File size exceeds {max_size_mb}MB limit"
            }
        )
    return None
