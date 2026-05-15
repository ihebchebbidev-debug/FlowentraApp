import { useMemo } from "react";
import { ServiceOrder } from "../types";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  ExternalLink
} from "lucide-react";

interface SimpleLocationMapProps {
  serviceOrders: ServiceOrder[];
  onViewOrder: (order: ServiceOrder) => void;
  onEditOrder: (order: ServiceOrder) => void;
}

export function SimpleLocationMap({ serviceOrders, onViewOrder, onEditOrder }: SimpleLocationMapProps) {
  const ordersWithLocation = useMemo(() => {
    return serviceOrders.filter(order => 
      order.customer.address.hasLocation === 1 &&
      order.customer.address.latitude &&
      order.customer.address.longitude
    );
  }, [serviceOrders]);

  const handleMarkerClick = (order: ServiceOrder) => {
    console.log('Service Order ID:', order.id);
    console.log('Service Order:', order);
    onViewOrder(order);
  };

  // Calculate center point for the map view - use default if no locations
  const centerLat = ordersWithLocation.length > 0 
    ? ordersWithLocation.reduce((sum, order) => sum + order.customer.address.latitude, 0) / ordersWithLocation.length
    : 36.456389; // Default center (Tunisia)
  const centerLng = ordersWithLocation.length > 0 
    ? ordersWithLocation.reduce((sum, order) => sum + order.customer.address.longitude, 0) / ordersWithLocation.length
    : 10.737222;
  // Create Google Maps Static API URL with proper markers
  const createMapUrl = () => {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const size = '800x600';
    const zoom = '13';
    const center = `${centerLat},${centerLng}`;
    
    if (ordersWithLocation.length === 0) {
      // Show empty map centered on default location
      return `${baseUrl}?center=${center}&zoom=${zoom}&size=${size}&maptype=roadmap`;
    }
    
    // Create markers with proper coordinates
    const markers = ordersWithLocation.map((order, index) => {
      const color = order.priority === 'urgent' ? 'red' : 
                   order.priority === 'high' ? 'orange' : 'blue';
      return `markers=color:${color}%7Clabel:${index + 1}%7C${order.customer.address.latitude},${order.customer.address.longitude}`;
    }).join('&');
    
    // Note: This will show a watermark without API key, but markers will be positioned correctly
    return `${baseUrl}?center=${center}&zoom=${zoom}&size=${size}&${markers}&maptype=roadmap`;
  };

  return (
    <div className="space-y-4">
      {/* Map with properly positioned markers */}
      <div className="h-96 w-full rounded-lg overflow-hidden border shadow-sm bg-muted/20 relative">
        <img
          src={createMapUrl()}
          alt="Service Orders Map"
          className="w-full h-full object-cover rounded-lg"
          style={{ filter: 'none' }}
        />
        
        {/* Clickable overlay for markers */}
        <div className="absolute inset-0">
          {ordersWithLocation.map((order, index) => {
            // Calculate approximate pixel position for clickable areas
            // This is an approximation for the clickable area
            const latRange = 0.02; // Approximate lat range shown in map
            const lngRange = 0.04; // Approximate lng range shown in map
            
            const relativeX = ((order.customer.address.longitude - (centerLng - lngRange/2)) / lngRange) * 100;
            const relativeY = (((centerLat + latRange/2) - order.customer.address.latitude) / latRange) * 100;
            
            return (
              <div
                key={order.id}
                className="absolute cursor-pointer"
                style={{
                  left: `${Math.max(2, Math.min(98, relativeX))}%`,
                  top: `${Math.max(2, Math.min(98, relativeY))}%`,
                  width: '24px',
                  height: '24px',
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleMarkerClick(order)}
                title={`${order.orderNumber} - ${order.customer.company}`}
              >
                <div className="w-6 h-6 rounded-full bg-transparent hover:bg-black/10 transition-colors" />
              </div>
            );
          })}
        </div>

        <div className="absolute top-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const googleMapsUrl = `https://www.google.com/maps/@${centerLat},${centerLng},15z`;
              window.open(googleMapsUrl, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Maps
          </Button>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs">
          <div className="font-semibold mb-2">Service Orders ({ordersWithLocation.length})</div>
          {ordersWithLocation.map((order, index) => (
            <div key={order.id} className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <span className="truncate max-w-32">{order.orderNumber}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}