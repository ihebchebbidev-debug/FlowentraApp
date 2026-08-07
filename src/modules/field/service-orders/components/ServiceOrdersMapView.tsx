import { useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ServiceOrder } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  User, 
  Building,
  Eye,
  Edit
} from "lucide-react";
import { DynamicMap } from "./DynamicMap";

interface ServiceOrdersMapViewProps {
  serviceOrders: ServiceOrder[];
  onViewOrder: (order: ServiceOrder) => void;
  onEditOrder: (order: ServiceOrder) => void;
}

export function ServiceOrdersMapView({ serviceOrders, onViewOrder, onEditOrder }: ServiceOrdersMapViewProps) {
  const { theme } = useTheme();
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Leaflet components only on client side
    const loadMapComponents = async () => {
      try {
        const [
          { MapContainer },
          { TileLayer },
          { Marker },
          { Popup },
          { divIcon, Icon }
        ] = await Promise.all([
          import('react-leaflet').then(m => ({ MapContainer: m.MapContainer })),
          import('react-leaflet').then(m => ({ TileLayer: m.TileLayer })),
          import('react-leaflet').then(m => ({ Marker: m.Marker })),
          import('react-leaflet').then(m => ({ Popup: m.Popup })),
          import('leaflet')
        ]);

        // Fix for default markers
        delete (Icon.Default.prototype as any)._getIconUrl;
        Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Import CSS
        await import('leaflet/dist/leaflet.css');

        setMapComponents({ MapContainer, TileLayer, Marker, Popup, divIcon });
      } catch (error) {
        console.error('Failed to load map components:', error);
      }
    };

    loadMapComponents();
  }, []);

  const getStatusIcon = (status: ServiceOrder['status']) => {
    const statusIcons = {
      draft: "📝",
      offer: "💼", 
      won: "✅",
      scheduled: "📅",
      in_progress: "🔧",
      completed: "✅",
      cancelled: "❌",
      follow_up_pending: "🔔"
    };
    return statusIcons[status] || "📍";
  };

  const getStatusColor = (status: ServiceOrder['status']) => {
    const colors = {
      draft: "#6B7280",
      offer: "#3B82F6", 
      won: "#10B981",
      scheduled: "#F59E0B",
      in_progress: "#EF4444",
      completed: "#10B981",
      cancelled: "#6B7280",
      follow_up_pending: "#8B5CF6"
    };
    return colors[status] || "#6B7280";
  };

  const getPriorityColor = (priority: ServiceOrder['priority']) => {
    const colors = {
      low: "#10B981",
      medium: "#F59E0B", 
      high: "#EF4444",
      urgent: "#DC2626"
    };
    return colors[priority];
  };

  const createCustomIcon = (order: ServiceOrder) => {
    if (!mapComponents?.divIcon) return null;
    
    const statusIcon = getStatusIcon(order.status);
    const statusColor = getStatusColor(order.status);
    const priorityColor = getPriorityColor(order.priority);
    
    return mapComponents.divIcon({
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid white; background-color: ${statusColor}; font-size: 14px;">
            ${statusIcon}
          </div>
          <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; border: 1px solid white; background-color: ${priorityColor};"></div>
        </div>
      `,
      className: 'custom-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  const ordersWithLocation = useMemo(() => {
    return serviceOrders.filter(order => 
      order.customer.address.hasLocation === 1 &&
      order.customer.address.latitude &&
      order.customer.address.longitude
    );
  }, [serviceOrders]);

  const mapCenter = useMemo(() => {
    if (ordersWithLocation.length === 0) return [36.456389, 10.737222]; // Default to Nabeul center
    
    const latSum = ordersWithLocation.reduce((sum, order) => sum + order.customer.address.latitude, 0);
    const lngSum = ordersWithLocation.reduce((sum, order) => sum + order.customer.address.longitude, 0);
    
    return [
      latSum / ordersWithLocation.length,
      lngSum / ordersWithLocation.length
    ];
  }, [ordersWithLocation]);

  const tileLayerUrl = theme === 'dark' 
    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileLayerAttribution = theme === 'dark'
    ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (!mapComponents) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg border">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Always show the map, even with no locations

  const { MapContainer, TileLayer, Marker, Popup } = mapComponents;

  try {
    return (
      <DynamicMap>
        <div className="h-96 w-full rounded-lg overflow-hidden border shadow-sm">
          <MapContainer
            center={mapCenter as [number, number]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            whenReady={() => {
              console.log('Map ready');
            }}
          >
            <TileLayer
              url={tileLayerUrl}
              attribution={tileLayerAttribution}
            />
            
            {ordersWithLocation.map((order) => {
              const customIcon = createCustomIcon(order);
              return customIcon ? (
                <Marker
                  key={order.id}
                  position={[order.customer.address.latitude, order.customer.address.longitude]}
                  icon={customIcon}
                >
                  <Popup className="custom-popup" maxWidth={300}>
                    <div className="p-2 min-w-[250px]">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{order.orderNumber}</h4>
                          <p className="text-xs text-muted-foreground">{order.repair.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {order.status.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ color: getPriorityColor(order.priority) }}
                          >
                            {order.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{order.customer.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{order.customer.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {order.customer.address.street}, {order.customer.address.city}
                          </span>
                        </div>
                        {order.repair.promisedRepairDate && (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Due: {order.repair.promisedRepairDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onViewOrder(order);
                          }} 
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditOrder(order);
                          }} 
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null;
            })}
          </MapContainer>
        </div>
      </DynamicMap>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg border border-dashed">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Map Error</h3>
          <p className="text-muted-foreground">
            Unable to load the map. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}