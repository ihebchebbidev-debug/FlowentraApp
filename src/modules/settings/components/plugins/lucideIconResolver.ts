import * as Icons from 'lucide-react';
import { type LucideIcon, Puzzle } from 'lucide-react';

/** Resolve a lucide-react icon component by its name. Falls back to Puzzle. */
export function getLucideIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Puzzle;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lib = Icons as unknown as Record<string, any>;
  const cmp = lib[name];
  if (cmp && typeof cmp === 'object') return cmp as LucideIcon;
  if (typeof cmp === 'function') return cmp as LucideIcon;
  return Puzzle;
}
