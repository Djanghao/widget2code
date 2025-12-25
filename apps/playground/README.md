# Playground

Interactive demo/editor: load WidgetDSLs, preview rendering, and view generated JSX (WidgetDSL → JSX → Preview).

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```
BACKEND_PORT=8010
FRONTEND_PORT=3060
DASHSCOPE_API_KEY=your-qwen-api-key
```

## Run
```bash
npm run dev:full
```

The dev server writes generated JSX to `src/generated/Widget.jsx` via a Vite middleware for live preview.
