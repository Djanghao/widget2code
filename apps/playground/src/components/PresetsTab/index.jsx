import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { examples } from "../../constants/examples.js";
import PreviewPanel from "./PreviewPanel.jsx";
import TreePanel from "./TreePanel.jsx";

export default function PresetsTab({
  selectedExample,
  handleExampleChange,
  currentSpec,
  handleSpecChange,
  specTextareaRef,
  generatedCode,
  ratioInput,
  setRatioInput,
  enableAutoResize,
  setEnableAutoResize,
  autoSizing,
  operationMode,
  handleAutoResizeByRatio,
  editedSpec,
  currentExample,
  setEditedSpec,
  handleDownloadWidget,
  isLoading,
  previewContainerRef,
  widgetFrameRef,
  setFrameEl,
  generatedJSX,
  frameSize,
  treeRoot,
  selectedPath,
  handleSelectNode,
  treeContainerRef,
  downloadScale,
  setDownloadScale,
}) {
  const isLocked = operationMode !== "idle";
  const isCompiling = operationMode === "compiling";

  // Responsive: stack panels when viewport < 1300px
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isNarrow = viewportWidth < 1300;

  return (
    <div
      key="presets"
      style={{
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
        gridTemplateRows: isNarrow ? "2fr 2fr 1fr 1fr" : "1fr 1fr",
        gridTemplateAreas: isNarrow
          ? '"spec" "preview" "code" "tree"'
          : '"spec preview" "code tree"',
        gap: 12,
        minWidth: 0,
        flex: 1,
        minHeight: 0,
        paddingBottom: 16,
        gridAutoRows: "minmax(0, 1fr)",
        animation: "fadeIn 0.2s ease-in-out",
      }}
    >
      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gridArea: "spec",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 8,
            color: "#f5f5f7",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#34C759",
            }}
          />
          WidgetDSL
          <select
            value={selectedExample}
            onChange={(e) => !isLocked && handleExampleChange(e.target.value)}
            disabled={isLocked}
            title={isLocked ? "Locked during operation" : "Select preset"}
            style={{
              padding: "6px 10px",
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: isLocked ? "#1c1c1e" : "#2c2c2e",
              color: isLocked ? "#8e8e93" : "#f5f5f7",
              border: "1px solid #3a3a3c",
              borderRadius: 6,
              cursor: isLocked ? "not-allowed" : "pointer",
              outline: "none",
              marginLeft: "auto",
              opacity: isLocked ? 0.6 : 1,
            }}
            onFocus={(e) =>
              !isLocked && (e.target.style.borderColor = "#007AFF")
            }
            onBlur={(e) => (e.target.style.borderColor = "#3a3a3c")}
          >
            {Object.entries(examples).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </h2>
        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <textarea
            value={currentSpec}
            onChange={(e) => handleSpecChange(e.target.value)}
            spellCheck={false}
            ref={specTextareaRef}
            disabled={isCompiling}
            title={isCompiling ? "Locked during compilation" : ""}
            style={{
              width: "100%",
              height: "100%",
              padding: 16,
              fontSize: 13,
              fontFamily: "Monaco, Consolas, monospace",
              backgroundColor: isCompiling ? "#0a0a0a" : "#0d0d0d",
              color: isCompiling ? "#8e8e93" : "#f5f5f7",
              border: "1px solid #3a3a3c",
              borderRadius: 10,
              resize: "none",
              boxSizing: "border-box",
              overflowY: "auto",
              lineHeight: 1.6,
              outline: "none",
              transition: "border-color 0.2s ease",
              cursor: isCompiling ? "not-allowed" : "text",
              opacity: isCompiling ? 0.6 : 1,
            }}
            onFocus={(e) =>
              !isCompiling && (e.target.style.borderColor = "#007AFF")
            }
            onBlur={(e) => (e.target.style.borderColor = "#3a3a3c")}
          />
        </div>
      </div>

      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gridArea: "code",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 8,
            color: "#f5f5f7",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#FF9500",
            }}
          />
          Generated widget.jsx
        </h2>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 10,
            border: "1px solid #3a3a3c",
            backgroundColor: "#1e1e1e",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <SyntaxHighlighter
              language="jsx"
              style={vscDarkPlus}
              showLineNumbers
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                fontSize: 13,
                borderRadius: 10,
                whiteSpace: "pre",
                minHeight: 0,
                overflow: "visible",
              }}
            >
              {generatedCode}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <PreviewPanel
        ratioInput={ratioInput}
        setRatioInput={setRatioInput}
        enableAutoResize={enableAutoResize}
        setEnableAutoResize={setEnableAutoResize}
        autoSizing={autoSizing}
        operationMode={operationMode}
        handleAutoResizeByRatio={handleAutoResizeByRatio}
        editedSpec={editedSpec}
        currentExample={currentExample}
        setEditedSpec={setEditedSpec}
        handleDownloadWidget={handleDownloadWidget}
        isLoading={isLoading}
        previewContainerRef={previewContainerRef}
        widgetFrameRef={widgetFrameRef}
        setFrameEl={setFrameEl}
        selectedExample={selectedExample}
        generatedJSX={generatedJSX}
        frameSize={frameSize}
        downloadScale={downloadScale}
        setDownloadScale={setDownloadScale}
      />

      <TreePanel
        treeRoot={treeRoot}
        selectedPath={selectedPath}
        onSelect={handleSelectNode}
        treeContainerRef={treeContainerRef}
      />
    </div>
  );
}
