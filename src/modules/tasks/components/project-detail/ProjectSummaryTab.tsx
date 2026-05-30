import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, Wrench, Truck, Activity, Briefcase } from 'lucide-react';

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

interface ProjectLinks {
  offers?: LinkedEntity[];
  sales?: LinkedEntity[];
  serviceOrders?: LinkedEntity[];
  dispatches?: LinkedEntity[];
}

interface Props {
  project: any;
  projectLinks: ProjectLinks | null;
}

const Stat = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className="text-2xl font-semibold leading-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
      </div>
    </div>
  </Card>
);

export function ProjectSummaryTab({ project, projectLinks }: Props) {
  const { t } = useTranslation('tasks');

  const offers = projectLinks?.offers ?? [];
  const sales = projectLinks?.sales ?? [];
  const serviceOrders = projectLinks?.serviceOrders ?? [];
  const deals = sales.filter((s) => s.isDeal);

  const offersTotal = offers.reduce((s, o) => s + (o.amount ?? 0), 0);
  const dealsTotal = deals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const winRate = offers.length > 0 ? Math.round((deals.length / offers.length) * 100) : 0;

  const openServiceOrders = serviceOrders.filter(
    (so) => so.status && !['completed', 'closed', 'invoiced', 'cancelled'].includes(so.status),
  ).length;

  const latest = [...offers, ...sales, ...serviceOrders]
    .filter((x) => x.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          {t('projects.detail.summary.title')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={FileText} label={t('projects.detail.tabs.offers')} value={offers.length} sub={`${offersTotal.toFixed(2)} ${t('projects.detail.summary.total')}`} />
          <Stat icon={CheckCircle2} label={t('projects.detail.tabs.deals')} value={deals.length} sub={`${dealsTotal.toFixed(2)} ${t('projects.detail.summary.won')}`} />
          <Stat icon={Wrench} label={t('projects.detail.summary.serviceOrders')} value={serviceOrders.length} sub={`${openServiceOrders} ${t('projects.detail.summary.open')}`} />
          <Stat icon={Activity} label={t('projects.detail.summary.winRate')} value={`${winRate}%`} sub={`${deals.length}/${offers.length || 0}`} />
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {t('projects.detail.summary.overallStatus')}
          </h4>
          <Badge variant="outline">{project?.status ?? '-'}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">{t('projects.detail.summary.kind')}</div>
            <div className="font-medium">{project?.type ?? project?.projectKind ?? '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('projects.detail.summary.priority')}</div>
            <div className="font-medium">{project?.priority ?? '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('projects.detail.summary.contact')}</div>
            <div className="font-medium truncate">{project?.contactName ?? '-'}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-3">{t('projects.detail.summary.recentActivity')}</h4>
        {latest.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('projects.detail.summary.noActivity')}</div>
        ) : (
          <ul className="space-y-2">
            {latest.map((it) => (
              <li key={`${it.entityType}-${it.entityId}`} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-xs uppercase">{it.entityType.replace('_', ' ')}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{it.number}</span>
                  <span className="truncate">{it.title}</span>
                  {it.isDeal && <Badge className="text-xs bg-primary/15 text-primary border-primary/30">{t('projects.detail.deals.badge')}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {it.date ? new Date(it.date).toLocaleDateString() : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
