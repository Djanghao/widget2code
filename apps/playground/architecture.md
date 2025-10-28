# Playground Architecture

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        App["App.jsx - Main Application"]

        subgraph Tabs
            Presets["Presets Tab - Example Widgets"]
            Widget2DSL["Widget2DSL Tab - ImageToWidget.jsx"]
            Prompt2DSL["Prompt2DSL Tab - Prompt2DSL.jsx"]
            Guides["Guides Tab - Documentation.jsx"]
        end

        App --> Presets
        App --> Widget2DSL
        App --> Prompt2DSL
        App --> Guides

        subgraph Components
            Renderer["WidgetRenderer.jsx - Babel Standalone Renderer"]
            TreeView["TreeView.jsx - Spec Tree Viewer"]
        end

        Presets --> Renderer
        Presets --> TreeView
        Widget2DSL --> Renderer
        Widget2DSL --> TreeView
        Prompt2DSL --> Renderer
        Prompt2DSL --> TreeView
    end

    subgraph Backend["Backend (FastAPI)"]
        Server["server.py - API Server"]
        GenWidget["/api/generate-widget - Image to Spec"]
        GenText["/api/generate-widget-text - Prompt to Spec"]

        Server --> GenWidget
        Server --> GenText
    end

    subgraph AIModels["AI Models"]
        VLM["Vision LLM - Qwen VL Plus/Max"]
        LLM["Text LLM - Qwen Models"]
    end

    subgraph Packages
        Compiler["compiler - WidgetDSL to JSX"]
        Primitives["primitives - Widget Components"]
        Icons["icons - SF Symbols + Lucide"]
    end

    Widget2DSL -->|Upload Image| GenWidget
    Prompt2DSL -->|Text Prompt| GenText
    GenWidget -->|API Call| VLM
    GenText -->|API Call| LLM
    VLM -->|WidgetDSL JSON| Widget2DSL
    LLM -->|WidgetDSL JSON| Prompt2DSL

    Presets -->|WidgetDSL| Compiler
    Widget2DSL -->|WidgetDSL| Compiler
    Prompt2DSL -->|WidgetDSL| Compiler

    Compiler -->|JSX Code| Renderer
    Renderer -->|Babel Transform & Render| Primitives

    Compiler -.->|Uses| Primitives
    Compiler -.->|Uses| Icons
    Renderer -.->|Runtime Import| Primitives
    Renderer -.->|Runtime Import| Icons

    style App fill:#007AFF,color:#fff
    style Server fill:#34C759,color:#fff
    style Compiler fill:#FF9500,color:#fff
    style VLM fill:#BF5AF2,color:#fff
    style LLM fill:#BF5AF2,color:#fff
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant API as FastAPI Server
    participant AI as AI Model
    participant Compiler as Compiler
    participant Vite as Vite Plugin
    participant Frame as Widget Frame

    Note over User,Frame: Presets Tab Flow
    User->>UI: Select Example
    UI->>Compiler: Compile WidgetDSL
    Compiler->>Vite: Write JSX to file
    Vite->>Frame: Hot reload
    Frame->>User: Display Widget

    Note over User,Frame: Widget2DSL Flow
    User->>UI: Upload Image
    UI->>API: POST /api/generate-widget
    API->>AI: VLM Analysis
    AI->>API: WidgetDSL JSON
    API->>UI: Return WidgetDSL
    UI->>Compiler: Compile WidgetDSL
    Compiler->>Vite: Write JSX to file
    Vite->>Frame: Hot reload
    Frame->>User: Display Widget

    Note over User,Frame: Prompt2DSL Flow
    User->>UI: Enter Prompt
    UI->>API: POST /api/generate-widget-text
    API->>AI: LLM Generation
    AI->>API: WidgetDSL JSON
    API->>UI: Return WidgetDSL
    UI->>Compiler: Compile WidgetDSL
    Compiler->>Vite: Write JSX to file
    Vite->>Frame: Hot reload
    Frame->>User: Display Widget
