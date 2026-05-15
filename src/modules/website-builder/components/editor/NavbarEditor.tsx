/**
 * NavbarEditor — Comprehensive configuration panel for navbar/header blocks.
 * Provides extensive customization options for all navbar features.
 */
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown, ChevronUp, Menu, Globe, Search, Bell, Phone, Mail, MapPin, Clock,
  Facebook, Instagram, Twitter, Linkedin, Youtube, Github, Plus, Trash2, GripVertical,
  Layout, Palette, Type, Link2, Settings2, Languages, Image, Megaphone
} from 'lucide-react';
import { EditorSection } from './property-editors';
import { ImageUploader } from './ImageUploader';
import { LanguageSwitcherEditor } from './LanguageSwitcherEditor';
import { SiteLanguage } from '../../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

interface NavLink {
  label: string;
  href: string;
  icon?: string;
  children?: Array<{ label: string; href: string; icon?: string; description?: string }>;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface TopBarLink {
  label: string;
  href: string;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
}

interface NavbarConfig {
  // Basic
  logo: string;
  logoImage?: string;
  logoHeight?: number;
  logoPosition?: 'left' | 'center';
  
  // Navigation
  links: NavLink[];
  linkStyle?: 'default' | 'underline' | 'pill' | 'highlight';
  linkSpacing?: 'compact' | 'normal' | 'wide';
  showIcons?: boolean;
  
  // CTA Button
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  ctaTextColor?: string;
  ctaStyle?: 'solid' | 'outline' | 'ghost';
  secondaryCta?: boolean;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  
  // Appearance
  variant?: 'default' | 'centered' | 'minimal' | 'bordered' | 'split' | 'stacked' | 'floating' | 'transparent';
  sticky?: boolean;
  transparent?: boolean;
  blurBackground?: boolean;
  bgColor?: string;
  textColor?: string;
  borderStyle?: 'none' | 'solid' | 'gradient';
  shadowStyle?: 'none' | 'subtle' | 'medium' | 'strong';
  height?: 'compact' | 'normal' | 'tall';
  
  // Top Bar
  showTopBar?: boolean;
  topBarText?: string;
  topBarLinks?: TopBarLink[];
  topBarBgColor?: string;
  topBarTextColor?: string;
  showTopBarClose?: boolean;
  
  // Contact Info (Top Bar)
  showContactInfo?: boolean;
  contactInfo?: ContactInfo;
  
  // Features
  showSearch?: boolean;
  searchStyle?: 'icon' | 'input' | 'expandable';
  showCart?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  
  // Social Links
  showSocialLinks?: boolean;
  socialLinks?: SocialLink[];
  socialPosition?: 'left' | 'right' | 'topbar';
  
  // Language Switcher
  showLanguageSwitcher?: boolean;
  languageSwitcherVariant?: 'icon' | 'flags' | 'dropdown' | 'pills' | 'text' | 'vertical' | 'carousel' | 'sidebar';
  languageSwitcherPosition?: 'navbar' | 'topbar' | 'mobile-only';
  languages?: SiteLanguage[];
  currentLanguage?: string;
  
