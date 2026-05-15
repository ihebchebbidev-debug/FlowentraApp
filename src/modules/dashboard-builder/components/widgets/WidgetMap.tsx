import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DashboardWidget } from '../../types';
import { useDashboardData } from '@/modules/dashboard/hooks/useDashboardData';
import { useDashboardFilter } from '../../context/DashboardFilterContext';
import { WidgetBackground } from './WidgetBackground';
import { WidgetSkeleton } from './WidgetSkeleton';
import { useTranslation } from 'react-i18next';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapLocation {
  lat: number;
  lng: number;
  label: string;
  status?: string;
  sublabel?: string;
}

interface Props {
  widget: DashboardWidget;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  created: '#3b82f6',
  sent: '#8b5cf6',
  accepted: '#10b981',
  pending: '#f59e0b',
  completed: '#06b6d4',
  technically_completed: '#14b8a6',
  partially_completed: '#f97316',
  invoiced: '#6366f1',
  cancelled: '#ef4444',
  dispatched: '#0ea5e9',
};

/** Extract lat/lng from an item, checking nested contact object too */
function extractCoords(item: any): { lat: number; lng: number } | null {
  // Direct coordinates on the item
  let lat = parseFloat(item.latitude);
  let lng = parseFloat(item.longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return { lat, lng };

  // From nested contact
  if (item.contact) {
    lat = parseFloat(item.contact.latitude);
    lng = parseFloat(item.contact.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return { lat, lng };
  }

  return null;
}

/** Build locations from real backend data per data source */
function buildLocations(dataSource: string, items: any[]): MapLocation[] {
  const locations: MapLocation[] = [];

  for (const item of items) {
    const coords = extractCoords(item);
    if (!coords) continue;

    let label = '';
    let sublabel = '';
    const status = item.status || '';

    switch (dataSource) {
      case 'contacts':
        label = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || `Contact #${item.id}`;
        sublabel = [item.city, item.company].filter(Boolean).join(' · ');
        break;
      case 'dispatches':
        label = item.dispatchNumber || `Dispatch #${item.id}`;
        sublabel = item.contactName || item.siteAddress || '';
        break;
      case 'serviceOrders':
        label = item.orderNumber || `SO #${item.id}`;
        sublabel = item.contact?.name || item.description || '';
        break;
      case 'sales':
        label = item.saleNumber || item.title || `Sale #${item.id}`;
        sublabel = item.contact?.name || '';
        break;
      case 'offers':
        label = item.offerNumber || item.title || `Offer #${item.id}`;
        sublabel = item.contact?.name || '';
        break;
      case 'tasks':
        label = item.title || `Task #${item.id}`;
        sublabel = item.projectName || '';
        break;
      default:
        label = item.name || item.title || `#${item.id}`;
    }

    locations.push({ ...coords, label, sublabel, status });
  }

  return locations;
}

// Fallback sample locations when no real data has coordinates
const FALLBACK_LOCATIONS: MapLocation[] = [
  { lat: 36.8065, lng: 10.1815, label: 'Tunis HQ', status: 'active' },
  { lat: 36.7525, lng: 10.2244, label: 'Site Alpha', status: 'pending' },
  { lat: 36.8442, lng: 10.1653, label: 'Site Beta', status: 'completed' },
];

export function WidgetMap({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const dd = useDashboardData();
  const { filterItems } = useDashboardFilter();
  const cfg = widget.config || {};
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Get real items from the selected data source
  const rawItems = useMemo(() => {
    switch (widget.dataSource) {
      case 'sales': return dd.sales;
      case 'offers': return dd.offers;
      case 'contacts': return dd.contacts;
      case 'tasks': return dd.tasks;
      case 'serviceOrders': return dd.serviceOrders;
      case 'dispatches': return dd.dispatches;
      default: return [];
    }
  }, [dd, widget.dataSource]);

  const filteredItems = useMemo(() => filterItems(rawItems as any[]), [rawItems, filterItems]);

  // Build real locations, fallback to samples if none have coords
  const locations = useMemo(() => {
    const real = buildLocations(widget.dataSource, filteredItems);
    return real.length > 0 ? real : FALLBACK_LOCATIONS;
  }, [filteredItems, widget.dataSource]);

  const accentColor = cfg.color || '#6366f1';
  const isRealData = locations !== FALLBACK_LOCATIONS;

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [36.8065, 10.1815],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    locations.forEach((loc) => {
      const markerColor = (loc.status && STATUS_COLORS[loc.status]) || accentColor;

      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 8,
        fillColor: markerColor,
        fillOpacity: 0.85,
        color: '#fff',
        weight: 2,
      }).addTo(map);

      const popupContent = `
        <div style="font-size:12px;min-width:120px">
          <div style="font-weight:600;margin-bottom:2px">${loc.label}</div>
          ${loc.sublabel ? `<div style="font-size:10px;color:#666">${loc.sublabel}</div>` : ''}
          ${loc.status ? `<div style="margin-top:4px"><span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600;background:${markerColor}20;color:${markerColor}">${loc.status}</span></div>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'widget-map-popup' });
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [locations, accentColor]);

  if (dd.isLoading) return <WidgetSkeleton type="map" />;

  return (
    <WidgetBackground bg={cfg.kpiBg} fallbackColor={accentColor} widgetId={widget.id}>
      <div className="h-full w-full relative">
        <div ref={mapContainerRef} className="absolute inset-0 rounded-[inherit]" />
        {/* Overlay badge */}
        <div className="absolute top-2 left-2 z-[1000] bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border border-border/40 shadow-sm flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-[10px] font-medium text-foreground">
            {locations.length} {t('dashboardBuilder.mapLocations', 'locations')}
          </span>
          {!isRealData && (
            <span className="text-[9px] text-muted-foreground ml-1">
              ({t('dashboardBuilder.mapSampleData', 'sample')})
            </span>
          )}
        </div>
      </div>
    </WidgetBackground>
  );
}
