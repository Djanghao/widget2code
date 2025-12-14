import React, { useEffect, useState } from "react";
import { LuMenu as Menu, LuX as X } from "react-icons/lu";
import { useApiKey } from "../ApiKeyManager.jsx";

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      fontSize: 15,
      fontWeight: 500,
      backgroundColor: "transparent",
      color: active ? "#f5f5f7" : "#8e8e93",
      border: "none",
      borderBottom: active ? "2px solid #007AFF" : "2px solid transparent",
      cursor: "pointer",
      transition: "all 0.2s ease",
      position: "relative",
    }}
    onMouseEnter={(e) => {
      if (!active) e.target.style.color = "#f5f5f7";
    }}
    onMouseLeave={(e) => {
      if (!active) e.target.style.color = "#8e8e93";
    }}
  >
    {children}
  </button>
);

const MobileMenuItem = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "16px 24px",
      fontSize: 16,
      fontWeight: 500,
      backgroundColor: active ? "#2c2c2e" : "transparent",
      color: active ? "#007AFF" : "#f5f5f7",
      border: "none",
      borderLeft: active ? "3px solid #007AFF" : "3px solid transparent",
      cursor: "pointer",
      transition: "all 0.2s ease",
      textAlign: "left",
      width: "100%",
      display: "block",
    }}
    onMouseEnter={(e) => {
      if (!active) e.target.style.backgroundColor = "#2c2c2e";
    }}
    onMouseLeave={(e) => {
      if (!active) e.target.style.backgroundColor = "transparent";
    }}
  >
    {children}
  </button>
);

export default function AppHeader({
  activeTab,
  onTabChange,
  onMaterialsClick,
  onApiKeyClick,
}) {
  const { hasApiKey } = useApiKey();
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const useBurgerMenu = vw < 1300;

  const handleTabChange = (tab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        marginBottom: 12,
        flexShrink: 0,
        borderBottom: "1px solid #2c2c2e",
        paddingBottom: 12,
        position: "relative",
      }}
    >
      {useBurgerMenu ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              minHeight: 28,
            }}
          >
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                padding: 8,
                backgroundColor: "transparent",
                color: "#f5f5f7",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#007AFF")}
              onMouseLeave={(e) => (e.target.style.color = "#f5f5f7")}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h1
              onClick={() => handleTabChange("presets")}
              style={{
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                color: "#f5f5f7",
                letterSpacing: "-0.3px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flex: 1,
                lineHeight: "28px",
              }}
            >
              Widget Factory
            </h1>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onApiKeyClick}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: hasApiKey
                    ? "rgba(52, 199, 89, 0.15)"
                    : "rgba(255, 149, 0, 0.15)",
                  color: hasApiKey ? "#34C759" : "#FF9500",
                  border: `1px solid ${
                    hasApiKey
                      ? "rgba(52, 199, 89, 0.3)"
                      : "rgba(255, 149, 0, 0.3)"
                  }`,
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = hasApiKey
                    ? "rgba(52, 199, 89, 0.25)"
                    : "rgba(255, 149, 0, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = hasApiKey
                    ? "rgba(52, 199, 89, 0.15)"
                    : "rgba(255, 149, 0, 0.15)";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                API
              </button>
              <button
                onClick={onMaterialsClick}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: "#2c2c2e",
                  color: "#f5f5f7",
                  border: "1px solid #3a3a3c",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#3a3a3c")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#2c2c2e")
                }
              >
                Materials
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <>
              <div
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 998,
                  animation: "fadeIn 0.2s ease-in-out",
                }}
              />
              <nav
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: "80%",
                  maxWidth: 320,
                  backgroundColor: "#1c1c1e",
                  zIndex: 999,
                  overflowY: "auto",
                  boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
                  animation: "slideInLeft 0.3s ease-out",
                  paddingTop: 60,
                }}
              >
                <div style={{ padding: "8px 0" }}>
                  <div
                    style={{
                      padding: "0 24px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#8e8e93",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Main
                  </div>
                  <MobileMenuItem
                    active={activeTab === "presets"}
                    onClick={() => handleTabChange("presets")}
                  >
                    Presets
                  </MobileMenuItem>
                  <MobileMenuItem
                    active={activeTab === "widget2code"}
                    onClick={() => handleTabChange("widget2code")}
                  >
                    Widget2Code
                  </MobileMenuItem>
                </div>
              </nav>
            </>
          )}
        </>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              minWidth: 0,
            }}
          >
            <h1
              onClick={() => onTabChange("presets")}
              style={{
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                color: "#f5f5f7",
                letterSpacing: "-0.3px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                lineHeight: "28px",
              }}
            >
              Widget Factory
            </h1>
            <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
              <TabButton
                active={activeTab === "presets"}
                onClick={() => onTabChange("presets")}
              >
                Presets
              </TabButton>
              <TabButton
                active={activeTab === "widget2code"}
                onClick={() => onTabChange("widget2code")}
              >
                Widget2Code
              </TabButton>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={onApiKeyClick}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: hasApiKey
                  ? "rgba(52, 199, 89, 0.15)"
                  : "rgba(255, 149, 0, 0.15)",
                color: hasApiKey ? "#34C759" : "#FF9500",
                border: `1px solid ${
                  hasApiKey
                    ? "rgba(52, 199, 89, 0.3)"
                    : "rgba(255, 149, 0, 0.3)"
                }`,
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = hasApiKey
                  ? "rgba(52, 199, 89, 0.25)"
                  : "rgba(255, 149, 0, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = hasApiKey
                  ? "rgba(52, 199, 89, 0.15)"
                  : "rgba(255, 149, 0, 0.15)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {hasApiKey ? "API Key" : "Configure API"}
            </button>
            <button
              onClick={onMaterialsClick}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: "#2c2c2e",
                color: "#f5f5f7",
                border: "1px solid #3a3a3c",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#3a3a3c")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2c2c2e")}
            >
              Materials
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
