/**
 * @file DSLMutations.jsx
 * @description DSL Mutations comparison viewer for synthetic DSL generation results.
 * Displays side-by-side comparison of seed and mutated widgets with their DSL code.
 * @author AI Assistant
 * @date 2025-10-31
 */

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import WidgetRenderer from "./components/WidgetRenderer.jsx";
import { compileWidgetDSLToJSX } from "@widget-factory/compiler";

function DSLMutations() {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchPath, setSelectedBatchPath] = useState("");
  const [batchData, setBatchData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compiledSeedJSX, setCompiledSeedJSX] = useState(null);
  const [compiledMutatedJSX, setCompiledMutatedJSX] = useState(null);
  const [compileError, setCompileError] = useState(null);

  // Pagination settings
  const itemsPerPage = 25;
  const totalPages = batchData ? Math.ceil(batchData.length / itemsPerPage) : 0;
  const currentPage = Math.floor(currentIndex / itemsPerPage) + 1;

  // Load available batches on mount
  useEffect(() => {
    loadAvailableBatches();
  }, []);

  // Compile DSLs when current index changes
  useEffect(() => {
    if (batchData && batchData.length > 0 && currentIndex < batchData.length) {
      const currentItem = batchData[currentIndex];
      compileDSLs(currentItem);
    }
  }, [currentIndex, batchData]);

  const loadAvailableBatches = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/dsl-batches");
      const result = await response.json();

      if (result.success && result.batches) {
        setAvailableBatches(result.batches);
        setIsLoading(false);
      } else {
        throw new Error(result.error || "Failed to load available batches");
      }
    } catch (err) {
      console.error("Error loading batch files:", err);
      setError(`Failed to load batch files: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleBatchSelect = async (event) => {
    const batchPath = event.target.value;
    if (!batchPath) {
      setBatchData(null);
      setSelectedBatchPath("");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompileError(null);

    try {
      const [runId, filename] = batchPath.split("/");
      const response = await fetch(`/api/dsl-batches/${runId}/${filename}`);
      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load batch data");
      }

      const data = result.data;

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid batch file format. Expected an array of DSL entries."
        );
      }

      setBatchData(data);
      setSelectedBatchPath(batchPath);
      setCurrentIndex(0);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading batch file:", err);
      setError(`Failed to load batch file: ${err.message}`);
      setIsLoading(false);
      setBatchData(null);
    }
  };

  const compileDSLs = async (item) => {
    setCompileError(null);
    setCompiledSeedJSX(null);
    setCompiledMutatedJSX(null);

    try {
      // Compile seed DSL
      const seedJSX = compileWidgetDSLToJSX(item.seedDSL);
      setCompiledSeedJSX(seedJSX);

      // Compile mutated DSL
      const mutatedJSX = compileWidgetDSLToJSX(item.resultDSL);
      setCompiledMutatedJSX(mutatedJSX);
    } catch (err) {
      console.error("Compilation error:", err);
      setCompileError(err.message);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (batchData && currentIndex < batchData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePageChange = (pageNum) => {
    const newIndex = (pageNum - 1) * itemsPerPage;
    if (newIndex >= 0 && newIndex < (batchData?.length || 0)) {
      setCurrentIndex(newIndex);
    }
  };

  const currentItem = batchData?.[currentIndex];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Header with batch selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 20px",
          backgroundColor: "#2c2c2e",
          borderRadius: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}
        >
          <label
            style={{
              color: "#f5f5f7",
              fontSize: 15,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Select Batch:
          </label>
          <select
            value={selectedBatchPath}
            onChange={handleBatchSelect}
            disabled={isLoading}
            style={{
              flex: 1,
              maxWidth: 500,
              padding: "8px 12px",
              backgroundColor: "#1c1c1e",
              color: "#f5f5f7",
              border: "1px solid #3a3a3c",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <option value="">-- Select a batch file --</option>
            {availableBatches.map((batch) => (
              <option key={batch.path} value={batch.path}>
                {batch.runId} / {batch.filename} ({batch.sizeMB} MB)
              </option>
            ))}
          </select>
          <button
            onClick={loadAvailableBatches}
            disabled={isLoading}
            style={{
              padding: "8px 12px",
              backgroundColor: "#007AFF",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 500,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {batchData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#8e8e93",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#f5f5f7", fontWeight: 500 }}>
              {currentIndex + 1} of {batchData.length}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                style={{
                  padding: "6px 10px",
                  backgroundColor: currentIndex === 0 ? "#2c2c2e" : "#3a3a3c",
                  color: currentIndex === 0 ? "#636366" : "#f5f5f7",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                disabled={!batchData || currentIndex >= batchData.length - 1}
                style={{
                  padding: "6px 10px",
                  backgroundColor:
                    !batchData || currentIndex >= batchData.length - 1
                      ? "#2c2c2e"
                      : "#3a3a3c",
                  color:
                    !batchData || currentIndex >= batchData.length - 1
                      ? "#636366"
                      : "#f5f5f7",
                  border: "none",
                  borderRadius: 6,
                  cursor:
                    !batchData || currentIndex >= batchData.length - 1
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {batchData && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "0 20px",
            flexShrink: 0,
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    pageNum === currentPage ? "#007AFF" : "#2c2c2e",
                  color: pageNum === currentPage ? "#fff" : "#8e8e93",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {pageNum}
              </button>
            )
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#3a0a0a",
            border: "1px solid #6e1a1a",
            borderRadius: 8,
            color: "#ff6b6b",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Compile error display */}
      {compileError && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#3a0a0a",
            border: "1px solid #6e1a1a",
            borderRadius: 8,
            color: "#ff6b6b",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          <strong>Compilation Error:</strong> {compileError}
        </div>
      )}

      {/* Main comparison view */}
      {batchData && currentItem && (
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto 1fr",
            gap: 16,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Top-left: Seed Widget Render */}
          <div
            style={{
              backgroundColor: "#2c2c2e",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                color: "#f5f5f7",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Seed Widget
            </h3>
            <div
              style={{
                backgroundColor: "#1c1c1e",
                borderRadius: 8,
                padding: 16,
                maxHeight: 500,
                overflow: "auto",
              }}
            >
              {compiledSeedJSX && (
                <div
                  style={{
                    transform: "scale(0.8)",
                    transformOrigin: "top left",
                    display: "inline-block",
                  }}
                >
                  <WidgetRenderer jsxCode={compiledSeedJSX} />
                </div>
              )}
            </div>
          </div>

          {/* Top-right: Mutated Widget Render */}
          <div
            style={{
              backgroundColor: "#2c2c2e",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                color: "#f5f5f7",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Mutated Widget
            </h3>
            <div
              style={{
                backgroundColor: "#1c1c1e",
                borderRadius: 8,
                padding: 16,
                maxHeight: 500,
                overflow: "auto",
              }}
            >
              {compiledMutatedJSX && (
                <div
                  style={{
                    transform: "scale(0.8)",
                    transformOrigin: "top left",
                    display: "inline-block",
                  }}
                >
                  <WidgetRenderer jsxCode={compiledMutatedJSX} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom-left: Seed DSL */}
          <div
            style={{
              backgroundColor: "#2c2c2e",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                color: "#f5f5f7",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Seed DSL
            </h3>
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: 12,
                backgroundColor: "#1c1c1e",
                borderRadius: 8,
                color: "#f5f5f7",
                fontSize: 12,
                fontFamily: "Monaco, Menlo, monospace",
                overflow: "auto",
                lineHeight: 1.5,
                minHeight: 0,
              }}
            >
              {JSON.stringify(currentItem.seedDSL, null, 2)}
            </pre>
          </div>

          {/* Bottom-right: Mutated DSL with mutations info */}
          <div
            style={{
              backgroundColor: "#2c2c2e",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              gap: 12,
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  color: "#f5f5f7",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Mutated DSL
              </h3>
              {currentItem.mutations && currentItem.mutations.length > 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#1c1c1e",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#8e8e93",
                  }}
                >
                  <strong style={{ color: "#f5f5f7" }}>
                    Mutations Applied ({currentItem.mutations.length}):
                  </strong>
                  <div style={{ marginTop: 6 }}>
                    {currentItem.mutations.map((m, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <span style={{ color: "#007AFF", fontWeight: 600 }}>
                          {i + 1}. {m.mutation}
                        </span>
                        {m.description && (
                          <span style={{ color: "#8e8e93", marginLeft: 8 }}>
                            - {m.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: 12,
                backgroundColor: "#1c1c1e",
                borderRadius: 8,
                color: "#f5f5f7",
                fontSize: 12,
                fontFamily: "Monaco, Menlo, monospace",
                overflow: "auto",
                lineHeight: 1.5,
                minHeight: 0,
              }}
            >
              {JSON.stringify(currentItem.resultDSL, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!batchData && !isLoading && !error && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2c2c2e",
            borderRadius: 12,
            padding: 40,
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#8e8e93",
              maxWidth: 400,
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "#f5f5f7", fontSize: 18 }}>
              No Batch File Loaded
            </h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Select a batch file from the dropdown above to start comparing
              seed and mutated DSLs.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !batchData && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2c2c2e",
            borderRadius: 12,
          }}
        >
          <div style={{ textAlign: "center", color: "#8e8e93" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid #3a3a3c",
                borderTopColor: "#007AFF",
                borderRadius: "50%",
                margin: "0 auto 12px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ margin: 0, fontSize: 14 }}>Loading batch files...</p>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default DSLMutations;
