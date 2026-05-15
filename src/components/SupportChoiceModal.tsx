import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TicketCheck, Plus, ListTodo } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTicket: () => void;
};

export default function SupportChoiceModal({ open, onOpenChange, onCreateTicket }: Props) {
  const { t } = useTranslation('support');
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <TicketCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-[15px]">
                {t('supportChoice.title', 'Support')}
              </DialogTitle>
              <DialogDescription className="text-[12px] mt-0.5">
                {t('supportChoice.subtitle', 'How can we help you today?')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-2">
          {/* Create new ticket */}
          <button
            onClick={() => {
              onOpenChange(false);
              onCreateTicket();
            }}
            className="w-full flex items-center gap-3.5 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {t('supportChoice.createTicket', 'Report an Issue')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('supportChoice.createTicketDesc', 'Describe a problem and our team will handle it')}
              </p>
            </div>
          </button>

          {/* View my tickets */}
          <button
            onClick={() => {
              onOpenChange(false);
              navigate('/dashboard/ticketsadmin');
            }}
            className="w-full flex items-center gap-3.5 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <ListTodo className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {t('supportChoice.viewTickets', 'View My Tickets')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('supportChoice.viewTicketsDesc', 'Check the status of your submitted tickets')}
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
