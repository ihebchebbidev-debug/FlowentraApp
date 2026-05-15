import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COMPONENT_PALETTE } from '../../utils/palette';
import {
  Layout, Square, Columns2, Columns3, Type, Info, Grid3X3,
  DollarSign, Quote, Mail, Image, Video, MousePointer, Minus,
  Menu, PanelBottom, ArrowUpDown, BarChart3, HelpCircle,
  Users, Building, Megaphone, Pin, Layers, ChevronRight,
  MoreHorizontal, AlignLeft, FileText, Code, List, AlertCircle,
  Zap, Star, User, Search, ClipboardList, LogIn, Inbox,
  Share2, LayoutGrid, Activity, GitBranch, Flag, Bell,
  MoveHorizontal, Timer, ExternalLink, ToggleLeft, Table2,
  MessageSquare, Shield, Newspaper, ShoppingBag, Code2,
  Cookie, MapPin, MapPinned, PanelLeft, LayoutDashboard, LayoutPanelLeft,
  Film, Music, Briefcase, ListVideo,
  LayoutList, Maximize, SplitSquareHorizontal, Package, ShoppingCart,
  UserPlus, UserCircle, MessageCircle, Tag, ChevronDown,
  Globe, Plus, GripVertical, Rows3,
  GalleryHorizontal, PanelLeftClose, Palette, Play,
  Gift, AlertTriangle, Sparkles, Webhook,
  SlidersHorizontal, CreditCard, Heart, Eye, ListOrdered,
  AlignCenter, Award, CirclePlay, CircleArrowUp,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

/** Data transfer key — must match EditorCanvas.tsx */
const PALETTE_DRAG_TYPE = 'application/x-builder-block-type';

const ICON_MAP: Record<string, React.FC<any>> = {
  Layout, Square, Columns2, Columns3, Type, Info, Grid3X3,
  DollarSign, Quote, Mail, Image, Video, MousePointer, Minus,
  Menu, PanelBottom, ArrowUpDown, BarChart3, HelpCircle,
  Users, Building, Megaphone, Pin, Layers, ChevronRight,
  MoreHorizontal, AlignLeft, FileText, Code, List, AlertCircle,
  Zap, Star, User, Search, ClipboardList, LogIn, Inbox,
  Share2, LayoutGrid, Activity, GitBranch, Flag, Bell,
  MoveHorizontal, Timer, ExternalLink, ToggleLeft, Table2,
  MessageSquare, Shield, Newspaper, ShoppingBag, Code2,
  Cookie, MapPin, MapPinned, PanelLeft, LayoutDashboard, LayoutPanelLeft,
  Film, Music, Briefcase, ListVideo,
  LayoutList, Maximize, SplitSquareHorizontal, Package, ShoppingCart,
  UserPlus, UserCircle, MessageCircle, Tag, Globe, Rows3,
  GalleryHorizontal, PanelLeftClose, Palette, Play,
  Gift, AlertTriangle, Sparkles, Webhook,
  SlidersHorizontal, CreditCard, Heart, Eye, ListOrdered,
  AlignCenter, Award, CirclePlay, CircleArrowUp,
  // Aliases for palette icon names that differ from lucide export names
  Columns: Columns2,
  PlayCircle: CirclePlay,
  ArrowUpCircle: CircleArrowUp,
};

const CATEGORY_KEYS = [
  { key: 'layout', i18nKey: 'layout', emoji: '🧱' },
  { key: 'navigation', i18nKey: 'navigation', emoji: '🧭' },
  { key: 'text', i18nKey: 'textContent', emoji: '✍️' },
  { key: 'media', i18nKey: 'media', emoji: '🖼️' },
  { key: 'business', i18nKey: 'business', emoji: '💼' },
  { key: 'interactive', i18nKey: 'interactive', emoji: '🧩' },
  { key: 'blog', i18nKey: 'blogProducts', emoji: '📰' },
  { key: 'advanced', i18nKey: 'advanced', emoji: '⚙️' },
] as const;

// Mini wireframe thumbnails for popular block types
const BLOCK_THUMBNAIL: Record<string, React.FC<{ className?: string }>> = {
  /* ── HERO VARIANTS ── */
  'hero:Hero Section': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/6 rounded-[1px] flex flex-col items-center justify-center gap-[2px] p-[2px]">
        <div className="w-4/5 h-[3px] bg-current/25 rounded-[1px]" />
        <div className="w-3/5 h-[2px] bg-current/15 rounded-[1px]" />
        <div className="w-3 h-[3px] bg-current/30 rounded-[1px] mt-[2px]" />
      </div>
    </div>
  ),
  hero: ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/6 rounded-[1px] flex flex-col items-center justify-center gap-[2px] p-[2px]">
        <div className="w-4/5 h-[3px] bg-current/25 rounded-[1px]" />
        <div className="w-3/5 h-[2px] bg-current/15 rounded-[1px]" />
        <div className="w-3 h-[3px] bg-current/30 rounded-[1px] mt-[2px]" />
      </div>
    </div>
  ),
  'hero:Hero Carousel': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/6 rounded-[1px] flex flex-col items-center justify-center gap-[2px] p-[2px] relative">
        <div className="w-3/5 h-[3px] bg-current/25 rounded-[1px]" />
        <div className="w-2/5 h-[2px] bg-current/12 rounded-[1px]" />
        <div className="absolute bottom-[2px] flex gap-[2px]">
          <div className="w-[3px] h-[3px] rounded-full bg-current/30" />
          <div className="w-[3px] h-[3px] rounded-full bg-current/12" />
          <div className="w-[3px] h-[3px] rounded-full bg-current/12" />
        </div>
        <div className="absolute left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-current/15 rounded-[0.5px]" />
        <div className="absolute right-[1px] top-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-current/15 rounded-[0.5px]" />
      </div>
    </div>
  ),
  'hero:Split Hero': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full flex gap-[2px]">
        <div className="flex-1 flex flex-col justify-center gap-[2px] p-[2px]">
          <div className="w-full h-[3px] bg-current/25 rounded-[1px]" />
          <div className="w-4/5 h-[2px] bg-current/12 rounded-[1px]" />
          <div className="w-3 h-[3px] bg-current/30 rounded-[1px] mt-[1px]" />
        </div>
        <div className="flex-1 bg-current/10 rounded-[1px]" />
      </div>
    </div>
  ),
  'hero:Gradient Hero': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full rounded-[1px] flex flex-col items-center justify-center gap-[2px] p-[2px]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.12))' }}>
        <div className="w-4/5 h-[3px] bg-current/30 rounded-[1px]" />
        <div className="w-3/5 h-[2px] bg-current/18 rounded-[1px]" />
        <div className="w-3 h-[3px] bg-current/35 rounded-[1px] mt-[1px]" />
      </div>
    </div>
  ),
  'hero:Video Hero': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/8 rounded-[1px] flex flex-col items-center justify-center gap-[2px] p-[2px] relative">
        <div className="w-3/5 h-[3px] bg-current/25 rounded-[1px]" />
        <div className="w-2/5 h-[2px] bg-current/12 rounded-[1px]" />
        <div className="absolute bottom-[2px] right-[2px] w-2 h-1.5 rounded-[1px] bg-current/15 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[3px] border-l-current/30 border-y-[2px] border-y-transparent" />
        </div>
      </div>
    </div>
  ),

  /* ── NAVIGATION ── */
  'navbar:Navbar': ({ className }) => (
    <div className={className}>
      <div className="flex items-center gap-[2px] h-full">
        <div className="w-2 h-[3px] bg-current/30 rounded-[1px]" />
        <div className="flex-1" />
        <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
        <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
        <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
      </div>
    </div>
  ),
  'navbar:Split Navbar': ({ className }) => (
    <div className={className}>
      <div className="flex items-center h-full">
        <div className="w-2 h-[3px] bg-current/30 rounded-[1px]" />
        <div className="flex-1 flex items-center justify-center gap-[2px]">
          <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
          <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
          <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
        </div>
        <div className="w-2.5 h-[3px] bg-current/25 rounded-[1px]" />
      </div>
    </div>
  ),
  'navbar:Stacked Navbar': ({ className }) => (
    <div className={className}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between bg-current/8 px-[2px] py-[1px]">
          <div className="w-3 h-[2px] bg-current/15 rounded-[1px]" />
          <div className="flex gap-[2px]">
            <div className="w-1 h-[1px] bg-current/10 rounded-[1px]" />
            <div className="w-1 h-[1px] bg-current/10 rounded-[1px]" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div className="w-2 h-[3px] bg-current/25 rounded-[1px]" />
          <div className="flex gap-[2px]">
            <div className="w-1.5 h-[2px] bg-current/12 rounded-[1px]" />
            <div className="w-1.5 h-[2px] bg-current/12 rounded-[1px]" />
            <div className="w-2 h-[2px] bg-current/20 rounded-[1px]" />
          </div>
        </div>
      </div>
    </div>
  ),

  /* ── FOOTERS ── */
  'footer:Footer': ({ className }) => (
    <div className={className}>
      <div className="flex items-center justify-between h-full border-t border-current/10 pt-[2px]">
        <div className="w-2 h-[3px] bg-current/20 rounded-[1px]" />
        <div className="flex gap-[2px]">
          <div className="w-1.5 h-[2px] bg-current/10 rounded-[1px]" />
          <div className="w-1.5 h-[2px] bg-current/10 rounded-[1px]" />
          <div className="w-1.5 h-[2px] bg-current/10 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),
  'footer:Column Footer': ({ className }) => (
    <div className={className}>
      <div className="border-t border-current/10 pt-[2px] h-full">
        <div className="grid grid-cols-4 gap-[3px] h-full">
          <div className="flex flex-col gap-[1px]">
            <div className="w-3 h-[3px] bg-current/25 rounded-[1px]" />
            <div className="w-full h-[2px] bg-current/8 rounded-[1px]" />
            <div className="flex gap-[1px] mt-auto">
              <div className="w-1 h-1 rounded-full bg-current/15" />
              <div className="w-1 h-1 rounded-full bg-current/15" />
            </div>
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="flex flex-col gap-[1px]">
              <div className="w-2.5 h-[2px] bg-current/20 rounded-[1px]" />
              <div className="w-full h-[1px] bg-current/8 rounded-[1px]" />
              <div className="w-3/4 h-[1px] bg-current/8 rounded-[1px]" />
              <div className="w-full h-[1px] bg-current/8 rounded-[1px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  'footer:Centered Footer': ({ className }) => (
    <div className={className}>
      <div className="border-t border-current/10 pt-[2px] h-full flex flex-col items-center justify-center gap-[2px]">
        <div className="w-3 h-[3px] bg-current/25 rounded-[1px]" />
        <div className="w-4/5 h-[2px] bg-current/10 rounded-[1px]" />
        <div className="flex gap-[3px] mt-[1px]">
          <div className="w-1.5 h-[2px] bg-current/12 rounded-[1px]" />
          <div className="w-1.5 h-[2px] bg-current/12 rounded-[1px]" />
          <div className="w-1.5 h-[2px] bg-current/12 rounded-[1px]" />
        </div>
        <div className="flex gap-[2px] mt-[1px]">
          <div className="w-1.5 h-1.5 rounded-full bg-current/15" />
          <div className="w-1.5 h-1.5 rounded-full bg-current/15" />
          <div className="w-1.5 h-1.5 rounded-full bg-current/15" />
        </div>
      </div>
    </div>
  ),
  'footer:Branded Footer': ({ className }) => (
    <div className={className}>
      <div className="border-t border-current/10 pt-[2px] h-full flex flex-col items-center justify-center gap-[2px]">
        <div className="w-5 h-[4px] bg-current/20 rounded-[1px]" />
        <div className="w-3/5 h-[2px] bg-current/8 rounded-[1px]" />
        <div className="w-full border-t border-b border-current/8 py-[1px] flex items-center justify-between mt-[1px]">
          <div className="flex gap-[2px]">
            <div className="w-1 h-[1px] bg-current/10 rounded-[1px]" />
            <div className="w-1 h-[1px] bg-current/10 rounded-[1px]" />
          </div>
          <div className="flex gap-[1px]">
            <div className="w-1 h-1 rounded-full bg-current/12" />
            <div className="w-1 h-1 rounded-full bg-current/12" />
          </div>
        </div>
      </div>
    </div>
  ),
  'footer:Minimal Footer': ({ className }) => (
    <div className={className}>
      <div className="border-t border-current/10 pt-[2px] h-full flex items-center justify-between">
        <div className="w-2 h-[2px] bg-current/20 rounded-[1px]" />
        <div className="flex gap-[2px]">
          <div className="w-1 h-[1px] bg-current/10 rounded-[1px]" />
          <div className="w-1 h-[1px] bg-current/10 rounded-[1px]" />
        </div>
        <div className="flex gap-[1px]">
          <div className="w-1 h-1 rounded-full bg-current/10" />
          <div className="w-1 h-1 rounded-full bg-current/10" />
          <div className="w-2.5 h-[2px] bg-current/8 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),

  /* ── BUSINESS ── */
  features: ({ className }) => (
    <div className={className}>
      <div className="w-3/5 h-[2px] bg-current/20 rounded-[1px] mx-auto mb-[3px]" />
      <div className="grid grid-cols-3 gap-[2px]">
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-[1px]">
            <div className="w-1.5 h-1.5 rounded-full bg-current/20" />
            <div className="w-full h-[2px] bg-current/10 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  pricing: ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-3 gap-[2px] h-full">
        {[1,2,3].map(i => (
          <div key={i} className={`flex flex-col items-center gap-[1px] rounded-[1px] p-[1px] ${i === 2 ? 'bg-current/10' : 'bg-current/5'}`}>
            <div className="w-2 h-[2px] bg-current/25 rounded-[1px]" />
            <div className="w-1.5 h-[2px] bg-current/15 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  testimonials: ({ className }) => (
    <div className={className}>
      <div className="flex items-start gap-[2px]">
        <div className="w-2 h-2 rounded-full bg-current/15 shrink-0 mt-[1px]" />
        <div className="flex-1 space-y-[1px]">
          <div className="w-full h-[2px] bg-current/15 rounded-[1px]" />
          <div className="w-4/5 h-[2px] bg-current/10 rounded-[1px]" />
          <div className="flex gap-[1px] mt-[2px]">
            {[1,2,3,4,5].map(i => <div key={i} className="w-[3px] h-[3px] bg-current/20 rounded-[0.5px]" />)}
          </div>
        </div>
      </div>
    </div>
  ),
  stats: ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-4 gap-[2px]">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex flex-col items-center gap-[1px]">
            <div className="w-2 h-[3px] bg-current/25 rounded-[1px]" />
            <div className="w-full h-[2px] bg-current/10 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  'cta-banner': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/8 rounded-[1px] flex items-center justify-between p-[3px]">
        <div className="flex flex-col gap-[1px]">
          <div className="w-4 h-[3px] bg-current/25 rounded-[1px]" />
          <div className="w-3 h-[2px] bg-current/12 rounded-[1px]" />
        </div>
        <div className="w-3 h-[4px] bg-current/30 rounded-[1px]" />
      </div>
    </div>
  ),
  'logo-cloud': ({ className }) => (
    <div className={className}>
      <div className="w-3/5 h-[2px] bg-current/15 rounded-[1px] mx-auto mb-[3px]" />
      <div className="flex items-center justify-center gap-[3px]">
        {[1,2,3,4].map(i => (
          <div key={i} className="w-2 h-1.5 bg-current/10 rounded-[0.5px]" />
        ))}
      </div>
    </div>
  ),
  'team-grid': ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-3 gap-[3px]">
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-[1px]">
            <div className="w-2 h-2 rounded-full bg-current/15" />
            <div className="w-full h-[2px] bg-current/12 rounded-[1px]" />
            <div className="w-2/3 h-[1px] bg-current/8 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  'service-card': ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-3 gap-[2px]">
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-[1px] p-[1px] bg-current/5 rounded-[1px]">
            <div className="w-1.5 h-1.5 rounded-full bg-current/18" />
            <div className="w-full h-[2px] bg-current/15 rounded-[1px]" />
            <div className="w-2/3 h-[1px] bg-current/8 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  about: ({ className }) => (
    <div className={className}>
      <div className="flex gap-[3px] h-full">
        <div className="w-2/5 bg-current/10 rounded-[1px]" />
        <div className="flex-1 flex flex-col justify-center gap-[2px]">
          <div className="w-full h-[3px] bg-current/20 rounded-[1px]" />
          <div className="w-full h-[2px] bg-current/10 rounded-[1px]" />
          <div className="w-3/4 h-[2px] bg-current/8 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),

  /* ── INTERACTIVE ── */
  'contact-form': ({ className }) => (
    <div className={className}>
      <div className="space-y-[2px]">
        <div className="w-full h-[4px] bg-current/8 rounded-[1px] border border-current/10" />
        <div className="w-full h-[4px] bg-current/8 rounded-[1px] border border-current/10" />
        <div className="w-full h-[6px] bg-current/8 rounded-[1px] border border-current/10" />
        <div className="w-3 h-[4px] bg-current/20 rounded-[1px]" />
      </div>
    </div>
  ),
  faq: ({ className }) => (
    <div className={className}>
      <div className="space-y-[2px]">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-[2px] px-[1px]">
            <div className="w-[3px] h-[3px] bg-current/15 rounded-[0.5px]" />
            <div className="flex-1 h-[2px] bg-current/12 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  newsletter: ({ className }) => (
    <div className={className}>
      <div className="flex flex-col items-center gap-[2px]">
        <div className="w-4/5 h-[2px] bg-current/20 rounded-[1px]" />
        <div className="w-3/5 h-[2px] bg-current/10 rounded-[1px]" />
        <div className="flex gap-[2px] mt-[1px] w-full">
          <div className="flex-1 h-[4px] bg-current/8 rounded-[1px] border border-current/10" />
          <div className="w-3 h-[4px] bg-current/25 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),
  timeline: ({ className }) => (
    <div className={className}>
      <div className="flex gap-[2px] h-full">
        <div className="flex flex-col items-center">
          <div className="w-[3px] h-[3px] rounded-full bg-current/25" />
          <div className="flex-1 w-[1px] bg-current/12" />
          <div className="w-[3px] h-[3px] rounded-full bg-current/18" />
          <div className="flex-1 w-[1px] bg-current/12" />
          <div className="w-[3px] h-[3px] rounded-full bg-current/12" />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div className="w-full h-[2px] bg-current/15 rounded-[1px]" />
          <div className="w-3/4 h-[2px] bg-current/10 rounded-[1px]" />
          <div className="w-full h-[2px] bg-current/8 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),
  tabs: ({ className }) => (
    <div className={className}>
      <div className="flex gap-[2px] mb-[2px] border-b border-current/10 pb-[1px]">
        <div className="w-2 h-[3px] bg-current/25 rounded-t-[1px]" />
        <div className="w-2 h-[3px] bg-current/10 rounded-t-[1px]" />
        <div className="w-2 h-[3px] bg-current/10 rounded-t-[1px]" />
      </div>
      <div className="space-y-[1px]">
        <div className="w-full h-[2px] bg-current/10 rounded-[1px]" />
        <div className="w-3/4 h-[2px] bg-current/8 rounded-[1px]" />
      </div>
    </div>
  ),

  /* ── MEDIA ── */
  'image-text': ({ className }) => (
    <div className={className}>
      <div className="flex gap-[3px] h-full">
        <div className="flex-1 bg-current/10 rounded-[1px]" />
        <div className="flex-1 flex flex-col justify-center gap-[2px]">
          <div className="w-full h-[3px] bg-current/20 rounded-[1px]" />
          <div className="w-full h-[2px] bg-current/10 rounded-[1px]" />
          <div className="w-3/4 h-[2px] bg-current/8 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),
  'image-gallery': ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-3 gap-[1px]">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="aspect-square bg-current/10 rounded-[0.5px]" />
        ))}
      </div>
    </div>
  ),
  'video-embed': ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/8 rounded-[1px] flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-current/15 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[4px] border-l-current/30 border-y-[2.5px] border-y-transparent ml-[1px]" />
        </div>
      </div>
    </div>
  ),
  map: ({ className }) => (
    <div className={className}>
      <div className="w-full h-full bg-current/6 rounded-[1px] flex items-center justify-center relative">
        <div className="w-1.5 h-2 bg-current/20 rounded-t-full" />
        <div className="absolute bottom-[1px] right-[1px] w-2 h-[3px] bg-current/8 rounded-[1px]" />
      </div>
    </div>
  ),

  /* ── E-COMMERCE ── */
  'product-card': ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-3 gap-[2px]">
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col gap-[1px]">
            <div className="w-full aspect-square bg-current/10 rounded-[0.5px]" />
            <div className="w-full h-[2px] bg-current/15 rounded-[1px]" />
            <div className="w-2/3 h-[2px] bg-current/20 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  'product-carousel': ({ className }) => (
    <div className={className}>
      <div className="flex gap-[2px] items-end h-full">
        {[0.6,1,0.6].map((op, i) => (
          <div key={i} className="flex-1 flex flex-col gap-[1px]" style={{ opacity: op }}>
            <div className="w-full aspect-[4/3] bg-current/10 rounded-[0.5px]" />
            <div className="w-full h-[2px] bg-current/12 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),
  cart: ({ className }) => (
    <div className={className}>
      <div className="space-y-[2px]">
        {[1,2].map(i => (
          <div key={i} className="flex items-center gap-[2px]">
            <div className="w-2 h-2 bg-current/10 rounded-[0.5px]" />
            <div className="flex-1 h-[2px] bg-current/12 rounded-[1px]" />
            <div className="w-2 h-[2px] bg-current/20 rounded-[1px]" />
          </div>
        ))}
        <div className="border-t border-current/10 pt-[1px] flex justify-between">
          <div className="w-2 h-[2px] bg-current/12 rounded-[1px]" />
          <div className="w-2.5 h-[3px] bg-current/25 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),

  /* ── BLOG ── */
  'blog-grid': ({ className }) => (
    <div className={className}>
      <div className="grid grid-cols-3 gap-[2px]">
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col gap-[1px]">
            <div className="w-full h-[5px] bg-current/10 rounded-[0.5px]" />
            <div className="w-full h-[2px] bg-current/18 rounded-[1px]" />
            <div className="w-2/3 h-[1px] bg-current/8 rounded-[1px]" />
          </div>
        ))}
      </div>
    </div>
  ),

  /* ── ADVANCED ── */
  'cookie-consent': ({ className }) => (
    <div className={className}>
      <div className="h-full flex flex-col justify-end">
        <div className="w-full bg-current/8 rounded-[1px] p-[2px] flex items-center gap-[2px] border border-current/10">
          <div className="flex-1 h-[2px] bg-current/12 rounded-[1px]" />
          <div className="w-2.5 h-[3px] bg-current/25 rounded-[1px]" />
        </div>
      </div>
    </div>
  ),
};

interface ComponentPaletteProps {
  onAdd: (type: string) => void;
}

export function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  const { t } = useTranslation('wb');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['layout', 'navigation', 'business']));

  const filtered = searchTerm
    ? COMPONENT_PALETTE.filter(p =>
        p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : COMPONENT_PALETTE;

  const toggleCategory = useCallback((key: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, blockType: string, label: string) => {
    e.dataTransfer.setData(PALETTE_DRAG_TYPE, blockType);
    e.dataTransfer.effectAllowed = 'copy';
    // Create a lightweight drag image
    const ghost = document.createElement('div');
    ghost.textContent = label;
    ghost.style.cssText = 'position:fixed;top:-999px;padding:6px 12px;background:#6366f1;color:white;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;z-index:9999;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    // Clean up ghost after drag starts
    requestAnimationFrame(() => document.body.removeChild(ghost));
  }, []);

  const renderItem = useCallback((item: typeof COMPONENT_PALETTE[0], idx: number, compact = false) => {
    const IconComp = ICON_MAP[item.icon] || Square;
    const thumbKey = `${item.type}:${item.label}`;
    const Thumb = BLOCK_THUMBNAIL[thumbKey] || BLOCK_THUMBNAIL[item.type];
    const itemKey = `${item.type}-${idx}`;

    return (
      <div
        key={itemKey}
        draggable
        onDragStart={(e) => handleDragStart(e, item.type, item.label)}
        onClick={() => onAdd(item.type)}
        className={`w-full flex items-start gap-2.5 rounded-lg transition-all text-left group cursor-grab active:cursor-grabbing ${
          compact
            ? 'px-2 py-1.5 hover:bg-primary/4'
            : 'px-2.5 py-2 border border-border/20 hover:border-primary/25 hover:bg-primary/3'
        }`}
      >
        {/* Icon or Thumbnail */}
        {Thumb ? (
          <div className="w-8 h-7 rounded-md bg-muted/30 group-hover:bg-primary/8 flex flex-col p-[3px] transition-colors shrink-0 text-muted-foreground/50 group-hover:text-primary overflow-hidden pointer-events-none">
            <Thumb className="w-full h-full flex flex-col" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-md bg-muted/30 group-hover:bg-primary/8 flex items-center justify-center transition-colors shrink-0 pointer-events-none">
            <IconComp className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        )}
        <div className="flex-1 min-w-0 pointer-events-none">
          <span className="text-[11px] text-foreground/70 group-hover:text-foreground font-medium block truncate">{item.label}</span>
          {item.description && (
            <span className="text-[9px] text-muted-foreground/50 group-hover:text-muted-foreground/70 block truncate leading-tight mt-[1px]">{item.description}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 mt-1 pointer-events-none">
          <GripVertical className="h-3 w-3 text-transparent group-hover:text-muted-foreground/30 transition-colors" />
          <Plus className="h-3 w-3 text-transparent group-hover:text-primary/40 transition-colors" />
        </div>
      </div>
    );
  }, [onAdd, handleDragStart]);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
           <Input
            placeholder={t('palette.searchBlocks')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs pl-8 bg-muted/30 border-border/30 rounded-lg"
          />
        </div>

        {/* Drag hint */}
        <p className="text-[9px] text-muted-foreground/40 px-0.5 flex items-center gap-1">
          <GripVertical className="h-2.5 w-2.5" />
          {t('palette.dragHint')}
        </p>

        {searchTerm ? (
          <>
            <p className="text-[10px] text-muted-foreground/60 px-0.5">
              {t('palette.results', { count: filtered.length })}
            </p>
            <div className="space-y-1">
              {filtered.map((item, idx) => renderItem(item, idx))}
              {filtered.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-6 w-6 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground/50">{t('palette.noBlocksMatch', { term: searchTerm })}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          CATEGORY_KEYS.map(cat => {
            const items = filtered.filter(p => p.category === cat.key);
            if (items.length === 0) return null;
            const isExpanded = expandedCats.has(cat.key);
            return (
              <div key={cat.key}>
                <button
                  onClick={() => toggleCategory(cat.key)}
                  className="w-full flex items-center gap-2 px-1.5 py-1.5 text-left rounded-md hover:bg-muted/30 transition-colors"
                >
                  <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-200 shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                  <span className="text-[11px] font-semibold text-foreground/70 flex-1">
                    {t(`palette.${cat.i18nKey}`)}
                  </span>
                  <span className="text-[9px] text-muted-foreground/40 tabular-nums">{items.length}</span>
                </button>
                {isExpanded && (
                  <div className="mt-0.5 ml-1 space-y-0.5">
                    {items.map((item, idx) => renderItem(item, idx, true))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
