import { useEffect, useRef, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, ExternalLink, User, X, Briefcase, Clock } from "lucide-react";
import type { Job, Technician } from "../types";
import { DispatcherService } from "../services/dispatcher.service";
import { toast } from "sonner";

interface DispatcherMapViewProps {
  jobs: Job[];
  technicians: Technician[];
  onJobClick?: (job: Job) => void;
  onJobAssigned?: () => void;
}

export function DispatcherMapView({ jobs, technicians, onJobClick, onJobAssigned }: DispatcherMapViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedJobForAssign, setSelectedJobForAssign] = useState<Job | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Create a map of technician IDs to technician info
  const technicianMap = useMemo(() => {
    const map = new Map<string, Technician>();
    technicians.forEach(tech => map.set(tech.id, tech));
    return map;
  }, [technicians]);

  // Filter jobs that have location data
  const jobsWithLocation = useMemo(() => {
    return jobs.filter(job => 
      job.location?.lat && job.location?.lng
    );
  }, [jobs]);

  // Calculate map center from jobs
  const mapCenter = useMemo(() => {
    if (jobsWithLocation.length === 0) return [36.456389, 10.737222]; // Default center
    
    const latSum = jobsWithLocation.reduce((sum, job) => sum + (job.location.lat || 0), 0);
    const lngSum = jobsWithLocation.reduce((sum, job) => sum + (job.location.lng || 0), 0);
    
    return [
      latSum / jobsWithLocation.length,
      lngSum / jobsWithLocation.length
    ];
  }, [jobsWithLocation]);

  // Get technician initials for display
  const getTechnicianInitials = (techId: string): string => {
    const tech = technicianMap.get(techId);
    if (!tech) return "?";
    const first = tech.firstName?.charAt(0) || "";
    const last = tech.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get technician full name
  const getTechnicianName = (techId: string): string => {
    const tech = technicianMap.get(techId);
    if (!tech) return t('dispatcher.map.unassigned', 'Unassigned');
    return `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email || t('dispatcher.map.unknown_technician', 'Unknown');
  };

  // Get color based on job status/priority
  const getJobColor = (job: Job): string => {
    if (job.priority === 'urgent') return '#DC2626';
    if (job.priority === 'high') return '#EF4444';
    if (job.status === 'in_progress') return '#F59E0B';
    if (job.status === 'completed') return '#10B981';
    return '#3B82F6';
  };

  // Get technician color (for visual distinction)
  const getTechnicianColor = (techId: string): string => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];
    if (!techId) return '#6B7280';
    const hash = techId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
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
        mapRef.current = L.map(mapContainer.current).setView(mapCenter, 12);

        // Add tile layer based on theme
        let tileLayer;
        if (theme === 'dark') {
          tileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
            maxZoom: 18,
          });
        } else {
          tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
          });
        }
        
        tileLayer.addTo(mapRef.current);

        // Clear existing markers
        markersRef.current = [];

        // Add markers for each job with location
        jobsWithLocation.forEach((job) => {
          const techId = job.assignedTechnicianId;
          const techColor = getTechnicianColor(techId || '');
          const jobColor = getJobColor(job);
          const techInitials = techId ? getTechnicianInitials(techId) : '';
          const techName = techId ? getTechnicianName(techId) : t('dispatcher.map.unassigned', 'Unassigned');

          // Create custom icon with technician initials
          const customIcon = L.divIcon({
            html: `
              <div style="
                position: relative;
                width: 40px;
                height: 48px;
              ">
                <div style="
                  width: 36px;
                  height: 36px;
                  background: linear-gradient(135deg, ${techColor}, ${jobColor});
                  border: 3px solid white;
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                  position: absolute;
                  top: 0;
                  left: 2px;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                    font-size: 11px;
                    font-weight: 700;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    white-space: nowrap;
                  ">${techInitials || '?'}</div>
                </div>
              </div>
            `,
            className: 'dispatcher-map-marker',
            iconSize: [40, 48],
            iconAnchor: [10, 48],
            popupAnchor: [10, -44]
          });

          // Create marker
          const marker = L.marker([job.location.lat, job.location.lng], {
            icon: customIcon
          }).addTo(mapRef.current);

          // Create popup content
          const isDark = theme === 'dark';
          const popupContent = `
            <div style="min-width: 280px; padding: 12px; background: ${isDark ? '#1f2937' : '#ffffff'}; color: ${isDark ? '#f9fafb' : '#111827'}; border-radius: 8px;">
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="
                    width: 32px;
                    height: 32px;
                    background: ${techColor};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 12px;
                  ">${techInitials || '?'}</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px; color: ${isDark ? '#f9fafb' : '#111827'};">
                      ${techName}
                    </div>
                    <div style="font-size: 11px; color: ${isDark ? '#9ca3af' : '#6b7280'};">
                      ${t('dispatcher.map.assigned_technician', 'Assigned Technician')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'}; padding-top: 12px; margin-bottom: 12px;">
                <h4 style="font-weight: 600; margin: 0 0 6px 0; font-size: 14px; color: ${isDark ? '#f9fafb' : '#111827'};">
                  ${job.title || job.serviceOrderTitle || t('dispatcher.map.job', 'Job')}
                </h4>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: ${isDark ? '#9ca3af' : '#666666'};">
                  ${job.description || ''}
                </p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px;">
                  <span>👤</span>
                  <span style="color: ${isDark ? '#f9fafb' : '#111827'};">${job.customerName || t('dispatcher.map.no_customer', 'N/A')}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px;">
                  <span>📍</span>
                  <span style="color: ${isDark ? '#f9fafb' : '#111827'};">${job.location.address || t('dispatcher.map.no_address', 'No address')}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                  <span>🎯</span>
                  <span style="color: ${isDark ? '#f9fafb' : '#111827'};">
                    ${t('dispatcher.map.priority', 'Priority')}: ${t(`dispatcher.priority_${job.priority}`, job.priority)} | 
                    ${t('dispatcher.map.status', 'Status')}: ${t(`dispatcher.status_${job.status}`, job.status.replace('_', ' '))}
                  </span>
                </div>
              </div>
              
              <div style="display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};">
                <button onclick="window.dispatcherMapJobClick('${job.id}')" style="
                  flex: 1; 
                  padding: 8px 12px; 
                  background: ${techColor}; 
                  border: none; 
                  border-radius: 6px; 
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                  color: white;
                ">${t('dispatcher.map.view_details', 'View Details')}</button>
                ${job.status === 'unassigned' ? `<button onclick="window.dispatcherMapAssignClick('${job.id}')" style="
                  flex: 1; 
                  padding: 8px 12px; 
                  background: #10B981; 
                  border: none; 
                  border-radius: 6px; 
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                  color: white;
                ">${t('mapAssign.assignJob', 'Assign Job')}</button>` : ''}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            className: theme === 'dark' ? 'dark-popup' : 'light-popup'
          });

          markersRef.current.push(marker);
        });

        // Add custom CSS for popups
        const style = document.createElement('style');
        style.id = 'dispatcher-map-styles';
        style.textContent = `
          .leaflet-popup-content-wrapper {
            background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
            color: ${theme === 'dark' ? '#f9fafb' : '#111827'};
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            padding: 0;
          }
          .leaflet-popup-content {
            margin: 0;
          }
          .leaflet-popup-tip {
            background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          }
          .leaflet-container {
            font-family: inherit;
          }
          .leaflet-control-attribution {
            display: none !important;
          }
          .dispatcher-map-marker {
            background: transparent !important;
            border: none !important;
          }
        `;
        
        // Remove old style if exists
        const oldStyle = document.getElementById('dispatcher-map-styles');
        if (oldStyle) oldStyle.remove();
        document.head.appendChild(style);

        (mapRef.current as any)._customStyle = style;

        // Add global functions for popup buttons
        (window as any).dispatcherMapJobClick = (jobId: string) => {
          const job = jobsWithLocation.find(j => j.id === jobId);
          if (job && onJobClick) {
            onJobClick(job);
          }
        };
        
        (window as any).dispatcherMapAssignClick = (jobId: string) => {
          const job = jobsWithLocation.find(j => j.id === jobId);
          if (job) {
            setSelectedJobForAssign(job);
          }
        };

        // Fit bounds if we have markers
        if (jobsWithLocation.length > 1) {
          const bounds = L.latLngBounds(jobsWithLocation.map(j => [j.location.lat, j.location.lng]));
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

      } catch (error) {
        console.error('Failed to initialize dispatcher map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        try {
          const customStyle = (mapRef.current as any)._customStyle;
          if (customStyle && customStyle.parentNode) {
            customStyle.parentNode.removeChild(customStyle);
          }
          mapRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
      delete (window as any).dispatcherMapJobClick;
      delete (window as any).dispatcherMapAssignClick;
    };
  }, [jobsWithLocation, theme, mapCenter, technicians, t]);

  // Calculate distance between two lat/lng points (Haversine formula)
  const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Get nearby available technicians sorted by distance
  const nearbyTechnicians = useMemo(() => {
    if (!selectedJobForAssign?.location?.lat || !selectedJobForAssign?.location?.lng) return [];
    
    return technicians
      .filter(tech => tech.status === 'available' && tech.location?.lat && tech.location?.lng)
      .map(tech => ({
        ...tech,
        distance: getDistanceKm(
          selectedJobForAssign.location.lat!, selectedJobForAssign.location.lng!,
          tech.location!.lat, tech.location!.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [selectedJobForAssign, technicians]);

  // Handle assigning a job to a technician from map
  const handleMapAssign = async (technicianId: string) => {
    if (!selectedJobForAssign || isAssigning) return;
    setIsAssigning(true);
    try {
      const now = new Date();
      const scheduledStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
      const scheduledEnd = new Date(scheduledStart.getTime() + (selectedJobForAssign.estimatedDuration || 60) * 60000);
      
      await DispatcherService.assignJob(
        selectedJobForAssign.id,
        technicianId,
        scheduledStart,
        scheduledEnd
      );
      
      toast.success(t('mapAssign.assigned_successfully', 'Job assigned successfully'));
      setSelectedJobForAssign(null);
      onJobAssigned?.();
    } catch (error) {
      console.error('Failed to assign job from map:', error);
      toast.error(t('mapAssign.assignment_failed', 'Failed to assign job'));
    } finally {
      setIsAssigning(false);
    }
  };

  // Always show the map, even with no locations

  return (
    <div className="relative h-full min-h-[400px] rounded-lg overflow-hidden border shadow-sm flex">
      <div ref={mapContainer} className="flex-1 h-full" style={{ minHeight: '400px' }} />
      
      {/* Nearby Technicians Panel */}
      {selectedJobForAssign && (
        <div className="w-72 border-l bg-card flex-shrink-0 flex flex-col z-[1001]">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {t('mapAssign.nearbyTechnicians')}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {selectedJobForAssign.title || selectedJobForAssign.serviceOrderTitle}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setSelectedJobForAssign(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Job info */}
          <div className="p-3 border-b bg-muted/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{selectedJobForAssign.location?.address}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{selectedJobForAssign.estimatedDuration || 60} min</span>
            </div>
            {selectedJobForAssign.customerName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{selectedJobForAssign.customerName}</span>
              </div>
            )}
          </div>
          
          {/* Technician list */}
          <ScrollArea className="flex-1">
            {nearbyTechnicians.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {t('mapAssign.noNearbyTechs')}
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {nearbyTechnicians.map(tech => (
                  <div
                    key={tech.id}
                    className="p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {tech.firstName[0]}{tech.lastName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">
                          {tech.firstName} {tech.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {t('mapAssign.distance', { distance: tech.distance })}
                        </div>
                      </div>
                    </div>
                    
                    {tech.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tech.skills.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {tech.skills.length > 3 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            +{tech.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      disabled={isAssigning}
                      onClick={() => handleMapAssign(tech.id)}
                    >
                      <Briefcase className="h-3 w-3 mr-1" />
                      {t('mapAssign.assign')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg border">
        <div className="text-xs font-medium text-foreground mb-2">
          {t('dispatcher.map.legend', 'Legend')}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t('dispatcher.map.pin_shows_technician', 'Pins show assigned technician initials')}
            </span>
          </div>
        </div>
      </div>

      {/* Open in Maps button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg"
          onClick={() => {
            const googleMapsUrl = `https://www.google.com/maps/@${mapCenter[0]},${mapCenter[1]},13z`;
            window.open(googleMapsUrl, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('dispatcher.map.open_in_maps', 'Open in Maps')}
        </Button>
      </div>

      {/* Job count badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
        {jobsWithLocation.length} {t('dispatcher.map.jobs_on_map', 'jobs on map')}
      </div>
    </div>
  );
}
