import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { SupplierInvoicePDFDocument } from "../components/SupplierInvoicePDFDocument";
import { supplierInvoiceService } from "../services/purchaseService";
import {
  defaultSettings,
  getCompanyLogoBase64,
} from "@/modules/offers/utils/pdfSettings.utils";
import { PdfSettingsService } from "@/modules/sales/services/pdfSettings.service";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useCurrency } from "@/shared/hooks/useCurrency";

/**
 * Full-screen PDF report for a Supplier Invoice. Mirrors OfferReportPage.
 */
export default function SupplierInvoiceReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation("purchases");
  const { format: formatCurrency } = useCurrency();
  const companyLogo = useCompanyLogo();

  const [invoice, setInvoice] = useState<any>(null);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [fetched, settings] = await Promise.all([
          supplierInvoiceService.getById(id),
          PdfSettingsService.loadSettingsAsync(),
        ]);
        if (!mounted) return;
        setInvoice(fetched);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({
          ...settings,
          company: { ...settings.company, logo: logoBase64 || "" },
        } as any);
      } catch (err) {
        console.error("[SupplierInvoiceReportPage] load failed", err);
        if (mounted) setPdfSettings(defaultSettings);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, companyLogo]);

  const pdfTranslations = useMemo(
    () => ({
      supplierInvoice: t("pdf.supplierInvoice", "SUPPLIER INVOICE"),
      invoiceNumber: t("pdf.invoiceNumber", "Invoice N°"),
      date: t("pdf.date", "Date"),
      supplierInformation: t("pdf.supplierInformation", "Supplier Information"),
      invoiceDetails: t("pdf.invoiceDetails", "Invoice Details"),
      name: t("pdf.name", "Name"),
      email: t("pdf.email", "Email"),
      phone: t("pdf.phone", "Phone"),
      address: t("pdf.address", "Address"),
      taxId: t("pdf.taxId", "Tax ID"),
      status: t("pdf.status", "Status"),
      dueDate: t("pdf.dueDate", "Due Date"),
      poReference: t("pdf.poReference", "PO Reference"),
      supplierRef: t("pdf.supplierRef", "Supplier Ref"),
      description: t("pdf.description", "Description"),
      pos: t("pdf.pos", "Pos"),
      qty: t("pdf.qty", "Qty"),
      unitPrice: t("pdf.unitPrice", "Unit Price"),
      total: t("pdf.total", "Total"),
      subtotal: t("pdf.subtotal", "Subtotal"),
      tax: t("pdf.tax", "Tax"),
      tva: t("pdf.tva", "TVA"),
      discount: t("pdf.discount", "Discount"),
      fiscalStamp: t("pdf.fiscalStamp", "Fiscal Stamp"),
      rsDeduction: t("pdf.rsDeduction", "RS Deduction"),
      netPayable: t("pdf.netPayable", "Net Payable"),
      additionalNotes: t("pdf.additionalNotes", "Additional Notes"),
      amountInWords: t("pdf.amountInWords", "Amount in Words"),
      page: t("pdf.page", "Page"),
      complianceInfo: t("pdf.complianceInfo", "Compliance Information"),
      rsType: t("pdf.rsType", "RS Type"),
      rsRate: t("pdf.rsRate", "RS Rate"),
      rsAmount: t("pdf.rsAmount", "RS Amount"),
      statusValue: t(`invoiceStatus.${invoice?.status || "draft"}`, {
        defaultValue: invoice?.status || "draft",
      }),
    }),
    [t, invoice?.status],
  );

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar>
        <SupplierInvoicePDFDocument
          invoice={invoice}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
          translations={pdfTranslations}
          language={i18n.language}
          currencyCode={invoice?.currency || "TND"}
        />
      </PDFViewer>
    </div>
  );
}
