// TEJ XML Generator for Tunisian Tax Authority (DGI - RiTEJ cahier de charges v1.0)
// Root: <DeclarationsRS VersionSchema="1.0">
//   - Dates DD/MM/YYYY
//   - Amounts in millimes (xs:integer = value * 1000)
//   - Structured Beneficiaire (TypeIdentifiant + CategorieContribuable + Resident)
//   - IdTypeOperation: RS1_xxxxxx
//   - Per-Acte wrappers: AjouterCertificats / ModifierCertificats / AnnulerCertificats
//   - Per-wrapper totals
import type { RSRecord, TEJDeclarant, TEJExportLog } from '../types/retenue-source';
import { legacyToTejOperationCode } from '../constants/tejOperationCodes';
import { saveTEJExportLog } from '../services/rsCalculationService';

const escapeXml = (s: string | undefined | null): string =>
  (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** TND → millimes (xs:integer). */
const toMillimes = (n: number): number => Math.round((n ?? 0) * 1000);

/** YYYY-MM-DD → DD/MM/YYYY. Accepts Date or ISO string. */
const ddmmyyyy = (input: string | Date | undefined): string => {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const trunc = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max));

const rateForLegacy = (code: string): number => {
  switch (code) {
    case '10': return 10;
    case '05': return 0.5;
    case '03': return 3;
    case '20': return 20;
    case 'P1': return 1.5;
    case 'P2': return 5;
    case 'P3': return 10;
    case 'P4': return 15;
    case 'P5': return 25;
    default:   return 0;
  }
};

export interface TEJExportOptions {
  /** 0=AjouterCertificats (default), 1=ModifierCertificats, 2=AnnulerCertificats. */
  acteDepot?: 0 | 1 | 2;
}

/** Render the <TypeIdentifiant>/<Identifiant> choice block. */
function renderIdentifiant(idType: number, value: string): string {
  const elementName =
    idType === 2 ? 'Cin' :
    idType === 3 ? 'Passeport' :
    idType === 4 ? 'CarteSejour' :
    idType === 5 ? 'AutreIdentifiantFiscal' :
                   'MatriculeFiscal';
  return `      <TypeIdentifiant>${idType}</TypeIdentifiant>
      <${elementName}>${escapeXml((value ?? '').trim())}</${elementName}>`;
}

function renderCertificat(r: RSRecord): string {
  const opCode      = r.operationCode ?? legacyToTejOperationCode(r.rsTypeCode);
  const rsRate      = rateForLegacy(r.rsTypeCode);
  const rsTvaAmt    = r.rsTvaAmount ?? 0;
  const netServi    = r.montantNetServi ?? Math.max(0, r.amountPaid - r.rsAmount - rsTvaAmt);
  const idType      = r.beneficiaireIdType ?? 1;
  const categorie   = r.beneficiaireCategorie ?? 'PM';
  const resident    = r.beneficiaireIsResident !== false ? 1 : 0;
  const pays        = r.beneficiairePaysCode ?? 'TN';
  const refCert     = r.refCertifChezDeclarant ?? `CRT-${r.id}`;
  const anneeFact   = r.anneeFacturation ?? new Date(r.invoiceDate).getFullYear();
  const priseEnChg  = r.priseEnCharge ? 1 : 0;

  return `    <Certificat>
      <RefCertifChezDeclarant>${escapeXml(trunc(refCert, 50))}</RefCertifChezDeclarant>
      <AnneeFacturation>${anneeFact}</AnneeFacturation>
      <IdTypeOperation>${escapeXml(opCode)}</IdTypeOperation>${r.cnpc ? `\n      <Cnpc>${escapeXml(r.cnpc)}</Cnpc>` : ''}
      <Beneficiaire>
${renderIdentifiant(idType, r.supplierTaxId)}
        <CategorieContribuable>${categorie}</CategorieContribuable>
        <Resident>${resident}</Resident>
        <NometprenonOuRaisonsociale>${escapeXml(trunc(r.supplierName, 200))}</NometprenonOuRaisonsociale>${r.beneficiaireDateNaissance ? `\n        <DateNaissance>${ddmmyyyy(r.beneficiaireDateNaissance)}</DateNaissance>` : ''}
        <Pays>${escapeXml(pays)}</Pays>
        <InfosContact>
          <Adresse>${escapeXml(trunc(r.supplierAddress ?? '', 200))}</Adresse>
        </InfosContact>
      </Beneficiaire>
      <Facture>
        <NumeroFacture>${escapeXml(trunc(r.invoiceNumber, 50))}</NumeroFacture>
        <DateFacture>${ddmmyyyy(r.invoiceDate)}</DateFacture>
        <DatePayement>${ddmmyyyy(r.paymentDate)}</DatePayement>
        <MontantHT>${toMillimes(r.amountPaid)}</MontantHT>
        <MontantTVA>${toMillimes(rsTvaAmt)}</MontantTVA>
        <TauxRS>${Math.round(rsRate * 100)}</TauxRS>
        <MontantRS>${toMillimes(r.rsAmount)}</MontantRS>${rsTvaAmt > 0 ? `\n        <MontantRSTVA>${toMillimes(rsTvaAmt)}</MontantRSTVA>` : ''}
        <MontantNetServi>${toMillimes(netServi)}</MontantNetServi>
        <PriseEnCharge>${priseEnChg}</PriseEnCharge>
      </Facture>
    </Certificat>`;
}

