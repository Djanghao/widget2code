import React, { useState, useEffect } from "react";
import { sfDynamicIconImports } from "../../icons/sf-symbols/src/index.jsx";
import { lucideIconsMap } from "../../icons/src/index.jsx";
import { iconCache } from "./utils/iconCache.js";

export function ProgressRing({
  percentage = 0,
  color = "#34C759",
  backgroundColor = "#d1d1d6",
  size = 80,
  strokeWidth = 6,
  iconName,
  iconSize = 32,
  iconColor = "#000000",
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const [IconComp, setIconComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLucide, setIsLucide] = useState(false);

  useEffect(() => {
    if (!iconName) {
      setLoading(false);
      return;
    }

    if (iconName.startsWith("lucide:")) {
      const lucideName = iconName.replace("lucide:", "");
      const comp = lucideIconsMap?.[lucideName];
      setIconComp(() => comp);
      setIsLucide(true);
      setLoading(false);
    } else {
      const sfName = iconName.startsWith("sf:")
        ? iconName.replace("sf:", "")
        : iconName;

      if (iconCache.has(sfName)) {
        setIconComp(() => iconCache.get(sfName));
        setIsLucide(false);
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
            setIsLucide(false);
            setLoading(false);
          })
          .catch((err) => {
            console.error(`[ProgressRing] Failed to load icon: ${sfName}`, err);
            setIconComp(null);
            setIsLucide(false);
            setLoading(false);
          });
      } else {
        setIconComp(null);
        setIsLucide(false);
        setLoading(false);
      }
    }
  }, [iconName]);

  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (normalizedPercentage / 100) * circumference;

  const wrapperStyle = {
    position: "relative",
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

  const iconWrapperStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "--icon-color": iconColor,
    width: iconSize,
    height: iconSize,
  };

  return (
    <div {...rest} style={wrapperStyle}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>

      {iconName && IconComp && (
        <div style={iconWrapperStyle}>
          {isLucide ? (
            <IconComp size={iconSize} color={iconColor} />
          ) : (
            <IconComp />
          )}
        </div>
      )}

      {iconName && !IconComp && !loading && (
        <div style={iconWrapperStyle}>
          <svg
            width={iconSize}
            height={iconSize}
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
          </svg>
        </div>
      )}
    </div>
  );
}
