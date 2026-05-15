import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Book, ChevronLeft, ChevronRight, ExternalLink, FolderKanban,
  Maximize2, X, Layers, ListChecks, Image as ImageIcon, Plug, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MODULES, SHOTS, MODULE_ICON, CATEGORY_ICON,
} from "./DocumentationPage";
import { MODULE_APIS, MODULE_TABLES } from "./moduleTechnicalRefs";
import { getTableColumns } from "./tableSchemas";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, KeyRound } from "lucide-react";

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
  // Methods may be combined like "GET/POST/PUT" — colorize by first.
  const first = method.split("/")[0].trim().toUpperCase();
  return METHOD_COLORS[first] ?? "bg-muted text-foreground border-border";
}

export default function ModuleDocumentationPage() {
  const navigate = useNavigate();
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const mod = useMemo(() => MODULES.find((m) => m.key === moduleKey), [moduleKey]);

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const shots = mod ? (SHOTS[mod.key] || []) : [];
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

  // Sibling navigation (prev/next module)
  const sortedModules = useMemo(() => MODULES, []);
  const idx = mod ? sortedModules.findIndex((m) => m.key === mod.key) : -1;
  const prevMod = idx > 0 ? sortedModules[idx - 1] : null;
  const nextMod = idx >= 0 && idx < sortedModules.length - 1 ? sortedModules[idx + 1] : null;

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" /> Module not found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The module “{moduleKey}” does not exist in the documentation.
            </p>
            <Button onClick={() => navigate("/dashboard/settings/documentation")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to documentation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MIcon = MODULE_ICON[mod.key] ?? FolderKanban;
  const CIcon = CATEGORY_ICON[mod.category] ?? FolderKanban;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 overflow-x-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b">
        <div className="w-full px-3 sm:px-4 lg:px-8 py-3 flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/dashboard/settings/documentation")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-1">
            <Link to="/dashboard/settings" className="hover:text-foreground hidden sm:inline">Settings</Link>
            <ChevronRight className="h-3 w-3 hidden sm:inline shrink-0" />
            <Link to="/dashboard/settings/documentation" className="hover:text-foreground shrink-0">Docs</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate">{mod.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {prevMod && (
              <Button variant="outline" size="icon" className="sm:hidden h-8 w-8" asChild aria-label={`Previous: ${prevMod.name}`}>
                <Link to={`/dashboard/settings/documentation/module/${prevMod.key}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {nextMod && (
              <Button variant="outline" size="icon" className="sm:hidden h-8 w-8" asChild aria-label={`Next: ${nextMod.name}`}>
                <Link to={`/dashboard/settings/documentation/module/${nextMod.key}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {prevMod && (
              <Button variant="outline" size="sm" className="hidden sm:inline-flex max-w-[180px]" asChild>
                <Link to={`/dashboard/settings/documentation/module/${prevMod.key}`}>
                  <ChevronLeft className="h-4 w-4 mr-1 shrink-0" /> <span className="truncate">{prevMod.name}</span>
                </Link>
              </Button>
            )}
            {nextMod && (
              <Button variant="outline" size="sm" className="hidden sm:inline-flex max-w-[180px]" asChild>
                <Link to={`/dashboard/settings/documentation/module/${nextMod.key}`}>
                  <span className="truncate">{nextMod.name}</span> <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="w-full px-3 sm:px-4 lg:px-8 pt-6 pb-5 border-b bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className="flex items-start gap-3 sm:gap-5 max-w-[1600px] mx-auto min-w-0">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20">
            <MIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <CIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{mod.category}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">{mod.name}</h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-2 max-w-3xl break-words">{mod.description}</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Badge variant="secondary" className="gap-1"><ListChecks className="h-3 w-3" /> {mod.features.length} features</Badge>
              <Badge variant="secondary" className="gap-1"><ExternalLink className="h-3 w-3" /> {mod.routes.length} routes</Badge>
              {shots.length > 0 && (
                <Badge variant="secondary" className="gap-1"><ImageIcon className="h-3 w-3" /> {shots.length} screenshots</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body — full width */}
      <div className="w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="max-w-[1600px] mx-auto grid gap-4 sm:gap-6 lg:grid-cols-3 min-w-0">
          {/* Features */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Functionalities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {mod.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> URLs & Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mod.routes.map((r) => (
                  <li key={r.path}>
                    <Link
                      to={r.path}
                      className="group flex items-start gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-primary group-hover:underline truncate">{r.path}</div>
                        <div className="text-xs text-muted-foreground">{r.label}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Backend API + Database tables */}
        {(MODULE_APIS[mod.key]?.length || MODULE_TABLES[mod.key]?.length) ? (
          <div className="max-w-[1600px] mx-auto mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3 min-w-0">
            {MODULE_APIS[mod.key]?.length ? (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plug className="h-4 w-4 text-primary" /> Backend API endpoints
                  </CardTitle>
                  <CardDescription>
                    REST endpoints consumed by this module ({MODULE_APIS[mod.key].length}).
                    Path params are shown as <code className="text-[11px]">{"{id}"}</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border/60">
                    {MODULE_APIS[mod.key].map((ep, i) => (
                      <li key={i} className="py-2 flex items-start gap-3">
                        <Badge
                          variant="outline"
                          className={`shrink-0 font-mono text-[10px] px-1.5 py-0.5 ${methodBadge(ep.method)}`}
                        >
                          {ep.method}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <code className="block text-xs font-mono text-foreground break-all">
                            {ep.path}
                          </code>
                          {ep.description ? (
                            <div className="text-[11px] text-muted-foreground mt-0.5">{ep.description}</div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {MODULE_TABLES[mod.key]?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" /> Database tables
                  </CardTitle>
                  <CardDescription>
                    Backend entities/tables this module reads & writes ({MODULE_TABLES[mod.key].length}).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {MODULE_TABLES[mod.key].map((t) => {
                      const cols = getTableColumns(t);
                      return (
                        <li key={t} className="rounded-md border bg-muted/30 overflow-hidden">
                          {cols ? (
                            <Collapsible>
                              <CollapsibleTrigger className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-muted/60 transition-colors text-left group">
                                <Database className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                <code className="text-xs font-mono font-semibold flex-1 truncate">{t}</code>
                                <Badge variant="outline" className="text-[10px] shrink-0">{cols.length} cols</Badge>
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
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] font-mono px-1.5 py-0 shrink-0 ${typeBadgeColor(c.type)}`}
                                        >
                                          {c.type}
                                        </Badge>
                                        {c.notNull && (
                                          <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 border-red-500/30 text-red-600 dark:text-red-300">
                                            NOT NULL
                                          </Badge>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <div className="flex items-center gap-2 px-2.5 py-2">
                              <Database className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                              <code className="text-xs font-mono flex-1 truncate">{t}</code>
                              <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">schema n/a</Badge>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        {/* Screenshots */}
        {shots.length > 0 && (
          <div className="max-w-[1600px] mx-auto mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Screenshots & walkthroughs</h2>
              <Badge variant="outline" className="ml-1">{shots.length}</Badge>
            </div>

            <div className="space-y-8">
              {shots.map((s, idx) => (
                <Card key={s.src} className="overflow-hidden">
                  <div className="grid lg:grid-cols-5 gap-0">
                    <button
                      type="button"
                      onClick={() => setLightboxIdx(idx)}
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
                      <span className="absolute bottom-3 left-3 rounded bg-background/85 backdrop-blur px-2 py-1 text-[11px] font-mono border">
                        {idx + 1} / {shots.length}
                      </span>
                    </button>
                    <div className="lg:col-span-2 p-5 lg:p-6 space-y-4">
                      <h3 className="font-semibold text-sm leading-snug">{s.caption}</h3>
                      {s.details?.length ? (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Details</p>
                          <ul className="text-xs space-y-1.5 text-foreground/85">
                            {s.details.map((d, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {s.whatYouCanDo?.length ? (
                        <>
                          <Separator />
                          <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">What you can do</p>
                            <ul className="text-xs space-y-1.5 text-foreground/85">
                              {s.whatYouCanDo.map((d, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-primary mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : null}
                      {s.fieldsActions?.length ? (
                        <>
                          <Separator />
                          <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Fields & actions</p>
                            <ul className="text-xs space-y-1.5 text-foreground/85">
                              {s.fieldsActions.map((d, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-primary mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="max-w-[1600px] mx-auto mt-10 flex items-center justify-between gap-2 pt-6 border-t flex-wrap">
          {prevMod ? (
            <Button variant="outline" asChild className="max-w-[45%] sm:max-w-[200px]">
              <Link to={`/dashboard/settings/documentation/module/${prevMod.key}`} className="min-w-0">
                <ChevronLeft className="h-4 w-4 mr-2 shrink-0" />
                <span className="text-left min-w-0">
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Previous</span>
                  <span className="block text-sm truncate">{prevMod.name}</span>
                </span>
              </Link>
            </Button>
          ) : <span />}
          <Button variant="ghost" onClick={() => navigate("/dashboard/settings/documentation")} className="shrink-0">
            All modules
          </Button>
          {nextMod ? (
            <Button variant="outline" asChild className="max-w-[45%] sm:max-w-[200px]">
              <Link to={`/dashboard/settings/documentation/module/${nextMod.key}`} className="min-w-0">
                <span className="text-right min-w-0">
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Next</span>
                  <span className="block text-sm truncate">{nextMod.name}</span>
                </span>
                <ChevronRight className="h-4 w-4 ml-2 shrink-0" />
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
            <img
              src={currentShot.src}
              alt={currentShot.caption}
              className="max-h-full max-w-full object-contain rounded shadow-2xl"
            />
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
          <div className="border-t bg-background/80 px-4 py-2 text-[11px] text-muted-foreground text-center">
            ← / → to navigate · Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
