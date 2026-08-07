import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportIncident } from '@/services/incident/incidentService';

interface ErrorFallbackProps {
  error?: Error | string;
  onRetry?: () => void;
  backTo?: string;
}

export function PurchaseErrorFallback({ error, onRetry, backTo }: ErrorFallbackProps) {
  const navigate = useNavigate();
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full border-destructive/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Failed to load</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {backTo && (
              <Button variant="outline" size="sm" onClick={() => navigate(backTo)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Go back
              </Button>
            )}
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Class-based error boundary for catching render errors
interface State { hasError: boolean; error?: Error; }

export class PurchaseErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onRetry?: () => void; backTo?: string },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PurchaseErrorBoundary]', error, info.componentStack);
    const errorId = `PUR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    void reportIncident({
      incidentType: 'react_boundary',
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      module: 'purchases',
      referenceId: errorId,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <PurchaseErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          backTo={this.props.backTo}
        />
      );
    }
    return this.props.children;
  }
}
