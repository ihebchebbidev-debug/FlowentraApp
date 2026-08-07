import { useTranslation } from 'react-i18next';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, TrendingUp, TrendingDown, ArrowRightLeft, Package, AlertTriangle } from 'lucide-react';
import { useStockTransactions } from '../hooks/useStockTransactions';
import type { MaterialStock } from '../types';
import type { StockTransaction, StockTransactionType } from '../types/stockTransaction';

interface StockHistoryDialogProps {
  material: MaterialStock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTransactionIcon = (type: StockTransactionType) => {
  switch (type) {
    case 'add':
    case 'return':
    case 'transfer_in':
      return <TrendingUp className="h-4 w-4" />;
    case 'remove':
    case 'sale_deduction':
    case 'transfer_out':
    case 'damaged':
    case 'lost':
      return <TrendingDown className="h-4 w-4" />;
    case 'offer_added':
      return <Package className="h-4 w-4" />;
    case 'adjustment':
      return <ArrowRightLeft className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getTransactionColor = (type: StockTransactionType): string => {
  switch (type) {
    case 'add':
    case 'return':
    case 'transfer_in':
      return 'bg-success/10 text-success border-success/20';
    case 'remove':
    case 'sale_deduction':
    case 'transfer_out':
    case 'damaged':
    case 'lost':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'offer_added':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'adjustment':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getQuantityPrefix = (type: StockTransactionType): string => {
  switch (type) {
    case 'add':
    case 'return':
    case 'transfer_in':
      return '+';
    case 'remove':
    case 'sale_deduction':
    case 'transfer_out':
    case 'damaged':
    case 'lost':
      return '-';
    default:
      return '';
  }
};

export function StockHistoryDialog({ material, open, onOpenChange }: StockHistoryDialogProps) {
  const { t } = useTranslation('stock-management');
  
  const articleId = material ? parseInt(material.id) : null;
  const { data: transactions, isLoading } = useStockTransactions(articleId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('history.title')}
            {material && (
              <Badge variant="outline" className="font-normal">
                {material.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <ContentSkeleton rows={5} />
          ) : !transactions || transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('history.no_transactions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  t={t}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface TransactionItemProps {
  transaction: StockTransaction;
  t: (key: string) => string;
}

function TransactionItem({ transaction, t }: TransactionItemProps) {
  const formattedDate = format(new Date(transaction.createdAt), 'dd/MM/yyyy');
  const formattedTime = format(new Date(transaction.createdAt), 'HH:mm');

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className={`p-2 rounded-lg ${getTransactionColor(transaction.transactionType)}`}>
        {getTransactionIcon(transaction.transactionType)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {transaction.performedByName || transaction.performedBy}
          </span>
          <Badge variant="outline" className="text-xs">
            {t(`history.types.${transaction.transactionType}`)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formattedDate} • {formattedTime}
          </span>
        </div>

        {/* Reason */}
        {transaction.reason && (
          <p className="text-sm text-muted-foreground">
            {transaction.reason}
          </p>
        )}

        {/* Reference */}
        {transaction.referenceNumber && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{t(`history.reference_types.${transaction.referenceType || 'manual'}`)}:</span>
            <Badge variant="secondary" className="text-xs font-mono">
              {transaction.referenceNumber}
            </Badge>
          </div>
        )}

        {/* Notes */}
        {transaction.notes && (
          <p className="text-xs text-muted-foreground italic">
            {transaction.notes}
          </p>
        )}
      </div>

      {/* Quantity & Balance */}
      <div className="text-right shrink-0">
        <div className={`text-sm font-semibold ${
          getQuantityPrefix(transaction.transactionType) === '+' 
            ? 'text-success' 
            : getQuantityPrefix(transaction.transactionType) === '-'
            ? 'text-destructive'
            : 'text-foreground'
        }`}>
          {getQuantityPrefix(transaction.transactionType)}{transaction.quantity}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('history.balance')}: {transaction.newStock}
        </div>
        <div className="text-xs text-muted-foreground/70">
          ({t('history.was')}: {transaction.previousStock})
        </div>
      </div>
    </div>
  );
}
