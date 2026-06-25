import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { Edit, Eye, MoreVertical, Package, Trash2, ArrowRightLeft, Warehouse, Clock, DollarSign } from "lucide-react";
import { getStatusColor, getStatusIcon } from "./utils";
import { TableRowActions } from '@/shared/components/TableRowActions';

export function ArticlesListView({
  items,
  onView,
  onEdit,
  onTransfer,
}: {
  items: any[];
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onTransfer: (item: any) => void;
}) {
  const { t } = useTranslation('articles');
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <Card className="shadow-card border-0 bg-card">
        
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.map((article) => {
              const StatusIcon = getStatusIcon(article.status);
              return (
                <div
                  key={article.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50"
                  onClick={() => onView(article)}
                >
                  {/* Header: icon + name + status */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">
                          {article.name}
                        </p>
                        <Badge className={`${getStatusColor(article.status)} text-[10px] px-2 py-0.5 shrink-0 font-medium flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {article.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {article.sku} {article.category ? `• ${article.category}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-12 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Warehouse className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                      <span>{article.location || t('fields.no_location', 'No location')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <span className="text-muted-foreground font-normal">{t('fields.stock')}:</span>
                      <span>{article.stock ?? 0} {t('fields.units')}</span>
                    </div>
                  </div>

                  {/* Footer: price + actions */}
                  <div className="flex items-center justify-between pl-12" onClick={e => e.stopPropagation()}>
                    <span className="text-sm font-semibold text-primary">{article.sellPrice} TND</span>
                    <div>
                      <TableRowActions actions={[
                        { icon: Eye, label: t('actions.view_details'), onClick: (e) => { e.stopPropagation(); onView(article); } },
                        { icon: Edit, label: t('actions.edit_article'), onClick: (e) => { e.stopPropagation(); onEdit(article); } },
                        { icon: ArrowRightLeft, label: t('actions.transfer'), onClick: (e) => { e.stopPropagation(); onTransfer(article); } },
                        { icon: Trash2, label: t('actions.delete'), onClick: (e) => { e.stopPropagation(); }, variant: 'destructive' }
                      ]} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
