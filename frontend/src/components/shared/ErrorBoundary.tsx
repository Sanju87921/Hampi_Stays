import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload(); // Hard reload for extreme cases to clear corrupted state
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-sand-50 rounded-3xl border border-sand-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-cinematic text-navy-950 mb-3">Something went wrong</h2>
            <p className="text-sm text-navy-950/60 mb-8 leading-relaxed">
              We encountered an unexpected error while loading this module. 
              Our team has been notified. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-white p-4 rounded-xl border border-red-100 mb-8 overflow-auto max-h-48 text-xs font-mono text-red-900 shadow-sm">
                <strong>{this.state.error.toString()}</strong>
                <br />
                {this.state.errorInfo?.componentStack}
              </div>
            )}

            <Button 
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 rounded-full h-12"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </Button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
