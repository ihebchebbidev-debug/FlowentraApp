// Hierarchical picker for TEJ / RiTEJ IdTypeOperation codes (DGI v1.0).
// Groups official operation codes by family for fast, accurate selection.
import { useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  TEJ_OPERATION_CODES,
  TEJ_OPERATION_BY_FAMILY,
  getTejOperation,
  type TejOperationFamily,
} from '@/modules/shared/constants/tejOperationCodes';

interface Props {
  value?: string;
  onChange: (code: string, defaultRate: number | null) => void;
  label?: string;
  /** When true, show only families relevant to purchases / supplier invoices. */
  purchaseOnly?: boolean;
  className?: string;
  showHelp?: boolean;
}

const PURCHASE_FAMILIES: TejOperationFamily[] = [
  'Honoraires', 'Loyers', 'Marchés', 'Redevances', 'Intérêts', 'Exonérations',
];

export function TejOperationCodePicker({
  value, onChange, label = 'Code opération (TEJ)', purchaseOnly = false, className, showHelp = true,
}: Props) {
  const families = useMemo(() => {
    const all = Object.keys(TEJ_OPERATION_BY_FAMILY) as TejOperationFamily[];
    return purchaseOnly ? all.filter(f => PURCHASE_FAMILIES.includes(f)) : all;
  }, [purchaseOnly]);

  const current = getTejOperation(value);

  return (
    <div className={className}>
      {label && <Label className="text-xs">{label}</Label>}
      <Select
        value={value || ''}
        onValueChange={(v) => {
          const op = TEJ_OPERATION_CODES.find(o => o.code === v);
          onChange(v, op?.defaultRate ?? null);
        }}
      >
        <SelectTrigger className="h-8 mt-1">
          <SelectValue placeholder="Sélectionner un code opération…" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {families.map(family => (
            <SelectGroup key={family}>
              <SelectLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {family}
              </SelectLabel>
              {TEJ_OPERATION_BY_FAMILY[family].map(op => (
                <SelectItem key={op.code} value={op.code} className="text-xs">
                  <span className="font-mono mr-2">{op.code}</span>
                  <span>{op.labelFr}</span>
                  {op.defaultRate !== null && (
                    <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                      {op.defaultRate}%
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {showHelp && current && (
        <p className="text-[10px] text-muted-foreground mt-1">
          <span className="font-mono">{current.code}</span> · {current.family}
          {current.defaultRate !== null && <> · taux usuel {current.defaultRate}%</>}
        </p>
      )}
    </div>
  );
}
