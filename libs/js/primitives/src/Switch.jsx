export const Switch = ({
  on = false,
  onColor = '#34C759',
  offColor = '#e0e0e0',
  thumbColor = '#ffffff',
  width = 51,
  height = 31,
  minWidth = 51,
  minHeight = 31,
  ...props
}) => {
  const containerStyle = {
    width: '100%',
    minWidth,
    minHeight,
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    ...props.style,
  };

  const switchStyle = {
    position: 'relative',
    width: width,
    height: height,
    backgroundColor: on ? onColor : offColor,
    borderRadius: height / 2,
    transition: 'background-color 0.2s ease',
  };

  const thumbSize = height - 4;
  const thumbPosition = on ? width - thumbSize - 2 : 2;

  const thumbStyle = {
    position: 'absolute',
    top: 2,
    left: thumbPosition,
    width: thumbSize,
    height: thumbSize,
    backgroundColor: thumbColor,
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'left 0.2s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={switchStyle}>
        <div style={thumbStyle} />
      </div>
    </div>
  );
};
