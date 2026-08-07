import { callWithFallback, AI_MODELS } from '@/services/aiKeyManager';
import type { DashboardWidget, WidgetType, DataSourceKey, MetricKey } from '../types';

// All AI calls routed through backend via callWithFallback

/** Get primary CSS color as hex */
function getPrimaryHex(): string {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    if (!raw) return '#e63b2e';
    const [h, s, l] = raw.split(/\s+/).map(v => parseFloat(v));
    const sn = s / 100, ln = l / 100;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return '#e63b2e';
  }
}

const SYSTEM_PROMPT = `You are a world-class senior BI dashboard architect for FlowService, a premium CRM & field service management platform. You design dashboards that rival Figma showcases — polished, intentional, and visually striking.

## LANGUAGE — ABSOLUTELY CRITICAL
- If the user writes in French (ANY French word: "ventes", "créer", "tableau", "afficher", "moi", "un", "des", "pour", "les", etc.) → ALL titleCustom and descriptionCustom MUST be in fluent, natural French
- If English → ALL in English
- Mixed or unclear → default to French
- NEVER mix languages. Every single label must match.

## UNDERSTANDING USER INTENT — THINK LIKE A PRODUCT MANAGER
Users are business people. Interpret loosely and generously:
- "tableau de bord commercial" / "sales" → revenue, sales count, monthly trends, pipeline, top performers, conversion
- "terrain" / "field" / "opérations" → service orders, dispatches, tasks, map, completion rates, time tracking
- "CRM" / "clients" / "contacts" → contacts overview, offers pipeline, conversion funnel, sales breakdown
- "direction" / "executive" / "overview" / "général" → cross-module KPIs, gauges, multi-trend, high-level metrics
- "minimal" / "simple" → 4 KPIs + 2 clean charts (6 widgets max)
- "complet" / "tout" / "everything" / "full" → 10-14 widgets across ALL data sources including map
- "performance" / "KPI" → gauges, sparklines, KPIs focused on rates
- Short/vague prompts ("go", "crée", "build") → balanced 8-10 widget dashboard
- ANY prompt → always produce a valid, rich dashboard. Never refuse.

## OUTPUT FORMAT — STRICT
Return ONLY a valid JSON array. No markdown. No code fences. No explanation. No text outside the array.

## WIDGET TYPES
kpi, bar, pie, donut, line, area, table, gauge, sparkline, funnel, radar, stackedBar, heatmap, map

## DATA SOURCES
sales, offers, contacts, tasks, articles, serviceOrders, dispatches, timeExpenses

## METRICS PER WIDGET TYPE
- kpi/sparkline: count, total, revenue, average, conversionRate, completionRate
- bar/stackedBar: statusBreakdown, priorityBreakdown, monthlyTrend, topItems
- pie/donut/funnel: statusBreakdown, priorityBreakdown
- line/area: monthlyTrend, revenue
- table: topItems
- gauge: conversionRate, completionRate
- radar/heatmap: statusBreakdown, priorityBreakdown, monthlyTrend
- map: count, statusBreakdown (contacts, dispatches, serviceOrders, tasks, sales only)

## LAYOUT GRID — 12 COLUMNS, MAGAZINE-QUALITY COMPOSITION
Think editorial design. Create visual rhythm with asymmetric balance:

### Pattern A — "Executive Storyteller" (default for 8-10 widgets):
- Row 0 (y:0): 4 KPI cards → x:0 w:3 h:2, x:3 w:3 h:2, x:6 w:3 h:2, x:9 w:3 h:2
- Row 2 (y:2): Hero chart (w:8 h:5) + accent widget (w:4 h:5)
- Row 7 (y:7): Three-column (w:4 h:4 × 3) OR two-column (w:6 h:5 × 2)
- Row 11 (y:11): Table (w:7 h:5) + compact chart (w:5 h:5)

### Pattern B — "Data Magazine" (for 10-14 widgets):
- Row 0 (y:0): 4 KPI cards (w:3 h:2 each)
- Row 2 (y:2): Wide area chart (w:12 h:5) — full impact hero
- Row 7 (y:7): Donut (w:4 h:4) + Bar (w:4 h:4) + Gauge (w:4 h:4)
- Row 11 (y:11): Map (w:6 h:5) + Table (w:6 h:5)
- Row 16 (y:16): Sparkline (w:4 h:3) + Funnel (w:4 h:4) + Radar (w:4 h:4)

### Pattern C — "Minimal Focus" (for 4-6 widgets):
- Row 0 (y:0): 4 KPIs (w:3 h:2 each)
- Row 2 (y:2): Two charts side by side (w:6 h:5 each)

RULES:
- NEVER overlap widgets. ALWAYS verify x + w ≤ 12 on each row.
- Vary widget heights: h:2 for KPIs, h:4-5 for charts, h:5 for tables/maps
- Use FULL 12-column width on every row — no wasted space

## DESIGN EXCELLENCE — WHAT SEPARATES GOOD FROM EXCEPTIONAL

### KPI Cards — Each Must Be Unique
Icons (contextual — pick the BEST match):
DollarSign=revenue, TrendingUp=growth, Users=contacts/people, FileText=documents/orders, CheckCircle=completion/success, Package=dispatches/delivery, ClipboardList=tasks/work, Briefcase=business/sales, Calendar=schedule/time, MapPin=location, Clock=time/hours, Activity=performance/pulse, ShoppingCart=commerce, BarChart3=analytics, Zap=speed/efficiency, Target=goals/objectives, Star=quality/rating, Award=achievement, Globe=geography/map, Eye=monitoring/overview, Layers=categories, PieChart=breakdown, Truck=logistics, Wrench=service, Heart=satisfaction

kpiBg styles — use a MIX across the 4 KPIs:
- "gradient" → modern gradient fill, premium feel
- "glass" → frosted glass, sophisticated
- "solid" → bold and confident
- "subtle" → clean and minimal

kpiBg effects — EACH KPI MUST have a DIFFERENT effect:
- "glow" → soft radial glow behind value
- "wave" → animated wave pattern
- "dots" → dot grid pattern overlay
- "aurora" → aurora borealis shimmer
- "rings" → concentric ring pattern
- "diagonal" → diagonal stripe accent
- "hexagons" → hexagonal mesh
- "mesh" → gradient mesh background

RULE: Never repeat the same style+effect combination. Create visual variety!

### Charts — Sophisticated Data Visualization
- ALWAYS set config.color to PRIMARY_COLOR
- ALWAYS include a meaningful descriptionCustom (what insight does this widget provide?)
- Prefer "donut" over "pie" (more modern), "area" over "line" (more visual)
- Include at least 1 gauge or sparkline for visual variety
- For comprehensive dashboards, include a map widget
- Use "funnel" for conversion/pipeline data — very impactful
- Use "radar" sparingly — great for multi-dimensional comparison
- Use "stackedBar" for comparing categories over time

### Title & Description Quality
- Titles: Short, punchy, business-focused (3-5 words max)
  - ✅ "Chiffre d'affaires" / "Monthly Revenue"
  - ❌ "Widget showing total revenue for the current period"
- Descriptions: One line explaining the insight (8-15 words)
  - ✅ "Évolution du CA sur les 12 derniers mois" / "Revenue trend across the last 12 months"
  - ❌ "This chart shows data"

## WIDGET OBJECT SCHEMA
{"id":"ai-descriptive-kebab","type":"kpi","titleCustom":"Short Title","descriptionCustom":"One-line insight description","dataSource":"sales","metric":"revenue","layout":{"x":0,"y":0,"w":3,"h":2,"minW":2,"minH":2},"config":{"icon":"DollarSign","color":"{{PRIMARY_COLOR}}","kpiBg":{"style":"gradient","effect":"glow"}}}

## EXAMPLE: PREMIUM SALES DASHBOARD (FR)
[
  {"id":"ai-ca-total","type":"kpi","titleCustom":"Chiffre d'affaires","descriptionCustom":"Revenu total généré ce mois","dataSource":"sales","metric":"revenue","layout":{"x":0,"y":0,"w":3,"h":2,"minW":2,"minH":2},"config":{"icon":"DollarSign","color":"{{PRIMARY_COLOR}}","kpiBg":{"style":"gradient","effect":"glow"}}},
  {"id":"ai-ventes-count","type":"kpi","titleCustom":"Ventes conclues","descriptionCustom":"Nombre de ventes finalisées","dataSource":"sales","metric":"count","layout":{"x":3,"y":0,"w":3,"h":2,"minW":2,"minH":2},"config":{"icon":"ShoppingCart","color":"{{PRIMARY_COLOR}}","kpiBg":{"style":"glass","effect":"wave"}}},
  {"id":"ai-offres-actives","type":"kpi","titleCustom":"Offres en cours","descriptionCustom":"Pipeline commercial actif","dataSource":"offers","metric":"count","layout":{"x":6,"y":0,"w":3,"h":2,"minW":2,"minH":2},"config":{"icon":"Target","color":"{{PRIMARY_COLOR}}","kpiBg":{"style":"solid","effect":"dots"}}},
  {"id":"ai-taux-conversion","type":"kpi","titleCustom":"Taux de conversion","descriptionCustom":"Ratio offres converties en ventes","dataSource":"offers","metric":"conversionRate","layout":{"x":9,"y":0,"w":3,"h":2,"minW":2,"minH":2},"config":{"icon":"TrendingUp","color":"{{PRIMARY_COLOR}}","kpiBg":{"style":"subtle","effect":"aurora"}}},
  {"id":"ai-evolution-ca","type":"area","titleCustom":"Évolution du chiffre d'affaires","descriptionCustom":"Tendance mensuelle du revenu sur 12 mois","dataSource":"sales","metric":"monthlyTrend","layout":{"x":0,"y":2,"w":8,"h":5,"minW":4,"minH":3},"config":{"color":"{{PRIMARY_COLOR}}"}},
  {"id":"ai-repartition-offres","type":"donut","titleCustom":"Répartition des offres","descriptionCustom":"Ventilation par statut du pipeline","dataSource":"offers","metric":"statusBreakdown","layout":{"x":8,"y":2,"w":4,"h":5,"minW":3,"minH":3},"config":{"color":"{{PRIMARY_COLOR}}"}},
  {"id":"ai-performance-gauge","type":"gauge","titleCustom":"Performance commerciale","descriptionCustom":"Taux de conversion global","dataSource":"sales","metric":"conversionRate","layout":{"x":0,"y":7,"w":4,"h":4,"minW":3,"minH":3},"config":{"color":"{{PRIMARY_COLOR}}"}},
  {"id":"ai-ventes-statut","type":"bar","titleCustom":"Ventes par statut","descriptionCustom":"Répartition des ventes actives","dataSource":"sales","metric":"statusBreakdown","layout":{"x":4,"y":7,"w":4,"h":4,"minW":3,"minH":3},"config":{"color":"{{PRIMARY_COLOR}}"}},
  {"id":"ai-tendance-contacts","type":"sparkline","titleCustom":"Tendance contacts","descriptionCustom":"Nouveaux contacts ce trimestre","dataSource":"contacts","metric":"count","layout":{"x":8,"y":7,"w":4,"h":4,"minW":2,"minH":2},"config":{"color":"{{PRIMARY_COLOR}}"}},
  {"id":"ai-top-ventes","type":"table","titleCustom":"Top ventes récentes","descriptionCustom":"Dernières transactions conclues","dataSource":"sales","metric":"topItems","layout":{"x":0,"y":11,"w":7,"h":5,"minW":4,"minH":3},"config":{"color":"{{PRIMARY_COLOR}}"}},
  {"id":"ai-entonnoir","type":"funnel","titleCustom":"Entonnoir de conversion","descriptionCustom":"Du prospect à la vente finalisée","dataSource":"offers","metric":"statusBreakdown","layout":{"x":7,"y":11,"w":5,"h":5,"minW":3,"minH":3},"config":{"color":"{{PRIMARY_COLOR}}"}}
]

PRIMARY_COLOR: {{PRIMARY_COLOR}}
`;

