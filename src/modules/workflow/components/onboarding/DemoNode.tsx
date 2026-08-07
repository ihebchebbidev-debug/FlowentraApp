import { Handle, Position } from '@xyflow/react';
import {
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook,
  Sparkles, FileText, Play, DollarSign, ShoppingCart, Truck, Users,
  Brain, Bot, Globe, Code, FormInput, ArrowLeftRight, Split, Repeat,
  ClipboardList, PauseCircle, Settings2, Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook,
  Sparkles, FileText, DollarSign, ShoppingCart, Truck, Users,
  Brain, Bot, Globe, Code, FormInput, ArrowLeftRight, Split, Repeat,
  ClipboardList, PauseCircle, Settings2, Database,
};

// Exact palette from real N8nStyleNode.getCategoryColor
export const CATEGORY_COLOR: Record<string, string> = {
  trigger: '#ff6d5a',
  entity: '#10b981',
  action: '#3b82f6',
  condition: '#f59e0b',
  communication: '#06b6d4',
  ai: '#8b5cf6',
  integration: '#64748b',
  approval: '#f97316',
};

/**
 * DemoNode — pixel-mirror of N8nStyleNode at slightly compressed scale
 * to fit inside the tour modal. Same accent bar, icon tile, category pill,
 * status pill row, handle styling.
 */
export function DemoNode({ data, selected }: any) {
  const Icon = ICONS[data.icon] || Zap;
  const color = CATEGORY_COLOR[data.category] || CATEGORY_COLOR.action;
  const isTrigger = !!data.isTrigger;
  const hasStatus = data.fromStatus || data.toStatus;

  return (
    <div
      data-demo-target={data.targetId}
      className={cn(
        'relative w-[240px] transition-all duration-200 group',
        selected && 'scale-[1.02]',
      )}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          className="!w-[10px] !h-[10px] !rounded-full !bg-background !border-[2.5px] !border-muted-foreground/50"
        />
      )}

      <div
        className={cn(
          'rounded-xl overflow-hidden bg-card border shadow-sm transition-all',
          selected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border/60 hover:shadow-md',
        )}
      >
        <div className="h-[3px]" style={{ background: color }} />

        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: `${color}1f`, border: `1.5px solid ${color}55` }}
          >
            <Icon className="h-[17px] w-[17px]" style={{ color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[12.5px] text-foreground truncate leading-tight">
              {data.label}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-wider"
                style={{ background: `${color}24`, color }}
              >
                {data.category}
              </span>
            </div>
          </div>

          {isTrigger && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase"
              style={{ background: `${color}28`, color }}
            >
              <Play className="h-2.5 w-2.5" />
            </div>
          )}
        </div>

        {hasStatus && (
          <div className="px-3 pb-2.5">
            <div className="flex items-center gap-1 text-[9.5px]">
              {data.fromStatus && (
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                  {data.fromStatus}
                </span>
              )}
              {data.fromStatus && data.toStatus && (
                <span className="text-muted-foreground">→</span>
              )}
              {data.toStatus && (
                <span
                  className="px-1.5 py-0.5 rounded-md font-medium text-white"
                  style={{ background: color }}
                >
                  {data.toStatus}
                </span>
              )}
            </div>
          </div>
        )}

        {data.subtitle && !hasStatus && (
          <div className="px-3 pb-2.5">
            <div className="text-[10.5px] text-muted-foreground/80 truncate">
              {data.subtitle}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="!w-[10px] !h-[10px] !rounded-full !bg-background !border-[2.5px] !border-muted-foreground/50"
      />
    </div>
  );
}
