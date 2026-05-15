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
                  className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => onView(article)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                          <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-foreground text-sm sm:text-base break-words line-clamp-2">{article.name}</h3>
                          </div>
                          <Badge className={`${getStatusColor(article.status)} text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {article.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                          <span className="break-words line-clamp-1">{t("fields.sku")}: {article.sku} - {article.category}</span>
                          <span className="text-xs">{t("fields.stock")}: {article.stock} {t("fields.units")}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Warehouse className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{article.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{article.sellPrice} TND</span>
                          </div>
                          <div className="hidden sm:flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{t("fields.last")}: {article.lastUsed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                      <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {article.lastUsedBy}
                        </Badge>
                      </div>
                      
                      <div onClick={(e) => e.stopPropagation()}>
                        <TableRowActions actions={[
                          { icon: Eye, label: t('actions.view_details'), onClick: (e) => { e.stopPropagation(); onView(article); } },
                          { icon: Edit, label: t('actions.edit_article'), onClick: (e) => { e.stopPropagation(); onEdit(article); } },
                          { icon: ArrowRightLeft, label: t('actions.transfer'), onClick: (e) => { e.stopPropagation(); onTransfer(article); } },
                          { icon: Trash2, label: t('actions.delete'), onClick: (e) => { e.stopPropagation(); }, variant: 'destructive' }
                        ]} />
                      </div>
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
