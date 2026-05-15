import { useState } from "react";
import { DealsHeader } from "./components/DealsHeader";
import { PipelineOverview } from "./components/PipelineOverview";
import { RevenueStats } from "./components/RevenueStats";
import { ActiveDealsList, type Deal } from "./components/ActiveDealsList";
import { KanbanBoard, type KanbanDeal } from "./components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { PluginGate } from "@/modules/shared/plugins";

const kanbanDeals: KanbanDeal[] = [
  { id: 'd1', title: "Enterprise Software License", value: "45,000 TND", numericValue: 45000, stage: "Proposal", closeDate: "2024-01-15", contact: "John Doe", company: "Acme Corp", probability: 65, daysInStage: 12 },
  { id: 'd2', title: "Consulting Services", value: "12,500 TND", numericValue: 12500, stage: "Negotiation", closeDate: "2024-01-10", contact: "Jane Smith", company: "Tech Startup", probability: 80, daysInStage: 5 },
  { id: 'd3', title: "Annual Support Contract", value: "8,500 TND", numericValue: 8500, stage: "Qualified", closeDate: "2024-01-20", contact: "Mike Johnson", company: "Consulting LLC", probability: 40, daysInStage: 8 },
  { id: 'd4', title: "Cloud Migration Project", value: "78,000 TND", numericValue: 78000, stage: "Lead", closeDate: "2024-02-15", contact: "Sarah Wilson", company: "DataFlow Inc", probability: 20, daysInStage: 3 },
  { id: 'd5', title: "Security Audit Package", value: "22,000 TND", numericValue: 22000, stage: "Lead", closeDate: "2024-02-01", contact: "Alex Brown", company: "SecureNet", probability: 15, daysInStage: 7 },
  { id: 'd6', title: "ERP Integration", value: "95,000 TND", numericValue: 95000, stage: "Proposal", closeDate: "2024-01-25", contact: "Lisa Chen", company: "MegaCorp", probability: 55, daysInStage: 15 },
  { id: 'd7', title: "Mobile App Development", value: "35,000 TND", numericValue: 35000, stage: "Qualified", closeDate: "2024-02-10", contact: "Tom Davis", company: "AppVenture", probability: 45, daysInStage: 4 },
  { id: 'd8', title: "Data Analytics Platform", value: "60,000 TND", numericValue: 60000, stage: "Negotiation", closeDate: "2024-01-18", contact: "Emma White", company: "Insight Labs", probability: 75, daysInStage: 9 },
  { id: 'd9', title: "Website Redesign", value: "18,000 TND", numericValue: 18000, stage: "Closed Won", closeDate: "2024-01-05", contact: "Ryan Lee", company: "BrandUp", probability: 100, daysInStage: 0 },
  { id: 'd10', title: "API Integration Suite", value: "28,000 TND", numericValue: 28000, stage: "Closed Won", closeDate: "2024-01-08", contact: "Nina Patel", company: "ConnectX", probability: 100, daysInStage: 0 },
  { id: 'd11', title: "IT Infrastructure Upgrade", value: "52,000 TND", numericValue: 52000, stage: "Lead", closeDate: "2024-03-01", contact: "Omar Hassan", company: "BuildTech", probability: 10, daysInStage: 2 },
  { id: 'd12', title: "Training Program", value: "15,000 TND", numericValue: 15000, stage: "Qualified", closeDate: "2024-02-20", contact: "Diana Ross", company: "LearnPro", probability: 35, daysInStage: 6 },
];

const listDeals: Deal[] = kanbanDeals.slice(0, 5).map((d, i) => ({
  id: i + 1,
  title: d.title,
  value: d.value,
  stage: d.stage,
  closeDate: d.closeDate,
  contact: d.contact,
  company: d.company,
}));

const stages = [
  { name: "Lead", count: kanbanDeals.filter(d => d.stage === "Lead").length },
  { name: "Qualified", count: kanbanDeals.filter(d => d.stage === "Qualified").length },
  { name: "Proposal", count: kanbanDeals.filter(d => d.stage === "Proposal").length },
  { name: "Negotiation", count: kanbanDeals.filter(d => d.stage === "Negotiation").length },
  { name: "Closed Won", count: kanbanDeals.filter(d => d.stage === "Closed Won").length },
];

export function DealsModule() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  return (
    <PluginGate code="PL0003DEALS">
      <div className="flex flex-col h-full">
        <DealsHeader>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('kanban')}
              className={cn(
                "h-7 px-2.5 gap-1.5 text-xs font-medium",
                view === 'kanban' && "bg-background shadow-sm text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('list')}
              className={cn(
                "h-7 px-2.5 gap-1.5 text-xs font-medium",
                view === 'list' && "bg-background shadow-sm text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
          </div>
        </DealsHeader>

        {view === 'kanban' ? (
          <div className="flex-1 p-4 overflow-hidden">
            <KanbanBoard initialDeals={kanbanDeals} />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <RevenueStats />
            <PipelineOverview stages={stages} />
            <ActiveDealsList deals={listDeals} />
          </div>
        )}
      </div>
      </PluginGate>
  );
}
