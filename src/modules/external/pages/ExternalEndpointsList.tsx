import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Globe, Zap, BarChart3, Copy, MoreHorizontal, Eye, Pencil, Trash2, ArrowDownLeft, ArrowUpDown, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExternalEndpoints } from '../hooks/useExternalEndpoints';
import { useExternalTranslations } from '../hooks/useExternalTranslations';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';

export function ExternalEndpointsList() {
  useExternalTranslations();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { endpoints, stats, loading, search, setSearch, statusFilter, setStatusFilter, deleteEndpoint } = useExternalEndpoints();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Public inbound URL points at the BACKEND (VITE_API_URL), not the frontend origin.
  const getPublicUrl = (slug: string) => {
    return `${API_URL.replace(/\/$/, '')}/api/external-receive/${slug}`;
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getPublicUrl(slug));
    toast.success(t('external.toast.urlCopied'), { description: t('external.toast.urlCopiedDesc') });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEndpoint(deleteId);
    } catch (e: any) {
      toast.error(t('external.toast.error'), { description: e?.message });
    } finally {
      setDeleteId(null);
    }
  };

  const filters = [
    { value: '', label: t('external.filters.all') },
    { value: 'active', label: t('external.filters.active') },
    { value: 'inactive', label: t('external.filters.inactive') },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('external.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('external.description')}</p>
        </div>
        <Button onClick={() => navigate('create')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('external.createEndpoint')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Globe className="h-3.5 w-3.5" />{t('external.stats.totalEndpoints')}</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalEndpoints}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Zap className="h-3.5 w-3.5" />{t('external.stats.activeEndpoints')}</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.activeEndpoints}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />{t('external.stats.totalReceivedToday')}
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalReceivedToday}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <SendHorizonal className="h-3.5 w-3.5 text-blue-500" />{t('external.stats.totalSentToday')}
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalSentToday}</p>
        </CardContent></Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('external.search')} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button key={f.value} variant={statusFilter === f.value ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : endpoints.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">{t('external.noEndpoints')}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('external.noEndpointsDesc')}</p>
          <Button onClick={() => navigate('create')} className="mt-4 gap-2"><Plus className="h-4 w-4" />{t('external.createEndpoint')}</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('external.table.name')}</TableHead>
                <TableHead>{t('external.table.slug')}</TableHead>
                <TableHead>{t('external.table.status')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('external.table.direction', 'Flow')}</TableHead>
                <TableHead className="text-center">{t('external.table.received')}</TableHead>
                <TableHead className="text-center hidden md:table-cell">{t('external.table.sent', 'Sent')}</TableHead>
                <TableHead>{t('external.table.created')}</TableHead>
                <TableHead className="w-[50px]">{t('external.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((ep) => {
                const isBidirectional = !!ep.webhookForwardUrl;
                return (
                <TableRow key={ep.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`${ep.id}`)}>
                  <TableCell className="font-medium">{ep.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{ep.slug}</code></TableCell>
                  <TableCell>
                    <Badge variant={ep.isActive ? 'default' : 'secondary'}>
                      {ep.isActive ? t('external.detail.active') : t('external.detail.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {isBidirectional ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                        <ArrowUpDown className="h-3 w-3" />{t('external.detail.flowBidirectional', 'In + Out')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                        <ArrowDownLeft className="h-3 w-3" />{t('external.detail.flowInbound', 'Inbound')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{ep.totalReceived}</TableCell>
                  <TableCell className="text-center hidden md:table-cell text-muted-foreground">{ep.totalSent > 0 ? ep.totalSent : '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(ep.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`${ep.id}`); }}>
                          <Eye className="h-4 w-4 mr-2" />{t('external.actions.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`${ep.id}/edit`); }}>
                          <Pencil className="h-4 w-4 mr-2" />{t('external.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyUrl(ep.slug); }}>
                          <Copy className="h-4 w-4 mr-2" />{t('external.actions.copyUrl')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(ep.id); }}>
                          <Trash2 className="h-4 w-4 mr-2" />{t('external.actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('external.confirm.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('external.confirm.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('external.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('external.confirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
