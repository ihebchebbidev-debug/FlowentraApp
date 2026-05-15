import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface BlockErrorBoundaryProps {
  blockLabel: string;
  blockType: string;
  children: ReactNode;
}

interface BlockErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches render errors in individual lazy-loaded blocks.
 * Prevents a single broken block from crashing the entire editor or public site.
 */
export class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  constructor(props: BlockErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BlockErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[BlockErrorBoundary] "${this.props.blockLabel}" (${this.props.blockType}) crashed:`,
      error,
      errorInfo.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full py-6 px-6">
          <div className="max-w-5xl mx-auto rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Block failed to render
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>{this.props.blockLabel}</strong> ({this.props.blockType}) encountered an error.
                </p>
                {this.state.error && (
                  <p className="text-[10px] text-muted-foreground/70 font-mono truncate mt-1">
                    {this.state.error.message}
                  </p>
                )}
              </div>
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-background border border-border/60 hover:bg-muted transition-colors shrink-0"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
