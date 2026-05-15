import React, { useEffect, useState, Suspense } from 'react';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { DashboardSkeleton } from '@/components/ui/page-skeleton';
import techBackground from '@/assets/tech-background.jpg';

// Eager-load the real dashboard to avoid dynamic import 404s
import Dashboard from '../pages/Dashboard';
// Preload a single image
function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

export default function DashboardGate() {
  const { withLoading } = useLoading();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    withLoading(async () => {
      // Warm up data and assets used by the dashboard
      await Promise.all([
        // Preload notifications data chunk
        import('@/data/notifications'),
        // Preload brand background image to avoid pop-in
        preloadImage(techBackground),
        // Tiny delay to show progress nicely (feel free to tweak/remove)
        new Promise((r) => setTimeout(r, 600)),
      ]);
    }, '').then(() => {
      if (mounted) setReady(true);
    }).catch(() => {
      // If something fails, still proceed to render the dashboard; it can handle its own errors
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, [withLoading]);

  if (!ready) {
    return <DashboardSkeleton />;
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
