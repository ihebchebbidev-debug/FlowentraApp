import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowDownUp, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/hooks/useTableSort';

export type SortMenuOption = { key: string; label: string };

type Props = {
  options: SortMenuOption[];
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  label?: string;
};

/**
 * Sorting control for card/list views (where there are no table headers).
 * Reuses the same tri-state toggle as SortableHeader: asc -> desc -> none.
 */
export function SortMenu({ options, sortKey, sortDirection, onSort, className, label = 'Sort' }: Props) {
  const active = options.find((o) => o.key === sortKey && !!sortDirection);
  const DirIcon = sortDirection === 'asc' ? ChevronUp : ChevronDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('shrink-0 gap-1.5', active && 'border-primary/50 text-primary', className)}
          aria-label={label}
        >
          <ArrowDownUp className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">{active ? active.label : label}</span>
          {active && <DirIcon className="h-3.5 w-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => {
          const isActive = sortKey === opt.key && !!sortDirection;
          const Icon = isActive ? (sortDirection === 'asc' ? ChevronUp : ChevronDown) : Check;
          return (
            <DropdownMenuItem
              key={opt.key}
              onSelect={(e) => {
                e.preventDefault();
                onSort(opt.key);
              }}
              className="flex items-center justify-between gap-2"
            >
              <span className={cn('truncate', isActive && 'text-primary font-medium')}>{opt.label}</span>
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'opacity-0')} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SortMenu;
