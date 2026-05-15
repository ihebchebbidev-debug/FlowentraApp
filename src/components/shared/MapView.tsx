import { useEffect, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  ExternalLink
} from "lucide-react";

export interface MapItem {
  id: string;
  title: string;
  subtitle: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  location: {
    latitude: number;
    longitude: number;
    hasLocation: number;
    address?: string;
    city?: string;
  };
}

interface MapViewProps {
  items: MapItem[];
  onViewItem: (item: MapItem) => void;
  onEditItem: (item: MapItem) => void;
}

export function MapView({ items, onViewItem, onEditItem }: MapViewProps) {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const itemsWithLocation = useMemo(() => {
    return items.filter(item => 
      item.location.hasLocation === 1 &&
      item.location.latitude &&
      item.location.longitude
    );
  }, [items]);

  const mapCenter = useMemo(() => {
    if (itemsWithLocation.length === 0) return [36.456389, 10.737222]; // Default to Nabeul center
    
    const latSum = itemsWithLocation.reduce((sum, item) => sum + item.location.latitude, 0);
    const lngSum = itemsWithLocation.reduce((sum, item) => sum + item.location.longitude, 0);
    
    return [
      latSum / itemsWithLocation.length,
      lngSum / itemsWithLocation.length
    ];
  }, [itemsWithLocation]);

  const handleMarkerClick = (item: MapItem) => {
    console.log('Item ID:', item.id);
    console.log('Item:', item);
    onViewItem(item);
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      low: "#10B981",
      medium: "#F59E0B", 
      high: "#EF4444",
      urgent: "#DC2626"
    };
    return colors[priority as keyof typeof colors] || "#3B82F6";
  };

  useEffect(() => {
    let L: any;
    
    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainer.current) return;

      try {
        // Import Leaflet dynamically
        L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Remove existing map if it exists
        if (mapRef.current) {
          mapRef.current.remove();
        }

        // Create the map
        mapRef.current = L.map(mapContainer.current).setView(mapCenter, 13);

        // Add tile layer based on theme with better styling
        let tileLayer;
        if (theme === 'dark') {
          // Dark theme with Stadia Dark tiles
          tileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 18,
          });
        } else {
          // Light theme with standard OpenStreetMap tiles
          tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
          });
        }
        
        tileLayer.addTo(mapRef.current);

        // Clear existing markers
        markersRef.current = [];

        // Add markers for each item
        itemsWithLocation.forEach((item, index) => {
          const pinColor = getPriorityColor(item.priority);
          
          // Create simple colored pin icon
          const customIcon = L.divIcon({
            html: `
              <div style="
                width: 24px; 
                height: 24px; 
                background-color: ${pinColor}; 
                border: 2px solid white; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: pointer;
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(45deg);
                  width: 8px;
                  height: 8px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            className: 'custom-pin-marker',
            iconSize: [24, 24],
            iconAnchor: [6, 24],
            popupAnchor: [6, -24]
          });

          // Create marker with exact GPS coordinates
          const marker = L.marker([item.location.latitude, item.location.longitude], {
            icon: customIcon
          }).addTo(mapRef.current);

          // Create popup content with theme-aware styling
          const isDark = theme === 'dark';
          const popupContent = `
            <div style="min-width: 250px; padding: 8px; background: ${isDark ? '#1f2937' : '#ffffff'}; color: ${isDark ? '#f9fafb' : '#111827'}; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div>
                  <h4 style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px; color: ${isDark ? '#f9fafb' : '#111827'};">${item.title}</h4>
                  <p style="margin: 0; font-size: 12px; color: ${isDark ? '#9ca3af' : '#666666'};">${item.subtitle}</p>
                </div>
              </div>
              
              <div style="margin-bottom: 12px;">
                ${item.location.address ? `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px;">
                  <span>📍</span>
                  <span style="color: ${isDark ? '#f9fafb' : '#111827'};">${item.location.address}${item.location.city ? ', ' + item.location.city : ''}</span>
                </div>
                ` : ''}
                ${item.priority ? `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                  <span>🎯</span>
                  <span style="color: ${isDark ? '#f9fafb' : '#111827'};">Priority: ${item.priority}${item.status ? ' | Status: ' + item.status.replace('_', ' ') : ''}</span>
                </div>
                ` : ''}
              </div>
              
              <div style="display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};">
                <button onclick="window.mapItemView('${item.id}')" style="
                  flex: 1; 
                  padding: 6px 12px; 
                  background: ${isDark ? '#374151' : '#ffffff'}; 
                  border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'}; 
                  border-radius: 4px; 
                  cursor: pointer;
                  font-size: 12px;
                  color: ${isDark ? '#f9fafb' : '#111827'};
                ">👁️ View</button>
                <button onclick="window.mapItemEdit('${item.id}')" style="
                  flex: 1; 
                  padding: 6px 12px; 
                  background: ${isDark ? '#374151' : '#ffffff'}; 
                  border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'}; 
                  border-radius: 4px; 
                  cursor: pointer;
                  font-size: 12px;
                  color: ${isDark ? '#f9fafb' : '#111827'};
                ">✏️ Edit</button>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            className: theme === 'dark' ? 'dark-popup' : 'light-popup'
          });

          // Handle marker click
          marker.on('click', () => {
            handleMarkerClick(item);
          });

          markersRef.current.push(marker);
        });

        // Add custom CSS for popups and hide attribution
        const style = document.createElement('style');
        style.textContent = `
          .leaflet-popup-content-wrapper {
            background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
            color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          }
          .leaflet-popup-tip {
            background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          }
          .leaflet-container {
            font-family: inherit;
          }
          .dark-popup .leaflet-popup-content-wrapper {
            background: #1f2937;
            color: #f9fafb;
          }
          .dark-popup .leaflet-popup-tip {
            background: #1f2937;
          }
          .light-popup .leaflet-popup-content-wrapper {
            background: #ffffff;
            color: #111827;
          }
          .light-popup .leaflet-popup-tip {
            background: #ffffff;
          }
          /* Hide Leaflet attribution */
          .leaflet-control-attribution {
            display: none !important;
          }
        `;
        document.head.appendChild(style);

        // Store style element for cleanup
        (mapRef.current as any)._customStyle = style;

        // Add global functions for popup buttons
        (window as any).mapItemView = (itemId: string) => {
          const item = itemsWithLocation.find(i => i.id === itemId);
          if (item) handleMarkerClick(item);
        };

        (window as any).mapItemEdit = (itemId: string) => {
          const item = itemsWithLocation.find(i => i.id === itemId);
          if (item) onEditItem(item);
        };

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        try {
          // Remove custom styles
          const customStyle = (mapRef.current as any)._customStyle;
          if (customStyle && customStyle.parentNode) {
            customStyle.parentNode.removeChild(customStyle);
          }
          mapRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
      // Clean up global functions
      delete (window as any).mapItemView;
      delete (window as any).mapItemEdit;
    };
  }, [itemsWithLocation, theme, mapCenter]);

  // Always show the map, even with no locations

  return (
    <div className="space-y-4">
      <div className="h-64 w-full rounded-lg overflow-hidden border shadow-sm relative z-0">
        <div ref={mapContainer} className="w-full h-full z-0" />
        
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const googleMapsUrl = `https://www.google.com/maps/@${mapCenter[0]},${mapCenter[1]},15z`;
              window.open(googleMapsUrl, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Maps
          </Button>
        </div>
      </div>
    </div>
  );
}