import React, { useState, useEffect } from 'react';
import { Icon } from '@widget-factory/primitives';
import { Text } from '@widget-factory/primitives';
import { Image } from '@widget-factory/primitives';
import { Checkbox } from '@widget-factory/primitives';
import { Sparkline } from '@widget-factory/primitives';
import { WidgetShell } from '@widget-factory/primitives';
import MermaidDiagram from './MermaidDiagram.jsx';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('architecture');
  const [expandedSections, setExpandedSections] = useState({
    'architecture': true,
    'widgetshell': true,
    'icon-system': true,
    'component-types': true
  });

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const container = document.querySelector('[data-content-scroll]');
      if (container) {
        const offsetTop = element.offsetTop - container.offsetTop - 80;
        container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
      setActiveSection(sectionId);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    const container = document.querySelector('[data-content-scroll]');
    if (!container) return;

    const handleScroll = () => {
      const sections = [
        'architecture', 'system-overview', 'data-flow', 'component-architecture',
        'widgetshell', 'css-priority', 'examples', 'autoresize', 'visual-examples',
        'icon-system', 'sf-symbols', 'lucide-icons',
        'component-types', 'container-components', 'fixed-size-components', 'image-components'
      ];
      const scrollPosition = container.scrollTop + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop - container.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: '#1c1c1e',
      color: '#f5f5f7',
      overflow: 'hidden'
    }}>
      <div style={{
        width: 240,
        flexShrink: 0,
        backgroundColor: '#202020',
        borderRight: '1px solid #333',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: 16
      }}>
        <nav>
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => scrollToSection('architecture')}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'architecture' ? '#3a3a3a' : 'transparent',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6,
                marginTop: 16
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'architecture') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'architecture') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection('system-overview')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'system-overview' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'system-overview' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'system-overview') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'system-overview') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              System Overview
            </button>
            <button
              onClick={() => scrollToSection('data-flow')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'data-flow' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'data-flow' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'data-flow') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'data-flow') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Data Flow
            </button>
            <button
              onClick={() => scrollToSection('component-architecture')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'component-architecture' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'component-architecture' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'component-architecture') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'component-architecture') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Component Architecture
            </button>
            <button
              onClick={() => scrollToSection('widgetshell')}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'widgetshell' ? '#3a3a3a' : 'transparent',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6,
                marginTop: 24
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'widgetshell') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'widgetshell') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              WidgetShell Size Rules
            </button>
            <button
              onClick={() => scrollToSection('css-priority')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'css-priority' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'css-priority' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'css-priority') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'css-priority') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              CSS Priority Rules
            </button>
            <button
              onClick={() => scrollToSection('examples')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'examples' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'examples' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'examples') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'examples') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Examples
            </button>
            <button
              onClick={() => scrollToSection('autoresize')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'autoresize' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'autoresize' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'autoresize') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'autoresize') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              AutoResize
            </button>
            <button
              onClick={() => scrollToSection('visual-examples')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'visual-examples' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'visual-examples' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'visual-examples') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'visual-examples') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Visual Examples
            </button>

            <button
              onClick={() => scrollToSection('icon-system')}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'icon-system' ? '#3a3a3a' : 'transparent',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6,
                marginTop: 24
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'icon-system') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'icon-system') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Icon System
            </button>
            <button
              onClick={() => scrollToSection('sf-symbols')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'sf-symbols' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'sf-symbols' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'sf-symbols') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'sf-symbols') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              SF Symbols
            </button>
            <button
              onClick={() => scrollToSection('lucide-icons')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'lucide-icons' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'lucide-icons' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'lucide-icons') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'lucide-icons') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Lucide Icons
            </button>

            <button
              onClick={() => scrollToSection('component-types')}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'component-types' ? '#3a3a3a' : 'transparent',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6,
                marginTop: 24
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'component-types') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'component-types') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Component Types
            </button>
            <button
              onClick={() => scrollToSection('container-components')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'container-components' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'container-components' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'container-components') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'container-components') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Container Components
            </button>
            <button
              onClick={() => scrollToSection('fixed-size-components')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'fixed-size-components' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'fixed-size-components' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'fixed-size-components') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'fixed-size-components') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Fixed-Size Components
            </button>
            <button
              onClick={() => scrollToSection('image-components')}
              style={{
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: activeSection === 'image-components' ? '#3a3a3a' : 'transparent',
                color: activeSection === 'image-components' ? '#fff' : '#b3b3b3',
                fontSize: 15,
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                borderRadius: 6
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'image-components') {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'image-components') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Image Components
            </button>
          </div>
        </nav>
      </div>

      <div
        data-content-scroll
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 60px'
        }}
      >
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

          <div id="component-architecture" style={{ scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Component Architecture
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
              The diagram below shows how WidgetSpec JSON is compiled into React components.
            </p>
            <MermaidDiagram scale={0.75} chart={`graph LR
    subgraph WidgetSpecStructure["WidgetSpec Structure"]
        WidgetSpec["WidgetSpec JSON"]
        Widget["widget"]
        Root["root"]
        WidgetSpec --> Widget
        Widget --> Root
        Widget --> Width["width"]
        Widget --> Height["height"]
        Widget --> AR["aspectRatio"]
        Root --> Container["container"]
        Root --> Text["Text"]
        Root --> Icon["Icon"]
    end
    subgraph CompilerPipeline["Compiler Pipeline"]
        Parser["Parse WidgetSpec"]
        Generator["Generate JSX"]
        Output["JSX String"]
        WidgetSpec --> Parser
        Parser --> Generator
        Generator --> Output
    end
    subgraph Primitives["Primitives Library"]
        WidgetShell["WidgetShell"]
        PrimitiveText["Text"]
        PrimitiveIcon["Icon"]
        Output -.->|Uses| WidgetShell
        Output -.->|Uses| PrimitiveText
        Output -.->|Uses| PrimitiveIcon
    end
    style WidgetSpec fill:#007AFF,color:#fff
    style Output fill:#FF9500,color:#fff
    style WidgetShell fill:#34C759,color:#fff`} />
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

        <section id="widgetshell" style={{ marginBottom: 60, scrollMarginTop: 20 }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 24,
            color: '#f5f5f7',
            borderBottom: '2px solid #3a3a3c',
            paddingBottom: 12
          }}>
            WidgetShell Container Size Rules
          </h2>

          <div id="css-priority" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              CSS Priority Rules
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
              Container sizing precedence in widgetspec:
            </p>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li><strong>Explicit width/height</strong> always determine container size when present.</li>
              <li><strong>aspectRatio</strong> never directly sets container size. It is only used by <strong>AutoResize</strong> to calculate and write explicit width/height.</li>
              <li>When <strong>AutoResize</strong> is disabled, <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> is ignored.</li>
              <li>If no width/height are set (and AutoResize does not run), the container size is <strong>content-driven</strong>.</li>
            </ul>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#a1a1a6', marginTop: 8 }}>
              Note: <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>WidgetShell</code> does not accept an <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> prop.
            </p>
          </div>

          <div id="examples" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Examples
            </h3>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 20,
              marginBottom: 0
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #3a3a3c' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>Properties</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #3a3a3c' }}>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width: 200, height: 100, aspectRatio: 1</code>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      200×100 (rectangle, aspectRatio ignored)
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #3a3a3c' }}>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width: 200, aspectRatio: 1</code>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      Without AutoResize: width fixed at 200, height content-driven. With AutoResize: becomes 200×200 (height calculated and persisted).
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio: 1</code>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      Without AutoResize: content-driven (aspectRatio ignored). With AutoResize: width/height computed and persisted to maintain 1:1.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="autoresize" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              AutoResize Behavior
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
              AutoResize computes and writes explicit <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>height</code>. The <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> prop in widgetspec is treated as an input for this calculation, not a rendering constraint.
            </p>
            <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
              <li>Toggle: Editors expose a green <strong>AutoResize</strong> switch (on by default).</li>
              <li>When enabled and the spec has <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> but no <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width/height</code>, AutoResize runs to compute and persist dimensions.</li>
              <li>If <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width/height</code> already exist, AutoResize skips; aspectRatio is ignored.</li>
              <li>When disabled, aspectRatio is always ignored; the container uses explicit width/height if present, otherwise content-driven sizing.</li>
              <li>Manual control: use the ratio input (e.g. “16:9” or “1.777”) + <em>Auto-Resize</em> button to run AutoResize with that ratio and write dimensions back to the spec (overriding any spec aspectRatio).</li>
              <li>Drag-resize (Presets): the resizer locks proportion only when AutoResize is enabled and the spec has an aspectRatio; otherwise it resizes freely.</li>
            </ul>
          </div>

          <div id="visual-examples" style={{ scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Visual Examples
            </h3>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 24,
              marginBottom: 0
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1a6', marginBottom: 16 }}>Live Widget Examples</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <WidgetShell width={200} height={100} backgroundColor="#1a1a1a" borderRadius={16} style={{ padding: 16 }}>
                    <Text fontSize={14} color="#fff" fontWeight={600}>200×100</Text>
                    <Text fontSize={12} color="#999">Fixed size</Text>
                  </WidgetShell>
                  <code style={{ fontSize: 11, color: '#a1a1a6', textAlign: 'center' }}>width: 200, height: 100</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <WidgetShell width={150} height={150} backgroundColor="#1a1a1a" borderRadius={16} style={{ padding: 16 }}>
                    <Text fontSize={14} color="#fff" fontWeight={600}>150×150</Text>
                    <Text fontSize={12} color="#999">Square</Text>
                  </WidgetShell>
                  <code style={{ fontSize: 11, color: '#a1a1a6', textAlign: 'center' }}>width: 150, height: 150</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <WidgetShell width={180} height={120} backgroundColor="#1a1a1a" borderRadius={20} style={{ padding: 16 }}>
                    <Text fontSize={14} color="#fff" fontWeight={600}>180×120</Text>
                    <Text fontSize={12} color="#999">borderRadius: 20</Text>
                  </WidgetShell>
                  <code style={{ fontSize: 11, color: '#a1a1a6', textAlign: 'center' }}>borderRadius: 20</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="icon-system" style={{ marginBottom: 60, scrollMarginTop: 80 }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 24,
            color: '#f5f5f7',
            borderBottom: '2px solid #3a3a3c',
            paddingBottom: 12
          }}>
            Icon System
          </h2>

          <div id="sf-symbols" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              SF Symbols Icons
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
              SF Symbols icons use CSS variable <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>--icon-color</code> for dynamic coloring. The Icon component sets this variable and the SVG references it.
            </p>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 20,
              marginBottom: 16
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1a6', marginBottom: 8 }}>Icon Component (packages/primitives/src/Icon.jsx:20)</div>
                <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e5e5e7' }}>{`const wrapperStyle = {
  '--icon-color': color,
  width: size,
  height: size,
  ...
}`}</pre>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1a6', marginBottom: 8 }}>SVG Path (packages/icons/sf-symbols/src/components/Icon00Circle.jsx:8)</div>
                <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e5e5e7' }}>{`<path fill="var(--icon-color, rgba(255, 255, 255, 0.85))" />`}</pre>
              </div>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
              When you pass <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>color</code> prop to Icon, it sets <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>--icon-color</code> which the SVG uses via <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>var(--icon-color)</code>. This allows runtime color changes without modifying SVG source.
            </p>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 24,
              marginBottom: 0
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1a6', marginBottom: 16 }}>Live Examples</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="heart.fill" size={40} color="#FF3B30" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>heart.fill</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="star.fill" size={40} color="#FFD60A" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>star.fill</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="checkmark.circle.fill" size={40} color="#34C759" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>checkmark.circle.fill</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="cloud.fill" size={40} color="#007AFF" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>cloud.fill</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="bolt.fill" size={40} color="#FF9500" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>bolt.fill</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="moon.fill" size={40} color="#BF5AF2" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>moon.fill</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
              </div>
            </div>
          </div>

          <div id="lucide-icons" style={{ scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Lucide Icons
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
              Lucide icons use <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>lucide:</code> prefix (e.g., <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>lucide:home</code>). Color is passed directly as a prop to the Lucide component. SF Symbols icons work without prefix or with <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>sf:</code> prefix.
            </p>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 24,
              marginBottom: 0
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1a6', marginBottom: 16 }}>Live Examples</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="lucide:home" size={40} color="#FF3B30" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:home</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="lucide:settings" size={40} color="#FFD60A" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:settings</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="lucide:user" size={40} color="#34C759" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:user</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon name="lucide:mail" size={40} color="#007AFF" />
                  <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:mail</code>
                  <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="component-types" style={{ marginBottom: 60, scrollMarginTop: 80 }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 24,
            color: '#f5f5f7',
            borderBottom: '2px solid #3a3a3c',
            paddingBottom: 12
          }}>
            Component Types
          </h2>

          <div id="container-components" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Container Components
            </h3>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 20,
              marginBottom: 0
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Image</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
                  Container component using <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>backgroundImage</code>. Supports children elements overlaid on the image. Use <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>url</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>height</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>borderRadius</code> props.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Image
                    url="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=120&fit=crop"
                    width={120}
                    height={80}
                    borderRadius={12}
                    style={{ border: '1px solid #3a3a3c' }}
                  />
                  <Image
                    url="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200&h=120&fit=crop"
                    width={120}
                    height={80}
                    borderRadius={12}
                    style={{ border: '1px solid #3a3a3c', display: 'flex', alignItems: 'flex-end', padding: 8 }}
                  >
                    <Text fontSize={11} color="#fff" fontWeight={600} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>With overlay</Text>
                  </Image>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Text</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
                  Text container using <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>div</code> element. Supports <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>fontSize</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>color</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>align</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>fontWeight</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>lineHeight</code> props.
                </p>
                <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
                  <Text fontSize={18} color="#fff" fontWeight={600}>Bold Large Text</Text>
                  <Text fontSize={14} color="#999" fontWeight={400}>Regular Gray Text</Text>
                  <Text fontSize={12} color="#007AFF" align="center">Centered Blue Text</Text>
                </div>
              </div>
            </div>
          </div>

          <div id="fixed-size-components" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Fixed-Size Components
            </h3>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 20,
              marginBottom: 0
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Icon</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
                  Fixed-size wrapper with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>height</code> set to <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>size</code> prop (default 20px). Uses <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>flex: '0 0 auto'</code> and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>flexShrink: 0</code> to maintain size.
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Icon name="heart.fill" size={20} color="#FF3B30" />
                  <Icon name="heart.fill" size={30} color="#FF3B30" />
                  <Icon name="heart.fill" size={40} color="#FF3B30" />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Checkbox</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
                  Fixed-size circular checkbox with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>size</code> prop (default 20px). Shows checkmark when <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>checked</code> is true. Uses <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>color</code> prop for border/fill.
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Checkbox size={24} checked={false} color="#34C759" />
                  <Checkbox size={24} checked={true} color="#34C759" />
                  <Checkbox size={24} checked={true} color="#FF3B30" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Sparkline</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
                  Canvas-based line chart with fixed <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>height</code> props. Accepts <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>data</code> array and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>color</code> prop. Uses device pixel ratio for crisp rendering.
                </p>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Sparkline width={100} height={40} color="#34C759" data={[10, 20, 15, 25, 30, 22, 35, 40]} />
                  <Sparkline width={100} height={40} color="#FF3B30" data={[40, 35, 38, 30, 25, 28, 20, 15]} />
                  <Sparkline width={100} height={40} color="#007AFF" data={[20, 22, 24, 23, 25, 30, 28, 32]} />
                </div>
              </div>
            </div>
          </div>

          <div id="image-components" style={{ scrollMarginTop: 80 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              Image Components
            </h3>
            <div style={{
              backgroundColor: '#2c2c2e',
              border: '1px solid #3a3a3c',
              borderRadius: 8,
              padding: 20,
              marginBottom: 0
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>MapImage</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', margin: 0 }}>
                  Uses native <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>img</code> element with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>objectFit: 'cover'</code>. Does not support children. Use for map images where <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>img</code> element behavior is required.
                </p>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>AppLogo</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', margin: 0 }}>
                  Wrapper for app logo images with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>borderRadius</code> support. Uses native <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>img</code> element with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>objectFit: 'cover'</code>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
