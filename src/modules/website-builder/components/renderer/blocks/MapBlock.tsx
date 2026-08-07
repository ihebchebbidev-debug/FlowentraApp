import React, { useEffect, useRef, useState } from 'react';
import { SiteTheme } from '../../../types';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';

export type MapTheme = 'default' | 'light' | 'dark' | 'satellite' | 'streets' | 'outdoors' | 'grayscale' | 'watercolor';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  popup?: string;
}

interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

type ContactCardStyle = 'default' | 'minimal' | 'bordered' | 'elevated' | 'glass' | 'accent';

interface MapBlockProps {
  // Map configuration
  address?: string;
  embedUrl?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: number;
  mapTheme?: MapTheme;
  showZoomControl?: boolean;
  showAttribution?: boolean;
  draggable?: boolean;
  scrollWheelZoom?: boolean;
  
  // Markers
  markers?: MapMarker[];
  markerColor?: string;
  
  // Layout
  variant?: 'map-only' | 'map-with-info' | 'split' | 'overlay';
  infoPosition?: 'left' | 'right' | 'top' | 'bottom';
  
  // Contact info (for split/overlay variants)
  contactInfo?: ContactInfo;
  showContactCard?: boolean;
  contactCardTitle?: string;
  contactCardStyle?: ContactCardStyle;
  showDirectionsButton?: boolean;
  directionsButtonText?: string;
  
  // Styling
  bgColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  
  theme: SiteTheme;
  style?: React.CSSProperties;
  isEditing?: boolean;
}

// Leaflet tile layer URLs for different themes
const TILE_LAYERS: Record<MapTheme, { url: string; attribution: string }> = {
  default: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  light: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  dark: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
  },
  outdoors: {
    url: 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  grayscale: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  watercolor: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
};

