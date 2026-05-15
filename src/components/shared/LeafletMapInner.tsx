import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapInnerProps {
  latitude: string;
  longitude: string;
  onLocationSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}

function LeafletMapInner({
  latitude,
  longitude,
  onLocationSelect,
  disabled = false,
}: LeafletMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default center (Tunis, Tunisia)
  const defaultCenter: [number, number] = [36.8065, 10.1815];
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidPosition = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  
  const position: [number, number] = hasValidPosition ? [lat, lng] : defaultCenter;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: position,
      zoom: hasValidPosition ? 15 : 10,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add click handler
    if (!disabled) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    // Add initial marker if position is valid
    if (hasValidPosition) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // Only run once on mount

  // Update marker and view when position changes
  useEffect(() => {
    if (!mapRef.current) return;

    const newLat = parseFloat(latitude);
    const newLng = parseFloat(longitude);
    const isValid = !isNaN(newLat) && !isNaN(newLng) && newLat !== 0 && newLng !== 0;

    if (isValid) {
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng]).addTo(mapRef.current);
      }
      // Pan to new position
      mapRef.current.setView([newLat, newLng], mapRef.current.getZoom());
    } else {
      // Remove marker if position is invalid
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [latitude, longitude]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '100%', width: '100%' }}
      className={disabled ? 'pointer-events-none opacity-75' : ''}
    />
  );
}

export default LeafletMapInner;