export interface AiDashboardMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (widgets: DashboardWidget[] | null) => void;
  onError: (error: string) => void;
}

/** Parse AI response JSON into validated widgets */
function parseWidgets(raw: string): DashboardWidget[] | null {
  try {
    // Extract JSON array from response (handle markdown wrapping)
    let jsonStr = raw.trim();
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return null;
    jsonStr = arrayMatch[0];

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const validTypes: WidgetType[] = ['kpi', 'bar', 'pie', 'donut', 'line', 'area', 'table', 'gauge', 'sparkline', 'funnel', 'radar', 'stackedBar', 'heatmap', 'map'];
    const validSources: DataSourceKey[] = ['sales', 'offers', 'contacts', 'tasks', 'articles', 'serviceOrders', 'dispatches', 'timeExpenses', 'externalApi'];

    return parsed
      .filter((w: any) => w && validTypes.includes(w.type) && validSources.includes(w.dataSource))
      .map((w: any, i: number) => ({
        id: w.id || `ai-widget-${Date.now()}-${i}`,
        type: w.type as WidgetType,
        titleKey: w.titleKey || 'dashboardBuilder.presets.totalSales',
        titleCustom: w.titleCustom || w.title || undefined,
        descriptionKey: w.descriptionKey,
        descriptionCustom: w.descriptionCustom || w.description || w.subtitle || undefined,
        dataSource: w.dataSource as DataSourceKey,
        metric: (w.metric || 'count') as MetricKey,
        layout: {
          x: w.layout?.x ?? 0,
          y: w.layout?.y ?? i * 2,
          w: w.layout?.w ?? 3,
          h: w.layout?.h ?? 2,
          minW: w.layout?.minW ?? 2,
          minH: w.layout?.minH ?? 2,
        },
        config: w.config || {},
        filters: w.filters,
      }));
  } catch (e) {
    console.error('Failed to parse AI dashboard response:', e);
    return null;
  }
}


