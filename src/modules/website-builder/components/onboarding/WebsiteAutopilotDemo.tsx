import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Undo2, Redo2,
  Monitor, Tablet, Smartphone, Eye, Upload, Sparkles, MousePointerClick,
  Palette as PaletteIcon, Search, Globe, Languages, Layers, Plus, ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ComponentRenderer } from '../renderer/ComponentRenderer';
import { ComponentPalette } from '../editor/ComponentPalette';
import { PropertiesPanel } from '../editor/PropertiesPanel';
import { ThemeEditor } from '../editor/ThemeEditor';
import { SeoPanel } from '../editor/SeoPanel';
import { TemplateThumbnail } from '../TemplateThumbnail';
import { SITE_TEMPLATES } from '../../utils/siteTemplates';
import { DemoCursor } from './DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from './narrationVoice';
import {
  WB_STEPS, WB_CHAPTERS, initialDemoState, type WBDemoState,
} from './websiteAutopilotScript';

// Featured templates for the gallery phase — keep the e-commerce store first
// (the script highlights it) followed by a varied selection.
const _featured = SITE_TEMPLATES.find(t => t.id === 'ecommerce-store');
const GALLERY_TEMPLATES = (_featured
  ? [_featured, ...SITE_TEMPLATES.filter(t => t.id !== 'ecommerce-store').slice(0, 11)]
  : SITE_TEMPLATES.slice(0, 12));

interface Props {
  open: boolean;
  onClose: () => void;
  onStart?: () => void;
}

const DEVICE_WIDTH: Record<WBDemoState['device'], number | string> = { desktop: '100%', tablet: 760, mobile: 380 };
const noop = () => {};

