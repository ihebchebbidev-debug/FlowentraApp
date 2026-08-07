import { useTranslation } from 'react-i18next';
import { Users, Calendar, Briefcase, CheckCircle2 } from 'lucide-react';
import type { LoadingPhase } from '../hooks/useDispatcherProgressiveLoad';

interface DispatcherLoadingOverlayProps {
  phase: LoadingPhase;
  progress: number;
  usersLoaded: boolean;
  dispatchesLoaded: boolean;
  serviceOrdersLoaded: boolean;
}

export function DispatcherLoadingOverlay({
  phase,
  progress,
  usersLoaded,
  dispatchesLoaded,
  serviceOrdersLoaded,
}: DispatcherLoadingOverlayProps) {
  const { t } = useTranslation();
  
  if (phase === 'complete' || phase === 'idle') return null;

  const steps = [
    { 
      id: 'users', 
      label: t('dispatcher.loading_technicians'), 
      icon: Users,
      loaded: usersLoaded,
      active: phase === 'users',
    },
    { 
      id: 'dispatches', 
      label: t('dispatcher.loading_calendar_data'), 
      icon: Calendar,
      loaded: dispatchesLoaded,
      active: phase === 'dispatches',
    },
    { 
      id: 'serviceOrders', 
      label: t('dispatcher.loading_service_orders'), 
      icon: Briefcase,
      loaded: serviceOrdersLoaded,
      active: phase === 'serviceOrders',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        {/* Progress card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {t('dispatcher.preparing_dispatch_board')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('dispatcher.loading_resources')}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isComplete = step.loaded;
              const isActive = step.active;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isComplete 
                      ? 'bg-primary/10' 
                      : isActive 
                        ? 'bg-muted animate-pulse' 
                        : 'bg-muted/50 opacity-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isComplete 
                      ? 'bg-primary/20 text-primary' 
                      : isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isComplete 
                      ? 'text-foreground' 
                      : isActive 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                  }`}>
                    {step.label}
                    {isComplete && <span className="text-primary ml-2">✓</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
            {/* Shimmer effect */}
            <div 
              className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ 
                animationDuration: '1.5s',
                animationIterationCount: 'infinite',
              }}
            />
          </div>
          
          {/* Progress percentage */}
          <p className="text-center text-xs text-muted-foreground mt-2">
            {t('dispatcher.progress_complete', { progress })}
          </p>
        </div>
      </div>
    </div>
  );
}
