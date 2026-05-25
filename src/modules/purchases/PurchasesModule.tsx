import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const PurchasesCockpit = lazy(() => import("./pages/PurchasesCockpit"));
const PurchaseOrderDetailPage = lazy(() => import("./pages/PurchaseOrderDetailPage"));
const CreatePurchaseOrderPage = lazy(() => import("./pages/CreatePurchaseOrderPage"));
const GoodsReceiptDetailPage = lazy(() => import("./pages/GoodsReceiptDetailPage"));
const CreateGoodsReceiptPage = lazy(() => import("./pages/CreateGoodsReceiptPage"));
const EditGoodsReceiptPage = lazy(() => import("./pages/EditGoodsReceiptPage"));
const SupplierInvoiceDetailPage = lazy(() => import("./pages/SupplierInvoiceDetailPage"));
const CreateSupplierInvoicePage = lazy(() => import("./pages/CreateSupplierInvoicePage"));

import { PluginGate } from "@/modules/shared/plugins";

export function PurchasesModule() {
  return (
    <PluginGate code="PL0025PURCHASES">
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Unified Purchases cockpit with tabs */}
          <Route index element={<PurchasesCockpit />} />

          {/* Purchase Orders — list folded into cockpit; create + detail keep dedicated routes */}
          <Route path="orders" element={<Navigate to="..?tab=orders" replace />} />
          <Route path="orders/add" element={<CreatePurchaseOrderPage />} />
          <Route path="orders/:id" element={<PurchaseOrderDetailPage />} />

          {/* Goods Receipts */}
          <Route path="receipts" element={<Navigate to="..?tab=receipts" replace />} />
          <Route path="receipts/add" element={<CreateGoodsReceiptPage />} />
          <Route path="receipts/:id" element={<GoodsReceiptDetailPage />} />
          <Route path="receipts/:id/edit" element={<EditGoodsReceiptPage />} />

          {/* Supplier Invoices */}
          <Route path="invoices" element={<Navigate to="..?tab=invoices" replace />} />
          <Route path="invoices/add" element={<CreateSupplierInvoicePage />} />
          <Route path="invoices/:id" element={<SupplierInvoiceDetailPage />} />

          {/* Compliance, Audit & Reports are now sub-tabs under /purchases?tab=insights */}
          <Route path="compliance" element={<Navigate to="..?tab=insights" replace />} />
          <Route path="audit-log" element={<Navigate to="..?tab=insights" replace />} />
          <Route path="reports" element={<Navigate to="..?tab=insights" replace />} />
          <Route path="reports/*" element={<Navigate to="..?tab=insights" replace />} />
        </Routes>
      </Suspense>
    </PluginGate>
  );
}
