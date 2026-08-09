import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { goodsReceiptService } from "../services/purchaseService";
import type { GoodsReceipt } from "../types";

/**
 * Printable delivery-note style report for a Goods Receipt. No PDF document
 * exists in the module yet, so this page renders a print-stylesheet-friendly
 * HTML view (use the browser's "Print" / "Save as PDF" toolbar).
 *
 * Kept route-symmetric with PurchaseOrder / SupplierInvoice report pages so the
 * Detail screens can ship a uniform "View report" action across all three
 * Purchase entities.
 */
export default function GoodsReceiptReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("purchases");
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const r = await goodsReceiptService.getById(id);
        if (mounted) setReceipt(r);
      } catch (err) {
        console.error("[GoodsReceiptReportPage] load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-background">
        <p className="text-muted-foreground">
          {t("receipts.notFound", "Goods receipt not found")}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("actions.back", "Back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 me-1" />
          {t("actions.back", "Back")}
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 me-1" />
          {t("actions.print", "Print / Save PDF")}
        </Button>
      </div>

      {/* Sheet */}
      <div className="mx-auto max-w-3xl bg-card text-card-foreground shadow-sm my-6 p-8 print:my-0 print:shadow-none print:p-6">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("pdf.deliveryNote", "DELIVERY NOTE")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("fields.receiptNumber", "Receipt N°")}: {receipt.receiptNumber}
            </p>
          </div>
          <div className="text-end text-sm">
            <div>
              <span className="text-muted-foreground">
                {t("fields.date", "Date")}:{" "}
              </span>
              {new Date(receipt.receiptDate).toLocaleDateString()}
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("fields.status", "Status")}:{" "}
              </span>
              {t(`receiptStatus.${receipt.status}`, receipt.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {t("pdf.supplier", "Supplier")}
            </h2>
            <p className="font-medium">{receipt.supplierName}</p>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {t("pdf.linkedOrder", "Linked Purchase Order")}
            </h2>
            <p className="font-medium">
              {receipt.purchaseOrderNumber || receipt.purchaseOrderId}
            </p>
            {receipt.deliveryNoteRef && (
              <p className="text-muted-foreground text-xs mt-1">
                {t("fields.deliveryNoteRef", "Delivery Note Ref")}:{" "}
                {receipt.deliveryNoteRef}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="py-2 text-start">{t("pdf.article", "Article")}</th>
                <th className="py-2 text-end">{t("pdf.ordered", "Ordered")}</th>
                <th className="py-2 text-end">
                  {t("pdf.received", "Received")}
                </th>
                <th className="py-2 text-end">
                  {t("pdf.rejected", "Rejected")}
                </th>
                <th className="py-2 text-start">{t("pdf.notes", "Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((it) => (
                <tr key={it.id} className="border-b border-border/60">
                  <td className="py-2">
                    <div className="font-medium">
                      {it.articleName || it.articleNumber || "—"}
                    </div>
                    {it.articleNumber && it.articleName && (
                      <div className="text-xs text-muted-foreground">
                        {it.articleNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-end">{it.orderedQty}</td>
                  <td className="py-2 text-end">{it.quantityReceived}</td>
                  <td className="py-2 text-end">{it.quantityRejected}</td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {it.notes || it.rejectionReason || ""}
                  </td>
                </tr>
              ))}
              {(!receipt.items || receipt.items.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground text-xs"
                  >
                    {t("receipts.noItems", "No items on this receipt")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {receipt.notes && (
          <div className="mt-8 border-t border-border pt-4 text-sm">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {t("pdf.additionalNotes", "Additional Notes")}
            </h2>
            <p className="whitespace-pre-wrap">{receipt.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mt-12 text-sm">
          <div>
            <div className="h-16 border-b border-dashed border-border mb-1" />
            <p className="text-xs text-muted-foreground">
              {t("pdf.receivedBy", "Received by")}: {receipt.receivedByName || receipt.receivedBy}
            </p>
          </div>
          <div>
            <div className="h-16 border-b border-dashed border-border mb-1" />
            <p className="text-xs text-muted-foreground">
              {t("pdf.supplierSignature", "Supplier signature")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
