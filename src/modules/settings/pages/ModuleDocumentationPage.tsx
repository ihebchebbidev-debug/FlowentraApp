import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Book, ChevronLeft, ChevronRight, ExternalLink, FolderKanban,
  Maximize2, X, Layers, ListChecks, Image as ImageIcon, Plug, Database,
  ChevronDown, KeyRound, GitBranch, ShieldCheck, AlertTriangle, Workflow,
  Link2, FileCode2, CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MODULES, SHOTS, MODULE_ICON, CATEGORY_ICON } from "./DocumentationPage";
import { MODULE_APIS, MODULE_TABLES } from "./moduleTechnicalRefs";
import { getTableColumns } from "./tableSchemas";
import { MODULE_GUIDES } from "./docs";
import { useTranslation } from "react-i18next";
import { useCategoryLabel, useLocalizedGuide, useLocalizedModules, useLocalizedShots } from "./docs/locales/localize";

function typeBadgeColor(type: string): string {
  const t = type.toLowerCase();
  if (/(int|serial|bigserial|smallint|numeric|decimal|real|double|float|money)/.test(t))
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
  if (/(text|varchar|char|citext|uuid)/.test(t))
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (/(bool)/.test(t))
    return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
  if (/(date|time|timestamp|interval)/.test(t))
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
  if (/(json|jsonb|xml|bytea|array|\[\])/.test(t))
    return "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30";
  return "bg-muted text-muted-foreground border-border";
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  PATCH: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  DELETE: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};
function methodBadge(method: string) {
  const first = method.split("/")[0].trim().toUpperCase();
  return METHOD_COLORS[first] ?? "bg-muted text-foreground border-border";
}

