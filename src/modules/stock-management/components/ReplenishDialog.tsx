import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { articlesApi } from '@/services/api/articlesApi';
import { stockTransactionsApi } from '@/services/api/stockTransactionsApi';
import { lowStockNotificationService } from '@/services/lowStockNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import type { MaterialStock } from '../types';

interface ReplenishDialogProps {
  material: MaterialStock | null;
  type: 'add' | 'remove';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReplenishDialog({ material, type, open, onOpenChange }: ReplenishDialogProps) {
  const { t } = useTranslation('stock-management');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>(type);
  const [quantity, setQuantity] = useState('');

  // Sync activeTab when type prop changes
  useEffect(() => {
    setActiveTab(type);
  }, [type, open]);
  const [notes, setNotes] = useState('');

  const updateMutation = useMutation({
    mutationFn: async ({ id, newStock, previousStock }: { id: string; newStock: number; previousStock: number; qty: number }) => {
      const request = {
        articleId: parseInt(id),
        quantity: parseInt(quantity),
        reason: activeTab === 'add' ? 'Manual stock addition' : 'Manual stock removal',
        notes: notes || undefined,
      };

      console.log('[ReplenishDialog] Calling stock transaction API:', request);

      try {
        const transaction = activeTab === 'add' 
          ? await stockTransactionsApi.addStock(request)
          : await stockTransactionsApi.removeStock(request);
        
        console.log('[ReplenishDialog] Transaction created successfully:', transaction);
        return { 
          newStock: transaction.newStock, 
          previousStock: transaction.previousStock,
          transactionCreated: true 
        };
      } catch (error: any) {
        // Log the actual error for debugging
        console.error('[ReplenishDialog] Stock transaction API failed:', error?.message || error);
        console.log('[ReplenishDialog] Falling back to direct article update (no transaction history will be recorded)');
        
        // Fallback: Update article stock directly via articles API
        await articlesApi.update(id, { stock: newStock });
        
        // Show warning that history won't be available
        toast.warning(t('replenish.history_warning', 'Stock updated but transaction history unavailable'), {
          description: t('replenish.history_warning_desc', 'The stock transaction service is temporarily unavailable.')
        });
        
        return { newStock, previousStock, transactionCreated: false };
      }
    },
    onSuccess: async (variables) => {
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      // Invalidate both general and specific article transaction queries
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      if (material) {
        queryClient.invalidateQueries({ queryKey: ['stock-transactions', parseInt(material.id)] });
      }
      const qty = parseInt(quantity);
      
      // Get the user ID for notifications (fallback to 1 for admin)
      const userId = user?.id ? Number(user.id) : 1;
      
      if (activeTab === 'add') {
        toast.success(t('replenish.success'), {
          description: t('replenish.success_add', { count: qty, name: material?.name }),
        });
        
        // If stock was low and is now replenished above minimum, send replenished notification
        if (material && variables.previousStock <= material.minStock && variables.newStock > material.minStock) {
          await lowStockNotificationService.createStockReplenishedNotification({
            articleId: material.id,
            articleName: material.name,
            newStock: variables.newStock,
            userId,
          });
        }
      } else {
        toast.success(t('replenish.success'), {
          description: t('replenish.success_remove', { count: qty, name: material?.name }),
        });
        
        // Check if stock dropped below minimum - send low stock notification
        if (material && variables.newStock <= material.minStock) {
          await lowStockNotificationService.createLowStockNotification({
            articleId: material.id,
            articleName: material.name,
            stock: variables.newStock,
            minStock: material.minStock,
            userId,
          });
        }
      }
      handleClose();
    },
    onError: (error) => {
      console.error('Stock update failed:', error);
      toast.error(t('replenish.error'), {
        description: t('replenish.error_message'),
      });
    },
  });

  const handleClose = () => {
    setQuantity('');
    setNotes('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!material || !quantity) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const newStock = activeTab === 'add' 
      ? material.stock + qty 
      : Math.max(0, material.stock - qty);

    updateMutation.mutate({ id: material.id, newStock, previousStock: material.stock, qty });
  };

  if (!material) return null;

  const isValid = quantity && parseInt(quantity) > 0;
  const canRemove = activeTab === 'remove' ? material.stock > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('replenish.title')} - {material.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'add' | 'remove')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('replenish.add_stock')}
            </TabsTrigger>
            <TabsTrigger value="remove" className="gap-2" disabled={material.stock <= 0}>
              <Minus className="h-4 w-4" />
              {t('replenish.remove_stock')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {/* Current Stock Info */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">{t('card.current')}</span>
              <span className="text-lg font-bold text-foreground">{material.stock}</span>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('replenish.quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={activeTab === 'remove' ? material.stock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t('replenish.quantity_placeholder')}
              />
            </div>


            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('replenish.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('replenish.notes_placeholder')}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                {t('replenish.cancel')}
              </Button>
              <Button
                className="flex-1"
                variant={activeTab === 'remove' ? 'destructive' : 'default'}
                onClick={handleSubmit}
                disabled={!isValid || !canRemove || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : activeTab === 'add' ? (
                  <Plus className="h-4 w-4 mr-2" />
                ) : (
                  <Minus className="h-4 w-4 mr-2" />
                )}
                {activeTab === 'add' ? t('replenish.confirm_add') : t('replenish.confirm_remove')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
