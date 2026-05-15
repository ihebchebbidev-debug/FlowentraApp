import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formSubmissionsApi, ApiFormSubmission } from '../../services/apiSupportServices';
import { loadSubmissions, exportSubmissionsCSV, FormSubmission, deleteSubmission as deleteLocalSubmission, clearSubmissions as clearLocalSubmissions } from '../../utils/formSubmissions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Search, ChevronDown, ChevronRight, Inbox, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormSubmissionsPanelProps {
  siteId: string;
}

function toExportShape(s: ApiFormSubmission): FormSubmission {
  return {
    id: s.id, siteId: s.siteId, formId: s.formComponentId,
    formLabel: s.formLabel, pageTitle: s.pageTitle, data: s.data,
    submittedAt: s.submittedAt, webhookStatus: s.webhookStatus as any, source: s.source,
  };
}

export function FormSubmissionsPanel({ siteId }: FormSubmissionsPanelProps) {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<ApiFormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await formSubmissionsApi.list(siteId);
      if (res.success && res.data) { setSubmissions(res.data.submissions); }
      else {
        setUseLocalFallback(true);
        const local = loadSubmissions(siteId);
        setSubmissions(local.map(s => ({ id: s.id, siteId: s.siteId, formComponentId: s.formId, formLabel: s.formLabel, pageTitle: s.pageTitle, data: s.data, source: s.source, webhookStatus: s.webhookStatus, submittedAt: s.submittedAt })));
      }
    } catch {
      setUseLocalFallback(true);
      const local = loadSubmissions(siteId);
      setSubmissions(local.map(s => ({ id: s.id, siteId: s.siteId, formComponentId: s.formId, formLabel: s.formLabel, pageTitle: s.pageTitle, data: s.data, source: s.source, webhookStatus: s.webhookStatus, submittedAt: s.submittedAt })));
    } finally { setLoading(false); }
  }, [siteId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const refresh = () => { fetchSubmissions(); toast.success(t('wb:submissions.refreshed')); };

  const formGroups = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    submissions.forEach(s => { const existing = map.get(s.formComponentId); if (existing) { existing.count++; } else { map.set(s.formComponentId, { label: s.formLabel || 'Unknown Form', count: 1 }); } });
    return map;
  }, [submissions]);

  const filtered = useMemo(() => {
    let result = submissions;
    if (selectedForm !== 'all') result = result.filter(s => s.formComponentId === selectedForm);
    if (search) { const q = search.toLowerCase(); result = result.filter(s => JSON.stringify(s.data).toLowerCase().includes(q) || s.formLabel.toLowerCase().includes(q) || s.pageTitle.toLowerCase().includes(q)); }
    return result;
  }, [submissions, selectedForm, search]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      if (useLocalFallback) { deleteLocalSubmission(id); }
      else { const res = await formSubmissionsApi.delete(id); if (!res.success) { toast.error(res.error || t('wb:submissions.failedToDelete')); setDeletingId(null); return; } }
      setSubmissions(prev => prev.filter(s => s.id !== id));
      toast.success(t('wb:submissions.submissionDeleted'));
    } catch (err: any) { toast.error(err.message || t('wb:submissions.failedToDelete')); }
    finally { setDeletingId(null); }
  };

  const handleClearAll = async () => {
    if (!confirm(t('wb:submissions.confirmClear'))) return;
    try {
      if (useLocalFallback) { clearLocalSubmissions(siteId, selectedForm === 'all' ? undefined : selectedForm); }
      else { const res = await formSubmissionsApi.clear(siteId, selectedForm === 'all' ? undefined : selectedForm); if (!res.success) { toast.error(res.error || t('wb:submissions.failedToClear')); return; } }
      await fetchSubmissions();
      toast.success(t('wb:submissions.submissionsCleared'));
    } catch (err: any) { toast.error(err.message || t('wb:submissions.failedToClear')); }
  };

  const handleExport = () => {
    const csv = exportSubmissionsCSV(filtered.map(toExportShape));
    if (!csv) { toast.error(t('wb:submissions.noDataToExport')); return; }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `form-submissions-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(t('wb:submissions.exportCsv'));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t('wb:submissions.formSubmissions')}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh} title={t('wb:submissions.refresh')} disabled={loading}><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleExport} title={t('wb:submissions.exportCsv')} disabled={!filtered.length}><Download className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleClearAll} title={t('wb:submissions.clearAll')} disabled={!filtered.length}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder={t('wb:submissions.searchSubmissions')} value={search} onChange={e => setSearch(e.target.value)} className="h-7 text-xs pl-7" />
        </div>
        {formGroups.size > 1 && (
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setSelectedForm('all')} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${selectedForm === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {t('wb:manager.all')} ({submissions.length})
            </button>
            {Array.from(formGroups).map(([formId, { label, count }]) => (
              <button key={formId} onClick={() => setSelectedForm(formId)} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${selectedForm === formId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {label} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-3 opacity-40" />
            <p className="text-xs">{t('wb:submissions.loadingSubmissions')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-xs">{t('wb:submissions.noSubmissions')}</p>
            <p className="text-[10px] opacity-60 mt-1">{t('wb:submissions.noSubmissionsHint')}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {filtered.map(sub => {
              const isExpanded = expandedId === sub.id;
              const preview = Object.entries(sub.data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ');
              return (
                <div key={sub.id} className="border rounded-lg overflow-hidden group hover:border-primary/20 transition-colors">
                  <button onClick={() => setExpandedId(isExpanded ? null : sub.id)} className="w-full text-left p-2.5 flex items-start gap-2">
                    {isExpanded ? <ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-foreground">{sub.formLabel}</span>
                        <span className="text-[9px] text-muted-foreground">·</span>
                        <span className="text-[9px] text-muted-foreground">{sub.pageTitle}</span>
                        {sub.webhookStatus && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sub.webhookStatus === 'success' ? 'bg-green-100 text-green-700' : sub.webhookStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {sub.webhookStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{preview}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">{new Date(sub.submittedAt).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0" disabled={deletingId === sub.id} onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}>
                      {deletingId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 text-destructive" />}
                    </Button>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t bg-muted/20">
                      <table className="w-full text-[10px] mt-2">
                        <tbody>
                          {Object.entries(sub.data).map(([key, val]) => (
                            <tr key={key} className="border-b border-border/30 last:border-0">
                              <td className="py-1.5 pr-3 font-medium text-foreground capitalize whitespace-nowrap align-top">{key}</td>
                              <td className="py-1.5 text-muted-foreground break-all">{String(val)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
