import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX,
  Monitor, Tablet, Smartphone, Menu, Layout, ShoppingBag, Type, Image as ImageIcon,
  Eye, Sparkles, MousePointerClick, Settings2, Palette as PaletteIcon, GripVertical,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ComponentRenderer } from '../renderer/ComponentRenderer';
import { DemoCursor } from './DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor } from './narrationVoice';
import {
  WB_STEPS, WB_CHAPTERS, initialDemoState, type WBDemoState, type DemoPanel,
} from './websiteAutopilotScript';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when the user clicks "Start building" at the end. */
  onStart?: () => void;
}

const DEVICE_WIDTH: Record<WBDemoState['device'], number | string> = { desktop: '100%', tablet: 760, mobile: 380 };

const DEMO_PALETTE: { id: string; label: string; icon: React.FC<any>; blocks: { type: string; label: string }[] }[] = [
  { id: 'layout', label: 'Layout', icon: Layout, blocks: [
    { type: 'hero', label: 'Hero Section' }, { type: 'section', label: 'Section' }, { type: 'columns', label: 'Columns' }, { type: 'footer', label: 'Footer' },
  ] },
  { id: 'navigation', label: 'Navigation', icon: Menu, blocks: [
    { type: 'navbar', label: 'Navbar' }, { type: 'mega-menu', label: 'Mega Menu' },
  ] },
  { id: 'business', label: 'Business & Store', icon: ShoppingBag, blocks: [
    { type: 'features', label: 'Features' }, { type: 'product-card', label: 'Product Grid' }, { type: 'testimonials', label: 'Testimonials' }, { type: 'mini-cart', label: 'Mini Cart' }, { type: 'pricing', label: 'Pricing' },
  ] },
  { id: 'text', label: 'Text', icon: Type, blocks: [
    { type: 'heading', label: 'Heading' }, { type: 'paragraph', label: 'Paragraph' },
  ] },
  { id: 'media', label: 'Media', icon: ImageIcon, blocks: [
    { type: 'image', label: 'Image' }, { type: 'image-gallery', label: 'Gallery' },
  ] },
];