export default function ModuleDocumentationPage() {
  const navigate = useNavigate();
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const { t } = useTranslation("settings");
  const catLabel = useCategoryLabel();
  const modules = useLocalizedModules(MODULES);
  const mod = useMemo(() => modules.find((m) => m.key === moduleKey), [modules, moduleKey]);
  const guide = useLocalizedGuide(moduleKey, moduleKey ? MODULE_GUIDES[moduleKey] : undefined);

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const shots = useLocalizedShots(mod ? (SHOTS[mod.key] || []) : []);
  const currentShot = lightboxIdx != null ? shots[lightboxIdx] : null;
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevShot = useCallback(
    () => setLightboxIdx((i) => (i == null ? i : (i - 1 + shots.length) % shots.length)),
    [shots.length]
  );
  const nextShot = useCallback(
    () => setLightboxIdx((i) => (i == null ? i : (i + 1) % shots.length)),
    [shots.length]
  );

  useEffect(() => {
    if (lightboxIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevShot();
      else if (e.key === "ArrowRight") nextShot();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, closeLightbox, prevShot, nextShot]);

  const sortedModules = modules;
  const idx = sortedModules.findIndex((m) => m.key === moduleKey);
  const prevMod = idx > 0 ? sortedModules[idx - 1] : null;
  const nextMod = idx >= 0 && idx < sortedModules.length - 1 ? sortedModules[idx + 1] : null;

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" /> {t("docs.moduleNotFound")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("docs.moduleNotFoundBody", { key: moduleKey })}
            </p>
            <Button onClick={() => navigate("/dashboard/settings/documentation")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> {t("docs.backToDocs")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MIcon = MODULE_ICON[mod.key] ?? FolderKanban;
  const CIcon = CATEGORY_ICON[mod.category] ?? FolderKanban;
  const apis = MODULE_APIS[mod.key] ?? [];
  const tables = MODULE_TABLES[mod.key] ?? [];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Breadcrumb bar */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/85 border-b">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3 flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/dashboard/settings/documentation")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-1">
            <Link to="/dashboard/settings/documentation" className="hover:text-foreground shrink-0">{t("docs.docsShort")}</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline shrink-0">{catLabel(mod.category)}</span>
            <ChevronRight className="h-3 w-3 hidden sm:inline shrink-0" />
            <span className="text-foreground font-medium truncate">{mod.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {prevMod && (
              <Button variant="outline" size="sm" className="h-8" asChild aria-label={t("docs.previousModule", { name: prevMod.name })}>
                <Link to={`/dashboard/settings/documentation/module/${prevMod.key}`}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden lg:inline ml-1 max-w-[120px] truncate">{prevMod.name}</span>
                </Link>
              </Button>
            )}
            {nextMod && (
              <Button variant="outline" size="sm" className="h-8" asChild aria-label={t("docs.nextModule", { name: nextMod.name })}>
                <Link to={`/dashboard/settings/documentation/module/${nextMod.key}`}>
                  <span className="hidden lg:inline mr-1 max-w-[120px] truncate">{nextMod.name}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b bg-gradient-to-br from-primary/8 via-background to-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 pb-7">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <MIcon className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <CIcon className="h-3.5 w-3.5" /> {catLabel(mod.category)}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight break-words">{mod.name}</h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                {guide?.purpose ?? mod.description}
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {guide?.workflows.length ? (
                  <Badge variant="secondary" className="gap-1"><Workflow className="h-3 w-3" /> {t("docs.workflowsCount", { count: guide.workflows.length })}</Badge>
                ) : null}
                {guide?.rules.length ? (
                  <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> {t("docs.rulesCount", { count: guide.rules.length })}</Badge>
                ) : null}
                <Badge variant="outline" className="gap-1"><ListChecks className="h-3 w-3" /> {t("docs.featuresCount", { count: mod.features.length })}</Badge>
                <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" /> {t("docs.routesCount", { count: mod.routes.length })}</Badge>
                {apis.length ? <Badge variant="outline" className="gap-1"><Plug className="h-3 w-3" /> {t("docs.endpointsCount", { count: apis.length })}</Badge> : null}
                {tables.length ? <Badge variant="outline" className="gap-1"><Database className="h-3 w-3" /> {t("docs.tablesCount", { count: tables.length })}</Badge> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-1.5"><Book className="h-3.5 w-3.5" /> {t("docs.tabOverview")}</TabsTrigger>
            <TabsTrigger value="workflows" className="gap-1.5"><Workflow className="h-3.5 w-3.5" /> {t("docs.tabWorkflows")}</TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {t("docs.tabRules")}</TabsTrigger>
            {shots.length > 0 && (
              <TabsTrigger value="screens" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> {t("docs.tabScreens")}</TabsTrigger>
            )}
            <TabsTrigger value="technical" className="gap-1.5"><FileCode2 className="h-3.5 w-3.5" /> {t("docs.tabTechnical")}</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> {t("docs.whatItDoes")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {mod.features.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> {t("docs.screensAndRoutes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {mod.routes.map((r) => (
                        <li key={r.path}>
                          <Link to={r.path} className="group flex items-start gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-foreground">{r.label}</div>
                              <code className="font-mono text-px-10 text-primary group-hover:underline break-all">{r.path}</code>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {guide?.statuses?.length ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-primary" /> {t("docs.statusVocabulary")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {guide.statuses.map((s) => (
                          <li key={s.name} className="text-xs">
                            <Badge variant="outline" className="font-mono text-px-10 mr-2">{s.name}</Badge>
                            <span className="text-muted-foreground">{s.meaning}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>

            {guide?.integrations?.length ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" /> {t("docs.howItConnects")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {guide.integrations.map((i, n) => (
                      <li key={n} className="flex gap-2">
                        <GitBranch className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        <span className="leading-relaxed">{i}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* ── Workflows ── */}
          <TabsContent value="workflows" className="mt-0">
            {guide?.workflows.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {guide.workflows.map((w) => (
                  <Card key={w.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-primary" /> {w.name}
                      </CardTitle>
                      <CardDescription>{t("docs.stepsCount", { count: w.steps.length })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        {w.steps.map((s, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-px-10 font-semibold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
                {t("docs.noWorkflows")}
              </CardContent></Card>
            )}
          </TabsContent>

          {/* ── Rules ── */}
          <TabsContent value="rules" className="space-y-6 mt-0">
            {guide?.rules.length ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> {t("docs.rulesEnforced")}
                  </CardTitle>
                  <CardDescription>
                    Validations, guards and calculations applied by the backend — not just UI hints.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border/60">
                    {guide.rules.map((r, i) => (
                      <li key={i} className="py-3 first:pt-0 last:pb-0">
                        <div className="text-sm font-medium">{r.title}</div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
                {t("docs.noRules")}
              </CardContent></Card>
            )}

            {guide?.gotchas?.length ? (
              <Card className="border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> {t("docs.limitations")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {guide.gotchas.map((g, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="leading-relaxed">{g}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {guide?.sources?.length ? (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-muted-foreground" /> {t("docs.sourceOfTruth")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    This page was written from these files. If behaviour changes there, update the docs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.sources.map((s) => (
                      <code key={s} className="text-px-10 font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground break-all">
                        {s}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* ── Screens ── */}
          {shots.length > 0 && (
            <TabsContent value="screens" className="mt-0">
              <div className="space-y-8">
                {shots.map((s, i) => (
                  <Card key={s.src} className="overflow-hidden">
                    <div className="grid lg:grid-cols-5 gap-0">
                      <button
                        type="button"
                        onClick={() => setLightboxIdx(i)}
                        className="lg:col-span-3 relative group bg-muted/30"
                        aria-label={`Open ${s.caption} fullscreen`}
                      >
                        <img
                          src={s.src}
                          alt={s.caption}
                          loading="lazy"
                          className="w-full h-full object-cover max-h-[520px] group-hover:opacity-95 transition-opacity cursor-zoom-in"
                        />
                        <span className="absolute top-3 right-3 rounded bg-background/85 backdrop-blur p-1.5 opacity-0 group-hover:opacity-100 transition-opacity border">
                          <Maximize2 className="h-4 w-4" />
                        </span>
                        <span className="absolute bottom-3 left-3 rounded bg-background/85 backdrop-blur px-2 py-1 text-px-11 font-mono border">
                          {i + 1} / {shots.length}
                        </span>
                      </button>
                      <div className="lg:col-span-2 p-5 lg:p-6 space-y-4">
                        <h3 className="font-semibold text-sm leading-snug">{s.caption}</h3>
                        {([
                          ["Details", s.details],
                          ["What you can do", s.whatYouCanDo],
                          ["Fields & actions", s.fieldsActions],
                        ] as const).map(([label, list], n) =>
                          list?.length ? (
                            <div key={label}>
                              {n > 0 && <Separator className="mb-4" />}
                              <p className="text-px-11 font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
                              <ul className="text-xs space-y-1.5 text-foreground/85">
                                {list.map((d, j) => (
                                  <li key={j} className="flex gap-2">
                                    <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                    <span>{d}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* ── Technical ── */}
          <TabsContent value="technical" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plug className="h-4 w-4 text-primary" /> {t("docs.apiEndpoints")}
                  </CardTitle>
                  <CardDescription>
                    REST endpoints this module calls ({apis.length}). Path params appear as <code className="text-px-11">{"{id}"}</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {apis.length ? (
                    <ul className="divide-y divide-border/60">
                      {apis.map((ep, i) => (
                        <li key={i} className="py-2 flex items-start gap-3">
                          <Badge variant="outline" className={`shrink-0 font-mono text-px-10 px-1.5 py-0.5 ${methodBadge(ep.method)}`}>
                            {ep.method}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <code className="block text-xs font-mono break-all">{ep.path}</code>
                            {ep.description && <div className="text-px-11 text-muted-foreground mt-0.5">{ep.description}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No dedicated endpoints — this module reuses another module's API.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" /> {t("docs.dbTables")}
                  </CardTitle>
                  <CardDescription>{t("docs.dbTablesDescription", { count: tables.length })}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tables.length ? (
                    <ul className="space-y-2">
                      {tables.map((tbl) => {
                        const cols = getTableColumns(tbl);
                        return (
                          <li key={tbl} className="rounded-md border bg-muted/30 overflow-hidden">
                            {cols ? (
                              <Collapsible>
                                <CollapsibleTrigger className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-muted/60 transition-colors text-left group">
                                  <Database className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                  <code className="text-xs font-mono font-semibold flex-1 truncate">{tbl}</code>
                                  <Badge variant="outline" className="text-px-10 shrink-0">{t("docs.columnsCount", { count: cols.length })}</Badge>
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-t bg-background/40">
                                    <ul className="divide-y divide-border/50">
                                      {cols.map((c) => (
                                        <li key={c.name} className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                                          {c.pk ? (
                                            <KeyRound className="h-3 w-3 text-amber-500 shrink-0" aria-label="Primary key" />
                                          ) : (
                                            <span className="h-3 w-3 shrink-0" />
                                          )}
                                          <code className="font-mono font-medium truncate flex-1">{c.name}</code>
                                          <Badge variant="outline" className={`text-px-10 font-mono px-1.5 py-0 shrink-0 ${typeBadgeColor(c.type)}`}>
                                            {c.type}
                                          </Badge>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <div className="flex items-center gap-2 px-2.5 py-2">
                                <Database className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                <code className="text-xs font-mono flex-1 truncate">{tbl}</code>
                                <Badge variant="outline" className="text-px-10 text-muted-foreground shrink-0">{t("docs.schemaUnavailable")}</Badge>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground py-6 text-center">No tables mapped.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between gap-2 pt-6 border-t flex-wrap">
          {prevMod ? (
            <Button variant="outline" asChild>
              <Link to={`/dashboard/settings/documentation/module/${prevMod.key}`}>
                <ChevronLeft className="h-4 w-4 mr-1" /> {prevMod.name}
              </Link>
            </Button>
          ) : <span />}
          <Button variant="ghost" asChild>
            <Link to="/dashboard/settings/documentation">All modules</Link>
          </Button>
          {nextMod ? (
            <Button variant="outline" asChild>
              <Link to={`/dashboard/settings/documentation/module/${nextMod.key}`}>
                {nextMod.name} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : <span />}
        </div>
      </div>

      {/* Lightbox */}
      {currentShot && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80">
            <div className="text-sm font-medium truncate">
              {currentShot.caption}
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                {(lightboxIdx ?? 0) + 1} / {shots.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); closeLightbox(); }} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow-lg z-10"
              onClick={(e) => { e.stopPropagation(); prevShot(); }}
              aria-label="Previous"
              disabled={shots.length < 2}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <img src={currentShot.src} alt={currentShot.caption} className="max-h-full max-w-full object-contain rounded shadow-2xl" />
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow-lg z-10"
              onClick={(e) => { e.stopPropagation(); nextShot(); }}
              aria-label="Next"
              disabled={shots.length < 2}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="border-t bg-background/80 px-4 py-2 text-px-11 text-muted-foreground text-center">
            ← / → to navigate · Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
