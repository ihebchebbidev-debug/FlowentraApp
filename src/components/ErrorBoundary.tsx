import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/hooks/useLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    this.setState({ errorInfo, errorId });

    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to backend system logs
    this.logErrorToBackend(error, errorInfo, errorId);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private async logErrorToBackend(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const errorDetails = {
        errorId,
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      // Use the logger to send to backend
      await logger.error(
        `Page crashed: ${error.message}`,
        'Frontend',
        'other',
        {
          entityType: 'PageCrash',
          entityId: errorId,
          details: JSON.stringify(errorDetails, null, 2),
        }
      );
    } catch (logError) {
      console.error('Failed to log error to backend:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportBug = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown error'}`);
    const body = encodeURIComponent(
      `Error ID: ${errorId}\n\nError: ${error?.message}\n\nURL: ${window.location.href}\n\nPlease describe what you were doing when this error occurred:\n\n`
    );
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`, '_blank');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.errorId && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Error Reference ID</p>
                  <code className="text-sm font-mono text-foreground">{this.state.errorId}</code>
                </div>
              )}
              {import.meta.env.DEV && this.state.error && (
                <div className="rounded-lg bg-destructive/5 p-3 overflow-auto max-h-40">
                  <p className="text-xs font-semibold text-destructive mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Button onClick={this.handleRetry} className="flex-1" variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1" variant="outline">
                  Reload Page
                </Button>
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={this.handleGoHome} className="flex-1" variant="ghost">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
                <Button onClick={this.handleReportBug} variant="ghost" className="flex-1 text-muted-foreground">
                  <Bug className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
