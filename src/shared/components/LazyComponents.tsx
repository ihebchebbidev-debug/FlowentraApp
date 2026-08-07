import React, { Suspense } from 'react';

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  children,
  fallback,
  minHeight = '200px'
}) => {
  const defaultFallback = (
    <div 
      className="bg-background/50 p-6 space-y-4 animate-pulse"
      style={{ minHeight }}
    >
      <div className="h-6 w-40 bg-muted rounded" />
      <div className="h-4 w-full bg-muted/60 rounded" />
      <div className="h-4 w-3/4 bg-muted/60 rounded" />
      <div className="h-32 w-full bg-muted/40 rounded-lg" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

interface LazyListItemProps {
  children: React.ReactNode;
  threshold?: number;
  placeholder?: React.ReactNode;
  className?: string;
}

export const LazyListItem: React.FC<LazyListItemProps> = ({
  children,
  threshold = 0.1,
  placeholder,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    const node = elementRef.current;
    if (!node || isVisible) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold }
    );

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, isVisible]);

  const defaultPlaceholder = (
    <div className="h-20 bg-muted/30 rounded animate-pulse" />
  );

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
};