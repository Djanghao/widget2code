import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: '#0d0d0d',
    primaryColor: '#007AFF',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#007AFF',
    lineColor: '#6e6e73',
    secondaryColor: '#34C759',
    secondaryTextColor: '#ffffff',
    secondaryBorderColor: '#34C759',
    tertiaryColor: '#FF9500',
    tertiaryTextColor: '#ffffff',
    tertiaryBorderColor: '#FF9500',
    noteTextColor: '#f5f5f7',
    noteBkgColor: '#2c2c2e',
    noteBorderColor: '#3a3a3c',
    edgeLabelBackground: '#1c1c1e',
    clusterBkg: '#1c1c1e',
    clusterBorder: '#3a3a3c',
    fontSize: '15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  flowchart: {
    padding: 20,
    nodeSpacing: 60,
    rankSpacing: 80,
    curve: 'basis'
  },
  sequence: {
    actorMargin: 80,
    boxMargin: 20,
    boxTextMargin: 8,
    noteMargin: 15,
    messageMargin: 50
  }
});

export default function MermaidDiagram({ chart, scale = 1 }) {
  const containerRef = useRef(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (containerRef.current && chart) {
      const render = async () => {
        try {
          containerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(idRef.current, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          containerRef.current.innerHTML = `<div style="color: #ff6b6b; padding: 16px; background: #3a0a0a; border: 1px solid #6e1a1a; border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">Mermaid Rendering Error</div>
            <div style="font-size: 13px;">${error.message}</div>
          </div>`;
        }
      };
      render();
    }
  }, [chart]);

  return (
    <div
      style={{
        backgroundColor: '#0d0d0d',
        border: '1px solid #3a3a3c',
        borderRadius: 12,
        padding: 40,
        overflow: 'auto',
        maxWidth: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
}
