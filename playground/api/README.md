# Widget Factory API

FastAPI backend for generating WidgetSpec from images using Qwen VLM.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your DASHSCOPE_API_KEY
```

## Running

Start the API server:
```bash
python server.py
```

Or use the combined script from playground root:
```bash
npm run dev:full
```

## Endpoints

### GET /api/default-prompt
Returns the default system prompt from `default-prompt.md`.

### POST /api/generate-widget
Generate WidgetSpec from an uploaded image.

**Parameters:**
- `image` (file): Image file to analyze
- `system_prompt` (optional string): Custom system prompt (defaults to `default-prompt.md`)

**Response:**
```json
{
  "success": true,
  "widgetSpec": { ... },
  "aspectRatio": 1.777
}
```
