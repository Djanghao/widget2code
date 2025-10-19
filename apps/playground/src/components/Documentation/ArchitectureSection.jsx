import React from 'react';
import MermaidDiagram from '../../MermaidDiagram.jsx';

export default function ArchitectureSection() {
  return (
    <section id="architecture" style={{ marginBottom: 60, scrollMarginTop: 20 }}>
      <h2 style={{
        fontSize: 28,
        fontWeight: 600,
        marginBottom: 24,
        color: '#f5f5f7',
        borderBottom: '2px solid #3a3a3c',
        paddingBottom: 12
      }}>
        Playground Architecture
      </h2>

      <div id="system-overview" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          System Overview
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          The playground consists of three main parts: Frontend (React + Vite), Backend (FastAPI + AI Models), and Widget System (Compiler + Primitives).
        </p>
        <MermaidDiagram chart={`graph TD
    Frontend["Frontend<br/>React + Vite"]
    Backend["Backend<br/>FastAPI Server"]
    AI["AI Models<br/>Qwen VL/LLM"]
    System["Widget System<br/>Compiler + Primitives"]

    Frontend -->|HTTP Request| Backend
    Backend -->|AI Call| AI
    AI -->|WidgetSpec JSON| Backend
    Backend -->|WidgetSpec| Frontend
    Frontend -->|Compile| System
    System -->|JSX Components| Frontend

    style Frontend fill:#007AFF,color:#fff
    style Backend fill:#34C759,color:#fff
    style AI fill:#BF5AF2,color:#fff
    style System fill:#FF9500,color:#fff`} />
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginBottom: 16
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Frontend (React + Vite)</div>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li><strong>Presets Tab</strong>: Browse and edit 20+ pre-built widget examples</li>
              <li><strong>Widget2Spec Tab</strong>: Upload widget screenshots, generate WidgetSpec via VLM</li>
              <li><strong>Prompt2Spec Tab</strong>: Describe widgets in natural language, generate WidgetSpec via LLM</li>
              <li><strong>Guides Tab</strong>: Documentation, component reference, and architecture diagrams</li>
            </ul>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Backend (FastAPI)</div>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li><code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>/api/generate-widget</code> - Image → WidgetSpec (Qwen VL)</li>
              <li><code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>/api/generate-widget-text</code> - Prompt → WidgetSpec (Qwen)</li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Widget System</div>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li><strong>@widget-factory/compiler</strong>: Converts WidgetSpec JSON to React JSX</li>
              <li><strong>@widget-factory/primitives</strong>: Base components (WidgetShell, Text, Icon, etc.)</li>
              <li><strong>@widget-factory/icons</strong>: 500+ SF Symbols + 300+ Lucide icons</li>
            </ul>
          </div>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#a1a1a6', marginTop: 8 }}>
          Note: Full architecture diagrams with Mermaid charts are available in <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>playground/architecture.md</code>
        </p>
      </div>

      <div id="data-flow" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Data Flow
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          The sequence diagram below shows how data flows through the system for different tabs.
        </p>
        <MermaidDiagram scale={0.75} chart={`sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant API as FastAPI Server
    participant AI as AI Model
    participant Compiler
    participant Frame as Widget Frame

    Note over User,Frame: Presets Tab Flow
    User->>UI: Select Example
    UI->>Compiler: Compile WidgetSpec
    Compiler->>Frame: Render JSX
    Frame->>User: Display Widget

    Note over User,Frame: Widget2Spec Flow
    User->>UI: Upload Image
    UI->>API: POST /api/generate-widget
    API->>AI: VLM Analysis
    AI->>API: WidgetSpec JSON
    API->>UI: Return WidgetSpec
    UI->>Compiler: Compile WidgetSpec
    Compiler->>Frame: Render JSX
    Frame->>User: Display Widget

    Note over User,Frame: Prompt2Spec Flow
    User->>UI: Enter Prompt
    UI->>API: POST /api/generate-widget-text
    API->>AI: LLM Generation
    AI->>API: WidgetSpec JSON
    API->>UI: Return WidgetSpec
    UI->>Compiler: Compile WidgetSpec
    Compiler->>Frame: Render JSX
    Frame->>User: Display Widget`} />
      </div>

      <div id="autoresize-system" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          AutoResize System
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          AutoResize automatically calculates optimal widget dimensions based on aspect ratio and content size using binary search algorithm.
        </p>
        <MermaidDiagram scale={1.0} chart={`graph LR
    Start([Start])
    Parse["Parse Ratio<br/>'16:9' → 1.778"]
    CalcInit["Calculate Initial<br/>w=current/200<br/>h=w/ratio"]
    ApplyInit["Apply size & Render<br/>Wait for frame"]
    MeasureInit["Measure Overflow<br/>scrollW vs clientW"]
    CheckFit{Content<br/>Fits?}

    subgraph FitsPath["Path A: Content Fits"]
        TestMin["Test min size<br/>w=40, h=40/ratio"]
        CheckMin{Size 40<br/>Fits?}
        UseMin["Use size 40"]
        BinaryDown["Binary Search<br/>[40, startW]"]
    end

    subgraph OverflowPath["Path B: Content Overflows"]
        Expand["Expand size<br/>w *= 2"]
        TestExp["Apply & Measure"]
        CheckExp{Fits or<br/>w≥4096?}
        BinaryUp["Binary Search<br/>[lastOverflow, firstFit]"]
    end

    Final["Found optimal size"]
    Write["Write w & h<br/>to WidgetSpec"]
    Done([Done])

    Start --> Parse
    Parse --> CalcInit
    CalcInit --> ApplyInit
    ApplyInit --> MeasureInit
    MeasureInit --> CheckFit

    CheckFit -->|Yes| TestMin
    TestMin --> CheckMin
    CheckMin -->|Yes| UseMin
    CheckMin -->|No| BinaryDown
    UseMin --> Final
    BinaryDown --> Final

    CheckFit -->|No| Expand
    Expand --> TestExp
    TestExp --> CheckExp
    CheckExp -->|No| Expand
    CheckExp -->|Yes| BinaryUp
    BinaryUp --> Final

    Final --> Write
    Write --> Done

    style Start fill:#007AFF,color:#fff
    style Parse fill:#FF9500,color:#fff
    style MeasureInit fill:#34C759,color:#fff
    style CheckFit fill:#BF5AF2,color:#fff
    style BinaryDown fill:#BF5AF2,color:#fff
    style BinaryUp fill:#BF5AF2,color:#fff
    style Write fill:#FF375F,color:#fff
    style Done fill:#007AFF,color:#fff`} />
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginTop: 16,
          marginBottom: 0
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Core Algorithm Steps</div>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li><strong>1. Parse Ratio</strong>: Convert "16:9" → 1.778 or use decimal directly</li>
              <li><strong>2. Calculate Initial Size</strong>: w = current width or 200, h = w / ratio</li>
              <li><strong>3. Apply & Measure</strong>: Render widget, wait for DOM, check scrollWidth vs clientWidth</li>
              <li><strong>4. Path A - Content Fits</strong>: Test w=40 first, if not fit then binary search [40, startW]</li>
              <li><strong>5. Path B - Content Overflows</strong>: Exponentially expand (w *= 2) until fits, then binary search [low, high]</li>
              <li><strong>6. Write Back</strong>: Persist optimal width & height to WidgetSpec JSON</li>
            </ul>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Overflow Detection</div>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li>Compare <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>scrollWidth</code> vs <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>clientWidth</code></li>
              <li>Compare <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>scrollHeight</code> vs <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>clientHeight</code></li>
              <li>Check if child elements cross container padding boundaries</li>
              <li>Return <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>fits: true/false</code></li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Binary Search Optimization</div>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li><strong>Path A</strong>: If content fits, search downward from startW to 40 to find minimum size</li>
              <li><strong>Path B</strong>: If content overflows, exponentially expand (×2) until fits, then binary search</li>
              <li><strong>Efficiency</strong>: Typical convergence in 8-10 iterations (log₂ of range)</li>
              <li><strong>Bounds</strong>: Minimum 40px, maximum 4096px</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="component-architecture" style={{ scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Component Architecture
        </h3>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginTop: 16,
          marginBottom: 0
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>WidgetSpec Structure</div>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e5e5e7', backgroundColor: '#1c1c1e', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{`{
  "widget": {
    "width": 200,
    "height": 150,
    "aspectRatio": 1.333,
    "backgroundColor": "#1c1c1e",
    "borderRadius": 16,
    "root": { ... }
  }
}`}</pre>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>File Structure</div>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e5e5e7', backgroundColor: '#1c1c1e', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{`playground/
├── src/
│   ├── App.jsx
│   ├── ImageToWidget.jsx
│   ├── Prompt2Spec.jsx
│   ├── Documentation.jsx
│   ├── WidgetFrame.jsx
│   ├── TreeView.jsx
│   ├── generated/
│   │   ├── Widget.jsx
│   │   └── WidgetPreview.jsx
│   └── examples/
├── api/
│   └── server.py
└── vite.config.js`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
