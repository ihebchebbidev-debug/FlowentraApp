import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyValue } from "@/lib/formatters";
import { DEAL_STAGES, stageColor } from "../lib/dealStages";
import { type Deal, type DealStage } from "@/services/api/dealsApi";

interface Props {
  deals: Deal[];
  onOpen: (d: Deal) => void;
  /** Preferred: parent-supplied optimistic stage updater (from useDeals). */
  onMove: (dealId: number, stage: DealStage) => void;
}

/**
 * Lightweight kanban: drag a card onto a column to change its stage.
 * The parent owns the deal list and applies the change optimistically,
 * so the card visually moves immediately without waiting for the network.
 *
 * Column totals: only render a sum when every deal in the column shares
 * the same currency. Mixing e.g. USD + EUR into one number labeled with
 * the default currency was silently misleading.
 */
export function DealsKanbanView({ deals, onOpen, onMove }: Props) {
  const { t } = useTranslation("deals");

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {DEAL_STAGES.map(stage => {
        const items = deals.filter(d => d.stage === stage.id);
        const currencies = new Set(items.map(d => d.currency || "").filter(Boolean));
        const singleCurrency = currencies.size === 1 ? [...currencies][0] : undefined;
        const total = singleCurrency
          ? items.reduce((sum, d) => sum + (d.estimatedValue || 0), 0)
          : null;

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const id = Number(e.dataTransfer.getData("text/deal-id"));
              if (id) onMove(id, stage.id);
            }}
          >
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                <span className="text-sm font-medium">{t(`stages.${stage.id}`)}</span>
                <Badge variant="secondary" className="h-5">{items.length}</Badge>
              </div>
              {total !== null ? (
                <span className="text-xs text-muted-foreground">{formatCurrencyValue(total, singleCurrency)}</span>
              ) : items.length > 0 ? (
                <span className="text-xs text-muted-foreground italic" title={t("kanban.mixedCurrencies", { defaultValue: "Mixed currencies" })}>—</span>
              ) : null}
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
