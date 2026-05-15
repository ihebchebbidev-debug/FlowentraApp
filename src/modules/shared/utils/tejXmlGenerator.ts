// TEJ XML Generator for Tunisian Tax Authority (DGI - Direction Générale des Impôts)
// Format: DeclarationRetenueSource — Official TEJ standard
import type { RSRecord, TEJDeclarant, TEJExportLog } from '../types/retenue-source';
import { saveTEJExportLog } from '../services/rsCalculationService';

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format number to 2 decimal places for XML (Tunisian standard)
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * TEJ Export options
 */
export interface TEJExportOptions {
  typeActe?: '0' | '1' | '2'; // 0=Initial, 1=Corrective, 2=Cancellation
  codeNatureOperation?: string; // e.g. '01' = service fee
}

/**
 * Generate TEJ-compliant XML from RS records — Official DGI Tunisian format
 * Structure: DeclarationRetenueSource > Entete + ListeCertificats > Certificat
 */
export function generateTEJXml(
  declarant: TEJDeclarant,
  records: RSRecord[],
  year: number,
  month: number,
  options: TEJExportOptions = {}
): string {
  const typeActe = options.typeActe ?? '0';
  const codeNatureOperation = options.codeNatureOperation ?? '01';

  const certificatsXml = records.map((record, idx) => `
    <!-- Certificat ${idx + 1} -->
    <Certificat>
      <Beneficiaire>
        <Nom>${escapeXml(record.supplierName)}</Nom>
        <MatriculeFiscal>${escapeXml(record.supplierTaxId)}</MatriculeFiscal>
        <Adresse>${escapeXml(record.supplierAddress || '')}</Adresse>
      </Beneficiaire>
      <Facture>
        <Numero>${escapeXml(record.invoiceNumber)}</Numero>
        <Date>${record.invoiceDate}</Date>
      </Facture>
      <Paiement>
        <DatePaiement>${record.paymentDate}</DatePaiement>
        <MontantBrut>${formatAmount(record.amountPaid)}</MontantBrut>
        <MontantRetenue>${formatAmount(record.rsAmount)}</MontantRetenue>
        <CodeRetenue>${escapeXml(record.rsTypeCode)}</CodeRetenue>
        <CodeNatureOperation>${escapeXml(codeNatureOperation)}</CodeNatureOperation>
      </Paiement>
    </Certificat>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>

<DeclarationRetenueSource>

  <!-- Header: Declarant / Company -->
  <Entete>
    <MatriculeFiscalDeclarant>${escapeXml(declarant.taxId)}</MatriculeFiscalDeclarant>
    <RaisonSocialeDeclarant>${escapeXml(declarant.name)}</RaisonSocialeDeclarant>
    <AdresseDeclarant>${escapeXml(declarant.address)}</AdresseDeclarant>
    <Annee>${year}</Annee>
    <Mois>${String(month).padStart(2, '0')}</Mois>
    <TypeActe>${typeActe}</TypeActe>
  </Entete>

  <!-- List of RS certificates -->
  <ListeCertificats>
${certificatsXml}
  </ListeCertificats>

</DeclarationRetenueSource>`;
}

/**
 * Generate TEJ file name per convention:
 * [MatriculeFiscal]-[Year]-[Month]-[TypeActe].xml
 */
export function generateTEJFileName(
  payerTaxId: string,
  year: number,
  month: number,
  typeActe: string = '0'
): string {
  return `${payerTaxId}-${year}-${String(month).padStart(2, '0')}-${typeActe}.xml`;
}

/**
 * Validate records before TEJ export
 */
export function validateForTEJExport(records: RSRecord[]): string[] {
  const errors: string[] = [];

  if (records.length === 0) {
    errors.push('Aucun enregistrement RS à exporter');
    return errors;
  }

  records.forEach((record, idx) => {
    const prefix = `Certificat #${idx + 1}`;
    if (!record.supplierTaxId) errors.push(`${prefix} : Matricule Fiscal du bénéficiaire manquant`);
    if (!record.supplierName)  errors.push(`${prefix} : Nom du bénéficiaire manquant`);
    if (!record.invoiceNumber) errors.push(`${prefix} : Numéro de facture manquant`);
    if (!record.invoiceDate)   errors.push(`${prefix} : Date de facture manquante`);
    if (!record.paymentDate)   errors.push(`${prefix} : Date de paiement manquante`);
    if (record.rsAmount <= 0)  errors.push(`${prefix} : Le montant retenu doit être positif`);
    if (record.amountPaid <= 0) errors.push(`${prefix} : Le montant brut doit être positif`);
    if (record.rsAmount > record.amountPaid) errors.push(`${prefix} : La retenue dépasse le montant brut`);
  });

  // Check for duplicate invoice+payment combos
  const keys = records.map(r => `${r.invoiceNumber}-${r.paymentDate}`);
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    errors.push(`Doublons détectés : ${[...new Set(duplicates)].join(', ')}`);
  }

  return errors;
}

/**
 * Full TEJ export workflow: validate → generate XML → download → log
 */
export function exportTEJFile(
  declarant: TEJDeclarant,
  records: RSRecord[],
  year: number,
  month: number,
  options: TEJExportOptions = {}
): { success: boolean; fileName?: string; errors?: string[] } {
  // Validate
  const errors = validateForTEJExport(records);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const typeActe = options.typeActe ?? '0';

  // Generate XML
  const xml = generateTEJXml(declarant, records, year, month, options);
  const fileName = generateTEJFileName(declarant.taxId, year, month, typeActe);

  // Download file
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Log export
  const log: TEJExportLog = {
    id: `TEJ-${Date.now()}`,
    fileName,
    exportDate: new Date().toISOString(),
    exportedBy: 'current-user',
    month,
    year,
    recordCount: records.length,
    totalRSAmount: records.reduce((sum, r) => sum + r.rsAmount, 0),
    status: 'success',
  };
  saveTEJExportLog(log);

  return { success: true, fileName };
}
