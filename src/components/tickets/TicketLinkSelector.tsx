import React, { useState, useEffect, useRef } from 'react';
import { supportTicketsApi, SupportTicketResponse, CreateLinkPayload } from '@/services/api/supportTicketsApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

type LinkType = 'related' | 'duplicate' | 'blocks' | 'blocked_by';

interface SelectedLink {
  targetTicketId: number;
  linkType: LinkType;
  title?: string;
  status?: string;
}

interface Props {
  ticketId?: number; // current ticket to avoid self-linking
  existingLinks?: SelectedLink[];
  onLinksChange: (links: SelectedLink[]) => void;
}

export default function TicketLinkSelector({ ticketId, existingLinks = [], onLinksChange }: Props) {
  const { t } = useTranslation('support');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SupportTicketResponse[]>([]);
  const [selected, setSelected] = useState<SelectedLink[]>(existingLinks || []);
  const [linkType, setLinkType] = useState<LinkType>('related');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const tm = setTimeout(() => {
      let mounted = true;
      (async () => {
        if (!query || query.trim().length < 2) {
          setResults([]);
          return;
        }
        try {
          const out = await supportTicketsApi.search(query);
          if (mounted) setResults(out.filter(r => r.id !== ticketId));
        } catch (err) {
          console.error('Ticket search failed', err);
        }
      })();
      return () => { mounted = false; };
    }, 300);
    return () => clearTimeout(tm);
  }, [query, ticketId]);

  const addSelected = (ticket: SupportTicketResponse) => {
    if (ticket.id === ticketId) return;
    if (selected.find(s => s.targetTicketId === ticket.id)) return;
    const item: SelectedLink = { targetTicketId: ticket.id, linkType, title: ticket.title, status: ticket.status };
    const next = [...selected, item];
    setSelected(next);
    onLinksChange(next);
    setQuery('');
    setResults([]);
    if (inputRef.current) inputRef.current.blur();
  };

  const remove = (id: number) => {
    const next = selected.filter(s => s.targetTicketId !== id);
    setSelected(next);
    onLinksChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input ref={inputRef} placeholder={t('links.searchPlaceholder', 'Search tickets...')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={linkType} onValueChange={(v) => setLinkType(v as LinkType)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="related">{t('links.types.related', 'Related')}</SelectItem>
            <SelectItem value="duplicate">{t('links.types.duplicate', 'Duplicate')}</SelectItem>
            <SelectItem value="blocks">{t('links.types.blocks', 'Blocks')}</SelectItem>
            <SelectItem value="blocked_by">{t('links.types.blocked_by', 'Blocked by')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {results.length > 0 && (
        <div className="border rounded-md bg-popover p-2 max-h-48 overflow-auto">
          {results.map(r => (
            <div key={r.id} className="p-2 hover:bg-muted/30 rounded flex items-center justify-between cursor-pointer" onClick={() => addSelected(r)}>
              <div className="min-w-0">
                  <div className="text-sm font-medium truncate">#{r.id} — {r.title}</div>
                  {r.description && <div className="text-xs text-muted-foreground truncate mt-1">{r.description.slice(0, 120)}</div>}
                  <div className="text-xs text-muted-foreground">{r.userEmail || r.tenant || ''}</div>
                </div>
              <div className="ml-2">
                <Badge variant="secondary" className="text-[11px]">{r.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {selected.map(s => (
          <div key={s.targetTicketId} className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted border border-border">
            <div className="text-sm">#{s.targetTicketId} {s.title ? `— ${s.title}` : ''}</div>
            <div className="text-xs text-muted-foreground">{s.linkType}</div>
            <button onClick={() => remove(s.targetTicketId)} className="ml-1 text-muted-foreground"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
