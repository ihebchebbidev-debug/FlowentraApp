/**
 * CompanyOverrideSection
 *
 * Shared block used by every module's PDF Settings modal.
 *
 * By default a report footer is built from the OWNING company's own
 * Company Information (Settings > Company). Turning on the override lets this
 * one document type print different details — any field left blank still falls
 * back to the company record, so partial overrides are safe.
 */
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useActiveCompany } from '@/shared/company/useActiveCompany';
import { resolvePdfCompany, buildFooterLines, type PdfCompanyBlock } from './resolveCompany';

interface Props {
  company: PdfCompanyBlock | undefined;
  /** Same signature the PDF settings modals already use: ('company.city', value). */
  onSettingsChange: (path: string, value: any) => void;
  /** Whether the footer is enabled for this document type. */
  footerEnabled?: boolean;
}

export function CompanyOverrideSection({ company, onSettingsChange, footerEnabled = true }: Props) {
  const { t } = useTranslation();
  const { company: activeCompany } = useActiveCompany();
  const useOverride = company?.useOverride === true;
  const resolved = resolvePdfCompany(company, activeCompany);
  const footerLines = buildFooterLines(resolved);

  const set = (field: keyof PdfCompanyBlock) => (value: string) =>
    onSettingsChange(`company.${field}`, value);

  const field = (
    key: keyof PdfCompanyBlock,
    label: string,
    placeholder?: string,
    type: 'input' | 'textarea' = 'input',
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`pdf-company-${key}`}>{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          id={`pdf-company-${key}`}
          value={(company?.[key] as string) || ''}
          onChange={e => set(key)(e.target.value)}
          placeholder={placeholder ?? (resolved[key as 'address'] || '')}
          disabled={!useOverride}
          rows={2}
        />
      ) : (
        <Input
          id={`pdf-company-${key}`}
          value={(company?.[key] as string) || ''}
          onChange={e => set(key)(e.target.value)}
          placeholder={placeholder ?? (resolved[key as 'address'] || '')}
          disabled={!useOverride}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 p-3 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="pdf-company-override" className="text-sm font-medium">
            {t('pdfSettings.overrideCompany', { defaultValue: 'Override company information' })}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('pdfSettings.overrideCompanyDescription', {
              defaultValue:
                'Off: this report uses the company details from Settings > Company. On: the values below are used instead (blank fields still fall back).',
            })}
          </p>
        </div>
        <Switch
          id="pdf-company-override"
          checked={useOverride}
          onCheckedChange={checked => onSettingsChange('company.useOverride', checked)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('name', t('pdfSettings.companyName', { defaultValue: 'Company Name' }))}
        {field('tagline', t('pdfSettings.tagline', { defaultValue: 'Tagline' }))}
      </div>

      {field('address', t('pdfSettings.address', { defaultValue: 'Address' }), undefined, 'textarea')}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {field('city', t('pdfSettings.city', { defaultValue: 'City' }))}
        {field('postalCode', t('pdfSettings.postalCode', { defaultValue: 'Postal code' }))}
        {field('state', t('pdfSettings.state', { defaultValue: 'State / Region' }))}
        {field('country', t('pdfSettings.country', { defaultValue: 'Country' }))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {field('phone', t('pdfSettings.phone', { defaultValue: 'Phone' }))}
        {field('email', t('pdfSettings.email', { defaultValue: 'Email' }))}
        {field('website', t('pdfSettings.website', { defaultValue: 'Website' }))}
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {field('taxId', t('pdfSettings.taxId', { defaultValue: 'Tax ID / VAT' }))}
        {field('registrationNumber', t('pdfSettings.registrationNumber', { defaultValue: 'Registration number' }))}
        {field('shareCapital', t('pdfSettings.shareCapital', { defaultValue: 'Share capital' }))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {field('bankName', t('pdfSettings.bankName', { defaultValue: 'Bank name' }))}
        {field('bankAccount', t('pdfSettings.bankAccount', { defaultValue: 'Account / IBAN' }))}
        {field('bankSwift', t('pdfSettings.bankSwift', { defaultValue: 'SWIFT / BIC' }))}
      </div>

      {field(
        'footerMessage',
        t('pdfSettings.footerMessage', { defaultValue: 'Footer message' }),
        undefined,
        'textarea',
      )}

      {/* Preview of exactly what the PDF footer will print */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">
          {t('pdfSettings.footerPreview', { defaultValue: 'Footer Preview' })}
        </Label>
        <div
          className={`relative rounded-md border p-4 text-xs ${
            footerEnabled ? 'bg-background' : 'bg-muted/30 opacity-60'
          }`}
        >
          {!footerEnabled && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="bg-destructive/10 text-destructive text-xs font-medium px-2 py-1 rounded">
                {t('pdfSettings.footerDisabled', { defaultValue: 'Footer is currently disabled' })}
              </span>
            </div>
          )}
          <div className="border-t pt-3 space-y-1">
            {resolved.name ? <p className="text-foreground">{resolved.name}</p> : null}
            {footerLines.map((line, idx) => (
              <p key={idx} className="text-muted-foreground">
                {line}
              </p>
            ))}
            {resolved.footerMessage ? (
              <p className="text-muted-foreground italic">{resolved.footerMessage}</p>
            ) : null}
            {!resolved.name && footerLines.length === 0 && !resolved.footerMessage ? (
              <p className="text-muted-foreground italic">
                {t('pdfSettings.footerEmpty', {
                  defaultValue: 'No company details yet — fill them in Settings > Company.',
                })}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
