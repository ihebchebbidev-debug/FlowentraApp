import { useMemo, useEffect, useRef, useState } from "react";
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

interface MapboxMapViewProps {
  serviceOrders: ServiceOrder[];
  onViewOrder: (order: ServiceOrder) => void;
  onEditOrder: (order: ServiceOrder) => void;
}

export function MapboxMapView({ serviceOrders, onViewOrder, onEditOrder }: MapboxMapViewProps) {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const ordersWithLocation = useMemo(() => {
    return serviceOrders.filter(order => 
      order.customer.address.hasLocation === 1 &&
      order.customer.address.latitude &&
      order.customer.address.longitude
    );
  }, [serviceOrders]);

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        const mapboxCSS = await import('mapbox-gl/dist/mapbox-gl.css');
        setMapboxgl(mapboxModule.default);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Mapbox:', error);
      }
    };
    
    loadMapbox();
  }, []);

  const mapCenter = useMemo(() => {
    if (ordersWithLocation.length === 0) return [10.737222, 36.456389]; // Default to Nabeul center
    
    const latSum = ordersWithLocation.reduce((sum, order) => sum + order.customer.address.latitude, 0);
    const lngSum = ordersWithLocation.reduce((sum, order) => sum + order.customer.address.longitude, 0);
    
    return [
      lngSum / ordersWithLocation.length,
      latSum / ordersWithLocation.length
    ];
  }, [ordersWithLocation]);

  const initializeMap = () => {
    if (!mapboxgl || !mapContainer.current || !apiKey) return;

    mapboxgl.accessToken = apiKey;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11',
      center: mapCenter,
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Add markers for each service order
    ordersWithLocation.forEach((order) => {
      const statusColor = getStatusColor(order.status);
      const priorityColor = getPriorityColor(order.priority);
      
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.style.width = '32px';
      markerElement.style.height = '32px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = statusColor;
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerElement.style.display = 'flex';
      markerElement.style.alignItems = 'center';
      markerElement.style.justifyContent = 'center';
      markerElement.style.fontSize = '14px';
      markerElement.style.fontWeight = 'bold';
      markerElement.style.color = 'white';
      markerElement.style.cursor = 'pointer';
      markerElement.style.position = 'relative';
      markerElement.textContent = getStatusIcon(order.status);

      // Add priority indicator
      const priorityIndicator = document.createElement('div');
      priorityIndicator.style.position = 'absolute';
      priorityIndicator.style.top = '-2px';
      priorityIndicator.style.right = '-2px';
      priorityIndicator.style.width = '12px';
      priorityIndicator.style.height = '12px';
      priorityIndicator.style.borderRadius = '50%';
      priorityIndicator.style.backgroundColor = priorityColor;
      priorityIndicator.style.border = '1px solid white';
      markerElement.appendChild(priorityIndicator);

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div class="p-2 min-w-[250px]">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-semibold text-sm">${order.orderNumber}</h4>
              <p class="text-xs text-muted-foreground">${order.repair.description}</p>
            </div>
          </div>
          <div class="space-y-2 mb-3">
            <div class="flex items-center gap-2 text-xs">
              <span>🏢</span>
              <span>${order.customer.company}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span>👤</span>
              <span>${order.customer.contactPerson}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span>📍</span>
              <span>${order.customer.address.street}, ${order.customer.address.city}</span>
            </div>
          </div>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setDOMContent(popupContent);

      // Create marker
      new mapboxgl.Marker(markerElement)
        .setLngLat([order.customer.address.longitude, order.customer.address.latitude])
        .setPopup(popup)
        .addTo(map.current);
    });
  };

  useEffect(() => {
    if (isLoaded && apiKey) {
      initializeMap();
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isLoaded, apiKey, ordersWithLocation, theme]);

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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg border">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/50 rounded-lg border">
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium mb-2">Mapbox API Key Required</h3>
            <p className="text-muted-foreground mb-4">
              Please enter your Mapbox API key to view the map
            </p>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter Mapbox API Key"
                className="flex-1 px-3 py-2 border rounded-md"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button onClick={() => apiKey && initializeMap()}>
                Load Map
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Get your API key from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Always show the map, even with no locations

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border shadow-sm">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}