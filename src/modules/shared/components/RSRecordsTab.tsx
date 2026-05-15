// RS Records Tab for Offer/Sale Detail - Connected to backend API
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, MoreVertical, Trash2, Edit, FileDown, Receipt, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RSRecordModal } from './RSRecordModal';
import { TEJExportModal } from './TEJExportModal';
import {
  fetchRSRecords,
  deleteRSRecord as deleteRSRecordApi,
  type RSRecordDto,
} from '@/modules/shared/services/rsApiService';

interface RSRecordsTabProps {
  entityType: 'offer' | 'sale';
  entityId: string;
  entityNumber?: string;
  entityAmount: number;
  contactName?: string;
  contactTaxId?: string;
  contactAddress?: string;
  currency?: string;
}

export function RSRecordsTab({
  entityType,
  entityId,
  entityNumber,
  entityAmount,
  contactName,
  contactTaxId,
  contactAddress,
  currency = 'TND',
}: RSRecordsTabProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<RSRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRecord, setEditRecord] = useState<RSRecordDto | null>(null);
  const [showTEJExport, setShowTEJExport] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchRSRecords({
        entityType,
        entityId: Number(entityId),
        limit: 100,
      });
      setRecords(result.records || []);
    } catch (err: any) {
      console.error('Failed to load RS records:', err);
      toast.error(t('rs.loadError', 'Erreur lors du chargement des enregistrements RS'));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (id: number) => {
    try {
      await deleteRSRecordApi(id);
      toast.success(t('rs.recordDeleted', 'Enregistrement RS supprimé'));
      loadRecords();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalRS = records.reduce((sum, r) => sum + r.rsAmount, 0);
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const exportedCount = records.filter(r => r.tejExported).length;

  const getRSTypeLabel = (code: string) => {
    const labels: Record<string, string> = {
      '10': t('rs.type10', 'Honoraires / Services (10%)'),
      '05': t('rs.type05', 'Services exportés (0.5%)'),
      '03': t('rs.type03', 'Certains honoraires (3%)'),
      '20': t('rs.type20', 'Redevances / Intérêts (20%)'),
    };
    return labels[code] || code;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('rs.totalRecords', 'Total enregistrements')}</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('rs.totalRSAmount', 'Total RS')}</p>
            <p className="text-2xl font-bold text-destructive">{totalRS.toFixed(2)} {currency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('rs.pending', 'En attente')}</p>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('rs.exported', 'Exporté')}</p>
            <p className="text-2xl font-bold text-primary">{exportedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {t('rs.retenuRecords', 'Enregistrements Retenue à la Source')}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTEJExport(true)} disabled={records.length === 0} className="gap-2">
            <FileDown className="h-4 w-4" />
            {t('rs.exportTEJ', 'Exporter TEJ XML')}
          </Button>
          <Button size="sm" onClick={() => { setEditRecord(null); setShowAddModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('rs.addRS', 'Ajouter RS')}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('rs.noRecords', 'Aucun enregistrement de Retenue à la Source. Cliquez sur "Ajouter RS" pour calculer et enregistrer la retenue à la source pour les paiements liés à ce document.')}
          </AlertDescription>
        </Alert>
      )}

      {/* Records Table */}
      {!loading && records.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('rs.invoiceNo', 'N° Facture')}</TableHead>
                  <TableHead>{t('rs.supplier', 'Fournisseur')}</TableHead>
                  <TableHead>{t('rs.paymentDate', 'Date paiement')}</TableHead>
                  <TableHead className="text-right">{t('rs.amountPaid', 'Montant payé')}</TableHead>
                  <TableHead className="text-right">{t('rs.rsAmount', 'Montant RS')}</TableHead>
                  <TableHead>{t('rs.rsType', 'Type')}</TableHead>
                  <TableHead>{t('rs.status', 'Statut')}</TableHead>
                  <TableHead className="text-center">⚠️ {t('rs.compliance', 'Conformité')}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{record.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{record.supplierTaxId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(record.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{record.amountPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{record.rsAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{getRSTypeLabel(record.rsTypeCode)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.tejExported ? 'default' : 'secondary'}>
                        {record.tejExported ? t('rs.exported', 'Exporté') : t('rs.pending', 'En attente')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {record.isOverdue ? (
                        <Badge variant="destructive">⚠️ {record.daysLate}j tard</Badge>
                      ) : record.declarationDeadline ? (
                        <Badge variant="outline">📅 {new Date(record.declarationDeadline).toLocaleDateString()}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditRecord(record); setShowAddModal(true); }} className="gap-2">
                            <Edit className="h-4 w-4" />
                            {t('edit', 'Modifier')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(record.id)}
                            className="gap-2 text-destructive"
                            disabled={record.tejExported}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('delete', 'Supprimer')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit RS Modal */}
      <RSRecordModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        entityType={entityType}
        entityId={entityId}
        entityNumber={entityNumber}
        entityAmount={entityAmount}
        contactName={contactName}
        contactTaxId={contactTaxId}
        contactAddress={contactAddress}
        editRecord={editRecord}
        onSuccess={loadRecords}
      />

      {/* TEJ Export Modal */}
      <TEJExportModal
        open={showTEJExport}
        onOpenChange={setShowTEJExport}
        entityType={entityType}
        entityId={Number(entityId)}
        onExportComplete={loadRecords}
      />
    </div>
  );
}
