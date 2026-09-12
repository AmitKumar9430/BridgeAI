import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset
        });
      }

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-full border border-rose-500/40 uppercase tracking-wider">
                Application Recovery Shield
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Something Went Wrong
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                An unexpected interface issue occurred while loading this view. Your session data and progress have been preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/60 rounded-xl border border-slate-800 text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  window.location.href = '/';
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
