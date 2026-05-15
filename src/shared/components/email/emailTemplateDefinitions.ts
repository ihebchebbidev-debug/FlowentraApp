/**
 * Professional email template definitions.
 * Clean, black-and-white corporate layouts.
 * Bilingual: EN / FR.
 */

export type DocumentType = 'offer' | 'sale' | 'serviceOrder' | 'dispatch';

export interface EmailTemplateVars {
  type: DocumentType;
  lang: string;
  documentNumber: string;
  documentTitle?: string;
  customerName: string;
  totalAmount?: string;
  companyName?: string;
  companyLogoUrl?: string;
  bodyText: string;
  date?: string;
  signature?: string;
}

// ── Signature persistence ──────────────────────────────────────────────
const SIGNATURE_KEY = 'email-signature';
const SIGNATURE_ENABLED_KEY = 'email-signature-enabled';

export function getSavedSignature(): string {
  try { return localStorage.getItem(SIGNATURE_KEY) || ''; } catch { return ''; }
}

export function saveSignature(sig: string): void {
  try { localStorage.setItem(SIGNATURE_KEY, sig); } catch { /* ignore */ }
}

export function getSignatureEnabled(): boolean {
  try { return localStorage.getItem(SIGNATURE_ENABLED_KEY) !== 'false'; } catch { return true; }
}

export function setSignatureEnabled(enabled: boolean): void {
  try { localStorage.setItem(SIGNATURE_ENABLED_KEY, String(enabled)); } catch { /* ignore */ }
}

export interface EmailTemplateDefinition {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  previewAccent: string;
  render: (vars: EmailTemplateVars) => string;
}

// ── helpers ────────────────────────────────────────────────────────────
const isEn = (lang: string) => lang.startsWith('en');

function logoHtml(url?: string): string {
  if (!url) return '';
  return `<img src="${url}" alt="Company logo" style="max-width:180px;max-height:60px;display:block;" />`;
}

const typeLabels = (type: DocumentType, lang: string) => {
  const en = lang.startsWith('en');
  const map: Record<DocumentType, [string, string]> = {
    offer: ['Quotation', 'Devis'],
    sale: ['Sales Order', 'Bon de commande'],
    serviceOrder: ['Service Order', 'Bon de service'],
    dispatch: ['Dispatch', 'Expédition'],
  };
  return en ? map[type][0] : map[type][1];
};

function formatSignatureHtml(sig: string): string {
  if (!sig.trim()) return '';
  const lines = sig.split('\n').map(l =>
    l.trim() === '' ? '<br/>' : `<p style="margin:0 0 2px 0;font-size:12px;line-height:1.5;color:#666666;">${l}</p>`
  ).join('');
  return `<div style="margin-top:24px;padding-top:14px;border-top:1px solid #cccccc;">${lines}</div>`;
}

function bodyWithSignature(v: { bodyText: string; signature?: string }): string {
  return v.bodyText + (v.signature ? formatSignatureHtml(v.signature) : '');
}

