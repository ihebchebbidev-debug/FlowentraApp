import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, CheckCircle2, Plus, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dealsApi } from '@/services/api/dealsApi';

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
  projectId?: number | string | null;
}

/**
 * Renders the offers of a project (mode="offers") or its deals (mode="deals").
 *
 * In deals mode it merges TWO sources so nothing is lost during the migration to
 * the dedicated Deals module:
 *  - new Deals entity records linked to this project (Deal.projectId)  → /dashboard/deals/:id
 *  - legacy "won deals" = Sales flagged isDeal in the project links    → /dashboard/sales/:id
 */
export function ProjectOffersTab({ projectLinks, mode = 'offers', sales, projectId }: ProjectOffersTabProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const isDeals = mode === 'deals';

  const [newDeals, setNewDeals] = useState<LinkedEntity[]>([]);

  // Pull deals from the dedicated module that belong to this project.
  useEffect(() => {
    if (!isDeals || projectId == null) return;
    let cancelled = false;
    dealsApi
      .getAll({ projectId: Number(projectId), limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setNewDeals(
          res.deals.map((d) => ({
            entityType: 'deal',
            entityId: d.id,
            number: d.dealNumber || `DEAL-${d.id}`,
            title: d.title,
            status: d.stage,
            date: d.expectedCloseDate,
            isDeal: true,
            amount: d.estimatedValue,
          })),
        );
      })
      .catch(() => { if (!cancelled) setNewDeals([]); });
    return () => { cancelled = true; };
  }, [isDeals, projectId]);

  const legacyDeals = (sales ?? []).filter((s) => s.isDeal);
  const items: LinkedEntity[] = isDeals ? [...newDeals, ...legacyDeals] : projectLinks?.offers ?? [];

  const emptyKey = isDeals ? 'projects.detail.deals.empty' : 'projects.detail.offers.empty';
  const titleKey = isDeals ? 'projects.detail.deals.title' : 'projects.detail.offers.title';

  const handleOpen = (it: LinkedEntity) => {
    const path =
      it.entityType === 'deal' ? `/dashboard/deals/${it.entityId}`
      : it.entityType === 'sale' ? `/dashboard/sales/${it.entityId}`
      : `/dashboard/offers/${it.entityId}`;
    navigate(path);
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {isDeals ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
          {t(titleKey)}
          <Badge variant="secondary">{items.length}</Badge>
        </h3>
        <div className="flex items-center gap-3">
          {totalAmount > 0 && (
            <div className="text-sm text-muted-foreground">
              {t('projects.detail.offers.total')}: <span className="font-semibold text-foreground">{totalAmount.toFixed(2)}</span>
            </div>
          )}
          {isDeals ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/dashboard/deals/add${projectId != null ? `?projectId=${projectId}` : ''}`)}
            >
              <Plus className="h-4 w-4" /> {t('projects.detail.deals.add', 'New deal')}
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/dashboard/offers/add${projectId != null ? `?projectId=${projectId}` : ''}`)}
            >
              <Plus className="h-4 w-4" /> {t('projects.detail.offers.add', 'New offer')}
            </Button>
          )}
        </div>
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
                    {it.status && <Badge variant="outline" className="text-xs capitalize">{it.status}</Badge>}
                    {it.entityType === 'deal' && (
                      <Badge className="text-xs bg-primary/15 text-primary border-primary/30 gap-1">
                        <Handshake className="h-3 w-3" /> {t('projects.detail.deals.badge')}
                      </Badge>
                    )}
                    {it.entityType === 'sale' && isDeals && (
                      <Badge variant="secondary" className="text-xs">{t('projects.detail.deals.legacyBadge', 'Won')}</Badge>
                    )}
                  </div>
                  <div className="font-medium truncate">{it.title}</div>
                </div>
                <div className="text-right shrink-0">
                  {it.amount != null && <div className="font-semibold">{it.amount.toFixed(2)}</div>}
                  {it.date && (
                    <div className="text-xs text-muted-foreground">{new Date(it.date).toLocaleDateString()}</div>
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
