# Playground

Interactive demo/editor: load WidgetSpecs, preview rendering, and view generated JSX (WidgetSpec → JSX → Preview).

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```
BACKEND_PORT=8000
FRONTEND_PORT=5173
DASHSCOPE_API_KEY=your-qwen-api-key
```

## Run
```bash
npm run dev:full
```

The dev server writes generated JSX to `src/generated/Widget.jsx` via a Vite middleware for live preview.
