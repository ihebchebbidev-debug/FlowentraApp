import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Shared shadcn-based date picker for planning inputs. Stores value as
 * ISO date string (YYYY-MM-DD). Displays a localized long date and supports
 * clearing.
 */
export function PlannedDateField({ value, onChange, placeholder, className }: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const locale = i18n.language?.startsWith('fr') ? fr : enUS;

  const parsed = value ? parseISO(value) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">
            {date
              ? format(date, 'PPP', { locale })
              : placeholder ?? t('planning.pickDate', 'Pick a date')}
          </span>
          {date && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('clear', 'Clear')}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }
              }}
              className="ml-1 rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? format(d, 'yyyy-MM-dd') : null);
            setOpen(false);
          }}
          initialFocus
          locale={locale}
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}

export default PlannedDateField;