```

## Component Architecture

```mermaid
graph LR
    subgraph "Widget Spec Structure"
        WidgetDSL[WidgetDSL JSON]
        Widget[widget<br/>Container Config]
        Root[root<br/>Component Tree]

        WidgetDSL --> Widget
        Widget --> Root

        Widget --> Width[width]
        Widget --> Height[height]
        Widget --> AspectRatio[aspectRatio]
        Widget --> BG[backgroundColor]
        Widget --> BR[borderRadius]

        Root --> Container[container]
        Root --> Text[Text]
        Root --> Icon[Icon]
        Root --> Image[Image]
    end

    subgraph "Compiler Pipeline"
        Parser[Parse WidgetDSL]
        Generator[Generate JSX]
        Output[JSX String]

        WidgetDSL --> Parser
        Parser --> Generator
        Generator --> Output
    end

    subgraph "Primitives Library"
        WidgetShell[WidgetShell]
        PrimitiveText[Text]
        PrimitiveIcon[Icon]
        PrimitiveImage[Image]
        Checkbox[Checkbox]
        Sparkline[Sparkline]

        Output -.->|Uses| WidgetShell
        Output -.->|Uses| PrimitiveText
        Output -.->|Uses| PrimitiveIcon
        Output -.->|Uses| PrimitiveImage
        Output -.->|Uses| Checkbox
        Output -.->|Uses| Sparkline
    end

    style WidgetDSL fill:#007AFF,color:#fff
    style Output fill:#FF9500,color:#fff
    style WidgetShell fill:#34C759,color:#fff
```

## File Structure

```
apps/playground/
├── src/
│   ├── App.jsx                    # Main application with tabs
│   ├── main.jsx                   # Entry point
│   ├── ImageToWidget.jsx          # Widget2DSL tab
│   ├── Prompt2DSL.jsx            # Prompt2DSL tab
│   ├── Documentation.jsx          # Guides tab
│   ├── TreeView.jsx               # Spec tree viewer
│   ├── components/
│   │   ├── core/                  # Core UI components
│   │   └── Documentation/         # Documentation components
│   ├── examples/
│   │   └── *.json                 # Preset widget specs
│   └── hooks/
│       └── useAutoResize.js       # Auto-resize logic
├── vite.config.js                 # Vite configuration
└── package.json                   # Dependencies

apps/api/
├── server.py                      # FastAPI server
├── *.md                           # System prompts
└── .venv/                         # Python dependencies

packages/
├── compiler/                      # WidgetDSL to JSX compiler
├── primitives/                    # Widget UI components
├── icons/                         # SF Symbols + Lucide icons
├── spec/                          # WidgetDSL protocol & validation
├── renderer/                      # Runtime JSX renderer
└── exporter/                      # Widget export utilities
```

## Key Technologies

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool with HMR
- **react-dropzone** - File upload
- **react-syntax-highlighter** - Code display

### Backend
- **FastAPI** - Python web framework
- **Qwen VL** - Vision language model
- **Qwen** - Text language model
- **PIL** - Image processing

### Widget System
- **@widget-factory/compiler** - WidgetDSL to JSX compiler
- **@widget-factory/primitives** - Widget components
- **@widget-factory/icons** - SF Symbols + Lucide icons

## AutoResize System

```mermaid
graph TD
    Start[User Loads Widget]

    HasWH{Has width<br/>& height?}
    Start --> HasWH

    HasWH -->|Yes| UseWH[Use Explicit Dimensions]
    HasWH -->|No| CheckAR{Has aspectRatio?}

    CheckAR -->|No| ContentDriven[Content-Driven Size]
    CheckAR -->|Yes| CheckEnabled{AutoResize<br/>Enabled?}

    CheckEnabled -->|No| ContentDriven
    CheckEnabled -->|Yes| Calculate[Calculate Dimensions]

    Calculate --> Measure[Measure Overflow]
    Measure --> Fits{Content Fits?}

    Fits -->|No| Expand[Expand Size]
    Expand --> Measure

    Fits -->|Yes| Shrink[Try Smaller Size]
    Shrink --> CheckFit{Still Fits?}

    CheckFit -->|Yes| UseShrunk[Use Smaller Size]
    CheckFit -->|No| UseExpanded[Use Expanded Size]

    UseShrunk --> Write[Write width & height<br/>to WidgetDSL]
    UseExpanded --> Write

    Write --> Render[Render Widget]
    UseWH --> Render
    ContentDriven --> Render

    style Start fill:#007AFF,color:#fff
    style Calculate fill:#FF9500,color:#fff
    style Write fill:#34C759,color:#fff
    style Render fill:#BF5AF2,color:#fff
```

## Tab Functionality

### Presets Tab
- Browse and select pre-built widget examples
- Edit WidgetDSL JSON in real-time
- View generated JSX code
- Visualize component tree
- Resize widget with aspect ratio lock
- Auto-resize to fit content

### Widget2DSL Tab
- Upload widget screenshots
- Select icon library (SF Symbols, Lucide, or both)
- Choose Qwen vision model
- Customize system prompt
- Generate WidgetDSL from image
- Preview and iterate

### Prompt2DSL Tab
- Describe widget in natural language
- Select icon library preference
- Choose Qwen model (text or vision)
- Customize system prompt
- Generate WidgetDSL from description
- Preview and refine

### Guides Tab
- WidgetShell sizing rules
- Icon system documentation
- Component type reference
- Live component examples
- Interactive navigation