export function WebsiteAutopilotDemo({ open, onClose, onStart }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -100, y: -100, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const finished = stepIndex >= WB_STEPS.length;

  // Fold the script up to the current step → deterministic demo state.
  const state: WBDemoState = useMemo(() => {
    let s = initialDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, WB_STEPS.length); i++) s = WB_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = WB_STEPS[Math.min(stepIndex, WB_STEPS.length - 1)];
  const selectedComp = state.components.find(c => c.id === state.selectedId) || null;

  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  // Position the cursor over the current step's target (after the DOM updates).
  useEffect(() => {
    if (!open || finished) return;
    const place = () => {
      const el = document.getElementById(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 90), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 140);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.panel, state.device, state.components.length]);

  // Scroll the demo canvas to the freshly-added block (mirrors the real editor).
  useEffect(() => {
    if (!open || state.phase !== 'editor') return;
    const el = canvasRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      const blocks = el.querySelectorAll('[data-demo-block]');
      (blocks[blocks.length - 1] as HTMLElement | undefined)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 90);
    return () => clearTimeout(t);
  }, [state.components.length, state.phase, open]);

  // Voices load asynchronously — warm them up so pickBestVoice() resolves.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  // Narrate with the SAME warm female premium voice + cadence as the Workflow
  // autopilot, advancing only when narration finishes (timer fallback if muted).
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = step.caption;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code);
      const chunks = splitForSpeech(caption);

      let advanced = false;
      const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };

      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47;
        configureUtteranceForFemaleVoice(u, voice);
        if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; }
        try { synth.speak(u); } catch { /* safety net below */ }
      });

      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      const keepAlive = setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000);

      return () => {
        clearTimeout(safety);
        clearInterval(keepAlive);
        if (timerRef.current) clearTimeout(timerRef.current);
        try { synth.cancel(); } catch { /* ignore */ }
      };
    }

    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, i18n.language]);

  const restart = useCallback(() => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); setStepIndex(0); setPlaying(true); }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;

  const activeChapter = WB_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || WB_CHAPTERS[WB_CHAPTERS.length - 1];
  const showTheme = state.panel === 'theme';

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col">
      {state.phase === 'gallery' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Gallery header — mirrors the real Template Gallery */}
          <div className="h-14 shrink-0 border-b border-border/60 bg-gradient-to-r from-primary/5 to-card flex items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-3 min-w-0">
              <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><Layers className="h-4 w-4 text-primary-foreground" /></span>
              <div className="min-w-0">
                <h1 className="text-base font-semibold truncate">Choose a Template</h1>
                <p className="text-[11px] text-muted-foreground">{SITE_TEMPLATES.length}+ professional templates · or start from scratch</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex h-9 w-40 px-3 rounded-md border border-border/50 bg-background/80 items-center text-sm text-muted-foreground">My Store</div>
              <span id="demo-blank" className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-all ${state.galleryHighlight === null ? 'border-primary ring-2 ring-primary/30 text-primary' : 'border-border/50 text-foreground/70'}`}><Globe className="h-4 w-4" /> Blank Site</span>
              <span id="demo-create" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" /> Create</span>
            </div>
          </div>
          {/* Template grid */}
          <div id="demo-gallery" className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {GALLERY_TEMPLATES.map(tmpl => (
                <div key={tmpl.id} id={`demo-template-${tmpl.id}`}
                  className={`rounded-xl border overflow-hidden bg-card transition-all duration-300 ${state.galleryHighlight === tmpl.id ? 'border-primary ring-2 ring-primary shadow-xl -translate-y-1' : 'border-border/60'}`}>
                  <div className="h-32 sm:h-36 overflow-hidden border-b border-border/50" style={{ backgroundColor: tmpl.theme.backgroundColor }}>
                    <TemplateThumbnail template={tmpl} className="w-full h-full" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 min-w-0"><span className="text-base leading-none shrink-0">{tmpl.icon}</span><h3 className="text-sm font-semibold truncate">{tmpl.name}</h3></div>
                    <div className="flex items-center gap-1.5 mt-1.5"><Badge variant="secondary" className="text-[9px]">{tmpl.category}</Badge><Badge variant="outline" className="text-[9px]">{tmpl.pageCount} pages</Badge></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Toolbar — mirrors the real editor toolbar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">My Store</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-xs text-muted-foreground truncate">Home</span>
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saved</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="inline-flex items-center text-muted-foreground/50">
            <Undo2 className="h-4 w-4" /><Redo2 className="h-4 w-4 ml-1" />
          </span>
          <div className="inline-flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
              <span key={d} id={`demo-device-${d}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${state.device === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline capitalize">{d}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className={`h-8 w-8 flex items-center justify-center rounded-md ${showTheme ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}><PaletteIcon className="h-4 w-4" /></span>
          <span className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground"><Search className="h-4 w-4" /></span>
          <span className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground"><Globe className="h-4 w-4" /></span>
          <div className="w-px h-5 bg-border/60 mx-1" />
          <span id="demo-preview" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border/50 text-xs font-medium"><Eye className="h-3.5 w-3.5" /> Preview</span>
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium"><Upload className="h-3.5 w-3.5" /> Publish</span>

          <div className="w-px h-5 bg-border/60 mx-1" />
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Body: real palette | canvas | real properties/theme — pointer-events off so the tour drives it */}
      <div className="flex-1 flex min-h-0 select-none">
        <div id="demo-palette" className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card pointer-events-none">
          <ComponentPalette onAdd={noop} />
        </div>

        {/* Canvas */}
        <div ref={canvasRef} id="demo-canvas" className="flex-1 min-w-0 overflow-y-auto bg-muted/20 p-4 sm:p-6 flex justify-center">
          <div
            className="bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-500 w-full"
            // translateZ(0) makes this a containing block so any `position: fixed`
            // block (e.g. the floating mini-cart) stays inside the canvas frame
            // instead of escaping over the demo chrome.
            style={{ width: DEVICE_WIDTH[state.device], maxWidth: '100%', minHeight: 400, transform: 'translateZ(0)' }}
          >
            {state.components.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center text-muted-foreground/50">
                <MousePointerClick className="h-10 w-10 mb-3" />
                <p className="text-sm">Empty canvas — watch it come to life…</p>
              </div>
            ) : (
              state.components.map(comp => (
                <div key={comp.id} data-demo-block className={`relative animate-in fade-in slide-in-from-bottom-2 duration-500 ${state.selectedId === comp.id ? 'ring-2 ring-primary ring-inset' : ''}`}>
                  <ComponentRenderer component={comp} device={state.device} theme={state.theme} isEditing={false} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real properties / theme / SEO panel */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col border-l border-border/60 bg-card pointer-events-none">
          {state.panel === 'theme' ? (
            <div id="demo-panel-theme" className="h-full">
              <ThemeEditor theme={state.theme} onChange={noop} />
            </div>
          ) : state.panel === 'seo' ? (
            <div id="demo-props" className="h-full">
              <SeoPanel seo={state.seo} slug="home" pageTitle="Home" onChange={noop} onSlugChange={noop} onPageTitleChange={noop} />
            </div>
          ) : (
            <div id="demo-props" className="h-full">
              <PropertiesPanel
                component={selectedComp}
                onUpdate={noop}
                onUpdateStyles={noop}
                onUpdateVisibility={noop}
                onUpdateAnimation={noop}
                onRemove={noop}
                onDuplicate={noop}
                onMove={noop}
                onDeselect={noop}
                storeCurrency={state.theme.currency}
                storeCurrencyPosition={state.theme.currencyPosition}
              />
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Caption + chapters */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          {WB_CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => jumpChapter(ch.start)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
              {ch.title}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, WB_STEPS.length)} / {WB_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, WB_STEPS.length) / WB_STEPS.length) * 100}%` }} />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? 'Your store homepage is ready 🎉' : step.caption}
        </p>
      </div>

      {/* Virtual cursor */}
      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {/* End card */}
      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">A complete store, built in seconds</h3>
            <p className="text-sm text-muted-foreground mb-5">Drag blocks, edit anything, control every device — and publish. Your turn.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { onClose(); onStart?.(); }} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Start building</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