/** Generate a TEJ-compliant XML for a list of RS records. */
export function generateTEJXml(
  declarant: TEJDeclarant,
  records: RSRecord[],
  year: number,
  month: number,
  options: TEJExportOptions = {},
): string {
  // Group by Acte (defaults to 0 for legacy rows that have none)
  const byActe = new Map<number, RSRecord[]>();
  for (const r of records) {
    const acte = r.acte ?? 0;
    if (!byActe.has(acte)) byActe.set(acte, []);
    byActe.get(acte)!.push(r);
  }

  const wrapperName = (acte: number) =>
    acte === 1 ? 'ModifierCertificats' :
    acte === 2 ? 'AnnulerCertificats' :
                 'AjouterCertificats';

  const actesXml = Array.from(byActe.entries())
    .sort(([a], [b]) => a - b)
    .map(([acte, group]) => {
      const certs = group.map(renderCertificat).join('\n');
      const totalHT  = group.reduce((s, r) => s + toMillimes(r.amountPaid), 0);
      const totalTVA = group.reduce((s, r) => s + toMillimes(r.rsTvaAmount ?? 0), 0);
      const totalRS  = group.reduce((s, r) => s + toMillimes(r.rsAmount + (r.rsTvaAmount ?? 0)), 0);
      const totalNet = group.reduce(
        (s, r) => s + toMillimes(r.montantNetServi ?? r.amountPaid - r.rsAmount - (r.rsTvaAmount ?? 0)),
        0,
      );
      return `  <${wrapperName(acte)}>
${certs}
    <TotalMontantHT>${totalHT}</TotalMontantHT>
    <TotalMontantTVA>${totalTVA}</TotalMontantTVA>
    <TotalMontantRS>${totalRS}</TotalMontantRS>
    <TotalMontantNetServi>${totalNet}</TotalMontantNetServi>
  </${wrapperName(acte)}>`;
    })
    .join('\n');

  const acteDepot = options.acteDepot ?? 0;
  const categorie = declarant.categorieContribuable ?? 'PM';

  return `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationsRS VersionSchema="1.0">
  <Declarant>
${renderIdentifiant(1, declarant.taxId)}
    <CategorieContribuable>${categorie}</CategorieContribuable>
    <NometprenonOuRaisonsociale>${escapeXml(trunc(declarant.name, 200))}</NometprenonOuRaisonsociale>
    <InfosContact>
      <Adresse>${escapeXml(trunc(declarant.address ?? '', 200))}</Adresse>${declarant.email ? `\n      <Email>${escapeXml(declarant.email)}</Email>` : ''}${declarant.phone ? `\n      <Telephone>${escapeXml(declarant.phone)}</Telephone>` : ''}
    </InfosContact>
  </Declarant>
  <ReferenceDeclaration>
    <ActeDepot>${acteDepot}</ActeDepot>
    <AnneeDepot>${year}</AnneeDepot>
    <MoisDepot>${String(month).padStart(2, '0')}</MoisDepot>
  </ReferenceDeclaration>
${actesXml}
</DeclarationsRS>`;
}

