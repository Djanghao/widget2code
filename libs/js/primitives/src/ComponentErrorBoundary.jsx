import React, { Component } from 'react';
import { Placeholder } from './Placeholder.jsx';

/**
 * Component-level error boundary that renders a Placeholder when errors occur
 * This provides granular error handling - only the failing component is replaced,
 * not the entire widget
 */
export class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error but don't show it visually
    console.error('[ComponentErrorBoundary] Component failed to render:', error.message);
    if (errorInfo?.componentStack) {
      console.error('[ComponentErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render a Placeholder with the same dimensions as the failed component
      const { width, height } = this.props;
      return <Placeholder width={width} height={height} />;
    }

    return this.props.children;
  }
}
