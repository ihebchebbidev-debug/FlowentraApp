// Chart color tokens — read from CSS vars so charts respect light/dark themes.
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-orange))',
];

export const RAG_COLORS = {
  green: 'hsl(var(--rag-green))',
  yellow: 'hsl(var(--rag-yellow))',
  red: 'hsl(var(--rag-red))',
  orange: 'hsl(var(--rag-orange))',
  neutral: 'hsl(var(--rag-neutral))',
};

export const AXIS_TICK = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } as const;
export const GRID_STROKE = 'hsl(var(--border))';

export const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
    color: 'hsl(var(--foreground))',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 11 },
};
