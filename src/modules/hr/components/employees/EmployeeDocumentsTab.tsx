import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { FileText, Download, Trash2, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UploadThingDropzone, type UploadedFile } from '@/components/upload/UploadThingDropzone';
import { useEmployeeDocuments } from '../../hooks/useEmployeeDocuments';
import type { EmployeeDocument } from '../../types/hr.types';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';

const DOC_TYPES: EmployeeDocument['docType'][] = ['contract', 'payslip', 'id_card', 'cnss', 'medical', 'other'];

interface Props {
  userId: number;
}

export function EmployeeDocumentsTab({ userId }: Props) {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { documentsQuery, createDocument, deleteDocument } = useEmployeeDocuments(userId);
  const guardHr = useHrPermissionGuard();

  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<EmployeeDocument['docType']>('contract');
  const [title, setTitle] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);

  const reset = () => {
    setDocType('contract');
    setTitle('');
    setIssuedDate('');
    setExpiresAt('');
    setUploaded(null);
  };

  const handleSave = async () => {
    if (!guardHr('create')) return;
    if (!uploaded) {
      toast({ title: t('documentsTab.fileRequired', 'Please upload a file first'), variant: 'destructive' });
      return;
    }
    try {
      await createDocument.mutateAsync({
        docType,
        title: title.trim() || uploaded.name,
        fileUrl: uploaded.url,
        fileName: uploaded.name,
        mimeType: uploaded.type,
        fileSize: uploaded.size,
        issuedDate: issuedDate || undefined,
        expiresAt: expiresAt || undefined,
      });
      toast({ title: t('documentsTab.uploaded', 'Document uploaded') });
      reset();
      setOpen(false);
    } catch {
      toast({ title: t('documentsTab.uploadFailed', 'Upload failed'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!guardHr('delete')) return;
    if (!confirm(t('documentsTab.confirmDelete', 'Delete this document?'))) return;
    try {
      await deleteDocument.mutateAsync(id);
      toast({ title: t('documentsTab.deleted', 'Document deleted') });
    } catch {
      toast({ title: t('documentsTab.deleteFailed', 'Delete failed'), variant: 'destructive' });
    }
  };

  const docs = documentsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('documentsTab.subtitle', 'Contracts, payslips and other employee documents')}
        </p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <HrPermissionButton action="create" size="sm"><Plus className="h-4 w-4 mr-1" />{t('documentsTab.add', 'Add document')}</HrPermissionButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('documentsTab.add', 'Add document')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('documentsTab.type', 'Type')}</Label>
                  <Select value={docType} onValueChange={(v) => setDocType(v as EmployeeDocument['docType'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((tp) => (
                        <SelectItem key={tp} value={tp}>{t(`documentsTab.types.${tp}`, tp)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t('documentsTab.title', 'Title')}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('documentsTab.titlePlaceholder', 'Optional')} />
                </div>
                <div className="space-y-1">
                  <Label>{t('documentsTab.issuedDate', 'Issued date')}</Label>
                  <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('documentsTab.expiresAt', 'Expires at')}</Label>
                  <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('documentsTab.file', 'File')}</Label>
                <UploadThingDropzone
                  maxFiles={1}
                  maxSizeMB={20}
                  endpoint="documentUploader"
                  onUploadComplete={(files) => setUploaded(files[0] ?? null)}
                />
                {uploaded && (
                  <p className="text-xs text-muted-foreground truncate">
                    {uploaded.name} · {(uploaded.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
              <HrPermissionButton action="create" onClick={handleSave} disabled={createDocument.isPending || !uploaded}>
                {createDocument.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {t('save')}
              </HrPermissionButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documentsQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">{t('loading')}</div>
      ) : docs.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
          {t('documentsTab.empty', 'No documents yet')}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('documentsTab.type', 'Type')}</TableHead>
              <TableHead>{t('documentsTab.title', 'Title')}</TableHead>
              <TableHead>{t('documentsTab.issuedDate', 'Issued')}</TableHead>
              <TableHead>{t('documentsTab.expiresAt', 'Expires')}</TableHead>
              <TableHead>{t('documentsTab.uploadedAt', 'Uploaded')}</TableHead>
              <TableHead className="text-right">{t('documentsTab.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {t(`documentsTab.types.${d.docType}`, d.docType)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{d.title || d.fileName || '—'}</span>
                  </div>
                </TableCell>
                <TableCell>{d.issuedDate ? dayjs(d.issuedDate).format('YYYY-MM-DD') : '—'}</TableCell>
                <TableCell>{d.expiresAt ? dayjs(d.expiresAt).format('YYYY-MM-DD') : '—'}</TableCell>
                <TableCell>{d.createdAt ? dayjs(d.createdAt).format('YYYY-MM-DD') : '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    {d.fileUrl && (
                      <Button asChild size="icon" variant="ghost" title={t('documentsTab.download', 'Download')}>
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" download={d.fileName ?? undefined}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {d.fileUrl && (
                      <Button asChild size="icon" variant="ghost" title={t('documentsTab.open', 'Open')}>
                        <a href={d.fileUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <HrPermissionButton
                      action="delete"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(d.id)}
                      disabled={deleteDocument.isPending}
                      title={t('documentsTab.delete', 'Delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </HrPermissionButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