/** File name convention: [MatriculeFiscal]-[Year]-[Month]-[ActeDepot].xml */
export function generateTEJFileName(
  payerTaxId: string,
  year: number,
  month: number,
  acteDepot: number = 0,
): string {
  return `${payerTaxId}-${year}-${String(month).padStart(2, '0')}-${acteDepot}.xml`;
}

/** Pre-export validation matching the official XSD constraints. */
export function validateForTEJExport(records: RSRecord[]): string[] {
  const errors: string[] = [];
  if (records.length === 0) {
    errors.push('Aucun enregistrement RS à exporter');
    return errors;
  }
  records.forEach((r, idx) => {
    const tag = `Certificat #${idx + 1}`;
    if (!r.supplierTaxId)    errors.push(`${tag} : Identifiant du bénéficiaire manquant`);
    if (!r.supplierName)     errors.push(`${tag} : Raison sociale du bénéficiaire manquante`);
    if (!r.invoiceNumber)    errors.push(`${tag} : Numéro de facture manquant`);
    if (!r.invoiceDate)      errors.push(`${tag} : Date de facture manquante`);
    if (!r.paymentDate)      errors.push(`${tag} : Date de paiement manquante`);
    if (r.rsAmount <= 0)     errors.push(`${tag} : Le montant retenu doit être positif`);
    if (r.amountPaid <= 0)   errors.push(`${tag} : Le montant brut doit être positif`);
    if (r.rsAmount > r.amountPaid)
      errors.push(`${tag} : La retenue dépasse le montant brut`);
    // Beneficiary must be classified (PM/PP). Legacy rows without it default to PM.
    if (r.beneficiaireCategorie && !['PM', 'PP'].includes(r.beneficiaireCategorie))
      errors.push(`${tag} : CategorieContribuable invalide (PM ou PP attendu)`);
  });
  // Duplicates: same invoice + payment date == TEJ rejects
  const keys = records.map(r => `${r.invoiceNumber}|${r.paymentDate}`);
  const dups = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dups.length > 0)
    errors.push(`Doublons détectés : ${[...new Set(dups)].join(', ')}`);
  return errors;
}

/** Full client-side export workflow: validate → generate → download → log. */
export function exportTEJFile(
  declarant: TEJDeclarant,
  records: RSRecord[],
  year: number,
  month: number,
  options: TEJExportOptions = {},
): { success: boolean; fileName?: string; errors?: string[] } {
  const errors = validateForTEJExport(records);
  if (errors.length > 0) return { success: false, errors };

  const acteDepot = options.acteDepot ?? 0;
  const xml = generateTEJXml(declarant, records, year, month, options);
  const fileName = generateTEJFileName(declarant.taxId, year, month, acteDepot);

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const log: TEJExportLog = {
    id: `TEJ-${Date.now()}`,
    fileName,
    exportDate: new Date().toISOString(),
    exportedBy: 'current-user',
    month,
    year,
    recordCount: records.length,
    totalRSAmount: records.reduce((s, r) => s + r.rsAmount, 0),
    status: 'success',
  };
  saveTEJExportLog(log);
  return { success: true, fileName };
}
