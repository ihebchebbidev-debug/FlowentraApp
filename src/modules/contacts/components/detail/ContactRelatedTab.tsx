import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  Wrench, 
  FileText, 
  ShoppingCart, 
  ClipboardList,
  ExternalLink,
  Calendar,
  Loader2,
  Plus
} from "lucide-react";
import { format } from "date-fns";

interface RelatedRecord {
  id: number | string;
  number?: string;
  title?: string;
  status: string;
  date?: string;
  amount?: number;
}

interface ContactRelatedTabProps {
  contactId: number;
  type: 'installations' | 'offers' | 'sales' | 'serviceOrders';
  records: RelatedRecord[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary border-primary/20',
  accepted: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  in_progress: 'bg-warning/10 text-warning border-warning/20',
  won: 'bg-success/10 text-success border-success/20',
  lost: 'bg-destructive/10 text-destructive border-destructive/20',
  negotiation: 'bg-warning/10 text-warning border-warning/20',
  open: 'bg-primary/10 text-primary border-primary/20',
  ready_for_planning: 'bg-warning/10 text-warning border-warning/20',
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  invoiced: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted text-muted-foreground',
};

const typeConfig = {
  installations: {
    icon: Wrench,
    basePath: '/dashboard/installations',
    titleKey: 'detail.related.installations',
    createPath: '/dashboard/installations/new',
  },
  offers: {
    icon: FileText,
    basePath: '/dashboard/offers',
    titleKey: 'detail.related.offers',
    createPath: '/dashboard/offers/new',
  },
  sales: {
    icon: ShoppingCart,
    basePath: '/dashboard/sales',
    titleKey: 'detail.related.sales',
    createPath: null, // Sales are created from offers
  },
  serviceOrders: {
    icon: ClipboardList,
    basePath: '/dashboard/field/service-orders',
    titleKey: 'detail.related.service_orders',
    createPath: null, // Service orders are created from sales
  },
};

export function ContactRelatedTab({ 
  contactId, 
  type, 
  records, 
  isLoading 
}: ContactRelatedTabProps) {
  const { t } = useTranslation('contacts');
  const navigate = useNavigate();
  const config = typeConfig[type];
  const Icon = config.icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {t(config.titleKey)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length > 0 ? (
          <div className="space-y-2">
            {records.map((record) => (
              <div 
                key={record.id}
                onClick={() => navigate(`${config.basePath}/${record.id}`)}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">
                      {record.number || record.title || `#${record.id}`}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize ${statusColors[record.status] || ''}`}
                    >
                      {record.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {record.date && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.date), 'PPP')}
                    </div>
                  )}
                </div>
                {record.amount !== undefined && record.amount > 0 && (
                  <div className="text-right mr-4">
                    <span className="font-semibold">
                      {new Intl.NumberFormat('fr-TN', { 
                        style: 'currency', 
                        currency: 'TND' 
                      }).format(record.amount)}
                    </span>
                  </div>
                )}
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t('detail.related.no_records')}</h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