function today(lang: string): string {
  return new Date().toLocaleDateString(lang.startsWith('en') ? 'en-GB' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Subject generators ─────────────────────────────────────────────────
export function generateSubject(vars: Pick<EmailTemplateVars, 'type' | 'lang' | 'documentNumber' | 'documentTitle'>): string {
  const label = typeLabels(vars.type, vars.lang);
  const title = vars.documentTitle ? ` - ${vars.documentTitle}` : '';
  return `${label} ${vars.documentNumber}${title}`;
}

export function generateDefaultBody(vars: Pick<EmailTemplateVars, 'type' | 'lang' | 'documentNumber' | 'documentTitle' | 'customerName' | 'totalAmount'>): string {
  const en = isEn(vars.lang);
  const label = typeLabels(vars.type, vars.lang).toLowerCase();
  const titlePart = vars.documentTitle ? (en ? ` for "${vars.documentTitle}"` : ` pour "${vars.documentTitle}"`) : '';

  return en
    ? `Dear ${vars.customerName},\n\nPlease find attached our ${label} ${vars.documentNumber}${titlePart}.\n\nWe remain at your disposal for any questions.\n\nBest regards`
    : `Cher(e) ${vars.customerName},\n\nVeuillez trouver ci-joint notre ${label} ${vars.documentNumber}${titlePart}.\n\nNous restons à votre disposition pour toute question.\n\nCordialement`;
}

// ── TEMPLATE 1: Classic Formal ─────────────────────────────────────────
const classicFormal: EmailTemplateDefinition = {
  id: 'classic-formal',
  nameEn: 'Classic Formal',
  nameFr: 'Classique Formel',
  descriptionEn: 'Traditional black & white business letter',
  descriptionFr: 'Lettre d\'affaires noir et blanc traditionnelle',
  previewAccent: '#111111',
  render: (v) => {
    const label = typeLabels(v.type, v.lang);
    const d = v.date || today(v.lang);
    const en = isEn(v.lang);
    const attach = en ? 'Enclosed' : 'Ci-joint';

    return `<!DOCTYPE html><html lang="${v.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Times New Roman',Times,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr><td style="padding:0 0 20px;border-bottom:2px solid #111111;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>${v.companyLogoUrl ? logoHtml(v.companyLogoUrl) : (v.companyName ? `<div style="font-size:18px;font-weight:700;color:#111111;letter-spacing:0.5px;">${v.companyName}</div>` : '')}</td>
      <td align="right"><div style="font-size:12px;color:#666666;font-family:Helvetica,Arial,sans-serif;">${d}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 0 0;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#888888;font-family:Helvetica,Arial,sans-serif;">${label}</div>
    <div style="font-size:22px;font-weight:700;color:#111111;margin-top:4px;">${v.documentNumber}</div>
    ${v.documentTitle ? `<div style="font-size:14px;color:#555555;margin-top:4px;font-style:italic;">${v.documentTitle}</div>` : ''}
  </td></tr>
  <tr><td style="padding:28px 0;color:#333333;font-size:14px;line-height:1.8;">${bodyWithSignature(v)}</td></tr>
  <tr><td style="border-top:1px solid #dddddd;padding:16px 0;">
    <span style="font-size:12px;color:#888888;font-family:Helvetica,Arial,sans-serif;">${attach}: </span>
    <span style="font-size:12px;font-weight:600;color:#333333;font-family:Helvetica,Arial,sans-serif;">${label} ${v.documentNumber}.pdf</span>
  </td></tr>
  <tr><td style="border-top:2px solid #111111;padding-top:14px;">
    <p style="margin:0;font-size:10px;color:#bbbbbb;font-family:Helvetica,Arial,sans-serif;">${v.companyName ? `© ${new Date().getFullYear()} ${v.companyName}` : ''}</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  },
};

// ── TEMPLATE 2: Clean Minimal ──────────────────────────────────────────
const cleanMinimal: EmailTemplateDefinition = {
  id: 'clean-minimal',
  nameEn: 'Clean Minimal',
  nameFr: 'Minimaliste',
  descriptionEn: 'Ultra-clean white space layout',
  descriptionFr: 'Mise en page épurée avec espaces blancs',
  previewAccent: '#333333',
  render: (v) => {
    const label = typeLabels(v.type, v.lang);
    const d = v.date || today(v.lang);
    const en = isEn(v.lang);

    return `<!DOCTYPE html><html lang="${v.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e8e8;">
  <tr><td style="padding:36px 40px 0;">
    ${v.companyLogoUrl ? `<div style="margin-bottom:24px;">${logoHtml(v.companyLogoUrl)}</div>` : (v.companyName ? `<div style="font-size:13px;font-weight:700;color:#111111;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px;">${v.companyName}</div>` : '')}
    <div style="font-size:24px;font-weight:300;color:#111111;letter-spacing:-0.5px;">${label}</div>
    <div style="font-size:14px;color:#999999;margin-top:6px;">${v.documentNumber}${v.documentTitle ? ` — ${v.documentTitle}` : ''}</div>
    <div style="font-size:11px;color:#bbbbbb;margin-top:4px;">${d}</div>
  </td></tr>
  <tr><td style="padding:32px 40px;color:#333333;font-size:14px;line-height:1.75;">${bodyWithSignature(v)}</td></tr>
  <tr><td style="padding:0 40px 32px;">
    <div style="background:#f5f5f5;padding:12px 16px;font-size:12px;color:#666666;">
      📎 <strong style="color:#333333;">${label} ${v.documentNumber}.pdf</strong>
    </div>
  </td></tr>
  <tr><td style="border-top:1px solid #eeeeee;padding:16px 40px;">
    <p style="margin:0;font-size:10px;color:#cccccc;">${v.companyName ? `© ${new Date().getFullYear()} ${v.companyName}` : ''}</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  },
};

// ── TEMPLATE 3: Executive Letterhead ───────────────────────────────────
const executiveLetterhead: EmailTemplateDefinition = {
  id: 'executive-letterhead',
  nameEn: 'Executive Letterhead',
  nameFr: 'En-tête Direction',
  descriptionEn: 'Premium letterhead with dark header bar',
  descriptionFr: 'Papier à en-tête premium avec bandeau sombre',
  previewAccent: '#1a1a1a',
  render: (v) => {
    const label = typeLabels(v.type, v.lang);
    const d = v.date || today(v.lang);
    const en = isEn(v.lang);
    const attach = en ? 'Document attached' : 'Document joint';

    return `<!DOCTYPE html><html lang="${v.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;overflow:hidden;">
  <tr><td style="background:#1a1a1a;padding:28px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>${v.companyLogoUrl ? logoHtml(v.companyLogoUrl) : (v.companyName ? `<div style="color:#ffffff;font-size:16px;font-weight:600;letter-spacing:0.5px;">${v.companyName}</div>` : '')}</td>
      <td align="right"><div style="color:#999999;font-size:11px;">${d}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:32px 40px 0;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:#999999;margin-bottom:6px;">${label}</div>
    <div style="font-size:26px;font-weight:700;color:#111111;letter-spacing:-0.5px;">${v.documentNumber}</div>
    ${v.documentTitle ? `<div style="font-size:14px;color:#666666;margin-top:6px;">${v.documentTitle}</div>` : ''}
  </td></tr>
  <tr><td style="padding:28px 40px;color:#333333;font-size:14px;line-height:1.8;">${bodyWithSignature(v)}</td></tr>
  <tr><td style="padding:0 40px 28px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;"><tr>
      <td style="background:#1a1a1a;padding:12px 18px;">
        <span style="color:#999999;font-size:11px;">📎 ${attach}: </span>
        <span style="color:#ffffff;font-size:12px;font-weight:600;">${label} ${v.documentNumber}.pdf</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="border-top:1px solid #eeeeee;padding:16px 40px;">
    <p style="margin:0;font-size:10px;color:#cccccc;">${v.companyName ? `© ${new Date().getFullYear()} ${v.companyName}` : ''}</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  },
};

// ── TEMPLATE 4: Refined Serif ──────────────────────────────────────────
const refinedSerif: EmailTemplateDefinition = {
  id: 'refined-serif',
  nameEn: 'Refined Serif',
  nameFr: 'Serif Raffiné',
  descriptionEn: 'Elegant serif typography, understated design',
  descriptionFr: 'Typographie serif élégante, design discret',
  previewAccent: '#2c2c2c',
  render: (v) => {
    const label = typeLabels(v.type, v.lang);
    const d = v.date || today(v.lang);
    const en = isEn(v.lang);

    return `<!DOCTYPE html><html lang="${v.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Times New Roman',Times,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:48px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr><td style="text-align:center;padding-bottom:28px;">
    ${v.companyLogoUrl ? `<div style="margin-bottom:16px;">${logoHtml(v.companyLogoUrl)}</div>` : (v.companyName ? `<div style="font-size:20px;font-weight:700;color:#111111;letter-spacing:1px;">${v.companyName}</div>` : '')}
    <div style="width:40px;height:1px;background:#111111;margin:16px auto;"></div>
  </td></tr>
  <tr><td style="padding:0 0 8px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#999999;font-family:Helvetica,Arial,sans-serif;">${label} ${v.documentNumber}</div></td>
      <td align="right"><div style="font-size:11px;color:#999999;font-family:Helvetica,Arial,sans-serif;">${d}</div></td>
    </tr></table>
  </td></tr>
  ${v.documentTitle ? `<tr><td style="padding:4px 0 0;"><div style="font-size:16px;color:#444444;font-style:italic;">${v.documentTitle}</div></td></tr>` : ''}
  <tr><td style="padding:28px 0;color:#333333;font-size:15px;line-height:1.85;">${bodyWithSignature(v)}</td></tr>
  <tr><td style="border-top:1px solid #dddddd;padding:14px 0;">
    <span style="font-size:12px;color:#888888;font-family:Helvetica,Arial,sans-serif;">📎 </span>
    <span style="font-size:12px;font-weight:600;color:#333333;font-family:Helvetica,Arial,sans-serif;">${label} ${v.documentNumber}.pdf</span>
  </td></tr>
  <tr><td style="padding-top:28px;text-align:center;">
    <div style="width:40px;height:1px;background:#111111;margin:0 auto 12px;"></div>
    <p style="margin:0;font-size:10px;color:#cccccc;font-family:Helvetica,Arial,sans-serif;">${v.companyName ? `© ${new Date().getFullYear()} ${v.companyName}` : ''}</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  },
};

// ── TEMPLATE 5: Corporate Grid ─────────────────────────────────────────
const corporateGrid: EmailTemplateDefinition = {
  id: 'corporate-grid',
  nameEn: 'Corporate Grid',
  nameFr: 'Grille Corporate',
  descriptionEn: 'Structured grid layout with clean borders',
  descriptionFr: 'Mise en page en grille structurée avec bordures nettes',
  previewAccent: '#222222',
  render: (v) => {
    const label = typeLabels(v.type, v.lang);
    const d = v.date || today(v.lang);
    const en = isEn(v.lang);

    return `<!DOCTYPE html><html lang="${v.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dddddd;">
  <tr><td style="padding:24px 32px;border-bottom:1px solid #dddddd;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>${v.companyLogoUrl ? logoHtml(v.companyLogoUrl) : (v.companyName ? `<div style="font-size:15px;font-weight:700;color:#111111;">${v.companyName}</div>` : '')}</td>
      <td align="right"><div style="font-size:11px;color:#999999;">${d}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:24px 32px;border-bottom:1px solid #eeeeee;background:#fafafa;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#888888;">${en ? 'Reference' : 'Référence'}</div>
        <div style="font-size:18px;font-weight:700;color:#111111;margin-top:4px;">${label} ${v.documentNumber}</div>
      </td>
      ${v.documentTitle ? `<td align="right" valign="bottom"><div style="font-size:13px;color:#666666;">${v.documentTitle}</div></td>` : ''}
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 32px;color:#333333;font-size:14px;line-height:1.8;">${bodyWithSignature(v)}</td></tr>
  <tr><td style="padding:0 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #eeeeee;"><tr>
      <td style="padding:10px 16px;background:#fafafa;">
        <span style="font-size:12px;color:#888888;">📎 </span>
        <span style="font-size:12px;font-weight:600;color:#333333;">${label} ${v.documentNumber}.pdf</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="border-top:1px solid #dddddd;padding:14px 32px;background:#fafafa;">
    <p style="margin:0;font-size:10px;color:#bbbbbb;">${v.companyName ? `© ${new Date().getFullYear()} ${v.companyName}` : ''}</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  },
};

// ── TEMPLATE 6: Simple Plain ───────────────────────────────────────────
const simplePlain: EmailTemplateDefinition = {
  id: 'simple-plain',
  nameEn: 'Simple Plain',
  nameFr: 'Simple',
  descriptionEn: 'No frills, text-only professional email',
  descriptionFr: 'E-mail professionnel sobre, texte uniquement',
  previewAccent: '#444444',
  render: (v) => {
    const label = typeLabels(v.type, v.lang);
    const d = v.date || today(v.lang);
    const en = isEn(v.lang);

    return `<!DOCTYPE html><html lang="${v.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr><td style="padding-bottom:20px;">
    ${v.companyLogoUrl ? `<div style="margin-bottom:8px;">${logoHtml(v.companyLogoUrl)}</div>` : (v.companyName ? `<div style="font-size:14px;font-weight:700;color:#111111;margin-bottom:4px;">${v.companyName}</div>` : '')}
    <div style="font-size:12px;color:#999999;">${d}</div>
  </td></tr>
  <tr><td style="padding-bottom:24px;">
    <div style="font-size:13px;color:#888888;">${label} ${v.documentNumber}${v.documentTitle ? ` — ${v.documentTitle}` : ''}</div>
  </td></tr>
  <tr><td style="padding-bottom:24px;color:#333333;font-size:14px;line-height:1.75;">${bodyWithSignature(v)}</td></tr>
  <tr><td style="padding-top:16px;border-top:1px solid #eeeeee;">
    <span style="font-size:12px;color:#888888;">📎 ${label} ${v.documentNumber}.pdf</span>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  },
};

// ── Export all templates ────────────────────────────────────────────────
export const EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  classicFormal,
  cleanMinimal,
  executiveLetterhead,
  refinedSerif,
  corporateGrid,
  simplePlain,
];

export const DEFAULT_TEMPLATE_ID = 'classic-formal';

const STORAGE_KEY = 'email-default-template';

export function getSavedTemplateId(type: DocumentType): string {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return saved[type] || DEFAULT_TEMPLATE_ID;
  } catch { return DEFAULT_TEMPLATE_ID; }
}

export function saveDefaultTemplateId(type: DocumentType, templateId: string): void {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    saved[type] = templateId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch { /* ignore */ }
}
