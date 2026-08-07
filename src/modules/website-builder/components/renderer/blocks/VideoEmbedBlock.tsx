import React, { useState, useMemo } from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2, Play, ExternalLink } from 'lucide-react';

export type VideoVariant = 'standard' | 'inline' | 'grid' | 'playlist' | 'featured';

interface VideoItem {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

interface VideoEmbedBlockProps {
  url: string;
  title?: string;
  description?: string;
  aspectRatio?: string;
  variant?: VideoVariant;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  showTitle?: boolean;
  maxWidth?: string;
  borderRadius?: string;
  shadow?: boolean;
  videos?: VideoItem[];
  columns?: number;
  theme?: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Build YouTube embed URL with params */
function buildEmbedUrl(url: string, opts: { autoplay?: boolean; loop?: boolean; muted?: boolean; showControls?: boolean }): string {
  const id = extractYouTubeId(url);
  if (id) {
    const params = new URLSearchParams();
    if (opts.autoplay) params.set('autoplay', '1');
    if (opts.loop) { params.set('loop', '1'); params.set('playlist', id); }
    if (opts.muted) params.set('mute', '1');
    if (opts.showControls === false) params.set('controls', '0');
    params.set('rel', '0');
    const qs = params.toString();
    return `https://www.youtube.com/embed/${id}${qs ? '?' + qs : ''}`;
  }
  // Vimeo or raw embed URL
  if (url.includes('vimeo.com') && !url.includes('/video/')) {
    const vid = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (vid) return `https://player.vimeo.com/video/${vid}`;
  }
  return url;
}

function getThumbnail(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

export function VideoEmbedBlock({
  url, title, description, aspectRatio = '16/9', variant = 'standard',
  autoplay = false, loop = false, muted = false, showControls = true,
  showTitle = true, maxWidth = '48rem', borderRadius = '0.75rem',
  shadow = true, videos = [], columns = 2, theme, isEditing, onUpdate, style,
}: VideoEmbedBlockProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const embedOpts = { autoplay, loop, muted, showControls };

  const embedUrl = useMemo(() => buildEmbedUrl(url, embedOpts), [url, autoplay, loop, muted, showControls]);

  const EditableInput = ({ value, field, placeholder, className }: { value: string; field: string; placeholder: string; className?: string }) =>
    isEditing ? (
      <input
        type="text" value={value ?? ''} placeholder={placeholder}
        onChange={(e) => onUpdate?.({ [field]: e.target.value })}
        className={`w-full px-3 py-2 text-xs border rounded-lg bg-background outline-none focus:ring-1 focus:ring-primary/30 font-mono ${className || ''}`}
      />
    ) : null;

  const updateVideo = (idx: number, field: keyof VideoItem, val: string) => {
    const updated = videos.map((v, i) => (i === idx ? { ...v, [field]: val } : v));
    onUpdate?.({ videos: updated });
  };

  const addVideo = () => onUpdate?.({ videos: [...videos, { url: '', title: 'New Video', description: '' }] });
  const removeVideo = (idx: number) => onUpdate?.({ videos: videos.filter((_, i) => i !== idx) });

  // ── Standard: single video embed ──
  if (variant === 'standard' || variant === 'inline') {
    return (
      <div className="py-8 px-6" style={style}>
        <div className="mx-auto" style={{ maxWidth }}>
          {isEditing && <EditableInput value={url} field="url" placeholder="Paste YouTube or Vimeo URL..." className="mb-2" />}
          {showTitle && (title || isEditing) && (
            isEditing ? (
              <input type="text" value={title || ''} onChange={(e) => onUpdate?.({ title: e.target.value })} placeholder="Video title..."
                className="w-full text-xl font-bold mb-1 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}
              />
            ) : title ? (
              <h3 className="text-xl font-bold mb-1" style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}>{title}</h3>
            ) : null
          )}
          {showTitle && (description || isEditing) && (
            isEditing ? (
              <input type="text" value={description || ''} onChange={(e) => onUpdate?.({ description: e.target.value })} placeholder="Video description..."
                className="w-full text-sm mb-3 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 opacity-70"
                style={{ color: theme?.secondaryColor }}
              />
            ) : description ? (
              <p className="text-sm mb-3 opacity-70" style={{ color: theme?.secondaryColor }}>{description}</p>
            ) : null
          )}
          <div
            className={`overflow-hidden ${shadow ? 'shadow-lg' : ''}`}
            style={{ aspectRatio, borderRadius }}
          >
            <iframe
              src={embedUrl} className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Grid: multiple video thumbnails ──
  if (variant === 'grid') {
    const colCls = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' }[columns] || 'grid-cols-1 sm:grid-cols-2';
    return (
      <div className="py-10 px-6" style={style}>
        <div className="max-w-6xl mx-auto">
          {showTitle && (title || isEditing) && (
            isEditing ? (
              <input type="text" value={title || ''} onChange={(e) => onUpdate?.({ title: e.target.value })} placeholder="Section title..."
                className="w-full text-2xl font-bold mb-6 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 text-center"
                style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}
              />
            ) : title ? (
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}>{title}</h3>
            ) : null
          )}
          <div className={`grid ${colCls} gap-4`}>
            {videos.map((v, i) => {
              const thumb = v.thumbnail || getThumbnail(v.url);
              return (
                <div key={i} className="group relative rounded-xl overflow-hidden cursor-pointer" style={{ borderRadius, aspectRatio }}>
                  {isEditing && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <button onClick={() => removeVideo(i)} className="p-1 rounded bg-destructive/80 text-white hover:bg-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {isEditing ? (
                    <div className="p-3 space-y-1 bg-muted/50 h-full">
                      <input type="text" value={v.url} onChange={(e) => updateVideo(i, 'url', e.target.value)} placeholder="Video URL..."
                        className="w-full px-2 py-1 text-xs border rounded bg-background outline-none font-mono"
                      />
                      <input type="text" value={v.title || ''} onChange={(e) => updateVideo(i, 'title', e.target.value)} placeholder="Title..."
                        className="w-full px-2 py-1 text-xs border rounded bg-background outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      {thumb ? (
                        <img src={thumb} alt={v.title || ''} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Play className="h-8 w-8 opacity-30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-black ml-0.5" />
                        </div>
                      </div>
                      {v.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white text-sm font-medium truncate">{v.title}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {isEditing && (
            <div className="text-center mt-4">
              <button onClick={addVideo} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add Video
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Playlist: main video + sidebar list ──
  if (variant === 'playlist') {
    const activeVideo = videos[activeIndex] || { url: url, title: title };
    const activeEmbedUrl = buildEmbedUrl(activeVideo.url || url, embedOpts);
    return (
      <div className="py-10 px-6" style={style}>
        <div className="max-w-6xl mx-auto">
          {showTitle && (title || isEditing) && (
            isEditing ? (
              <input type="text" value={title || ''} onChange={(e) => onUpdate?.({ title: e.target.value })} placeholder="Playlist title..."
                className="w-full text-2xl font-bold mb-6 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}
              />
            ) : title ? (
              <h3 className="text-2xl font-bold mb-6" style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}>{title}</h3>
            ) : null
          )}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main player */}
            <div className="flex-1">
              <div className={`overflow-hidden ${shadow ? 'shadow-lg' : ''}`} style={{ aspectRatio, borderRadius }}>
                <iframe src={activeEmbedUrl} className="w-full h-full" allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              {activeVideo.title && !isEditing && (
                <p className="mt-3 text-lg font-semibold" style={{ color: theme?.textColor }}>{activeVideo.title}</p>
              )}
              {activeVideo.description && !isEditing && (
                <p className="mt-1 text-sm opacity-70" style={{ color: theme?.secondaryColor }}>{activeVideo.description}</p>
              )}
            </div>
            {/* Playlist sidebar */}
            <div className="lg:w-80 flex flex-col gap-2 max-h-[28rem] overflow-y-auto">
              {videos.map((v, i) => {
                const thumb = v.thumbnail || getThumbnail(v.url);
                const isActive = i === activeIndex;
                return (
                  <div key={i} className="relative group">
                    {isEditing && (
                      <div className="space-y-1 p-2 border rounded-lg bg-muted/30">
                        <input type="text" value={v.url} onChange={(e) => updateVideo(i, 'url', e.target.value)} placeholder="URL..."
                          className="w-full px-2 py-1 text-xs border rounded bg-background outline-none font-mono"
                        />
                        <input type="text" value={v.title || ''} onChange={(e) => updateVideo(i, 'title', e.target.value)} placeholder="Title..."
                          className="w-full px-2 py-1 text-xs border rounded bg-background outline-none"
                        />
                        <button onClick={() => removeVideo(i)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    )}
                    {!isEditing && (
                      <button onClick={() => setActiveIndex(i)}
                        className={`w-full flex gap-3 p-2 rounded-lg text-left transition-colors ${isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/50'}`}
                      >
                        <div className="w-28 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted relative">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Play className="h-4 w-4 opacity-30" /></div>
                          )}
                          {isActive && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Play className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`} style={{ color: isActive ? theme?.primaryColor : theme?.textColor }}>
                            {v.title || `Video ${i + 1}`}
                          </p>
                          {v.description && <p className="text-xs opacity-60 truncate mt-0.5" style={{ color: theme?.secondaryColor }}>{v.description}</p>}
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
              {isEditing && (
                <button onClick={addVideo} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline px-2 py-2">
                  <Plus className="h-3 w-3" /> Add Video
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Featured: large centered with decorative frame ──
  if (variant === 'featured') {
    return (
      <div className="py-16 px-6" style={{ backgroundColor: theme?.primaryColor ? theme.primaryColor + '08' : undefined, ...style }}>
        <div className="max-w-4xl mx-auto text-center">
          {showTitle && (title || isEditing) && (
            isEditing ? (
              <input type="text" value={title || ''} onChange={(e) => onUpdate?.({ title: e.target.value })} placeholder="Featured video title..."
                className="w-full text-3xl font-bold mb-2 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 text-center"
                style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}
              />
            ) : title ? (
              <h3 className="text-3xl font-bold mb-2" style={{ color: theme?.textColor, fontFamily: theme?.headingFont }}>{title}</h3>
            ) : null
          )}
          {(description || isEditing) && (
            isEditing ? (
              <input type="text" value={description || ''} onChange={(e) => onUpdate?.({ description: e.target.value })} placeholder="Description..."
                className="w-full text-base mb-8 bg-transparent outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 text-center opacity-70"
                style={{ color: theme?.secondaryColor }}
              />
            ) : description ? (
              <p className="text-base mb-8 opacity-70 max-w-2xl mx-auto" style={{ color: theme?.secondaryColor }}>{description}</p>
            ) : <div className="mb-8" />
          )}
          {isEditing && <EditableInput value={url} field="url" placeholder="Paste YouTube or Vimeo URL..." className="mb-4" />}
          <div className="relative p-1 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20">
            <div className="overflow-hidden rounded-xl shadow-2xl" style={{ aspectRatio }}>
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to standard
  return (
    <div className="py-6 px-6" style={style}>
      <div className="max-w-3xl mx-auto">
        {isEditing && <EditableInput value={url} field="url" placeholder="Enter video embed URL..." className="mb-2" />}
        <div className="rounded-xl overflow-hidden" style={{ aspectRatio }}>
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}
