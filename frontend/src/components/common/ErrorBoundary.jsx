import { Component } from 'react';

/**
 * React Error Boundary — catches runtime errors in any child subtree.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Or use the default fallback UI by omitting `fallback`.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you would send this to an error-tracking service (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
          <div className="text-red-400 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-6">
            An unexpected error occurred in this section. Your other work is safe.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-left text-xs text-red-300 bg-gray-900 rounded-lg p-4 mb-4 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
