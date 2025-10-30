/**
 * @file WidgetRenderer.jsx
 * @description Widget renderer using Babel standalone for runtime JSX compilation.
 * Transforms and executes JSX code without file system or lazy imports.
 * @author Houston Zhang
 * @date 2025-10-19
 */

import React, { useEffect, useState, useRef, Component } from "react";
import * as Babel from "@babel/standalone";
import * as WidgetPrimitives from "@widget-factory/primitives";
import * as LucideReact from "react-icons/lu";
import * as CircumIcons from "react-icons/ci";
import * as BoxIcons from "react-icons/bi";
import * as AntDesignIcons from "react-icons/ai";
import * as BootstrapIcons from "react-icons/bs";
import * as CssGgIcons from "react-icons/cg";
import * as DevIcons from "react-icons/di";
import * as FeatherIcons from "react-icons/fi";
import * as FlatColorIcons from "react-icons/fc";
import * as FontAwesome5 from "react-icons/fa";
import * as FontAwesome6 from "react-icons/fa6";
import * as GameIcons from "react-icons/gi";
import * as GithubOcticons from "react-icons/go";
import * as GrommetIcons from "react-icons/gr";
import * as HeroIcons from "react-icons/hi";
import * as HeroIcons2 from "react-icons/hi2";
import * as IcoMoonIcons from "react-icons/im";
import * as Ionicons4 from "react-icons/io";
import * as Ionicons5 from "react-icons/io5";
import * as LineAwesomeIcons from "react-icons/lia";
import * as MaterialDesignIcons from "react-icons/md";
import * as PhosphorIcons from "react-icons/pi";
import * as RadixIcons from "react-icons/rx";
import * as RemixIcons from "react-icons/ri";
import * as SimpleIcons from "react-icons/si";
import * as SimpleLineIcons from "react-icons/sl";
import * as TablerIcons from "react-icons/tb";
import * as ThemifyIcons from "react-icons/tfi";
import * as TypIcons from "react-icons/ti";
import * as VscodeIcons from "react-icons/vsc";
import * as WeatherIcons from "react-icons/wi";

if (typeof window !== "undefined") {
  window.React = React;
  window.WidgetPrimitives = WidgetPrimitives;
  window.LucideReact = LucideReact;
  window.CircumIcons = CircumIcons;
  window.BoxIcons = BoxIcons;
  window.AntDesignIcons = AntDesignIcons;
  window.BootstrapIcons = BootstrapIcons;
  window.CssGgIcons = CssGgIcons;
  window.DevIcons = DevIcons;
  window.FeatherIcons = FeatherIcons;
  window.FlatColorIcons = FlatColorIcons;
  window.FontAwesome5 = FontAwesome5;
  window.FontAwesome6 = FontAwesome6;
  window.GameIcons = GameIcons;
  window.GithubOcticons = GithubOcticons;
  window.GrommetIcons = GrommetIcons;
  window.HeroIcons = HeroIcons;
  window.HeroIcons2 = HeroIcons2;
  window.IcoMoonIcons = IcoMoonIcons;
  window.Ionicons4 = Ionicons4;
  window.Ionicons5 = Ionicons5;
  window.LineAwesomeIcons = LineAwesomeIcons;
  window.MaterialDesignIcons = MaterialDesignIcons;
  window.PhosphorIcons = PhosphorIcons;
  window.RadixIcons = RadixIcons;
  window.RemixIcons = RemixIcons;
  window.SimpleIcons = SimpleIcons;
  window.SimpleLineIcons = SimpleLineIcons;
  window.TablerIcons = TablerIcons;
  window.ThemifyIcons = ThemifyIcons;
  window.TypIcons = TypIcons;
  window.VscodeIcons = VscodeIcons;
  window.WeatherIcons = WeatherIcons;
}

