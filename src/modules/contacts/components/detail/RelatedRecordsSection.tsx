import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  FileText, 
  ShoppingCart, 
  ClipboardList,
  ExternalLink,
  Calendar,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface RelatedRecord {
  id: number | string;
  number?: string;
  title?: string;
  status: string;
  date?: string;
  amount?: number;
}

interface RelatedRecordsSectionProps {
  contactId: number;
  installations?: RelatedRecord[];
  offers?: RelatedRecord[];
  sales?: RelatedRecord[];
  serviceOrders?: RelatedRecord[];
  isLoading?: boolean;
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
};

function RecordCard({ 
  icon: Icon, 
  title, 
  records, 
  onViewAll, 
  basePath,
  numberField = 'number'
}: { 
  icon: React.ElementType;
  title: string;
  records: RelatedRecord[];
  onViewAll?: () => void;
  basePath: string;
  numberField?: string;
}) {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
            {records.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {records.length}
              </Badge>
            )}
          </CardTitle>
          {records.length > 3 && onViewAll && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {records.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No records found</p>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 3).map((record) => (
              <div 
                key={record.id}
                onClick={() => navigate(`${basePath}/${record.id}`)}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {record[numberField as keyof RelatedRecord] || record.title || `#${record.id}`}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] capitalize ${statusColors[record.status] || ''}`}
                    >
                      {record.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {record.date && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RelatedRecordsSection({
  contactId,
  installations = [],
  offers = [],
  sales = [],
  serviceOrders = [],
  isLoading = false
}: RelatedRecordsSectionProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <ContentSkeleton rows={3} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RecordCard
        icon={Wrench}
        title="Installations"
        records={installations}
        basePath="/dashboard/installations"
        onViewAll={() => navigate(`/dashboard/installations?contactId=${contactId}`)}
      />
      <RecordCard
        icon={FileText}
        title="Offers"
        records={offers}
        basePath="/dashboard/offers"
        numberField="number"
        onViewAll={() => navigate(`/dashboard/offers?contactId=${contactId}`)}
      />
      <RecordCard
        icon={ShoppingCart}
        title="Sales Orders"
        records={sales}
        basePath="/dashboard/sales"
        numberField="number"
        onViewAll={() => navigate(`/dashboard/sales?contactId=${contactId}`)}
      />
      <RecordCard
        icon={ClipboardList}
        title="Service Orders"
        records={serviceOrders}
        basePath="/dashboard/service-orders"
        numberField="number"
        onViewAll={() => navigate(`/dashboard/service-orders?contactId=${contactId}`)}
      />
    </div>
  );
}
