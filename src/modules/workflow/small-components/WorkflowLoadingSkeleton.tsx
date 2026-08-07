import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

export function WorkflowLoadingSkeleton() {
  const { t } = useTranslation();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 z-50">
      {/* Central loading indicator */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative p-5 rounded-full bg-primary/10 border-2 border-primary/30">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        </div>
        <p className="text-base text-muted-foreground font-medium animate-pulse">
          {t('loadingWorkflow') || 'Loading workflow...'}
        </p>
      </div>
      
      {/* Animated skeleton workflow preview */}
      <div className="flex items-center gap-4 opacity-60">
        {/* Skeleton node 1 */}
        <div className="relative">
          <Skeleton className="h-20 w-44 rounded-xl animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary/20 animate-pulse" />
          </div>
        </div>
        
        {/* Animated connection 1 */}
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-8 bg-muted-foreground/40 rounded-full" />
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
            <ArrowRight className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="h-0.5 w-8 bg-muted-foreground/40 rounded-full" />
        </div>
        
        {/* Skeleton node 2 */}
        <div className="relative">
          <Skeleton className="h-20 w-44 rounded-xl animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-accent/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
        
        {/* Animated connection 2 */}
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-8 bg-muted-foreground/40 rounded-full" />
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
            <ArrowRight className="h-4 w-4 text-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="h-0.5 w-8 bg-muted-foreground/40 rounded-full" />
        </div>
        
        {/* Skeleton node 3 */}
        <div className="relative">
          <Skeleton className="h-20 w-44 rounded-xl animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-secondary/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
        
        {/* Animated connection 3 */}
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-8 bg-muted-foreground/40 rounded-full" />
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '1s' }} />
            <ArrowRight className="h-4 w-4 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="h-0.5 w-8 bg-muted-foreground/40 rounded-full" />
        </div>
        
        {/* Skeleton node 4 */}
        <div className="relative">
          <Skeleton className="h-20 w-44 rounded-xl animate-pulse" style={{ animationDelay: '0.6s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-muted-foreground/20 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
      </div>
      
      {/* Subtle text hint */}
      <p className="mt-8 text-xs text-muted-foreground/60">
        {t('builderSubtitle') || 'Preparing your workflow automation...'}
      </p>
    </div>
  );
}