export function WebsiteAutopilotDemo({ open, onClose, onStart }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -100, y: -100, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= WB_STEPS.length;

  // Fold the script up to the current step → deterministic demo state.
  const state: WBDemoState = useMemo(() => {
    let s = initialDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, WB_STEPS.length); i++) s = WB_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = WB_STEPS[Math.min(stepIndex, WB_STEPS.length - 1)];

  // Reset when (re)opened.
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
      setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 120);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target]);

  // Voices load asynchronously — warm them up so pickBestVoice() resolves the
  // same premium voice the Workflow tour uses on the very first step.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  // Narrate the caption with the SAME warm female premium voice + cadence as the
  // Workflow autopilot, advancing only when the narration finishes (timer
  // fallback when muted or TTS is unsupported).
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
      const doAdvance = () => {
        if (advanced) return;
        advanced = true;
        timerRef.current = setTimeout(advance, 420); // breath before next step
      };

      // Queue every sentence so the engine pauses naturally between them.
      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47;
        if (voice) u.voice = voice;
        u.rate = 0.86;
        u.pitch = idx % 2 === 0 ? 1.02 : 0.98;
        u.volume = 1;
        if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; }
        try { synth.speak(u); } catch { /* safety net below */ }
      });

      // Safety net so a stuck/blocked TTS engine never freezes the tour.
      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      // Chrome bug: speechSynthesis pauses after ~15s — keep it awake.
      const keepAlive = setInterval(() => {
        if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); }
      }, 10000);

      return () => {
        clearTimeout(safety);
        clearInterval(keepAlive);
        if (timerRef.current) clearTimeout(timerRef.current);
        try { synth.cancel(); } catch { /* ignore */ }
      };
    }

    // muted / unsupported → plain timer
    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, i18n.language]);

  const restart = useCallback(() => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); setStepIndex(0); setPlaying(true); }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;

  const activeChapter = WB_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || WB_CHAPTERS[WB_CHAPTERS.length - 1];
  const activeCat = DEMO_PALETTE.find(c => c.id === state.category) || DEMO_PALETTE[0];

  return (
    <div className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Toolbar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Website Builder — Autopilot</span>
        </div>

        {/* Device switcher */}
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
              <span key={d} id={`demo-device-${d}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${state.device === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline capitalize">{d}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span id="demo-preview" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border/50 text-xs font-medium"><Eye className="h-3.5 w-3.5" /> Preview</span>
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

      {/* Body: palette | canvas | properties */}
      <div className="flex-1 flex min-h-0">
        {/* Palette */}
        <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/60 bg-card">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Blocks</div>
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {DEMO_PALETTE.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === state.category;
              return (
                <div key={cat.id}>
                  <div id={`demo-cat-${cat.id}`} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                    <Icon className="h-3.5 w-3.5" /> {cat.label}
                  </div>
                  {isActive && (
                    <div className="mt-1 ml-1 space-y-0.5">
                      {cat.blocks.map(b => (
                        <div key={b.type} id={`demo-block-${b.type}`}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] border transition-all ${state.highlightBlock === b.type ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]' : 'border-transparent text-foreground/70 hover:bg-muted/40'}`}>
                          <GripVertical className="h-3 w-3 opacity-40" /> {b.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div id="demo-canvas" className="flex-1 min-w-0 overflow-y-auto bg-muted/20 p-4 sm:p-6 flex justify-center">
          <div
            className="bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-500 w-full"
            style={{ width: DEVICE_WIDTH[state.device], maxWidth: '100%', minHeight: 400 }}
          >
            {state.components.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center text-muted-foreground/50">
                <MousePointerClick className="h-10 w-10 mb-3" />
                <p className="text-sm">Empty canvas — watch it come to life…</p>
              </div>
            ) : (
              state.components.map(comp => (
                <div
                  key={comp.id}
                  className={`relative animate-in fade-in slide-in-from-bottom-2 duration-500 ${state.selectedId === comp.id ? 'ring-2 ring-primary ring-inset' : ''}`}
                >
                  <ComponentRenderer component={comp} device={state.device} theme={state.theme} isEditing={false} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Properties / Theme panel */}
        <div className="hidden lg:flex w-60 shrink-0 flex-col border-l border-border/60 bg-card">
          <PanelHeader panel={state.panel} />
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {state.panel === 'theme' ? (
              <div id="demo-panel-theme" className="space-y-3">
                <div className="text-[11px] font-medium text-muted-foreground">Brand Colors</div>
                {([['Primary', state.theme.primaryColor], ['Accent', state.theme.accentColor], ['Background', state.theme.backgroundColor]] as const).map(([label, color]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-foreground/70">{label}</span>
                    <span className="flex items-center gap-1.5"><span className="h-5 w-5 rounded border border-border" style={{ backgroundColor: color }} /><span className="text-[10px] text-muted-foreground">{color}</span></span>
                  </div>
                ))}
              </div>
            ) : state.selectedId ? (
              <div id="demo-props" className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center"><Settings2 className="h-3.5 w-3.5 text-primary/70" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{state.components.find(c => c.id === state.selectedId)?.label}</p>
                    <p className="text-[10px] text-muted-foreground/60">{state.components.find(c => c.id === state.selectedId)?.type}</p>
                  </div>
                </div>
                {state.editing && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-foreground/60">{state.editing.label}</label>
                    <div className="h-8 px-2 flex items-center rounded-md border border-primary bg-background text-[11px]">
                      {state.editing.value}<span className="ml-0.5 w-px h-3.5 bg-primary animate-pulse" />
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">Edit text, colors, spacing, visibility — per device.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/40 py-10">
                <MousePointerClick className="h-6 w-6 mb-2" />
                <p className="text-[11px]">Select a block to edit it</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
        <p className="text-sm text-foreground/90 min-h-[20px]">{finished ? "Your store homepage is ready 🎉" : step.caption}</p>
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
            <p className="text-sm text-muted-foreground mb-5">That's the website builder — drag blocks, edit anything, control every device. Your turn.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { onClose(); onStart?.(); }} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                Start building
              </button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHeader({ panel }: { panel: DemoPanel }) {
  const map = { theme: { icon: PaletteIcon, label: 'Theme' }, properties: { icon: Settings2, label: 'Properties' }, palette: { icon: Layout, label: 'Properties' } } as const;
  const { icon: Icon, label } = map[panel];
  return (
    <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
  );
}
