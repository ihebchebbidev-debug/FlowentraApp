import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Eye, Inbox, ChevronLeft, ChevronRight, Wand2, FileText, TrendingUp, User, Mail, Phone, MapPin, Package, Pencil, Plus, X, Building2, Code2 } from 'lucide-react';
import { useEndpointLogs } from '../hooks/useEndpointLogs';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { externalEndpointsApi } from '../services/externalEndpoints.service';
import type { ExternalEndpointLog, ConvertLogPreview, FieldConfidence } from '../types';
import { useMemo } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';

interface Props { endpointId: number; }

// Derive a short human-readable label from a raw Content-Type string.
function formatContentType(ct?: string): { label: string; color: string } | null {
  if (!ct) return null;
  const lower = ct.split(';')[0].trim().toLowerCase();
  if (lower.includes('xml')) return { label: 'XML', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300' };
  if (lower.includes('json')) return { label: 'JSON', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300' };
  if (lower.includes('form')) return { label: 'FORM', color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-300' };
  return { label: lower.split('/').pop() ?? ct, color: 'text-muted-foreground bg-muted border-border' };
}

// Pretty-print body regardless of whether it's JSON or XML.
function formatBody(body?: string, contentType?: string): string {
  if (!body) return '';
  const isXml = contentType?.includes('xml') || body.trimStart().startsWith('<');
  if (isXml) {
    // Simple XML pretty-printer: insert newlines after > and before <.
    try {
      return body
        .replace(/></g, '>\n<')
        .replace(/(<[^/][^>]*>)\n/g, '$1\n  ')
        .trim();
    } catch { return body; }
  }
  try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
}

export function EndpointLogsTable({ endpointId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyFilter, setCompanyFilter] = useState('');
  const { logs, loading, page, setPage, total, deleteLog, clearLogs, markAsRead } = useEndpointLogs(endpointId);

  // Unique company IDs seen in current page — used for the filter dropdown.
  const companyIds = Array.from(new Set(logs.map(l => l.companyId).filter(Boolean) as string[])).sort();
  const filteredLogs = companyFilter ? logs.filter(l => l.companyId === companyFilter) : logs;
  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<ExternalEndpointLog>({
    method: (l) => l.method,
    format: (l) => formatContentType(l.contentType)?.label ?? '',
    company: (l) => l.companyId ?? '',
    statusCode: (l) => l.statusCode,
    receivedAt: (l) => l.receivedAt,
  });
  const sortedLogs = useMemo(() => sortItems(filteredLogs), [filteredLogs, sortItems]);
  const [selectedLog, setSelectedLog] = useState<ExternalEndpointLog | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  // Preview-confirm modal: holds the parsed payload + chosen target so the
  // user can review detected fields before we navigate to the create form.
  const [previewState, setPreviewState] = useState<{
    log: ExternalEndpointLog;
    target: 'offer' | 'sale';
    preview: ConvertLogPreview;
  } | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Helper: mutate the in-modal preview while editing. Any field the user
  // changes flips its confidence to "edited" so the badge accurately reflects
  // the source. Item-level edits set the item's own confidence to "edited".
  const updatePreview = (patch: Partial<ConvertLogPreview>) =>
    setPreviewState(s => {
      if (!s) return s;
      const confidence = { ...(s.preview.confidence ?? {}) };
      for (const k of Object.keys(patch)) confidence[k] = 'edited';
      return { ...s, preview: { ...s.preview, ...patch, confidence } };
    });

  const updateItem = (idx: number, patch: Partial<NonNullable<ConvertLogPreview['items']>[number]>) =>
    setPreviewState(s => {
      if (!s) return s;
      const items = [...(s.preview.items ?? [])];
      items[idx] = { ...items[idx], ...patch, confidence: 'edited' };
      const confidence = { ...(s.preview.confidence ?? {}), items: 'edited' as const };
      return { ...s, preview: { ...s.preview, items, confidence } };
    });

  const addItem = () =>
    setPreviewState(s => s ? {
      ...s,
      preview: {
        ...s.preview,
        items: [...(s.preview.items ?? []), { description: '', quantity: 1, unitPrice: 0, confidence: 'edited' }],
        confidence: { ...(s.preview.confidence ?? {}), items: 'edited' },
      },
    } : s);

  const removeItem = (idx: number) =>
    setPreviewState(s => s ? {
      ...s,
      preview: {
        ...s.preview,
        items: (s.preview.items ?? []).filter((_, i) => i !== idx),
        confidence: { ...(s.preview.confidence ?? {}), items: 'edited' },
      },
    } : s);

  const totalPages = Math.ceil(total / 20);

  const handleViewLog = async (log: ExternalEndpointLog) => {
    setSelectedLog(log);
    if (!log.isRead) await markAsRead(log.id);
  };

  // Convert: fetch the parsed preview and open the confirmation modal.
  // Navigation to the create form only happens once the user confirms.
  const handleConvert = async (log: ExternalEndpointLog, target: 'offer' | 'sale') => {
    setConvertingId(log.id);
    try {
      const preview = await externalEndpointsApi.convertPreview(endpointId, log.id);
      if (!log.isRead) { try { await markAsRead(log.id); } catch { /* non-fatal */ } }
      setPreviewState({ log, target, preview });
      setEditMode(false);
    } catch (e: any) {
      toast({
        title: t('external.logs.convertError', { defaultValue: 'Could not parse this payload' }),
        description: e?.message,
        variant: 'destructive',
      });
    } finally {
      setConvertingId(null);
    }
  };

  const confirmConvert = () => {
    if (!previewState) return;
    const { target, preview, log } = previewState;
    const path = target === 'offer' ? '/dashboard/offers/add' : '/dashboard/sales/add';
    navigate(path, { state: { prefill: preview, source: { type: 'external-log', endpointId, logId: log.id } } });
    setPreviewState(null);
  };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  if (logs.length === 0) {
    return (
      <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">{t('external.logs.empty')}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('external.logs.emptyDesc')}</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="font-medium text-foreground">{t('external.logs.title')} ({total})</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {companyIds.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
              >
                <option value="">{t('external.logs.allCompanies', 'All companies')}</option>
                {companyIds.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
          )}
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setShowClearDialog(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />{t('external.logs.clearAll')}
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader columnKey="method" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('external.logs.method')}</SortableHeader>
              <SortableHeader columnKey="format" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="hidden sm:table-cell">{t('external.logs.format', 'Format')}</SortableHeader>
              <SortableHeader columnKey="company" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="hidden md:table-cell">{t('external.logs.company', 'Company')}</SortableHeader>
              <SortableHeader columnKey="statusCode" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('external.logs.statusCode')}</SortableHeader>
              <SortableHeader columnKey="receivedAt" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('external.logs.receivedAt')}</SortableHeader>
              <TableHead className="w-[80px]">{t('external.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.map(log => {
              const ctInfo = formatContentType(log.contentType);
              return (
              <TableRow key={log.id} className={!log.isRead ? 'bg-primary/5' : ''}>
                <TableCell><Badge variant="outline">{log.method}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell">
                  {ctInfo
                    ? <span className={`inline-flex items-center gap-1 text-px-10 font-medium border rounded px-1.5 py-0.5 ${ctInfo.color}`}><Code2 className="h-2.5 w-2.5" />{ctInfo.label}</span>
                    : <span className="text-muted-foreground/50 text-xs">—</span>
                  }
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.companyId
                    ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5"><Building2 className="h-3 w-3" />{log.companyId}</span>
                    : <span className="text-muted-foreground/50 text-xs">—</span>
                  }
                </TableCell>
                <TableCell><Badge variant={log.statusCode === 200 ? 'default' : 'destructive'}>{log.statusCode}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(log.receivedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleViewLog(log)} title={t('external.logs.viewDetail')}><Eye className="h-3.5 w-3.5" /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={convertingId === log.id || !log.body}
                          title={t('external.logs.convert', { defaultValue: 'Convert to Offer / Sale' })}
                        >
                          <Wand2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConvert(log, 'offer')}>
                          <FileText className="h-3.5 w-3.5 mr-2" />
                          {t('external.logs.convertToOffer', { defaultValue: 'Convert to Offer' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvert(log, 'sale')}>
                          <TrendingUp className="h-3.5 w-3.5 mr-2" />
                          {t('external.logs.convertToSale', { defaultValue: 'Convert to Sale' })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteLog(log.id)} title={t('external.logs.delete')}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ); })}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('external.logs.viewDetail')}</DialogTitle></DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-4">
                  <div><span className="text-muted-foreground font-medium">{t('external.logs.method')}:</span> <Badge variant="outline" className="ml-1">{selectedLog.method}</Badge></div>
                  <div><Badge variant={selectedLog.statusCode === 200 ? 'default' : 'destructive'}>{selectedLog.statusCode}</Badge></div>
                  {selectedLog.contentType && (() => { const ci = formatContentType(selectedLog.contentType); return ci ? <span className={`inline-flex items-center gap-1 text-px-10 font-medium border rounded px-1.5 py-0.5 ${ci.color}`}><Code2 className="h-2.5 w-2.5" />{ci.label}</span> : null; })()}
                  {selectedLog.companyId && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5"><Building2 className="h-3 w-3" />{t('external.logs.company', 'Company')}: <strong>{selectedLog.companyId}</strong></span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="font-medium">{t('external.logs.sourceIp')}:</span> {selectedLog.sourceIp || '—'}</div>
                  <div><span className="font-medium">{t('external.logs.receivedAt')}:</span> {new Date(selectedLog.receivedAt).toLocaleString()}</div>
                </div>
                {selectedLog.queryString && <div><span className="text-muted-foreground font-medium">{t('external.logs.queryString')}:</span><pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">{selectedLog.queryString}</pre></div>}
                {selectedLog.headers && <div><span className="text-muted-foreground font-medium">{t('external.logs.headers')}:</span><pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto max-h-40">{(() => { try { return JSON.stringify(JSON.parse(selectedLog.headers), null, 2); } catch { return selectedLog.headers; } })()}</pre></div>}
                {selectedLog.body && <div><span className="text-muted-foreground font-medium">{t('external.logs.body')}:</span><pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap break-all">{formatBody(selectedLog.body, selectedLog.contentType)}</pre></div>}
                {selectedLog.responseBody && <div><span className="text-muted-foreground font-medium">{t('external.logs.response')}:</span><pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">{selectedLog.responseBody}</pre></div>}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Logs Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('external.confirm.clearLogs')}</AlertDialogTitle>
            <AlertDialogDescription>{t('external.confirm.clearLogsDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('external.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { clearLogs(); setShowClearDialog(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('external.confirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Preview — confirm detected fields before navigating */}
      <Dialog open={!!previewState} onOpenChange={(o) => { if (!o) { setPreviewState(null); setEditMode(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle>
                {t('external.logs.previewTitle', { defaultValue: 'Preview detected fields' })}
              </DialogTitle>
              {previewState && (
                <Button variant="ghost" size="sm" onClick={() => setEditMode(m => !m)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  {editMode
                    ? t('external.logs.previewDone', { defaultValue: 'Done' })
                    : t('external.logs.previewEdit', { defaultValue: 'Edit' })}
                </Button>
              )}
            </div>
          </DialogHeader>
          {previewState && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 text-sm pr-1">
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {previewState.target === 'offer'
                      ? t('external.logs.previewDescOffer', { defaultValue: 'Review the fields detected from this payload before creating the offer.' })
                      : t('external.logs.previewDescSale', { defaultValue: 'Review the fields detected from this payload before creating the sale.' })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-px-10 text-muted-foreground">
                    <ConfidenceBadge level="exact" /> {t('external.logs.confExact', { defaultValue: 'Direct match' })}
                    <ConfidenceBadge level="inferred" /> {t('external.logs.confInferred', { defaultValue: 'Best guess' })}
                    <ConfidenceBadge level="edited" /> {t('external.logs.confEdited', { defaultValue: 'Manually edited' })}
                  </div>
                </div>

                {/* Contact block */}
                {(() => {
                  const c = previewState.preview.confidence ?? {};
                  return editMode ? (
                    <div className="space-y-2 rounded-md border p-3">
                      <EditField icon={<User className="h-3.5 w-3.5" />} label={t('external.logs.previewContact', { defaultValue: 'Contact' })} value={previewState.preview.contactName ?? ''} onChange={v => updatePreview({ contactName: v })} confidence={c.contactName} />
                      <EditField icon={<Mail className="h-3.5 w-3.5" />} label={t('external.logs.previewEmail', { defaultValue: 'Email' })} value={previewState.preview.email ?? ''} onChange={v => updatePreview({ email: v })} type="email" confidence={c.email} />
                      <EditField icon={<Phone className="h-3.5 w-3.5" />} label={t('external.logs.previewPhone', { defaultValue: 'Phone' })} value={previewState.preview.phone ?? ''} onChange={v => updatePreview({ phone: v })} confidence={c.phone} />
                      <EditField icon={<MapPin className="h-3.5 w-3.5" />} label={t('external.logs.previewAddress', { defaultValue: 'Address' })} value={previewState.preview.address ?? ''} onChange={v => updatePreview({ address: v })} confidence={c.address} />
                    </div>
                  ) : (
                    <div className="rounded-md border divide-y">
                      <PreviewRow icon={<User className="h-3.5 w-3.5" />} label={t('external.logs.previewContact', { defaultValue: 'Contact' })} value={previewState.preview.contactName} confidence={c.contactName} />
                      <PreviewRow icon={<Mail className="h-3.5 w-3.5" />} label={t('external.logs.previewEmail', { defaultValue: 'Email' })} value={previewState.preview.email} confidence={c.email} />
                      <PreviewRow icon={<Phone className="h-3.5 w-3.5" />} label={t('external.logs.previewPhone', { defaultValue: 'Phone' })} value={previewState.preview.phone} confidence={c.phone} />
                      <PreviewRow icon={<MapPin className="h-3.5 w-3.5" />} label={t('external.logs.previewAddress', { defaultValue: 'Address' })} value={previewState.preview.address} confidence={c.address} />
                    </div>
                  );
                })()}

                {/* Items block */}
                <div className="rounded-md border">
                  <div className="px-3 py-2 bg-muted/50 flex items-center justify-between gap-2 font-medium">
                    <span className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5" />
                      {t('external.logs.previewItems', { defaultValue: 'Line items' })} ({previewState.preview.items?.length ?? 0})
                    </span>
                    {editMode && (
                      <Button variant="ghost" size="sm" onClick={addItem}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        {t('external.logs.previewAddItem', { defaultValue: 'Add item' })}
                      </Button>
                    )}
                  </div>
                  {(previewState.preview.items?.length ?? 0) > 0 ? (
                    <div className="divide-y">
                      {previewState.preview.items!.map((it, i) => (
                        editMode ? (
                          <div key={i} className="px-3 py-2 grid grid-cols-12 gap-2 items-center">
                            <Input className="col-span-5 h-8" placeholder={t('external.logs.previewItemDesc', { defaultValue: 'Description' })} value={it.description ?? ''} onChange={e => updateItem(i, { description: e.target.value })} />
                            <Input className="col-span-2 h-8" type="number" min={0} step="any" placeholder="Qty" value={it.quantity ?? ''} onChange={e => updateItem(i, { quantity: e.target.value === '' ? undefined : Number(e.target.value) })} />
                            <Input className="col-span-3 h-8" type="number" min={0} step="any" placeholder="Price" value={it.unitPrice ?? ''} onChange={e => updateItem(i, { unitPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
                            <div className="col-span-1 flex justify-center"><ConfidenceBadge level={it.confidence} /></div>
                            <Button variant="ghost" size="icon-sm" className="col-span-1" onClick={() => removeItem(i)}>
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                            <span className="truncate flex-1">{it.description || '—'}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {it.quantity ?? 1} × {it.unitPrice ?? 0}
                            </span>
                            <ConfidenceBadge level={it.confidence} />
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    !editMode && <div className="px-3 py-3 text-xs text-muted-foreground italic">—</div>
                  )}
                </div>

                {/* Total + currency */}
                {editMode ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">{t('external.logs.previewTotal', { defaultValue: 'Total' })}</label>
                      <Input className="h-8" type="number" min={0} step="any" value={previewState.preview.totalAmount ?? ''} onChange={e => updatePreview({ totalAmount: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">{t('external.logs.previewCurrency', { defaultValue: 'Currency' })}</label>
                      <Input className="h-8" maxLength={8} value={previewState.preview.currency ?? ''} onChange={e => updatePreview({ currency: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  (previewState.preview.totalAmount != null || previewState.preview.currency) && (
                    <div className="flex justify-between items-center font-medium pt-1">
                      <span>{t('external.logs.previewTotal', { defaultValue: 'Total' })}</span>
                      <span className="flex items-center gap-2">
                        <span>{previewState.preview.totalAmount ?? 0} {previewState.preview.currency ?? ''}</span>
                        <ConfidenceBadge level={previewState.preview.confidence?.totalAmount} />
                      </span>
                    </div>
                  )
                )}

                {/* Notes */}
                {editMode ? (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">{t('external.logs.previewNotes', { defaultValue: 'Notes' })}</label>
                    <Textarea rows={2} value={previewState.preview.notes ?? ''} onChange={e => updatePreview({ notes: e.target.value })} />
                  </div>
                ) : (
                  previewState.preview.notes && (
                    <div>
                      <div className="text-muted-foreground font-medium mb-1">{t('external.logs.previewNotes', { defaultValue: 'Notes' })}</div>
                      <p className="text-xs bg-muted p-2 rounded">{previewState.preview.notes}</p>
                    </div>
                  )
                )}

                {!editMode && !previewState.preview.contactName && !previewState.preview.email && (!previewState.preview.items || previewState.preview.items.length === 0) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t('external.logs.previewEmpty', { defaultValue: 'No fields could be detected automatically. You can still continue and fill the form manually.' })}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setPreviewState(null); setEditMode(false); }}>
              {t('external.confirm.cancel')}
            </Button>
            <Button onClick={confirmConvert}>
              {previewState?.target === 'offer'
                ? t('external.logs.previewConfirmOffer', { defaultValue: 'Continue to Offer' })
                : t('external.logs.previewConfirmSale', { defaultValue: 'Continue to Sale' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfidenceBadge({ level }: { level?: FieldConfidence }) {
  if (!level || level === 'none') return null;
  // Color mapping uses semantic tokens via Tailwind utility variants.
  // exact = green, inferred = amber, edited = primary/blue.
  const map: Record<Exclude<FieldConfidence, 'none'>, { label: string; cls: string; title: string }> = {
    exact:    { label: 'Exact',    cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', title: 'Extracted directly from a known field name' },
    inferred: { label: 'Inferred', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',         title: 'Best-guess match from an alternative key' },
    edited:   { label: 'Edited',   cls: 'border-primary/30 bg-primary/10 text-primary',                                   title: 'Manually changed in this preview' },
  };
  const m = map[level];
  return (
    <span title={m.title} className={`inline-flex items-center px-1.5 py-0.5 rounded border text-px-10 font-medium leading-none ${m.cls}`}>
      {m.label}
    </span>
  );
}

function PreviewRow({ icon, label, value, confidence }: { icon: React.ReactNode; label: string; value?: string | null; confidence?: FieldConfidence }) {
  return (
    <div className="px-3 py-2 flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground font-medium w-20 shrink-0">{label}</span>
      <span className="truncate flex-1">{value || <span className="text-muted-foreground italic">—</span>}</span>
      <ConfidenceBadge level={confidence} />
    </div>
  );
}

function EditField({ icon, label, value, onChange, type = 'text', confidence }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string; confidence?: FieldConfidence }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground font-medium w-20 shrink-0 text-xs">{label}</span>
      <Input className="h-8" type={type} value={value} onChange={e => onChange(e.target.value)} />
      <ConfidenceBadge level={confidence} />
    </div>
  );
}
