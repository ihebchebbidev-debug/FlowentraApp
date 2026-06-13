import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plus, Search, List, LayoutGrid, DollarSign, Target, Trophy, TrendingUp,
  MoreVertical, Eye, Edit, Trash2, GitBranch, Loader2, Handshake, Play,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrencyValue } from "@/lib/formatters";
import { useDeals } from "../hooks/useDeals";
import { DEAL_STAGES, stageBadgeClass, stageColor } from "../lib/dealStages";
import { DealsKanbanView } from "./DealsKanbanView";
import { ConvertDealModal } from "./ConvertDealModal";
import { DealsAutopilotDemo } from "./onboarding/DealsAutopilotDemo";
import type { Deal } from "@/services/api/dealsApi";
import { getInitialViewMode } from "../../../hooks/getInitialViewMode";

export function DealsList() {
  const { t } = useTranslation("deals");
  const navigate = useNavigate();
  const { deals, stats, loading, refetch, deleteDeal } = useDeals();

  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => getInitialViewMode(["list", "kanban"] as const, "kanban"));
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | string>("all");
  const [toDelete, setToDelete] = useState<Deal | null>(null);
  const [toConvert, setToConvert] = useState<Deal | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  // Search applies to both views; the stage chip only narrows the list view
  // (the kanban shows the whole pipeline by design, one column per stage).
  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(d =>
      d.title?.toLowerCase().includes(q) ||
      d.contactName?.toLowerCase().includes(q) ||
      d.dealNumber?.toLowerCase().includes(q)
    );
  }, [deals, search]);

  const filtered = useMemo(
    () => stageFilter === "all" ? searchFiltered : searchFiltered.filter(d => d.stage === stageFilter),
    [searchFiltered, stageFilter],
  );

  const statCards = [
    { icon: Handshake, label: t("stats.total"), value: stats.totalDeals, tint: "text-blue-600" },
    { icon: Target, label: t("stats.openValue"), value: formatCurrencyValue(stats.openValue), tint: "text-amber-600" },
    { icon: Trophy, label: t("stats.wonValue"), value: formatCurrencyValue(stats.wonValue), tint: "text-green-600" },
    { icon: TrendingUp, label: t("stats.winRate"), value: `${stats.winRate}%`, tint: "text-purple-600" },
    { icon: DollarSign, label: t("stats.avgValue"), value: formatCurrencyValue(stats.averageValue), tint: "text-sky-600" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Handshake className="h-6 w-6 text-primary" /> {t("header.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("header.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="gap-1.5">
            <Play className="h-3.5 w-3.5" /> {t("header.watchDemo")}
          </Button>
          <Button onClick={() => navigate("/dashboard/deals/add")} className="gap-1.5">
            <Plus className="h-4 w-4" /> {t("header.add")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.tint}`} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-semibold truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search.placeholder")}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Button
            variant={stageFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStageFilter("all")}
          >
            {t("filters.all")}
          </Button>
          {DEAL_STAGES.map(s => (
            <Button
              key={s.id}
              variant={stageFilter === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(s.id)}
              className="whitespace-nowrap"
            >
              {t(`stages.${s.id}`)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 ml-auto">
          <Button variant="ghost" size="sm" onClick={() => setViewMode("kanban")} className={viewMode === "kanban" ? "bg-background shadow-sm" : ""}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-background shadow-sm" : ""}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> …
          </div>
        ) : (viewMode === "kanban" ? searchFiltered : filtered).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <Handshake className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground mb-4">{t("empty.description")}</p>
            <Button onClick={() => navigate("/dashboard/deals/add")} className="gap-1.5">
              <Plus className="h-4 w-4" /> {t("empty.cta")}
            </Button>
          </div>
        ) : viewMode === "kanban" ? (
          <DealsKanbanView
            deals={searchFiltered}
            onOpen={d => navigate(`/dashboard/deals/${d.id}`)}
            onRefetch={refetch}
          />
        ) : (
          <Card>
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
                        <span className="h-2 w-2 rounded-full" style={{ background: stageColor(d.stage) }} />
                        {d.title}
                      </div>
                      {d.dealNumber && <span className="text-xs text-muted-foreground">{d.dealNumber}</span>}
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

      {/* Autopilot product demo */}
      <DealsAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

export default DealsList;
