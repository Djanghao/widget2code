import React from 'react';

export function PreviewErrorBoundary({ children, fallback = null, resetKey }) {
  return (
    <ErrorBoundaryInner fallback={fallback} resetKey={resetKey}>
      {children}
    </ErrorBoundaryInner>
  );
}

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Preview render error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey) {
      // Reset error state when the reset key changes (e.g., new spec/code)
      // so the preview can attempt to render again.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    const { fallback } = this.props;
    if (error) {
      if (typeof fallback === 'function') return fallback(error);
      if (fallback) return fallback;
      return (
        <div style={{
          color: '#ff6b6b',
          backgroundColor: '#3a0a0a',
          border: '1px solid #6e1a1a',
          borderRadius: 10,
          padding: 12,
          maxWidth: 560,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Preview Error</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(error?.message || error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

