/**
 * MapEditor — Properties panel for Map block with contact info and style options.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditorSection } from './property-editors';
import { ColorPicker } from './property-editors';
import {
  MapPin, Phone, Mail, Clock, Settings, Palette, Layout, Eye, Navigation, Globe,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

type MapTheme = 'default' | 'light' | 'dark' | 'satellite' | 'streets' | 'outdoors' | 'grayscale' | 'watercolor';
type MapVariant = 'map-only' | 'map-with-info' | 'split' | 'overlay';
type InfoPosition = 'left' | 'right' | 'top' | 'bottom';
type ContactCardStyle = 'default' | 'minimal' | 'bordered' | 'elevated' | 'glass' | 'accent';

interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

interface MapConfig {
  // Map
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
  markerColor?: string;
  
  // Layout
  variant?: MapVariant;
  infoPosition?: InfoPosition;
  
  // Contact Card
  showContactCard?: boolean;
  contactCardTitle?: string;
  contactCardStyle?: ContactCardStyle;
  contactInfo?: ContactInfo;
  showDirectionsButton?: boolean;
  directionsButtonText?: string;
  
  // Styling
  bgColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
}

interface MapEditorProps {
  config: Partial<MapConfig>;
  onUpdate: (config: Partial<MapConfig>) => void;
}

// ══════════════════════════════════════════════════════════════════
// Map Theme Options
// ══════════════════════════════════════════════════════════════════

const MAP_THEMES: { value: MapTheme; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'streets', label: 'Streets' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'watercolor', label: 'Watercolor' },
];

const CONTACT_CARD_STYLES: { value: ContactCardStyle; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Clean white card' },
  { value: 'minimal', label: 'Minimal', description: 'No background, text only' },
  { value: 'bordered', label: 'Bordered', description: 'Subtle border outline' },
  { value: 'elevated', label: 'Elevated', description: 'Floating with shadow' },
  { value: 'glass', label: 'Glass', description: 'Frosted glass effect' },
  { value: 'accent', label: 'Accent', description: 'Primary color background' },
];

// ══════════════════════════════════════════════════════════════════
// Section Components
// ══════════════════════════════════════════════════════════════════

function LocationSection({ config, onUpdate }: { config: Partial<MapConfig>; onUpdate: (c: Partial<MapConfig>) => void }) {
  return (
    <EditorSection title="Location" icon={<MapPin className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Address</Label>
          <Input
            value={config.address || ''}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="123 Main St, City, Country"
            className="h-8 text-xs"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Latitude</Label>
            <Input
              type="number"
              step="0.0001"
              value={config.latitude ?? 48.8566}
              onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) || 0 })}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Longitude</Label>
            <Input
              type="number"
              step="0.0001"
              value={config.longitude ?? 2.3522}
              onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
              className="h-7 text-xs"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Google Maps Embed URL (optional)</Label>
          <Input
            value={config.embedUrl || ''}
            onChange={(e) => onUpdate({ embedUrl: e.target.value })}
            placeholder="https://maps.google.com/maps?..."
            className="h-7 text-xs"
          />
          <p className="text-[9px] text-muted-foreground/60">Leave empty to use Leaflet map with coordinates</p>
        </div>
      </div>
    </EditorSection>
  );
}

function MapSettingsSection({ config, onUpdate }: { config: Partial<MapConfig>; onUpdate: (c: Partial<MapConfig>) => void }) {
  return (
    <EditorSection title="Map Settings" icon={<Settings className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Zoom Level</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[config.zoom ?? 14]}
                onValueChange={([v]) => onUpdate({ zoom: v })}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-6">{config.zoom ?? 14}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Height (px)</Label>
            <Input
              type="number"
              value={config.height ?? 400}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 400 })}
              className="h-7 text-xs"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Map Style</Label>
          <div className="grid grid-cols-4 gap-1">
            {MAP_THEMES.map((t) => (
              <button
                key={t.value}
                className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all capitalize ${
                  config.mapTheme === t.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border hover:bg-muted/30'
                }`}
                onClick={() => onUpdate({ mapTheme: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        <ColorPicker
          label="Marker Color"
          value={config.markerColor || '#3B82F6'}
          onChange={(v) => onUpdate({ markerColor: v })}
        />
        
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.showZoomControl !== false}
              onCheckedChange={(v) => onUpdate({ showZoomControl: v })}
              className="scale-75"
            />
            Zoom Controls
          </label>
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.draggable !== false}
              onCheckedChange={(v) => onUpdate({ draggable: v })}
              className="scale-75"
            />
            Draggable
          </label>
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.scrollWheelZoom === true}
              onCheckedChange={(v) => onUpdate({ scrollWheelZoom: v })}
              className="scale-75"
            />
            Scroll Zoom
          </label>
        </div>
      </div>
    </EditorSection>
  );
}

function LayoutSection({ config, onUpdate }: { config: Partial<MapConfig>; onUpdate: (c: Partial<MapConfig>) => void }) {
  return (
    <EditorSection title="Layout" icon={<Layout className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Variant</Label>
          <div className="grid grid-cols-2 gap-1">
            {[
              { value: 'map-only', label: 'Map Only' },
              { value: 'map-with-info', label: 'Map + Info' },
              { value: 'split', label: 'Split' },
              { value: 'overlay', label: 'Overlay' },
            ].map((v) => (
              <button
                key={v.value}
                className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all ${
                  config.variant === v.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border hover:bg-muted/30'
                }`}
                onClick={() => onUpdate({ variant: v.value as MapVariant })}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        
        {(config.variant === 'split') && (
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Info Position</Label>
            <div className="grid grid-cols-4 gap-1">
              {['left', 'right', 'top', 'bottom'].map((pos) => (
                <button
                  key={pos}
                  className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all capitalize ${
                    config.infoPosition === pos
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/40 hover:border-border hover:bg-muted/30'
                  }`}
                  onClick={() => onUpdate({ infoPosition: pos as InfoPosition })}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.showBorder === true}
              onCheckedChange={(v) => onUpdate({ showBorder: v })}
              className="scale-75"
            />
            Show Border
          </label>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Border Radius</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[config.borderRadius ?? 8]}
              onValueChange={([v]) => onUpdate({ borderRadius: v })}
              min={0}
              max={32}
              step={2}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-8">{config.borderRadius ?? 8}px</span>
          </div>
        </div>
      </div>
    </EditorSection>
  );
}

function ContactCardSection({ config, onUpdate }: { config: Partial<MapConfig>; onUpdate: (c: Partial<MapConfig>) => void }) {
  const contactInfo = config.contactInfo || {};
  
  const updateContactInfo = (updates: Partial<ContactInfo>) => {
    onUpdate({ contactInfo: { ...contactInfo, ...updates } });
  };

  return (
    <EditorSection title="Contact Card" icon={<Phone className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium">Show Contact Card</Label>
          <Switch
            checked={config.showContactCard === true}
            onCheckedChange={(v) => onUpdate({ showContactCard: v })}
          />
        </div>
        
        {config.showContactCard && (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Card Title</Label>
              <Input
                value={config.contactCardTitle || 'Contact Us'}
                onChange={(e) => onUpdate({ contactCardTitle: e.target.value })}
                placeholder="Contact Us"
                className="h-7 text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Card Style</Label>
              <div className="grid grid-cols-3 gap-1">
                {CONTACT_CARD_STYLES.map((s) => (
                  <button
                    key={s.value}
                    className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all ${
                      (config.contactCardStyle || 'default') === s.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 hover:border-border hover:bg-muted/30'
                    }`}
                    onClick={() => onUpdate({ contactCardStyle: s.value })}
                    title={s.description}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/30 space-y-2">
              <Label className="text-[10px] font-medium text-muted-foreground/70">Contact Details</Label>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={contactInfo.address || ''}
                  onChange={(e) => updateContactInfo({ address: e.target.value })}
                  placeholder="123 Main St, City, Country"
                  className="h-7 text-xs"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={contactInfo.phone || ''}
                  onChange={(e) => updateContactInfo({ phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="h-7 text-xs"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={contactInfo.email || ''}
                  onChange={(e) => updateContactInfo({ email: e.target.value })}
                  placeholder="hello@company.com"
                  className="h-7 text-xs"
                />
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5" />
                <Textarea
                  value={contactInfo.hours || ''}
                  onChange={(e) => updateContactInfo({ hours: e.target.value })}
                  placeholder="Mon-Fri: 9am-5pm&#10;Sat: 10am-3pm&#10;Sun: Closed"
                  className="text-xs min-h-[60px] resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Directions Button</Label>
                <Switch
                  checked={config.showDirectionsButton !== false}
                  onCheckedChange={(v) => onUpdate({ showDirectionsButton: v })}
                  className="scale-75"
                />
              </div>
              
              {config.showDirectionsButton !== false && (
                <Input
                  value={config.directionsButtonText || 'Get Directions'}
                  onChange={(e) => onUpdate({ directionsButtonText: e.target.value })}
                  placeholder="Get Directions"
                  className="h-7 text-xs"
                />
              )}
            </div>
          </>
        )}
      </div>
    </EditorSection>
  );
}

function AppearanceSection({ config, onUpdate }: { config: Partial<MapConfig>; onUpdate: (c: Partial<MapConfig>) => void }) {
  return (
    <EditorSection title="Appearance" icon={<Palette className="h-3.5 w-3.5" />}>
      <div className="space-y-3">
        <ColorPicker
          label="Background Color"
          value={config.bgColor || 'transparent'}
          onChange={(v) => onUpdate({ bgColor: v })}
        />
        
        <label className="flex items-center gap-2 text-[10px]">
          <Switch
            checked={config.showAttribution !== false}
            onCheckedChange={(v) => onUpdate({ showAttribution: v })}
            className="scale-75"
          />
          Show Map Attribution
        </label>
      </div>
    </EditorSection>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main Editor Component
// ══════════════════════════════════════════════════════════════════

export function MapEditor({ config, onUpdate }: MapEditorProps) {
  return (
    <div className="space-y-1">
      <LocationSection config={config} onUpdate={onUpdate} />
      <MapSettingsSection config={config} onUpdate={onUpdate} />
      <LayoutSection config={config} onUpdate={onUpdate} />
      <ContactCardSection config={config} onUpdate={onUpdate} />
      <AppearanceSection config={config} onUpdate={onUpdate} />
    </div>
  );
}

export default MapEditor;