export function MapBlock({
  address,
  embedUrl,
  latitude = 48.8566,
  longitude = 2.3522,
  zoom = 14,
  height = 400,
  mapTheme = 'default',
  showZoomControl = true,
  showAttribution = true,
  draggable = true,
  scrollWheelZoom = false,
  markers = [],
  markerColor,
  variant = 'map-only',
  infoPosition = 'left',
  contactInfo,
  showContactCard = false,
  contactCardTitle = 'Contact Us',
  contactCardStyle = 'default',
  showDirectionsButton = true,
  directionsButtonText = 'Get Directions',
  bgColor,
  borderRadius,
  showBorder = false,
  theme,
  style,
  isEditing,
}: MapBlockProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<any>(null);

  const effectiveRadius = borderRadius ?? theme.borderRadius;
  const primaryColor = markerColor || theme.primaryColor;

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainer.current || embedUrl) return;

    const initMap = async () => {
      try {
        const leaflet = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        setL(leaflet);

        // Fix default marker icons
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map if not already created
        if (!mapRef.current && mapContainer.current) {
          mapRef.current = leaflet.map(mapContainer.current, {
            zoomControl: showZoomControl,
            attributionControl: showAttribution,
            dragging: draggable && !isEditing,
            scrollWheelZoom: scrollWheelZoom && !isEditing,
          }).setView([latitude, longitude], zoom);

          // Add tile layer based on theme
          const tileConfig = TILE_LAYERS[mapTheme] || TILE_LAYERS.default;
          leaflet.tileLayer(tileConfig.url, {
            attribution: tileConfig.attribution,
            maxZoom: 19,
          }).addTo(mapRef.current);

          // Add default marker at center
          const customIcon = leaflet.divIcon({
            className: 'custom-map-marker',
            html: `<div style="
              width: 32px;
              height: 32px;
              background: ${primaryColor};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          leaflet.marker([latitude, longitude], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(address || 'Our Location');

          // Add additional markers
          markers.forEach((m) => {
            const markerIcon = leaflet.divIcon({
              className: 'custom-map-marker',
              html: `<div style="
                width: 28px;
                height: 28px;
                background: ${primaryColor};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  background: white;
                  border-radius: 50%;
                  transform: rotate(45deg);
                "></div>
              </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            });

            leaflet.marker([m.lat, m.lng], { icon: markerIcon })
              .addTo(mapRef.current)
              .bindPopup(m.popup || m.title || '');
          });

          setMapReady(true);
        }
      } catch (error) {
        console.error('Failed to load Leaflet map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update map when theme/position changes
  useEffect(() => {
    if (mapRef.current && L && mapReady) {
      mapRef.current.setView([latitude, longitude], zoom);
      
      // Update tile layer
      mapRef.current.eachLayer((layer: any) => {
        if (layer._url) {
          mapRef.current.removeLayer(layer);
        }
      });
      
      const tileConfig = TILE_LAYERS[mapTheme] || TILE_LAYERS.default;
      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
  }, [latitude, longitude, zoom, mapTheme, L, mapReady]);

  // If embedUrl is provided, use iframe (Google Maps embed)
  if (embedUrl) {
    const src = embedUrl || (address ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : '');
    return (
      <section className="py-8 px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
        <div 
          className="max-w-5xl mx-auto overflow-hidden" 
          style={{ 
            borderRadius: `${effectiveRadius}px`,
            border: showBorder ? `1px solid ${theme.secondaryColor}20` : undefined,
          }}
        >
          {src ? (
            <iframe src={src} className="w-full border-0" style={{ height }} allowFullScreen loading="lazy" />
          ) : (
            <div className="bg-muted flex items-center justify-center" style={{ height }}>
              <span className="text-sm text-muted-foreground">Enter an address or embed URL in properties</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Contact card style classes
  const getContactCardStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: theme.bodyFont,
    };
    
    switch (contactCardStyle) {
      case 'minimal':
        return { ...base, backgroundColor: 'transparent', color: theme.textColor };
      case 'bordered':
        return { 
          ...base, 
          backgroundColor: theme.backgroundColor, 
          color: theme.textColor,
          border: `1px solid ${theme.secondaryColor}30`,
        };
      case 'elevated':
        return { 
          ...base, 
          backgroundColor: theme.backgroundColor, 
          color: theme.textColor,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
        };
      case 'glass':
        return { 
          ...base, 
          backgroundColor: `${theme.backgroundColor}dd`,
          backdropFilter: 'blur(12px)',
          color: theme.textColor,
        };
      case 'accent':
        return { 
          ...base, 
          backgroundColor: theme.primaryColor, 
          color: '#ffffff',
        };
      default:
        return { ...base, backgroundColor: theme.backgroundColor, color: theme.textColor };
    }
  };

  const cardStyles = getContactCardStyles();
  const isAccent = contactCardStyle === 'accent';
  const iconColor = isAccent ? '#ffffff' : theme.primaryColor;
  const linkColor = isAccent ? '#ffffff' : theme.textColor;

  // Contact info card component
  const ContactCard = () => (
    <div 
      className="p-6 space-y-4"
      style={cardStyles}
    >
      <h3 
        className="font-bold text-xl mb-4"
        style={{ fontFamily: theme.headingFont, color: isAccent ? '#ffffff' : theme.textColor }}
      >
        {contactCardTitle}
      </h3>
      
      {contactInfo?.address && (
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
          <span className="text-sm">{contactInfo.address}</span>
        </div>
      )}
      
      {contactInfo?.phone && (
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 flex-shrink-0" style={{ color: iconColor }} />
          <a href={`tel:${contactInfo.phone}`} className="text-sm hover:underline" style={{ color: linkColor }}>{contactInfo.phone}</a>
        </div>
      )}
      
      {contactInfo?.email && (
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 flex-shrink-0" style={{ color: iconColor }} />
          <a href={`mailto:${contactInfo.email}`} className="text-sm hover:underline" style={{ color: linkColor }}>{contactInfo.email}</a>
        </div>
      )}
      
      {contactInfo?.hours && (
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
          <span className="text-sm whitespace-pre-line">{contactInfo.hours}</span>
        </div>
      )}

      {showDirectionsButton && address && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ 
            backgroundColor: isAccent ? '#ffffff' : theme.primaryColor, 
            color: isAccent ? theme.primaryColor : '#ffffff',
            borderRadius: `${effectiveRadius}px`,
          }}
        >
          <Navigation className="h-4 w-4" />
          {directionsButtonText}
        </a>
      )}
    </div>
  );

  // Map element
  const MapElement = (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ 
        minHeight: height,
        borderRadius: variant === 'map-only' ? `${effectiveRadius}px` : undefined,
      }}
    />
  );

  // Placeholder for editing mode
  const MapPlaceholder = (
    <div 
      className="w-full flex items-center justify-center bg-muted/50"
      style={{ 
        height,
        borderRadius: variant === 'map-only' ? `${effectiveRadius}px` : undefined,
      }}
    >
      <div className="text-center p-6">
        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: theme.primaryColor }} />
        <p className="text-sm text-muted-foreground">
          Interactive Leaflet map will appear here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Theme: {mapTheme} • Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
        </p>
      </div>
    </div>
  );

  // Render based on variant
  if (variant === 'map-only') {
    return (
      <section className="py-8 px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
        <div 
          className="max-w-5xl mx-auto overflow-hidden" 
          style={{ 
            borderRadius: `${effectiveRadius}px`,
            border: showBorder ? `1px solid ${theme.secondaryColor}20` : undefined,
            height,
          }}
        >
          {isEditing ? MapPlaceholder : MapElement}
        </div>
      </section>
    );
  }

  if (variant === 'split') {
    const isHorizontal = infoPosition === 'left' || infoPosition === 'right';
    return (
      <section className="py-8 px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
        <div 
          className={`max-w-6xl mx-auto overflow-hidden grid ${isHorizontal ? 'md:grid-cols-3' : 'grid-rows-2'} gap-0`}
          style={{ 
            borderRadius: `${effectiveRadius}px`,
            border: showBorder ? `1px solid ${theme.secondaryColor}20` : undefined,
          }}
        >
          {(infoPosition === 'left' || infoPosition === 'top') && showContactCard && (
            <div className={isHorizontal ? 'md:col-span-1' : ''}>
              <ContactCard />
            </div>
          )}
          <div 
            className={isHorizontal ? 'md:col-span-2' : ''} 
            style={{ height: isHorizontal ? height : height * 0.7 }}
          >
            {isEditing ? MapPlaceholder : MapElement}
          </div>
          {(infoPosition === 'right' || infoPosition === 'bottom') && showContactCard && (
            <div className={isHorizontal ? 'md:col-span-1' : ''}>
              <ContactCard />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'overlay') {
    return (
      <section className="py-8 px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
        <div 
          className="max-w-6xl mx-auto overflow-hidden relative"
          style={{ 
            borderRadius: `${effectiveRadius}px`,
            border: showBorder ? `1px solid ${theme.secondaryColor}20` : undefined,
            height,
          }}
        >
          {isEditing ? MapPlaceholder : MapElement}
          {showContactCard && (
            <div 
              className="absolute top-6 left-6 max-w-xs shadow-lg"
              style={{ 
                borderRadius: `${effectiveRadius}px`,
                overflow: 'hidden',
              }}
            >
              <ContactCard />
            </div>
          )}
        </div>
      </section>
    );
  }

  // Default: map-with-info (map above, info below)
  return (
    <section className="py-8 px-6" style={{ backgroundColor: bgColor || 'transparent', ...style }}>
      <div 
        className="max-w-5xl mx-auto overflow-hidden"
        style={{ 
          borderRadius: `${effectiveRadius}px`,
          border: showBorder ? `1px solid ${theme.secondaryColor}20` : undefined,
        }}
      >
        <div style={{ height }}>
          {isEditing ? MapPlaceholder : MapElement}
        </div>
        {showContactCard && <ContactCard />}
      </div>
    </section>
  );
}