export async function streamDashboardAI(
  userMessage: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const primary = getPrimaryHex();
  const systemPrompt = SYSTEM_PROMPT.replace(/\{\{PRIMARY_COLOR\}\}/g, primary);

  let accumulated = '';

  const result = await callWithFallback({
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
    onChunk: (delta) => {
      accumulated += delta;
      callbacks.onToken(delta);
    },
  });

  if (result.success) {
    callbacks.onComplete(parseWidgets(result.content || accumulated));
  } else {
    callbacks.onError(result.error || 'All AI models and keys exhausted. Add more keys in Settings → Integrations.');
  }
}

/** Quick presets users can click */
export const AI_QUICK_PROMPTS = [
  { labelKey: 'dashboardBuilder.ai.promptSales', prompt: 'Build me a sales-focused dashboard with revenue KPIs, sales trends, and pipeline analysis' },
  { labelKey: 'dashboardBuilder.ai.promptCRM', prompt: 'Create a CRM overview dashboard showing contacts, offers, sales funnel, and conversion metrics' },
  { labelKey: 'dashboardBuilder.ai.promptField', prompt: 'Build a field operations dashboard with service orders, tasks, dispatches map, and completion rates' },
  { labelKey: 'dashboardBuilder.ai.promptExecutive', prompt: 'Create an executive summary with high-level KPIs, trends, and performance gauges across all modules' },
  { labelKey: 'dashboardBuilder.ai.promptMinimal', prompt: 'Build a clean minimal dashboard with just 4 KPI cards and 2 charts' },
];
