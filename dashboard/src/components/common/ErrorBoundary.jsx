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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass rounded-2xl p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={28} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Something went wrong</h2>
              <p className="text-slate-400 text-sm">
                An unexpected error occurred. Our team has been notified.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="mt-4 text-left text-xs text-red-400 bg-slate-900 rounded-lg p-3 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
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
