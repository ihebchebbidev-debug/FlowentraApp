import { Handle, Position } from '@xyflow/react';
import {
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook, Sparkles,
};

const COLORS: Record<string, string> = {
  amber: 'border-amber-400/60 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  sky: 'border-sky-400/60 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
  violet: 'border-violet-400/60 bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-100',
  emerald: 'border-emerald-400/60 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
  rose: 'border-rose-400/60 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100',
  orange: 'border-orange-400/60 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100',
};

export function DemoNode({ data, selected }: any) {
  const Icon = ICONS[data.icon] || Zap;
  const colorCls = COLORS[data.color] || COLORS.sky;
  return (
    <div
      className={cn(
        'rounded-lg border-2 px-3 py-2 shadow-sm min-w-[150px] transition-all',
        colorCls,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-foreground/40 !border-0 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold leading-tight">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-foreground/40 !border-0 !w-2 !h-2" />
    </div>
  );
}
