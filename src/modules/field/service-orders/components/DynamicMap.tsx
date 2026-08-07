import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface DynamicMapProps {
  children: React.ReactNode;
}

export function DynamicMap({ children }: DynamicMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg border">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}