  // Mobile
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileMenuStyle?: 'drawer' | 'fullscreen' | 'dropdown';
  mobileMenuPosition?: 'left' | 'right';
  showMobileLogo?: boolean;
  showMobileCta?: boolean;
}

interface NavbarEditorProps {
  config: Partial<NavbarConfig>;
  onUpdate: (config: Partial<NavbarConfig>) => void;
}

// ══════════════════════════════════════════════════════════════════
// Sortable Link Item
// ══════════════════════════════════════════════════════════════════

function SortableLinkItem({ 
  link, 
  index, 
  onUpdate, 
  onRemove 
}: { 
  link: NavLink; 
  index: number;
  onUpdate: (index: number, updates: Partial<NavLink>) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `link-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-muted/10"
    >
      <button
        className="touch-none cursor-grab active:cursor-grabbing p-0.5"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
      </button>
      <Input
        value={link.label}
        onChange={(e) => onUpdate(index, { label: e.target.value })}
        className="h-7 text-xs flex-1"
        placeholder="Label"
      />
      <Input
        value={link.href}
        onChange={(e) => onUpdate(index, { href: e.target.value })}
        className="h-7 text-xs w-24"
        placeholder="URL"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Section Components
// ══════════════════════════════════════════════════════════════════

function LogoSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  return (
    <EditorSection title="Logo & Branding" icon={<Image className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-foreground/70">Logo Text</Label>
          <Input
            value={config.logo || ''}
            onChange={(e) => onUpdate({ logo: e.target.value })}
            placeholder="Brand Name"
            className="h-8 text-xs"
          />
        </div>
        
        <ImageUploader
          label="Logo Image"
          value={config.logoImage || ''}
          onChange={(value) => onUpdate({ logoImage: value })}
        />
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Logo Height</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[config.logoHeight || 32]}
                onValueChange={([v]) => onUpdate({ logoHeight: v })}
                min={20}
                max={80}
                step={4}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-8">{config.logoHeight || 32}px</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Position</Label>
            <Select value={config.logoPosition || 'left'} onValueChange={(v) => onUpdate({ logoPosition: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </EditorSection>
  );
}

function LayoutSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  return (
    <EditorSection title="Layout & Style" icon={<Layout className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-foreground/70">Variant</Label>
          <div className="grid grid-cols-4 gap-1">
            {['default', 'centered', 'minimal', 'split', 'stacked', 'floating', 'transparent', 'bordered'].map((v) => (
              <button
                key={v}
                className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all capitalize ${
                  config.variant === v
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border hover:bg-muted/30'
                }`}
                onClick={() => onUpdate({ variant: v as any })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Height</Label>
            <Select value={config.height || 'normal'} onValueChange={(v) => onUpdate({ height: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="tall">Tall</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Shadow</Label>
            <Select value={config.shadowStyle || 'none'} onValueChange={(v) => onUpdate({ shadowStyle: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="subtle">Subtle</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.sticky}
              onCheckedChange={(v) => onUpdate({ sticky: v })}
              className="scale-75"
            />
            Sticky
          </label>
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.transparent}
              onCheckedChange={(v) => onUpdate({ transparent: v })}
              className="scale-75"
            />
            Transparent
          </label>
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.blurBackground}
              onCheckedChange={(v) => onUpdate({ blurBackground: v })}
              className="scale-75"
            />
            Blur BG
          </label>
        </div>
      </div>
    </EditorSection>
  );
}

function LinksSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  const links = config.links || [];
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((_, i) => `link-${i}` === active.id);
      const newIndex = links.findIndex((_, i) => `link-${i}` === over.id);
      onUpdate({ links: arrayMove(links, oldIndex, newIndex) });
    }
  };

  const handleUpdateLink = (index: number, updates: Partial<NavLink>) => {
    const updated = links.map((l, i) => i === index ? { ...l, ...updates } : l);
    onUpdate({ links: updated });
  };

  const handleAddLink = () => {
    onUpdate({ links: [...links, { label: 'New Link', href: '#' }] });
  };

  const handleRemoveLink = (index: number) => {
    onUpdate({ links: links.filter((_, i) => i !== index) });
  };

  return (
    <EditorSection title="Navigation Links" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Link Style</Label>
            <Select value={config.linkStyle || 'default'} onValueChange={(v) => onUpdate({ linkStyle: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Spacing</Label>
            <Select value={config.linkSpacing || 'normal'} onValueChange={(v) => onUpdate({ linkSpacing: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map((_, i) => `link-${i}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {links.map((link, index) => (
                <SortableLinkItem
                  key={`link-${index}`}
                  link={link}
                  index={index}
                  onUpdate={handleUpdateLink}
                  onRemove={handleRemoveLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={handleAddLink}>
          <Plus className="h-3 w-3 mr-1" /> Add Link
        </Button>
      </div>
    </EditorSection>
  );
}

function CtaSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  return (
    <EditorSection title="Call-to-Action Button" icon={<Megaphone className="h-3.5 w-3.5" />}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Button Text</Label>
            <Input
              value={config.ctaText || ''}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Get Started"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Link URL</Label>
            <Input
              value={config.ctaLink || ''}
              onChange={(e) => onUpdate({ ctaLink: e.target.value })}
              placeholder="#contact"
              className="h-7 text-xs"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Button Style</Label>
          <div className="grid grid-cols-3 gap-1">
            {['solid', 'outline', 'ghost'].map((s) => (
              <button
                key={s}
                className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all capitalize ${
                  config.ctaStyle === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border hover:bg-muted/30'
                }`}
                onClick={() => onUpdate({ ctaStyle: s as any })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={config.secondaryCta}
            onCheckedChange={(v) => onUpdate({ secondaryCta: v })}
          />
          <Label className="text-[10px]">Show Secondary CTA</Label>
        </div>
        
        {config.secondaryCta && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Secondary Text</Label>
              <Input
                value={config.secondaryCtaText || ''}
                onChange={(e) => onUpdate({ secondaryCtaText: e.target.value })}
                placeholder="Learn More"
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Secondary Link</Label>
              <Input
                value={config.secondaryCtaLink || ''}
                onChange={(e) => onUpdate({ secondaryCtaLink: e.target.value })}
                placeholder="#about"
                className="h-7 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </EditorSection>
  );
}

function TopBarSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  return (
    <EditorSection title="Top Bar / Announcement" icon={<Megaphone className="h-3.5 w-3.5" />}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium">Show Top Bar</Label>
          <Switch
            checked={config.showTopBar}
            onCheckedChange={(v) => onUpdate({ showTopBar: v })}
          />
        </div>
        
        {config.showTopBar && (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Announcement Text</Label>
              <Input
                value={config.topBarText || ''}
                onChange={(e) => onUpdate({ topBarText: e.target.value })}
                placeholder="🎉 Free shipping on orders over $50!"
                className="h-7 text-xs"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={config.showTopBarClose}
                onCheckedChange={(v) => onUpdate({ showTopBarClose: v })}
              />
              <Label className="text-[10px]">Dismissable</Label>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium">Show Contact Info</Label>
              <Switch
                checked={config.showContactInfo}
                onCheckedChange={(v) => onUpdate({ showContactInfo: v })}
              />
            </div>
            
            {config.showContactInfo && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <Input
                    value={config.contactInfo?.phone || ''}
                    onChange={(e) => onUpdate({ contactInfo: { ...config.contactInfo, phone: e.target.value } })}
                    placeholder="+1 (555) 123-4567"
                    className="h-6 text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <Input
                    value={config.contactInfo?.email || ''}
                    onChange={(e) => onUpdate({ contactInfo: { ...config.contactInfo, email: e.target.value } })}
                    placeholder="hello@example.com"
                    className="h-6 text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <Input
                    value={config.contactInfo?.hours || ''}
                    onChange={(e) => onUpdate({ contactInfo: { ...config.contactInfo, hours: e.target.value } })}
                    placeholder="Mon-Fri 9am-5pm"
                    className="h-6 text-[10px]"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </EditorSection>
  );
}

function FeaturesSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  return (
    <EditorSection title="Features & Widgets" icon={<Settings2 className="h-3.5 w-3.5" />}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[10px]">Search</Label>
          </div>
          <Switch
            checked={config.showSearch}
            onCheckedChange={(v) => onUpdate({ showSearch: v })}
          />
        </div>
        
        {config.showSearch && (
          <div className="ml-5 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Search Style</Label>
            <Select value={config.searchStyle || 'icon'} onValueChange={(v) => onUpdate({ searchStyle: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="icon">Icon Only</SelectItem>
                <SelectItem value="input">Input Field</SelectItem>
                <SelectItem value="expandable">Expandable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[10px]">Notifications</Label>
          </div>
          <Switch
            checked={config.showNotifications}
            onCheckedChange={(v) => onUpdate({ showNotifications: v })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Menu className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[10px]">User Menu</Label>
          </div>
          <Switch
            checked={config.showUserMenu}
            onCheckedChange={(v) => onUpdate({ showUserMenu: v })}
          />
        </div>
      </div>
    </EditorSection>
  );
}

function SocialSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  const socialLinks = config.socialLinks || [];
  
  const platforms = [
    { id: 'facebook', icon: Facebook, label: 'Facebook' },
    { id: 'instagram', icon: Instagram, label: 'Instagram' },
    { id: 'twitter', icon: Twitter, label: 'Twitter/X' },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
    { id: 'youtube', icon: Youtube, label: 'YouTube' },
    { id: 'github', icon: Github, label: 'GitHub' },
  ];

  const togglePlatform = (platform: string) => {
    const exists = socialLinks.find(s => s.platform === platform);
    if (exists) {
      onUpdate({ socialLinks: socialLinks.filter(s => s.platform !== platform) });
    } else {
      onUpdate({ socialLinks: [...socialLinks, { platform, url: '#' }] });
    }
  };

  const updateUrl = (platform: string, url: string) => {
    onUpdate({
      socialLinks: socialLinks.map(s => s.platform === platform ? { ...s, url } : s)
    });
  };

  return (
    <EditorSection title="Social Links" icon={<Instagram className="h-3.5 w-3.5" />}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-medium">Show Social Links</Label>
          <Switch
            checked={config.showSocialLinks}
            onCheckedChange={(v) => onUpdate({ showSocialLinks: v })}
          />
        </div>
        
        {config.showSocialLinks && (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Position</Label>
              <Select value={config.socialPosition || 'right'} onValueChange={(v) => onUpdate({ socialPosition: v as any })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="left">Left Side</SelectItem>
                  <SelectItem value="right">Right Side</SelectItem>
                  <SelectItem value="topbar">Top Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              {platforms.map(({ id, icon: Icon, label }) => {
                const link = socialLinks.find(s => s.platform === id);
                const isActive = !!link;
                
                return (
                  <div key={id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => togglePlatform(id)}
                        className="scale-75"
                      />
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px]">{label}</span>
                    </div>
                    {isActive && (
                      <Input
                        value={link?.url || ''}
                        onChange={(e) => updateUrl(id, e.target.value)}
                        placeholder={`https://${id}.com/...`}
                        className="h-6 text-[10px] ml-5"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </EditorSection>
  );
}

function MobileSection({ config, onUpdate }: { config: Partial<NavbarConfig>; onUpdate: (c: Partial<NavbarConfig>) => void }) {
  return (
    <EditorSection title="Mobile Settings" icon={<Menu className="h-3.5 w-3.5" />}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Breakpoint</Label>
            <Select value={config.mobileBreakpoint || 'md'} onValueChange={(v) => onUpdate({ mobileBreakpoint: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="sm">Small (640px)</SelectItem>
                <SelectItem value="md">Medium (768px)</SelectItem>
                <SelectItem value="lg">Large (1024px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Menu Style</Label>
            <Select value={config.mobileMenuStyle || 'drawer'} onValueChange={(v) => onUpdate({ mobileMenuStyle: v as any })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="drawer">Drawer</SelectItem>
                <SelectItem value="fullscreen">Fullscreen</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Menu Position</Label>
          <div className="grid grid-cols-2 gap-1">
            {['left', 'right'].map((pos) => (
              <button
                key={pos}
                className={`px-2 py-1.5 text-[9px] rounded-lg border transition-all capitalize ${
                  config.mobileMenuPosition === pos
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border hover:bg-muted/30'
                }`}
                onClick={() => onUpdate({ mobileMenuPosition: pos as any })}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.showMobileLogo !== false}
              onCheckedChange={(v) => onUpdate({ showMobileLogo: v })}
              className="scale-75"
            />
            Show Logo
          </label>
          <label className="flex items-center gap-2 text-[10px]">
            <Switch
              checked={config.showMobileCta !== false}
              onCheckedChange={(v) => onUpdate({ showMobileCta: v })}
              className="scale-75"
            />
            Show CTA
          </label>
        </div>
      </div>
    </EditorSection>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main Editor Component
// ══════════════════════════════════════════════════════════════════

export function NavbarEditor({ config, onUpdate }: NavbarEditorProps) {
  return (
    <div className="space-y-1">
      <LogoSection config={config} onUpdate={onUpdate} />
      <LayoutSection config={config} onUpdate={onUpdate} />
      <LinksSection config={config} onUpdate={onUpdate} />
      <CtaSection config={config} onUpdate={onUpdate} />
      <TopBarSection config={config} onUpdate={onUpdate} />
      <FeaturesSection config={config} onUpdate={onUpdate} />
      <SocialSection config={config} onUpdate={onUpdate} />
      
      {/* Language Switcher - use existing component */}
      <LanguageSwitcherEditor
        showLanguageSwitcher={config.showLanguageSwitcher || false}
        languageSwitcherVariant={config.languageSwitcherVariant || 'icon'}
        languages={config.languages || []}
        currentLanguage={config.currentLanguage || 'en'}
        onUpdate={onUpdate}
      />
      
      <MobileSection config={config} onUpdate={onUpdate} />
    </div>
  );
}

export default NavbarEditor;
