import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LinkedEntity {
  entityType: string;
  entityId: number;
  number: string;
  title: string;
  status?: string;
  date?: string;
  isDeal?: boolean;
  amount?: number;
}

interface ProjectOffersTabProps {
  projectLinks: { offers?: LinkedEntity[] } | null;
  mode?: 'offers' | 'deals';
  sales?: LinkedEntity[];
}

/**
 * Renders the offers of a project (mode="offers") or the won-deals (mode="deals").
 * Pure presentation: data comes from the already-fetched projectLinks payload.
 */
export function ProjectOffersTab({ projectLinks, mode = 'offers', sales }: ProjectOffersTabProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();

  const items: LinkedEntity[] =
    mode === 'deals'
      ? (sales ?? []).filter((s) => s.isDeal)
      : projectLinks?.offers ?? [];

  const isDeals = mode === 'deals';
  const emptyKey = isDeals ? 'projects.detail.deals.empty' : 'projects.detail.offers.empty';
  const titleKey = isDeals ? 'projects.detail.deals.title' : 'projects.detail.offers.title';

  const handleOpen = (it: LinkedEntity) => {
    const path = it.entityType === 'sale' ? `/sales/${it.entityId}` : `/offers/${it.entityId}`;
    navigate(path);
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {isDeals ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
          {t(titleKey)}
          <Badge variant="secondary">{items.length}</Badge>
        </h3>
        {totalAmount > 0 && (
          <div className="text-sm text-muted-foreground">
            {t('projects.detail.offers.total')}: <span className="font-semibold text-foreground">{totalAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t(emptyKey)}</Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card
              key={`${it.entityType}-${it.entityId}`}
              className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleOpen(it)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{it.number}</span>
                    {it.status && <Badge variant="outline" className="text-xs">{it.status}</Badge>}
                    {isDeals && <Badge className="text-xs bg-primary/15 text-primary border-primary/30">{t('projects.detail.deals.badge')}</Badge>}
                  </div>
                  <div className="font-medium truncate">{it.title}</div>
                </div>
                <div className="text-right shrink-0">
                  {it.amount != null && (
                    <div className="font-semibold">{it.amount.toFixed(2)}</div>
                  )}
                  {it.date && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(it.date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
