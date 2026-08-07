import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import FileUploader from './FileUploader';
import { toast } from '../../../components/ui/sonner';
import { useSupportViewModel } from '../viewmodel/supportViewModel';

type Props = {
  onCreated?: (id: string) => void
}

export default function CreateTicketModal({ onCreated }: Props) {
  const { t } = useTranslation('support');
  const { createTicket } = useSupportViewModel();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [module, setModule] = useState('Dashboard');
  const [category, setCategory] = useState('Bug');
  const [urgency, setUrgency] = useState('Medium');
  const [errorDetails, setErrorDetails] = useState('');
  const [links, setLinks] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const modules = [
    { value: 'Dashboard', label: t('modules.dashboard') },
    { value: 'Sales', label: t('modules.sales') },
    { value: 'Inventory', label: t('modules.inventory') },
    { value: 'Field', label: t('modules.field') },
    { value: 'Settings', label: t('modules.settings') },
  ];

  const categories = [
    { value: 'Bug', label: t('ticketCategories.bug') },
    { value: 'Feature Request', label: t('ticketCategories.feature') },
    { value: 'Billing', label: t('ticketCategories.billing') },
    { value: 'Account', label: t('ticketCategories.account') },
    { value: 'Other', label: t('ticketCategories.other') },
  ];

  const urgencies = [
    { value: 'Low', label: t('priorities.low') },
    { value: 'Medium', label: t('priorities.medium') },
    { value: 'High', label: t('priorities.high') },
    { value: 'Critical', label: t('priorities.critical') },
  ];

  const handleFileChange = (files: File[]) => setAttachments(files);

  const resetForm = () => {
    setTitle('');
    setShortDesc('');
    setModule('Dashboard');
    setCategory('Bug');
    setUrgency('Medium');
    setErrorDetails('');
    setLinks('');
    setAttachments([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title || !shortDesc) return;
    setSubmitting(true);

    const ticket = {
      id: `TCK-${Math.floor(Math.random() * 100000)}`,
      subject: title,
      shortDesc,
      module,
      category,
      urgency,
      status: 'Open',
      createdAt: new Date().toISOString().slice(0,10),
      updatedAt: new Date().toISOString().slice(0,10),
      messages: [ { from: 'user' as const, text: shortDesc + (errorDetails ? '\n\nDetails:\n' + errorDetails : ''), date: new Date().toISOString().slice(0,10) } ],
      attachments,
      links: links.split(',').map(l => l.trim()).filter(Boolean)
    };

    try {
      const created = await createTicket(ticket as any);
      setOpen(false);
      resetForm();
      toast.success(t('ticket.success'));
      if (onCreated && created && (created as any).id) onCreated((created as any).id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">{t('ticket.createNewTicket')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('ticket.title')}</DialogTitle>
          <DialogDescription>{t('support.subtitle')}</DialogDescription>
        </DialogHeader>

        <form className="grid grid-cols-1 gap-3 mt-2" onSubmit={handleSubmit}>
          <Input placeholder={t('ticket.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} required />
          <Input placeholder={t('ticket.summaryPlaceholder')} value={shortDesc} onChange={e => setShortDesc(e.target.value)} required />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select className="border rounded p-2 bg-background" value={module} onChange={e => setModule(e.target.value)}>
              {modules.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select className="border rounded p-2 bg-background" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select className="border rounded p-2 bg-background" value={urgency} onChange={e => setUrgency(e.target.value)}>
              {urgencies.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          <textarea className="border rounded p-2 min-h-[100px] bg-background text-foreground" placeholder={t('ticket.errorDetailsPlaceholder')} value={errorDetails} onChange={e => setErrorDetails(e.target.value)} />

          <Input placeholder={t('ticket.linksPlaceholder')} value={links} onChange={e => setLinks(e.target.value)} />

          <FileUploader files={attachments} setFiles={handleFileChange} />

          <DialogFooter>
            <Button type="submit" disabled={submitting}>{t('ticket.createRequest')}</Button>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
