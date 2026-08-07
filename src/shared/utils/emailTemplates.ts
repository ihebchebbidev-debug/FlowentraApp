/**
 * Professional HTML email templates for offers, sales, and service orders.
 * Bilingual: EN / FR based on user language.
 */

interface EmailTemplateParams {
  type: 'offer' | 'sale' | 'serviceOrder';
  lang: string;
  documentNumber: string;
  documentTitle?: string;
  customerName: string;
  totalAmount?: string;
  companyName?: string;
}

export function generateEmailSubject(params: EmailTemplateParams): string {
  const { type, lang, documentNumber, documentTitle } = params;
  const isEn = lang.startsWith('en');

  switch (type) {
    case 'offer':
      return isEn
        ? `Quotation ${documentNumber}${documentTitle ? ` - ${documentTitle}` : ''}`
        : `Devis ${documentNumber}${documentTitle ? ` - ${documentTitle}` : ''}`;
    case 'sale':
      return isEn
        ? `Sales Order ${documentNumber}${documentTitle ? ` - ${documentTitle}` : ''}`
        : `Bon de commande ${documentNumber}${documentTitle ? ` - ${documentTitle}` : ''}`;
    case 'serviceOrder':
      return isEn
        ? `Service Order ${documentNumber}`
        : `Bon de service ${documentNumber}`;
  }
}

export function generateEmailBody(params: EmailTemplateParams): string {
  const { type, lang, documentNumber, documentTitle, customerName, totalAmount } = params;
  const isEn = lang.startsWith('en');

  switch (type) {
    case 'offer':
      return isEn
        ? `Dear ${customerName},\n\nPlease find attached our quotation ${documentNumber}${documentTitle ? ` for "${documentTitle}"` : ''}.\n\n${totalAmount ? `Total amount: ${totalAmount}\n\n` : ''}We remain at your disposal for any questions.\n\nBest regards`
        : `Cher(e) ${customerName},\n\nVeuillez trouver ci-joint notre devis ${documentNumber}${documentTitle ? ` pour "${documentTitle}"` : ''}.\n\n${totalAmount ? `Montant total : ${totalAmount}\n\n` : ''}Nous restons à votre disposition pour toute question.\n\nCordialement`;
    case 'sale':
      return isEn
        ? `Dear ${customerName},\n\nPlease find attached our sales order ${documentNumber}${documentTitle ? ` for "${documentTitle}"` : ''}.\n\n${totalAmount ? `Total amount: ${totalAmount}\n\n` : ''}We remain at your disposal for any questions.\n\nBest regards`
        : `Cher(e) ${customerName},\n\nVeuillez trouver ci-joint notre bon de commande ${documentNumber}${documentTitle ? ` pour "${documentTitle}"` : ''}.\n\n${totalAmount ? `Montant total : ${totalAmount}\n\n` : ''}Nous restons à votre disposition pour toute question.\n\nCordialement`;
    case 'serviceOrder':
      return isEn
        ? `Dear ${customerName},\n\nPlease find attached our service order ${documentNumber}.\n\nWe remain at your disposal for any questions.\n\nBest regards`
        : `Cher(e) ${customerName},\n\nVeuillez trouver ci-joint notre bon de service ${documentNumber}.\n\nNous restons à votre disposition pour toute question.\n\nCordialement`;
  }
}

export function generateProfessionalHtml(params: EmailTemplateParams & { bodyText: string; companyName?: string }): string {
  const { type, lang, documentNumber, documentTitle, customerName, totalAmount, bodyText, companyName } = params;
  const isEn = lang.startsWith('en');

  const typeLabels = {
    offer: isEn ? 'Quotation' : 'Devis',
    sale: isEn ? 'Sales Order' : 'Bon de commande',
    serviceOrder: isEn ? 'Service Order' : 'Bon de service',
  };

  const accentColor = type === 'offer' ? '#2563eb' : type === 'sale' ? '#059669' : '#7c3aed';
  const label = typeLabels[type];
  const attachLabel = isEn ? 'PDF document attached' : 'Document PDF en pièce jointe';
  const questionsLabel = isEn
    ? 'If you have any questions, feel free to reply to this email.'
    : 'Pour toute question, n\'hésitez pas à répondre à cet e-mail.';

  const formattedBody = bodyText
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px 0;">${line}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <!-- Header -->
  <tr>
    <td style="background:${accentColor};padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            ${companyName ? `<div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">${companyName}</div>` : ''}
            <div style="color:#ffffff;font-size:22px;font-weight:700;">${label} ${documentNumber}</div>
            ${documentTitle ? `<div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px;">${documentTitle}</div>` : ''}
          </td>
          <td align="right" valign="top">
            <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 14px;">
              <span style="color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;">${label}</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${totalAmount ? `
  <!-- Amount bar -->
  <tr>
    <td style="background:${accentColor}11;border-bottom:1px solid ${accentColor}22;padding:14px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#555;font-size:13px;">${isEn ? 'Total Amount' : 'Montant total'}</td>
          <td align="right" style="color:${accentColor};font-size:18px;font-weight:700;">${totalAmount}</td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- Body -->
  <tr>
    <td style="padding:32px;color:#333;font-size:14px;line-height:1.7;">
      ${formattedBody}
    </td>
  </tr>

  <!-- Attachment pill -->
  <tr>
    <td style="padding:0 32px 24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f8f9fb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
        <tr>
          <td style="padding-right:10px;">
            <div style="width:32px;height:32px;background:${accentColor}15;border-radius:6px;text-align:center;line-height:32px;">
              <span style="font-size:16px;">📎</span>
            </div>
          </td>
          <td>
            <div style="font-size:13px;font-weight:600;color:#333;">${attachLabel}</div>
            <div style="font-size:11px;color:#888;margin-top:1px;">${label} ${documentNumber}.pdf</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f8f9fb;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="margin:0;font-size:12px;color:#888;line-height:1.5;">${questionsLabel}</p>
      ${companyName ? `<p style="margin:8px 0 0;font-size:11px;color:#aaa;">© ${new Date().getFullYear()} ${companyName}</p>` : ''}
    </td>
  </tr>
</table>
</td></tr></table>
</body></html>`;
}
