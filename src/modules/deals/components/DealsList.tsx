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
  Plus, LayoutGrid, Table as TableIcon, Target, Trophy, TrendingUp,
  MoreVertical, Eye, Edit, Trash2, GitBranch, Loader2, Handshake, Play, Filter, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { formatStatValue, formatCurrencyValue } from "@/lib/formatters";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { CreateActionButton } from "@/components/CreateActionButton";
import { useDeals } from "../hooks/useDeals";
import { DEAL_STAGES, OPEN_STAGES, stageBadgeClass, stageColor } from "../lib/dealStages";
import { DealsKanbanView } from "./DealsKanbanView";
import { ConvertDealModal } from "./ConvertDealModal";
import { DealsAutopilotDemo } from "./onboarding/DealsAutopilotDemo";
import type { Deal } from "@/services/api/dealsApi";
import { getInitialViewMode } from "../../../hooks/getInitialViewMode";

type StatFilter = "all" | "open" | "won" | "lost";

export function DealsList() {
  const { t } = useTranslation("deals");
  const navigate = useNavigate();
  const { deals, stats, loading, refetch, deleteDeal } = useDeals();

  const [viewMode, setViewMode] = useState<"table" | "kanban">(() => getInitialViewMode(["table", "kanban"] as const, "table"));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStat, setSelectedStat] = useState<StatFilter>("all");
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterStage, setFilterStage] = useState<"all" | string>("all");
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
      if (!q) return true;
      return (
        d.title?.toLowerCase().includes(q) ||
        d.contactName?.toLowerCase().includes(q) ||
        d.contact?.name?.toLowerCase().includes(q) ||
        d.dealNumber?.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, searchTerm, selectedStat, filterStage]);

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
        <CreateActionButton className="bg-primary text-white hover:bg-primary/90 shadow-medium hover-lift" onClick={() => navigate("/dashboard/deals/add")}>
          <Plus className="h-4 w-4 text-white mr-2" /> {t("header.add")}
        </CreateActionButton>
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
            <CreateActionButton className="bg-primary text-white hover:bg-primary/90" onClick={() => navigate("/dashboard/deals/add")}>
              <Plus className="h-4 w-4 mr-2" /> {t("empty.cta")}
            </CreateActionButton>
          </div>
        ) : viewMode === "kanban" ? (
          <DealsKanbanView
            deals={filtered}
            onOpen={d => navigate(`/dashboard/deals/${d.id}`)}
            onRefetch={refetch}
          />
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
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/deals/${d.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> {t("actions.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setToConvert(d)}>
                              <GitBranch className="h-4 w-4 mr-2" /> {t("actions.convert")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setToDelete(d)}>
                              <Trash2 className="h-4 w-4 mr-2" /> {t("actions.delete")}
                            </DropdownMenuItem>
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
