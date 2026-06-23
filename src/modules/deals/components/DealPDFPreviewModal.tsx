import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { OfferPDFPreviewModal } from "@/modules/offers/components/OfferPDFPreviewModal";
import type { PdfLabelOverrides } from "@/modules/offers/components/PDF/pdfLabels";
import type { Deal } from "@/services/api/dealsApi";

interface DealPDFPreviewModalProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

/**
 * Deals reuse the exact same PDF viewer + actions (download / print / share /
 * sign / email) as offers. We adapt the Deal into the offer-shaped object the
 * offer PDF stack expects — line items map `lineTotal → totalPrice`, the deal
 * number stands in for the offer number, and the stage maps to status.
 */
export function DealPDFPreviewModal({ deal, isOpen, onClose, formatCurrency }: DealPDFPreviewModalProps) {
  const { t } = useTranslation("deals");

  // Deal-specific wording for the shared PDF document. Generic field labels
  // (date, client, quantity, total, …) keep their existing translations.
  const labelOverrides: PdfLabelOverrides = useMemo(() => ({
    documentType: t("pdf.documentType", { defaultValue: "Deal" }),
    documentNumber: t("pdf.documentNumber", { defaultValue: "Deal Number" }),
    documentDetails: t("pdf.documentDetails", { defaultValue: "Deal Details" }),
    documentItems: t("pdf.documentItems", { defaultValue: "Deal Items" }),
    thankYouMessage: t("pdf.thankYouMessage", { defaultValue: "Thank you for your business." }),
    statusValue: t(`stages.${deal.stage}`, { defaultValue: deal.stage }),
  }), [t, deal.stage]);

  const previewSubtitle = `${deal.dealNumber || `DEAL-${deal.id}`}${deal.title ? ` - ${deal.title}` : ""}`;

  const offerLike = useMemo(() => {
    const items = (deal.items || []).map((it) => {
      const qty = Number(it.quantity) || 0;
      const unit = Number(it.unitPrice) || 0;
      const gross = qty * unit;
      const disc = it.discount
        ? it.discountType === "percentage"
          ? gross * (Number(it.discount) / 100)
          : Number(it.discount)
        : 0;
      const totalPrice = it.lineTotal != null ? Number(it.lineTotal) : gross - disc;
      return { ...it, totalPrice };
    });
    const subtotal = items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
    const c = deal.contact;

    return {
      id: deal.id,
      offerNumber: deal.dealNumber || `DEAL-${deal.id}`,
      title: deal.title,
      status: deal.stage,
      createdAt: deal.createdAt,
      validUntil: deal.expectedCloseDate,
      contactName: deal.contactName || c?.name,
      contactCompany: c?.company,
      contactAddress: [c?.address, c?.city].filter(Boolean).join(", ") || undefined,
      contactPhone: c?.phone,
      contactEmail: c?.email,
      assignedToName: deal.assignedToName || deal.createdByName,
      notes: deal.notes,
      currency: deal.currency,
      // Deals carry no document-level discount / tax / stamp — totals derive
      // purely from the line items.
      discount: 0,
      discountType: "fixed" as const,
      taxes: 0,
      taxType: "percentage" as const,
      fiscalStamp: 0,
      items,
      totalAmount: subtotal,
      amount: subtotal,
      total: subtotal,
    };
  }, [deal]);

  return (
    <OfferPDFPreviewModal
      offer={offerLike}
      isOpen={isOpen}
      onClose={onClose}
      formatCurrency={formatCurrency}
      labelOverrides={labelOverrides}
      previewSubtitle={previewSubtitle}
      filePrefix="deal"
      reportType="deal"
    />
  );
}
