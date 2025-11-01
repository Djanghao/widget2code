# Changelog

## 0.4.0 (2025-11-01)

### Added

#### Core Architecture
- Complete llm-powered widget generation pipeline: Image → WidgetDSL → JSX → PNG
- Monorepo structure with 9 JavaScript/TypeScript packages and 1 Python package
- FastAPI backend server (apps/api) for AI generation services
- React playground web application (apps/playground) for visual editing and preview
- 12 shell automation scripts for complete workflows

#### JavaScript/TypeScript Packages

**@widget-factory/dsl (v0.4.0)**
- WidgetDSL specification and protocol definition
- JSON schema validation for widget specifications
- Aspect ratio parsing and size management utilities
- Hierarchical structure support for containers and leaf components

**@widget-factory/compiler (v0.4.0)**
- DSL to JSX compilation engine
- Automatic import generation for components and icons
- Container rendering with flexbox layout support
- Support for flex properties, alignment, gaps, and padding

**@widget-factory/primitives (v0.4.0)**
- 17 production-ready UI components
- 9 basic components: Text, Icon, Button, Image, AppLogo, MapImage, Checkbox, Indicator, Divider
- 8 chart components powered by ECharts: LineChart, BarChart, StackedBarChart, RadarChart, PieChart, ProgressBar, ProgressRing, Sparkline
- WidgetShell layout container with styling support

**@widget-factory/icons (v0.4.0)**
- Icon library system with 57,000+ icons
- 6,950 SF Symbols from Apple with lazy loading and code splitting
- 49,957 icons from 31 react-icons libraries (Lucide, FontAwesome, Material Design, Bootstrap, Heroicons, Ionicons, Feather, Ant Design, Boxicons, Remix, Tabler, and more)
- AI-powered icon retrieval using FAISS vector similarity search
- Multi-modal retrieval with SigLIP2 embeddings (text + image)
- Fused similarity scoring with configurable alpha weighting

**@widget-factory/renderer (v0.4.0)**
- Playwright-based headless browser rendering
- JSX to PNG conversion with multiple output modes (raw, autoresize, rescaled)
- Configurable viewport, timeout, and network idle detection
- Screenshot capture with aspect ratio preservation

**@widget-factory/exporter (v0.4.0)**
- Client-side PNG export using html2canvas
- Widget validation before export
- Quality issue detection and warnings
- Automatic filename generation

**@widget-factory/resizer (v0.1.0)**
- Intelligent auto-resize system with binary search optimization
- Aspect ratio-based widget resizing
- Overflow detection and measurement
- Layout stability detection to prevent content clipping

**@widget-factory/validator (v0.4.0)**
- DSL validation engine
- Runtime widget quality checks
- Overflow and size validation
- Metadata extraction utilities

**@widget-factory/cli (v0.4.0)**
- Command-line interface with `widget-factory` binary
- `compile` command: Convert WidgetDSL JSON to JSX
- `render` command: Render JSX to PNG (multiple formats)
- `batch-render` command: Process multiple widgets
- Automatic import resolution and server integration

**@widget-factory/dynamic (v0.1.0)**
- Runtime component generation system
- Dynamic imports for performance optimization

#### Python Package

**generator (v0.4.0)**
- Multi-stage widget generation from images with 4 modes:
  - Basic: Text and layout only
  - Icon-enhanced: With icon grounding and retrieval
  - Graph-enhanced: With chart/graph detection
  - Full pipeline: Icons + graphs combined
- Component generation from text prompts or images
- Support for Qwen-VL model family (qwen3-vl-flash, qwen3-vl-plus, qwen3-vl-235b-a22b-instruct, qwen3-vl-235b-a22b-thinking)
- Automatic image preprocessing and optimization (resize, format conversion)
- Vision-based icon detection with BLIP2 grounding and bounding boxes
- Icon cropping, caption generation, and multi-modal retrieval
- Multi-modal icon search with configurable top-K (50) and top-M (10) parameters
- Automatic chart/graph detection for 8 chart types (LineChart, BarChart, PieChart, RadarChart, StackedBarChart, ProgressBar, ProgressRing, Sparkline)
- Support for 57+ icon libraries
- High-performance concurrent batch generation with configurable workers (default: 5)
- Progress tracking with tqdm
- Async/await architecture with model caching for 200+ concurrent requests
- Thread-safe model access with locks
- Debug visualizations and prompt saving
- CLI commands: `generate-widget` and `generate-widget-batch`

#### Backend API (apps/api)

**Widget Generation Endpoints**
- `POST /api/generate-widget` - Basic widget generation from image
- `POST /api/generate-widget-text` - Text-to-widget generation (no image required)
- `POST /api/generate-widget-icons` - Widget generation with icon detection and retrieval
- `POST /api/generate-widget-graph` - Widget generation with chart/graph detection
- `POST /api/generate-widget-full` - Full pipeline with icons and graphs

**Component Generation Endpoints**
- `POST /api/generate-component` - Generate component from text prompt
- `POST /api/generate-component-from-image` - Generate component from image

**Perception Service Endpoints**
- `POST /api/extract-icon-captions` - Batch icon caption extraction
- `POST /api/encode-texts` - Text embedding generation

**Server Features**
- CORS configuration for local development
- Rate limiting per client IP (10 requests/minute default)
- File size validation (100MB max default)
- Custom error handlers (ValidationError, FileSizeError, RateLimitError, GenerationError)
- Optional model caching at startup
- Async request handling with detailed logging

#### Playground Application (apps/playground)

**Main Tabs**
- **Presets**: 30+ example widgets with live DSL editor, JSON syntax highlighting, auto-compile (300ms debounce), real-time JSX preview, tree visualization, and PNG download
- **Widget2Code**: Upload widget screenshots for AI-powered DSL generation with icon/graph extraction, configurable retrieval parameters (topK, topM, alpha), icon library selection, and debug modals
- **Prompt2Code**: Text-to-widget generation without images, with model selection and instant preview
- **Dynamic Components**: Generate individual components from text or images with size customization
- **Guides**: Component reference, DSL specification, and examples

**Editor Features**
- JSON syntax highlighting with real-time validation
- Tree view with node selection and navigation
- Dimension overlay and frame size display
- Export validation with quality warnings
- Materials modal for component library browsing
- API key manager with secure localStorage storage
- Icon/graph extraction debug modals
- Prompt viewer for debugging AI generation

#### Shell Scripts

**Setup**
- `install.sh` - One-command setup for Node.js and Python dependencies

**Development Servers**
- `start-dev.sh` - Start frontend only (port 3060)
- `start-api.sh` - Start API server only (port 8010)
- `start-full.sh` - Start both servers concurrently

**Generation (Standalone)**
- `generate-widget.sh` - Single image to DSL JSON generation
- `generate-batch.sh` - Parallel batch processing with configurable concurrency

**Rendering**
- `compile-widget.sh` - DSL to JSX compilation
- `render-widget.sh` - JSX to PNG rendering (requires server)
- `render-batch.sh` - Batch rendering

**Full Pipeline**
- `run-full.sh` - Complete pipeline: Image → DSL → JSX → PNG
- `run-batch-full.sh` - Batch full pipeline processing

### Performance

- Lazy loading for 57,000+ icons with dynamic code splitting
- Binary search optimization for auto-resize algorithm
- FAISS vector similarity search for sub-second icon retrieval
- Concurrent batch processing with configurable worker pool
- Model caching for 200+ concurrent AI requests
- Thread-safe model access with locks
