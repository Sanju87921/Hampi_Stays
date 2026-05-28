import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Wifi } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isChunkError: boolean;
}

/**
 * Detects whether the error is a Cloudflare/CDN stale chunk error.
 * This happens when a new deployment invalidates old JS chunk hashes
 * but a user's browser still has the old HTML pointing to the deleted files.
 */
function isChunkLoadError(error: Error): boolean {
  const msg = error?.message?.toLowerCase() || "";
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("failed to fetch") ||
    error?.name === "ChunkLoadError"
  );
}

export class ErrorBoundary extends Component<Props, State> {
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  public state: State = {
    hasError: false,
    isChunkError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log non-chunk errors — chunk errors are expected after deployments
    if (!isChunkLoadError(error)) {
      console.error("Uncaught error:", error, errorInfo);
    }
    this.setState({ errorInfo });

    // Auto-reload after 3s if it's a stale chunk error
    if (isChunkLoadError(error)) {
      this.reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  public componentWillUnmount() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
  }

  private handleReset = () => {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      // Stale chunk / new deployment detected
      if (this.state.isChunkError) {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-sand-50  rounded-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wifi className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-navy-950  mb-3">
                New Version Available
              </h2>
              <p className="text-sm text-navy-950/60  mb-8 leading-relaxed">
                HampiStays was updated in the background.
                <br />
                Refreshing automatically in a moment…
              </p>
              <Button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 rounded-full h-12"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh Now
              </Button>
            </motion.div>
          </div>
        );
      }

      // Generic runtime error
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-sand-50  rounded-3xl border border-sand-200 ">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-navy-950  mb-3">
              Something went wrong
            </h2>
            <p className="text-sm text-navy-950/60  mb-8 leading-relaxed">
              We encountered an unexpected error while loading this module.
              Our team has been notified. Please try refreshing the page.
            </p>

            {this.state.error && (
              <div className="text-left bg-white  p-4 rounded-xl border border-red-100 mb-8 overflow-auto max-h-48 text-xs font-mono text-red-900 shadow-sm">
                <strong>{this.state.error.toString()}</strong>
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
