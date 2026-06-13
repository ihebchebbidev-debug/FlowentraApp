import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrencyValue } from "@/lib/formatters";
import { DEAL_STAGES, stageColor } from "../lib/dealStages";
import { dealsApi, type Deal, type DealStage } from "@/services/api/dealsApi";

interface Props {
  deals: Deal[];
  onOpen: (d: Deal) => void;
  onRefetch: () => void;
}

/** Lightweight kanban: drag a card onto a column to change its stage. */
export function DealsKanbanView({ deals, onOpen, onRefetch }: Props) {
  const { t } = useTranslation("deals");

  const move = async (dealId: number, stage: DealStage) => {
    try {
      await dealsApi.update(dealId, { stage });
      onRefetch();
    } catch {
      toast.error(t("toast.saveError"));
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {DEAL_STAGES.map(stage => {
        const items = deals.filter(d => d.stage === stage.id);
        const total = items.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const id = Number(e.dataTransfer.getData("text/deal-id"));
              if (id) move(id, stage.id);
            }}
          >
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                <span className="text-sm font-medium">{t(`stages.${stage.id}`)}</span>
                <Badge variant="secondary" className="h-5">{items.length}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{formatCurrencyValue(total)}</span>
            </div>
            <div className="space-y-2 min-h-[40px]">
              {items.map(d => (
                <Card
                  key={d.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData("text/deal-id", String(d.id))}
                  onClick={() => onOpen(d)}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-2"
                  style={{ borderLeftColor: stageColor(d.stage) }}
                >
                  <p className="font-medium text-sm line-clamp-2">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.contactName || d.contact?.name || "—"}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold">{formatCurrencyValue(d.estimatedValue, d.currency)}</span>
                    <span className="text-xs text-muted-foreground">{d.probability}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DealsKanbanView;