class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "[WidgetErrorBoundary] Caught rendering error:",
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "inline-flex",
            maxWidth: 640,
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            color: "#ff6b6b",
            backgroundColor: "#3a0a0a",
            border: "1px solid #6e1a1a",
            borderRadius: 10,
            padding: 12,
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Widget Rendering Error:
          </div>
          <div
            style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#ff9999" }}
          >
            {String(this.state.error?.message || this.state.error)}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function WidgetRenderer({ jsxCode, onMount, onError }) {
  const [WidgetComponent, setWidgetComponent] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!jsxCode) {
      setWidgetComponent(null);
      setError(null);
      return;
    }

    try {
      console.log("[DirectRenderer] Transforming JSX code...");
      console.log(
        "[DirectRenderer] 📄 Raw JSX code (first 500 chars):",
        jsxCode.substring(0, 500)
      );

      let processedCode = jsxCode;

      // Remove React import
      processedCode = processedCode.replace(
        /import\s+React\s+from\s+['"]react['"];?\n?/g,
        ""
      );

      // Remove primitives imports
      processedCode = processedCode.replace(
        /import\s+\{[^}]*\}\s+from\s+['"]@widget-factory\/primitives['"];?\n?/g,
        ""
      );
      processedCode = processedCode.replace(
        /import\s+\*\s+as\s+\w+\s+from\s+['"]@widget-factory\/primitives['"];?\n?/g,
        ""
      );

      // Extract and remove all react-icons imports
      const iconImports = {
        lucide: [],
        circum: [],
        boxicons: [],
        antDesign: [],
        bootstrap: [],
        cssGg: [],
        devicons: [],
        feather: [],
        flatColor: [],
        fontAwesome5: [],
        fontAwesome6: [],
        gameIcons: [],
        octicons: [],
        grommet: [],
        heroicons: [],
        heroicons2: [],
        icomoon: [],
        ionicons4: [],
        ionicons5: [],
        lineAwesome: [],
        materialDesign: [],
        phosphor: [],
        radix: [],
        remix: [],
        simpleIcons: [],
        simpleLine: [],
        tabler: [],
        themify: [],
        typicons: [],
        vscode: [],
        weather: [],
      };

      // Extract Lucide icons
      const lucideMatch = processedCode.match(
        /import\s+\{([^}]+)\}\s+from\s+['"]react-icons\/lu['"];?\n?/
      );
      if (lucideMatch)
        iconImports.lucide = lucideMatch[1].split(",").map((s) => s.trim());
      processedCode = processedCode.replace(
        /import\s+\{[^}]*\}\s+from\s+['"]react-icons\/lu['"];?\n?/g,
        ""
      );

      // Extract Circum icons
      const circumMatch = processedCode.match(
        /import\s+\{([^}]+)\}\s+from\s+['"]react-icons\/ci['"];?\n?/
      );
      if (circumMatch)
        iconImports.circum = circumMatch[1].split(",").map((s) => s.trim());
      processedCode = processedCode.replace(
        /import\s+\{[^}]*\}\s+from\s+['"]react-icons\/ci['"];?\n?/g,
        ""
      );

      // Extract BoxIcons
      const boxiconsMatch = processedCode.match(
        /import\s+\{([^}]+)\}\s+from\s+['"]react-icons\/bi['"];?\n?/
      );
      if (boxiconsMatch)
        iconImports.boxicons = boxiconsMatch[1].split(",").map((s) => s.trim());
      processedCode = processedCode.replace(
        /import\s+\{[^}]*\}\s+from\s+['"]react-icons\/bi['"];?\n?/g,
        ""
      );

      // Extract all other icon libraries (add similar patterns for each)
      const iconLibraries = [
        { key: "antDesign", path: "ai" },
        { key: "bootstrap", path: "bs" },
        { key: "cssGg", path: "cg" },
        { key: "devicons", path: "di" },
        { key: "feather", path: "fi" },
        { key: "flatColor", path: "fc" },
        { key: "fontAwesome5", path: "fa" },
        { key: "fontAwesome6", path: "fa6" },
        { key: "gameIcons", path: "gi" },
        { key: "octicons", path: "go" },
        { key: "grommet", path: "gr" },
        { key: "heroicons", path: "hi" },
        { key: "heroicons2", path: "hi2" },
        { key: "icomoon", path: "im" },
        { key: "ionicons4", path: "io" },
        { key: "ionicons5", path: "io5" },
        { key: "lineAwesome", path: "lia" },
        { key: "materialDesign", path: "md" },
        { key: "phosphor", path: "pi" },
        { key: "radix", path: "rx" },
        { key: "remix", path: "ri" },
        { key: "simpleIcons", path: "si" },
        { key: "simpleLine", path: "sl" },
        { key: "tabler", path: "tb" },
        { key: "themify", path: "tfi" },
        { key: "typicons", path: "ti" },
        { key: "vscode", path: "vsc" },
        { key: "weather", path: "wi" },
      ];

      iconLibraries.forEach(({ key, path }) => {
        const match = processedCode.match(
          new RegExp(
            `import\\s+\\{([^}]+)\\}\\s+from\\s+['"]react-icons\\/${path}['"];?\\n?`
          )
        );
        if (match) iconImports[key] = match[1].split(",").map((s) => s.trim());
        processedCode = processedCode.replace(
          new RegExp(
            `import\\s+\\{[^}]*\\}\\s+from\\s+['"]react-icons\\/${path}['"];?\\n?`,
            "g"
          ),
          ""
        );
      });

      // Remove old library imports (backward compatibility)
      processedCode = processedCode.replace(
        /import\s+\{[^}]*\}\s+from\s+['"]lucide-react['"];?\n?/g,
        ""
      );
      processedCode = processedCode.replace(
        /import\s+CircumIcon\s+from\s+['"]@klarr-agency\/circum-icons-react['"];?\n?/g,
        ""
      );

      // Remove export default
      processedCode = processedCode.replace(/export\s+default\s+/g, "");

      // Build window object destructuring statements
      const primitivesDestructure = `const { ${Object.keys(
        WidgetPrimitives
      ).join(", ")} } = window.WidgetPrimitives;\n`;

      let iconDestructures = "";
      if (iconImports.lucide.length > 0) {
        iconDestructures += `const { ${iconImports.lucide.join(
          ", "
        )} } = window.LucideReact;\n`;
      }
      if (iconImports.circum.length > 0) {
        iconDestructures += `const { ${iconImports.circum.join(
          ", "
        )} } = window.CircumIcons;\n`;
      }
      if (iconImports.boxicons.length > 0) {
        iconDestructures += `const { ${iconImports.boxicons.join(
          ", "
        )} } = window.BoxIcons;\n`;
      }
      if (iconImports.antDesign.length > 0) {
        iconDestructures += `const { ${iconImports.antDesign.join(
          ", "
        )} } = window.AntDesignIcons;\n`;
      }
      if (iconImports.bootstrap.length > 0) {
        iconDestructures += `const { ${iconImports.bootstrap.join(
          ", "
        )} } = window.BootstrapIcons;\n`;
      }
      if (iconImports.cssGg.length > 0) {
        iconDestructures += `const { ${iconImports.cssGg.join(
          ", "
        )} } = window.CssGgIcons;\n`;
      }
      if (iconImports.devicons.length > 0) {
        iconDestructures += `const { ${iconImports.devicons.join(
          ", "
        )} } = window.DevIcons;\n`;
      }
      if (iconImports.feather.length > 0) {
        iconDestructures += `const { ${iconImports.feather.join(
          ", "
        )} } = window.FeatherIcons;\n`;
      }
      if (iconImports.flatColor.length > 0) {
        iconDestructures += `const { ${iconImports.flatColor.join(
          ", "
        )} } = window.FlatColorIcons;\n`;
      }
      if (iconImports.fontAwesome5.length > 0) {
        iconDestructures += `const { ${iconImports.fontAwesome5.join(
          ", "
        )} } = window.FontAwesome5;\n`;
      }
      if (iconImports.fontAwesome6.length > 0) {
        iconDestructures += `const { ${iconImports.fontAwesome6.join(
          ", "
        )} } = window.FontAwesome6;\n`;
      }
      if (iconImports.gameIcons.length > 0) {
        iconDestructures += `const { ${iconImports.gameIcons.join(
          ", "
        )} } = window.GameIcons;\n`;
      }
      if (iconImports.octicons.length > 0) {
        iconDestructures += `const { ${iconImports.octicons.join(
          ", "
        )} } = window.GithubOcticons;\n`;
      }
      if (iconImports.grommet.length > 0) {
        iconDestructures += `const { ${iconImports.grommet.join(
          ", "
        )} } = window.GrommetIcons;\n`;
      }
      if (iconImports.heroicons.length > 0) {
        iconDestructures += `const { ${iconImports.heroicons.join(
          ", "
        )} } = window.HeroIcons;\n`;
      }
      if (iconImports.heroicons2.length > 0) {
        iconDestructures += `const { ${iconImports.heroicons2.join(
          ", "
        )} } = window.HeroIcons2;\n`;
      }
      if (iconImports.icomoon.length > 0) {
        iconDestructures += `const { ${iconImports.icomoon.join(
          ", "
        )} } = window.IcoMoonIcons;\n`;
      }
      if (iconImports.ionicons4.length > 0) {
        iconDestructures += `const { ${iconImports.ionicons4.join(
          ", "
        )} } = window.Ionicons4;\n`;
      }
      if (iconImports.ionicons5.length > 0) {
        iconDestructures += `const { ${iconImports.ionicons5.join(
          ", "
        )} } = window.Ionicons5;\n`;
      }
      if (iconImports.lineAwesome.length > 0) {
        iconDestructures += `const { ${iconImports.lineAwesome.join(
          ", "
        )} } = window.LineAwesomeIcons;\n`;
      }
      if (iconImports.materialDesign.length > 0) {
        iconDestructures += `const { ${iconImports.materialDesign.join(
          ", "
        )} } = window.MaterialDesignIcons;\n`;
      }
      if (iconImports.phosphor.length > 0) {
        iconDestructures += `const { ${iconImports.phosphor.join(
          ", "
        )} } = window.PhosphorIcons;\n`;
      }
      if (iconImports.radix.length > 0) {
        iconDestructures += `const { ${iconImports.radix.join(
          ", "
        )} } = window.RadixIcons;\n`;
      }
      if (iconImports.remix.length > 0) {
        iconDestructures += `const { ${iconImports.remix.join(
          ", "
        )} } = window.RemixIcons;\n`;
      }
      if (iconImports.simpleIcons.length > 0) {
        iconDestructures += `const { ${iconImports.simpleIcons.join(
          ", "
        )} } = window.SimpleIcons;\n`;
      }
      if (iconImports.simpleLine.length > 0) {
        iconDestructures += `const { ${iconImports.simpleLine.join(
          ", "
        )} } = window.SimpleLineIcons;\n`;
      }
      if (iconImports.tabler.length > 0) {
        iconDestructures += `const { ${iconImports.tabler.join(
          ", "
        )} } = window.TablerIcons;\n`;
      }
      if (iconImports.themify.length > 0) {
        iconDestructures += `const { ${iconImports.themify.join(
          ", "
        )} } = window.ThemifyIcons;\n`;
      }
      if (iconImports.typicons.length > 0) {
        iconDestructures += `const { ${iconImports.typicons.join(
          ", "
        )} } = window.TypIcons;\n`;
      }
      if (iconImports.vscode.length > 0) {
        iconDestructures += `const { ${iconImports.vscode.join(
          ", "
        )} } = window.VscodeIcons;\n`;
      }
      if (iconImports.weather.length > 0) {
        iconDestructures += `const { ${iconImports.weather.join(
          ", "
        )} } = window.WeatherIcons;\n`;
      }

      processedCode = primitivesDestructure + iconDestructures + processedCode;

      const transformed = Babel.transform(processedCode, {
        presets: ["react"],
        filename: "widget.jsx",
      }).code;

      console.log("[DirectRenderer] Creating component...");

      const componentFactory = new Function(
        "React",
        `${transformed}\nreturn Widget;`
      );

      const Component = componentFactory(React);
      setWidgetComponent(() => Component);
      setError(null);

      console.log("[DirectRenderer] Component created successfully");

      if (!mountedRef.current) {
        mountedRef.current = true;
        if (onMount) {
          setTimeout(() => onMount(), 0);
        }
      }
    } catch (err) {
      console.error("[DirectRenderer] Error:", err);
      setError(err);
      setWidgetComponent(null);
      if (onError) {
        onError(err);
      }
    }
  }, [jsxCode, onMount, onError]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: "inline-flex",
          maxWidth: 640,
          alignItems: "center",
          justifyContent: "flex-start",
          color: "#ff6b6b",
          backgroundColor: "#3a0a0a",
          border: "1px solid #6e1a1a",
          borderRadius: 10,
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontWeight: 700, marginRight: 8 }}>Render Error:</div>
        <div style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
          {String(error?.message || error)}
        </div>
      </div>
    );
  }

  if (!WidgetComponent) {
    return null;
  }

  console.log("[WidgetRenderer] 🎬 Rendering widget component now...");
  return (
    <WidgetErrorBoundary>
      <WidgetComponent />
    </WidgetErrorBoundary>
  );
}

export default WidgetRenderer;
