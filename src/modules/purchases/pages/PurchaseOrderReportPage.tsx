import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { PurchaseOrderPDFDocument } from "../components/PurchaseOrderPDFDocument";
import { purchaseOrderService } from "../services/purchaseService";
import {
  defaultSettings,
  getCompanyLogoBase64,
} from "@/modules/offers/utils/pdfSettings.utils";
import { PdfSettingsService } from "@/modules/sales/services/pdfSettings.service";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useCurrency } from "@/shared/hooks/useCurrency";

/**
 * Full-screen PDF report for a Purchase Order, mirroring OfferReportPage.
 * Mounted at `/dashboard/purchases/orders/:id/report` outside the Purchases
 * layout so the viewer takes the whole viewport.
 */
export default function PurchaseOrderReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation("purchases");
  const { format: formatCurrency, current: currency } = useCurrency();
  const companyLogo = useCompanyLogo();

  const [order, setOrder] = useState<any>(null);
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [fetched, settings] = await Promise.all([
          purchaseOrderService.getById(id),
          PdfSettingsService.loadSettingsAsync(),
        ]);
        if (!mounted) return;
        setOrder(fetched);
        const logoBase64 = await getCompanyLogoBase64(companyLogo);
        setPdfSettings({
          ...settings,
          company: { ...settings.company, logo: logoBase64 || "" },
        } as any);
      } catch (err) {
        console.error("[PurchaseOrderReportPage] load failed", err);
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
      purchaseOrder: t("pdf.purchaseOrder", "PURCHASE ORDER"),
      orderNumber: t("pdf.orderNumber", "Order N°"),
      date: t("pdf.date", "Date"),
      supplierInformation: t("pdf.supplierInformation", "Supplier Information"),
      orderDetails: t("pdf.orderDetails", "Order Details"),
      name: t("pdf.name", "Name"),
      email: t("pdf.email", "Email"),
      phone: t("pdf.phone", "Phone"),
      address: t("pdf.address", "Address"),
      taxId: t("pdf.taxId", "Tax ID"),
      status: t("pdf.status", "Status"),
      expectedDelivery: t("pdf.expectedDelivery", "Expected Delivery"),
      paymentTerms: t("pdf.paymentTerms", "Payment Terms"),
      description: t("pdf.description", "Description"),
      supplierRef: t("pdf.supplierRef", "Supplier Ref"),
      pos: t("pdf.pos", "Pos"),
      qty: t("pdf.qty", "Qty"),
      unit: t("pdf.unit", "Unit Price"),
      total: t("pdf.total", "Total"),
      subtotal: t("pdf.subtotal", "Subtotal"),
      tax: t("pdf.tax", "Tax"),
      tva: t("pdf.tva", "TVA"),
      discount: t("pdf.discount", "Discount"),
      fiscalStamp: t("pdf.fiscalStamp", "Fiscal Stamp"),
      additionalNotes: t("pdf.additionalNotes", "Additional Notes"),
      amountInWords: t("pdf.amountInWords", "Amount in Words"),
      page: t("pdf.page", "Page"),
      statusValue: t(`status.${order?.status || "draft"}`, {
        defaultValue: order?.status || "draft",
      }),
    }),
    [t, order?.status],
  );

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PDFViewer width="100%" height="100%" showToolbar>
        <PurchaseOrderPDFDocument
          order={order}
          formatCurrency={formatCurrency}
          settings={pdfSettings}
          translations={pdfTranslations}
          language={i18n.language}
          currencyCode={order?.currency || currency.code}
        />
      </PDFViewer>
    </div>
  );
}
