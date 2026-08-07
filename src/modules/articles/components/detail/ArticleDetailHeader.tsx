import { ArrowLeft, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ArticleDetailHeader({
  article,
  adjustmentType,
  setAdjustmentType,
  stockAdjustment,
  setStockAdjustment,
  adjustmentReason,
  setAdjustmentReason,
  onAdjust,
  onTransfer,
  onEdit,
}: {
  article: any;
  adjustmentType: "add" | "remove";
  setAdjustmentType: (v: "add" | "remove") => void;
  stockAdjustment: string;
  setStockAdjustment: (v: string) => void;
  adjustmentReason: string;
  setAdjustmentReason: (v: string) => void;
  onAdjust: () => void;
  onTransfer: () => void;
  onEdit?: () => void;
}) {
  const { t } = useTranslation('articles');
  return (
    <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/inventory-services" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back_to_articles')}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border border-border/50">
              <DropdownMenuItem className="gap-2" onClick={onEdit}>
                <Edit className="h-4 w-4" />
                Edit Article
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                Adjust Stock
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={onTransfer}>
                Transfer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Delete Article
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shadow-medium border-2 border-background">
              <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
                AR
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground mb-1">
                {article.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {t("fields.sku")}: {article.sku} • {article.category}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">{t("fields.stock")}: {article.stock}</Badge>
                <Badge variant="outline" className="text-xs">{article.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-background/80">
              <Link to="/dashboard/inventory-services">
                <ArrowLeft className="h-4 w-4" />
                {t('detail.back_to_articles')}
              </Link>
            </Button>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 shadow-strong border-4 border-background">
                <AvatarFallback className="text-xl bg-gradient-primary text-primary-foreground">
                  AR
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {article.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {t("fields.sku")}: {article.sku} • {article.category}
                </p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1">{t("fields.stock")}: {article.stock} {t("fields.units")}</Badge>
                  <Badge variant="outline" className="px-3 py-1">{article.status}</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-background/80 border-border/50">
                  Adjust Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle>Adjust Stock Level</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Current Stock: {article.stock} units</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={adjustmentType === 'add' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAdjustmentType('add')}
                        className="flex-1"
                      >
                        Add
                      </Button>
                      <Button
                        variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAdjustmentType('remove')}
                        className="flex-1"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Enter quantity"
                      value={stockAdjustment}
                      onChange={(e) => setStockAdjustment(e.target.value)}
                      min="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for adjustment..."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={onAdjust} className="w-full">
                    {adjustmentType === 'add' ? 'Add' : 'Remove'} Stock
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={onTransfer} className="gap-2 hover:bg-background/80 border-border/50">
              Transfer
            </Button>
            <Button variant="outline" size="sm" className="gap-2 hover:bg-background/80 border-border/50" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
