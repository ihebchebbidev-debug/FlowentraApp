import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';

interface MapLocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
  height?: string;
  showCoordinateInputs?: boolean;
  disabled?: boolean;
}

// Lazy load the actual map component to avoid SSR/context issues
const LeafletMap = lazy(() => import('./LeafletMapInner'));

export function MapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  height = '300px',
  showCoordinateInputs = true,
  disabled = false,
}: MapLocationPickerProps) {
  const { t } = useTranslation();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Only mount map after initial render to avoid context issues
  useEffect(() => {
    setMapReady(true);
  }, []);
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidPosition = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const handleMapClick = useCallback((clickLat: number, clickLng: number) => {
    if (disabled) return;
    onLocationChange(clickLat.toFixed(7), clickLng.toFixed(7));
    setLocationError(null);
  }, [disabled, onLocationChange]);

  const handleUseMyLocation = useCallback(() => {
    if (disabled) return;
    
    if (!navigator.geolocation) {
      setLocationError(t('mapPicker.geolocationNotSupported'));
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange(
          position.coords.latitude.toFixed(7),
          position.coords.longitude.toFixed(7)
        );
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t('mapPicker.permissionDenied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(t('mapPicker.positionUnavailable'));
            break;
          case error.TIMEOUT:
            setLocationError(t('mapPicker.timeout'));
            break;
          default:
            setLocationError(t('mapPicker.unknownError'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [disabled, onLocationChange, t]);

  const handleClearLocation = useCallback(() => {
    if (disabled) return;
    onLocationChange('', '');
    setLocationError(null);
  }, [disabled, onLocationChange]);

  const handleLatitudeChange = useCallback((value: string) => {
    if (disabled) return;
    onLocationChange(value, longitude);
  }, [disabled, longitude, onLocationChange]);

  const handleLongitudeChange = useCallback((value: string) => {
    if (disabled) return;
    onLocationChange(latitude, value);
  }, [disabled, latitude, onLocationChange]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            {t('mapPicker.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasValidPosition && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearLocation}
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                {t('mapPicker.clear')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={disabled || isLocating}
              className="h-8"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-1" />
              )}
              {t('mapPicker.useMyLocation')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('mapPicker.instructions')}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map */}
        <div style={{ height }} className="relative bg-muted">
          {mapReady ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }>
              <LeafletMap
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={handleMapClick}
                disabled={disabled}
              />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Error message */}
        {locationError && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {locationError}
          </div>
        )}

        {/* Coordinate inputs */}
        {showCoordinateInputs && (
          <div className="p-4 border-t bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="map-latitude" className="text-xs">
                  {t('mapPicker.latitude')}
                </Label>
                <Input
                  id="map-latitude"
                  type="number"
                  step="0.0000001"
                  value={latitude}
                  onChange={(e) => handleLatitudeChange(e.target.value)}
                  placeholder={t('mapPicker.latitudePlaceholder')}
                  disabled={disabled}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="map-longitude" className="text-xs">
                  {t('mapPicker.longitude')}
                </Label>
                <Input
                  id="map-longitude"
                  type="number"
                  step="0.0000001"
                  value={longitude}
                  onChange={(e) => handleLongitudeChange(e.target.value)}
                  placeholder={t('mapPicker.longitudePlaceholder')}
                  disabled={disabled}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {hasValidPosition && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('mapPicker.currentLocation')}: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MapLocationPicker;
