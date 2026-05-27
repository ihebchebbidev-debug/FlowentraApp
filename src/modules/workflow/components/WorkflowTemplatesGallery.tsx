import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, ArrowRight, Layers } from 'lucide-react';
import {
  workflowTemplates,
  templateCategories,
  type WorkflowTemplate,
  type TemplateCategory,
} from '../data/workflowTemplates';
import type { Node, Edge } from '@xyflow/react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (nodes: Node[], edges: Edge[], template: WorkflowTemplate) => void;
}

/** Tiny SVG preview of a template's graph. */
function MiniGraph({ tpl }: { tpl: WorkflowTemplate }) {
  if (tpl.nodes.length === 0) return null;
  const xs = tpl.nodes.map(n => n.position.x);
  const ys = tpl.nodes.map(n => n.position.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs) + 200;
  const minY = Math.min(...ys), maxY = Math.max(...ys) + 80;
  const w = 280, h = 110;
  const sx = (x: number) => ((x - minX) / Math.max(1, maxX - minX)) * w;
  const sy = (y: number) => ((y - minY) / Math.max(1, maxY - minY)) * h;
  const nodeMap = new Map(tpl.nodes.map(n => [n.id, n]));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {tpl.edges.map(ed => {
        const a = nodeMap.get(ed.source), b = nodeMap.get(ed.target);
        if (!a || !b) return null;
        const x1 = sx(a.position.x) + 14, y1 = sy(a.position.y) + 6;
        const x2 = sx(b.position.x) + 4,  y2 = sy(b.position.y) + 6;
        const mx = (x1 + x2) / 2;
        return (
          <path
            key={ed.id}
            d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            stroke="hsl(var(--primary) / 0.45)" strokeWidth="1" fill="none"
          />
        );
      })}
      {tpl.nodes.map(nd => (
        <g key={nd.id}>
          <rect
            x={sx(nd.position.x)} y={sy(nd.position.y)}
            width={18} height={12} rx={3}
            fill="hsl(var(--primary) / 0.18)"
            stroke="hsl(var(--primary) / 0.55)" strokeWidth="0.7"
          />
        </g>
      ))}
    </svg>
  );
}

export function WorkflowTemplatesGallery({ open, onOpenChange, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workflowTemplates.filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[96vw] h-[min(92vh,780px)] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-semibold">Template gallery</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Start from a battle-tested workflow. Pick one to load it onto the canvas — every node and connection is fully editable.
          </DialogDescription>
        </div>

        {/* Toolbar: search + category chips */}
        <div className="px-6 py-3 border-b border-border shrink-0 space-y-2.5">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {templateCategories.map(c => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted',
                  )}
                >
                  {c.label}
                </button>
              );
            })}
            <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
              {filtered.length} template{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(tpl => {
              const Icon = tpl.icon;
              return (
                <div
                  key={tpl.id}
                  className="group relative rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {/* Mini preview */}
                  <div className="h-[110px] bg-muted/30 border-b border-border relative">
                    <MiniGraph tpl={tpl} />
                    {tpl.badge && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[9.5px] px-1.5 py-0">
                        {tpl.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold leading-tight text-foreground">{tpl.name}</div>
                        <div className="text-[10.5px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {tpl.category} · {tpl.nodes.length} nodes
                        </div>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-snug flex-1">
                      {tpl.description}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full justify-between"
                      onClick={() => {
                        onPick(tpl.nodes, tpl.edges, tpl);
                        onOpenChange(false);
                      }}
                    >
                      <span>Use this template</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-sm text-muted-foreground">
                No templates match your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
