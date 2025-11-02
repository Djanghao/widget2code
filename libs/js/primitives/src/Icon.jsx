import React, { useState, useEffect } from "react";
import { sfDynamicIconImports } from "@widget-factory/icons/sf-symbols";
import {
  lucideIconsMap,
  antDesignIconsMap,
  boxiconsIconsMap,
  circumIconsMap,
  cssGgIconsMap,
  deviconsIconsMap,
  featherIconsMap,
  flatColorIconsMap,
  grommetIconsMap,
  heroiconsIconsMap,
  heroicons2IconsMap,
  icomoonFreeIconsMap,
  ionicons4IconsMap,
  ionicons5IconsMap,
  githubOcticonsIconsMap,
  materialDesignIconsMap,
  phosphorIconsMap,
  radixIconsMap,
  remixIconsMap,
  simpleIconsMap,
  simpleLineIconsMap,
  tablerIconsMap,
  themifyIconsMap,
  typiconsIconsMap,
  vscodeIconsMap,
  weatherIconsIconsMap,
  fa5IconsMap,
  fa6IconsMap,
  gameIconsIconsMap,
  bootstrapIconsMap,
  lineAwesomeIconsMap,
} from "../../icons/src/index.jsx";
import { iconCache } from "./utils/iconCache.js";

// Map of react-icons library prefixes to their icon maps
// Only short prefixes - Widget DSL uses format: "prefix:IconName" (e.g., "lu:LuHeart")
const ICON_LIBRARIES = {
  lu: lucideIconsMap,
  ai: antDesignIconsMap,
  bi: boxiconsIconsMap,
  bs: bootstrapIconsMap,
  cg: cssGgIconsMap,
  ci: circumIconsMap,
  di: deviconsIconsMap,
  fa: fa5IconsMap,
  fa6: fa6IconsMap,
  fc: flatColorIconsMap,
  fi: featherIconsMap,
  gi: gameIconsIconsMap,
  go: githubOcticonsIconsMap,
  gr: grommetIconsMap,
  hi: heroiconsIconsMap,
  hi2: heroicons2IconsMap,
  im: icomoonFreeIconsMap,
  io: ionicons4IconsMap,
  io5: ionicons5IconsMap,
  lia: lineAwesomeIconsMap,
  md: materialDesignIconsMap,
  pi: phosphorIconsMap,
  rx: radixIconsMap,
  ri: remixIconsMap,
  si: simpleIconsMap,
  sl: simpleLineIconsMap,
  tb: tablerIconsMap,
  tfi: themifyIconsMap,
  ti: typiconsIconsMap,
  vsc: vscodeIconsMap,
  wi: weatherIconsIconsMap,
};

export function Icon({
  name,
  size = 20,
  color = "rgba(255, 255, 255, 0.85)",
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const [IconComp, setIconComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReactIcon, setIsReactIcon] = useState(false);

  useEffect(() => {
    if (!name) {
      setLoading(false);
      return;
    }

    // React-icons format: "prefix:IconName" (e.g., "lu:LuHeart")
    const colonIndex = name.indexOf(":");
    if (colonIndex > 0) {
      const libraryPrefix = name.substring(0, colonIndex);
      const iconName = name.substring(colonIndex + 1);
      const iconMap = ICON_LIBRARIES[libraryPrefix.toLowerCase()];

      if (iconMap) {
        const comp = iconMap[iconName];
        if (comp) {
          setIconComp(() => comp);
          setIsReactIcon(true);
          setLoading(false);
          return;
        }
      }
    }

    // SF Symbols fallback (supports both formats: "sf:bolt.fill" and "sf:SfBoltFill")
    const sfName = name.startsWith("sf:") ? name.replace("sf:", "") : name;

    if (iconCache.has(sfName)) {
      setIconComp(() => iconCache.get(sfName));
      setIsReactIcon(false);
      setLoading(false);
      return;
    }

    const loader = sfDynamicIconImports?.[sfName];
    if (loader) {
      setLoading(true);
      loader()
        .then((module) => {
          const comp = module.default;
          iconCache.set(sfName, comp);
          setIconComp(() => comp);
          setIsReactIcon(false);
          setLoading(false);
        })
        .catch((err) => {
          console.error(`Failed to load SF Symbol: ${sfName}`, err);
          setIconComp(null);
          setIsReactIcon(false);
          setLoading(false);
        });
    } else {
      setIconComp(null);
      setIsReactIcon(false);
      setLoading(false);
    }
  }, [name]);

  const wrapperStyle = {
    "--icon-color": color,
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    flexShrink: 0,
    ...style,
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(flexBasis !== undefined ? { flexBasis } : {}),
  };
  if (loading) {
    return (
      <div {...rest} style={wrapperStyle}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
        </svg>
      </div>
    );
  }

  if (!IconComp) {
    return (
      <div {...rest} style={wrapperStyle}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="4"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M8 12h8M12 8v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (isReactIcon) {
    return (
      <div {...rest} style={wrapperStyle}>
        <IconComp size={size} color={color} />
      </div>
    );
  }

  return (
    <div {...rest} style={wrapperStyle}>
      <IconComp />
    </div>
  );
}
