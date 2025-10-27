import React, { useEffect, useRef } from 'react';

export function Sparkline({
  width = 80,
  height = 40,
  color = '#34C759',
  data = [],
  fill = false,
  baseline = null,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  style = {},
  ...rest
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length < 2 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    if (baseline !== null && baseline >= min && baseline <= max) {
      const baselineY = height - ((baseline - min) / range) * height;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color + '66';
      ctx.lineWidth = 1;
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (fill) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '66');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [width, height, color, data, fill, baseline]);

  return (
    <canvas
      ref={canvasRef}
      {...rest}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        flexShrink: 0,
        ...style,
        ...(flex !== undefined ? { flex } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexShrink !== undefined ? { flexShrink } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {})
      }}
    />
  );
}
