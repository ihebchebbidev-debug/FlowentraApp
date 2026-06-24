import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plus, LayoutGrid, List, Table as TableIcon, Target, Trophy, TrendingUp,
  MoreVertical, Eye, Edit, Trash2, GitBranch, Loader2, Handshake, Play, Filter, ChevronDown, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { formatStatValue, formatCurrencyValue } from "@/lib/formatters";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { CreateActionButton } from "@/components/CreateActionButton";
import { useDeals } from "../hooks/useDeals";
import { DEAL_STAGES, OPEN_STAGES, stageBadgeClass, stageColor } from "../lib/dealStages";
import { computeForecast, isAtRisk } from "../lib/dealAnalytics";
import { DealsKanbanView } from "./DealsKanbanView";
import { ConvertDealModal } from "./ConvertDealModal";
import { DealsAutopilotDemo } from "./onboarding/DealsAutopilotDemo";
import type { Deal } from "@/services/api/dealsApi";
import { getInitialViewMode } from "../../../hooks/getInitialViewMode";
import { usePermissions } from "@/hooks/usePermissions";

type StatFilter = "all" | "open" | "won" | "lost";

export function DealsList() {
  const { t } = useTranslation("deals");
  const navigate = useNavigate();
  const { deals, stats, loading, refetch, deleteDeal } = useDeals();
  const { canCreate, canUpdate, canDelete, isMainAdmin } = usePermissions();

  const hasCreateAccess = isMainAdmin || canCreate('deals');
  const hasUpdateAccess = isMainAdmin || canUpdate('deals');
  const hasDeleteAccess = isMainAdmin || canDelete('deals');

  const [viewMode, setViewMode] = useState<"list" | "table" | "kanban">(() => getInitialViewMode(["list", "table", "kanban"] as const, "table"));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStat, setSelectedStat] = useState<StatFilter>("all");
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterStage, setFilterStage] = useState<"all" | string>("all");
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);
  const [toDelete, setToDelete] = useState<Deal | null>(null);
  const [toConvert, setToConvert] = useState<Deal | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const matchesStat = (d: Deal) => {
    if (selectedStat === "open") return OPEN_STAGES.includes(d.stage);
    if (selectedStat === "won") return d.stage === "won";
    if (selectedStat === "lost") return d.stage === "lost";
    return true;
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return deals.filter(d => {
      if (!matchesStat(d)) return false;
      if (filterStage !== "all" && d.stage !== filterStage) return false;
      if (showAtRiskOnly && !isAtRisk(d)) return false;
      if (!q) return true;
      return (
        d.title?.toLowerCase().includes(q) ||
        d.contactName?.toLowerCase().includes(q) ||
        d.contact?.name?.toLowerCase().includes(q) ||
        d.dealNumber?.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, searchTerm, selectedStat, filterStage, showAtRiskOnly]);

  const forecast = useMemo(() => computeForecast(deals), [deals]);
  const maxFunnelValue = Math.max(1, ...forecast.funnel.map(f => f.value));

  const statsData = [
    { label: t("stats.total"), value: stats.totalDeals, icon: Handshake, color: "primary", filter: "all" as StatFilter },
    { label: t("stats.open"), value: formatCurrencyValue(stats.openValue), icon: Target, color: "warning", filter: "open" as StatFilter },
    { label: t("stats.won"), value: formatCurrencyValue(stats.wonValue), icon: Trophy, color: "success", filter: "won" as StatFilter },
    { label: t("stats.winRate"), value: `${stats.winRate}%`, icon: TrendingUp, color: "info", filter: "value" as const },
  ];

  const Header = () => (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Handshake className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("header.title")}</h1>
          <p className="text-[11px] text-muted-foreground">{t("header.subtitle")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="gap-1.5">
          <Play className="h-3.5 w-3.5" /> {t("header.watchDemo")}
        </Button>
        {hasCreateAccess && (
          <CreateActionButton className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift" onClick={() => navigate("/dashboard/deals/add")}>
            <Plus className="h-4 w-4 text-white mr-2" /> {t("header.add")}
          </CreateActionButton>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header />

      {/* Autopilot product demo */}
      <DealsAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* Stats Cards */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsData.map((stat, index) => {
            const isSelected = selectedStat === stat.filter;
            const isInteractive = stat.filter !== "value";
            return (
              <Card
                key={index}
                className={`shadow-card hover-lift gradient-card group ${isInteractive ? "cursor-pointer" : ""} transition-all hover:shadow-lg ${
                  isSelected ? "border-2 border-primary bg-primary/5" : "border-0"
                }`}
                onClick={() => isInteractive && setSelectedStat(stat.filter as StatFilter)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${isSelected ? "bg-primary/20" : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`}`}>
                        <stat.icon className={`h-4 w-4 transition-all ${isSelected ? "text-primary" : `text-${stat.color}`}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatStatValue(stat.value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pipeline forecast & health — computed from the open pipeline */}
      {!loading && forecast.openCount > 0 && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-b border-border">
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-3">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("forecast.weighted", { defaultValue: "Weighted pipeline" })}</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrencyValue(forecast.weightedValue)}</p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("forecast.openValue", { defaultValue: "Open value" })}</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrencyValue(forecast.openValue)}</p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <button
                type="button"
                onClick={() => { setSelectedStat("open"); setShowAtRiskOnly(s => !s); }}
                className={`text-left rounded-lg px-2 -mx-2 py-0.5 transition-colors ${forecast.atRisk > 0 ? "hover:bg-amber-500/10" : ""} ${showAtRiskOnly ? "bg-amber-500/10" : ""}`}
              >
                <p className="text-[11px] text-muted-foreground font-medium">{t("forecast.atRisk", { defaultValue: "At risk" })}</p>
                <p className={`text-lg font-bold tabular-nums ${forecast.atRisk > 0 ? "text-amber-600" : ""}`}>{forecast.atRisk}</p>
              </button>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("forecast.avgAge", { defaultValue: "Avg. age" })}</p>
                <p className="text-lg font-bold tabular-nums">{forecast.avgAgeDays}{t("forecast.daysShort", { defaultValue: "d" })}</p>
              </div>
            </div>
            {/* Funnel by stage */}
            <div className="space-y-1.5">
              {forecast.funnel.map(f => (
                <button
                  key={f.stage}
                  type="button"
                  onClick={() => { setSelectedStat("all"); setFilterStage(f.stage); setShowAtRiskOnly(false); }}
                  className="w-full flex items-center gap-3 group"
                >
                  <span className="text-xs text-muted-foreground w-24 shrink-0 text-left capitalize">{t(`stages.${f.stage}`)}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all group-hover:opacity-80" style={{ width: `${(f.value / maxFunnelValue) * 100}%`, background: stageColor(f.stage) }} />
                  </div>
                  <span className="text-xs tabular-nums w-10 text-right shrink-0">{f.count}</span>
                  <span className="text-xs tabular-nums w-24 text-right shrink-0 text-muted-foreground">{formatCurrencyValue(f.value)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
            <div className="flex-1">
              <CollapsibleSearch
                placeholder={t("search.placeholder")}
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t("filters.filters", "Filters")}</span>
              {filterStage !== "all" && <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">1</Badge>}
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none ${viewMode === "list" ? "bg-primary text-white hover:bg-primary/90" : ""}`}
            >
              <List className={`h-4 w-4 ${viewMode === "list" ? "text-white" : ""}`} />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-none ${viewMode === "table" ? "bg-primary text-white hover:bg-primary/90" : ""}`}
            >
              <TableIcon className={`h-4 w-4 ${viewMode === "table" ? "text-white" : ""}`} />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className={`flex-1 sm:flex-none ${viewMode === "kanban" ? "bg-primary text-white hover:bg-primary/90" : ""}`}
            >
              <LayoutGrid className={`h-4 w-4 ${viewMode === "kanban" ? "text-white" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-down filter bar */}
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                  <option value="all">{t("filters.all")}</option>
                  {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{t(`stages.${s.id}`)}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full border border-border text-sm" onClick={() => { setFilterStage("all"); setSelectedStat("all"); setShowFilterBar(false); }}>{t("actions.cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> …
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <Handshake className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground mb-4">{t("empty.description")}</p>
            {hasCreateAccess && (
              <CreateActionButton className="bg-primary text-white hover:bg-primary/90" onClick={() => navigate("/dashboard/deals/add")}>
                <Plus className="h-4 w-4 mr-2" /> {t("empty.cta")}
              </CreateActionButton>
            )}
          </div>
        ) : viewMode === "kanban" ? (
          <DealsKanbanView
            deals={filtered}
            onOpen={d => navigate(`/dashboard/deals/${d.id}`)}
            onRefetch={refetch}
          />
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {filtered.map(d => (
              <Card
                key={d.id}
                className="shadow-card border-0 bg-card cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/dashboard/deals/${d.id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: stageColor(d.stage) }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-1.5">
                      <span className="truncate">{d.title}</span>
                      {isAtRisk(d) && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label={t("forecast.atRisk", { defaultValue: "At risk" })} />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {(d.contactName || d.contact?.name || "—")}{d.dealNumber ? ` · ${d.dealNumber}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">{formatCurrencyValue(d.estimatedValue, d.currency)}</div>
                    <Badge variant="secondary" className={`${stageBadgeClass(d.stage)} mt-0.5`}>{t(`stages.${d.stage}`)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.deal")}</TableHead>
                    <TableHead>{t("table.customer")}</TableHead>
                    <TableHead>{t("table.stage")}</TableHead>
                    <TableHead className="text-right">{t("table.value")}</TableHead>
                    <TableHead className="text-center">{t("table.probability")}</TableHead>
                    <TableHead>{t("table.closeDate")}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/dashboard/deals/${d.id}`)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: stageColor(d.stage) }} />
                          {isAtRisk(d) && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label={t("forecast.atRisk", { defaultValue: "At risk" })} />}
                          <div className="min-w-0">
                            <div className="truncate">{d.title}</div>
                            {d.dealNumber && <div className="text-xs text-muted-foreground">{d.dealNumber}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{d.contactName || d.contact?.name || "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className={stageBadgeClass(d.stage)}>{t(`stages.${d.stage}`)}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrencyValue(d.estimatedValue, d.currency)}</TableCell>
                      <TableCell className="text-center">{d.probability}%</TableCell>
                      <TableCell>{d.expectedCloseDate ? format(new Date(d.expectedCloseDate), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/deals/${d.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> {t("actions.view")}
                            </DropdownMenuItem>
                            {hasUpdateAccess && (
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/deals/${d.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" /> {t("actions.edit")}
                              </DropdownMenuItem>
                            )}
                            {hasUpdateAccess && (
                              <DropdownMenuItem onClick={() => setToConvert(d)}>
                                <GitBranch className="h-4 w-4 mr-2" /> {t("actions.convert")}
                              </DropdownMenuItem>
                            )}
                            {hasDeleteAccess && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => setToDelete(d)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> {t("actions.delete")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (toDelete) deleteDeal(toDelete.id); setToDelete(null); }}
            >
              {t("delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert */}
      {toConvert && (
        <ConvertDealModal
          deal={toConvert}
          open={!!toConvert}
          onClose={() => setToConvert(null)}
          onConverted={() => { setToConvert(null); refetch(); }}
        />
      )}
    </div>
  );
}

export default DealsList;
