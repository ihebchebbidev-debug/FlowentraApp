import { useEffect, useMemo, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  /** Persisted / applied values used to hydrate the controls on mount */
  initialValues?: Record<string, string>;
  onApply?: (values: Record<string, string>) => void;
  onClear?: () => void;
}

const Controls = ({
  filters,
  values,
  setValues,
  onApply,
  onClear,
}: {
  filters: FilterOption[];
  values: Record<string, string>;
  setValues: (v: Record<string, string>) => void;
  onApply: () => void;
  onClear: () => void;
}) => {
  const { t } = useTranslation('reporting');
  return (
    <>
      {filters.map((f) => (
        <div key={f.key} className="flex items-center gap-2">
          <span className="whitespace-nowrap text-px-11 font-medium text-muted-foreground">{f.label}</span>
          <Select
            value={values[f.key] ?? f.defaultValue ?? f.options[0]?.value}
            onValueChange={(v) => setValues({ ...values, [f.key]: v })}
          >
            <SelectTrigger className="h-8 min-w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          {t('filters.clear', 'Clear')}
        </Button>
        <Button size="sm" className="h-8" onClick={onApply}>
          <Filter className="mr-1 h-3.5 w-3.5" />
          {t('filters.apply', 'Apply')}
        </Button>
      </div>
    </>
  );
};

export const FilterBar = ({ filters, initialValues, onApply, onClear }: FilterBarProps) => {
  const { t } = useTranslation('reporting');
  const defaults = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [f.key, f.defaultValue ?? f.options[0]?.value ?? ''])
      ) as Record<string, string>,
    [filters]
  );
  const [values, setValues] = useState<Record<string, string>>({ ...defaults, ...(initialValues ?? {}) });
  const [open, setOpen] = useState(false);

  // Re-hydrate controls when persisted values arrive (e.g. after navigating
  // back to the page).
  useEffect(() => {
    setValues({ ...defaults, ...(initialValues ?? {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues), defaults]);

  const apply = () => {
    onApply?.(values);
    setOpen(false);
  };
  const clear = () => {
    setValues(defaults);
    onClear?.();
    onApply?.(defaults);
  };

  return (
    <>
      {/* Desktop / tablet */}
      <div className="mb-3 hidden flex-wrap items-center gap-3 rounded-lg border bg-card px-3.5 py-2 shadow-sm md:flex">
        <Controls filters={filters} values={values} setValues={setValues} onApply={apply} onClear={clear} />
      </div>

      {/* Mobile trigger */}
      <div className="mb-3 flex md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-center">
              <Filter className="mr-2 h-4 w-4" />
              {t('filters.title', 'Filters')}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t('filters.title', 'Filters')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-col gap-3">
              <Controls filters={filters} values={values} setValues={setValues} onApply={apply} onClear={clear} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
