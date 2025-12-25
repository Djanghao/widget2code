export const Slider = ({
  value = 50,
  enabled = true,
  color = '#007AFF',
  thumbColor = '#f0f0f0',
  width = 100,
  height = 4,
  thumbSize,
  minWidth = 100,
  minHeight = 20,
  ...props
}) => {
  // Normalize value between 0-100
  const percentage = Math.max(0, Math.min(100, value));

  // Calculate thumb size if not provided
  const finalThumbSize = thumbSize !== undefined ? thumbSize : height * 5;

  const containerStyle = {
    width: '100%',
    minWidth,
    minHeight,
    display: 'flex',
    alignItems: 'center',
    opacity: enabled ? 1 : 0.5,
    boxSizing: 'border-box',
    ...props.style,
  };

  const sliderTrackStyle = {
    position: 'relative',
    width: width,
    height: height,
    backgroundColor: '#e0e0e0',
    borderRadius: height / 2,
  };

  const activeTrackStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: color,
    borderRadius: height / 2,
  };

  const thumbStyle = {
    position: 'absolute',
    top: '50%',
    left: `${percentage}%`,
    width: finalThumbSize,
    height: finalThumbSize,
    backgroundColor: thumbColor,
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
  };

  return (
    <div style={containerStyle}>
      <div style={sliderTrackStyle}>
        <div style={activeTrackStyle} />
        <div style={thumbStyle} />
      </div>
    </div>
  );
};
