/**
 * Collapsible section wrapper for property editor panels.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface EditorSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function EditorSection({ title, icon, defaultOpen = true, children }: EditorSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/20 pb-3">
      <button
        className="flex items-center justify-between w-full py-1.5 text-left group"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">{icon}</span>}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">{title}</span>
        </div>
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/30" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
      </button>
      {open && <div className="space-y-3 pt-1">{children}</div>}
    </div>
  );
}
