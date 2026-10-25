'use client';

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in section:", error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`p-6 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm flex flex-col items-center text-center gap-4 ${this.props.className || ''}`}>
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <div>
            <h3 className="text-lg font-bold text-red-400">Section Failed to Load</h3>
            <p className="text-sm text-red-300/80 mt-1 max-w-[300px]">
              {this.props.sectionName ? `Error in ${this.props.sectionName}` : 'Something went wrong in this section.'}
            </p>
            {/* Dev only: show basic error message */}
            {process.env.NODE_ENV === 'development' && (
              <pre className="text-xs text-left bg-black/50 p-2 rounded mt-2 text-red-300 overflow-auto max-w-full">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
          <button 
            onClick={this.resetError}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
