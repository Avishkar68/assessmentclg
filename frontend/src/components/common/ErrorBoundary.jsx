import React, { Component } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Friendly fallback UI matching application aesthetics
      return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
          {/* Background decoration blur blobs */}
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-orange-650/5 blur-3xl animate-pulse translate-x-1/2 translate-y-1/2"></div>

          <Card hoverable={false} className="max-w-md w-full border-red-500/20 relative z-10">
            <Card.Body className="p-8 sm:p-10 flex flex-col items-center gap-5">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl animate-bounce">
                <ShieldAlert className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  Application Crash Detected
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Something went wrong while rendering this page. Uncaught client-side exception encountered.
                </p>
              </div>

              {this.state.error && (
                <div className="w-full bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-left font-mono text-[10px] text-red-400 overflow-x-auto max-h-28 leading-normal">
                  {this.state.error.toString()}
                </div>
              )}

              <Button
                variant="primary"
                onClick={this.handleReset}
                icon={RotateCcw}
                className="w-full mt-2"
              >
                Reload Application
              </Button>
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
