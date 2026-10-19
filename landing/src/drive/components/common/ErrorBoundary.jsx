import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[DriveUnify] Render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-2xl p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={28} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink mb-2">Something went wrong</h2>
              <p className="text-muted text-sm">
                An unexpected error occurred. Our team has been notified.
              </p>
              {(process.env.NODE_ENV !== 'production') && this.state.error && (
                <pre className="mt-4 text-left text-xs text-red-400 bg-raised rounded-lg p-3 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-brand-ink hover:brightness-110 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
