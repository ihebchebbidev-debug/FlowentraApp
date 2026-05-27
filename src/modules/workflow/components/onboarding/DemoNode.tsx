import { Handle, Position } from '@xyflow/react';
import {
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook,
  Sparkles, FileText, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DemoNode mirrors the visual structure of the real N8nStyleNode so the
 * tour feels identical to the production workflow builder.
 *  - 260px wide card, rounded-xl, soft border
 *  - Colored 3px top accent in the category color
 *  - Icon tile + label + category pill in the header
 *  - Optional status pills row (fromStatus → toStatus)
 *  - Left/right react-flow handles (hidden on triggers' input)
 */
const ICONS: Record<string, any> = {
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook,
  Sparkles, FileText,
};

// Match the exact palette used by N8nStyleNode getCategoryColor
const CATEGORY_COLOR: Record<string, string> = {
  trigger: '#ff6d5a',
  entity: '#10b981',
  action: '#3b82f6',
  condition: '#f59e0b',
  communication: '#06b6d4',
  ai: '#8b5cf6',
  approval: '#f97316',
};

export function DemoNode({ data, selected }: any) {
  const Icon = ICONS[data.icon] || Zap;
  const color = CATEGORY_COLOR[data.category] || CATEGORY_COLOR.action;
  const isTrigger = !!data.isTrigger;
  const hasStatus = data.fromStatus || data.toStatus;

  return (
    <div
      data-demo-target={data.targetId}
      className={cn(
        'relative w-[220px] transition-all duration-200',
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
          'rounded-xl overflow-hidden bg-card border shadow-sm',
          selected ? 'border-primary shadow-lg' : 'border-border/60',
        )}
      >
        {/* Top accent */}
        <div className="h-[3px]" style={{ background: color }} />

        {/* Header */}
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: `${color}1f`, border: `1.5px solid ${color}55` }}
          >
            <Icon className="h-[16px] w-[16px]" style={{ color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[12px] text-foreground truncate leading-tight">
              {data.label}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider"
                style={{ background: `${color}24`, color }}
              >
                {data.category}
              </span>
            </div>
          </div>

          {isTrigger && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
              style={{ background: `${color}28`, color }}
            >
              <Play className="h-2.5 w-2.5" />
            </div>
          )}
        </div>

        {hasStatus && (
          <div className="px-3 pb-2.5">
            <div className="flex items-center gap-1 text-[9px]">
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
