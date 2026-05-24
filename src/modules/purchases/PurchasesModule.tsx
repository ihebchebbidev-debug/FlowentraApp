import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const PurchaseDashboard = lazy(() => import("./pages/PurchaseDashboard"));
const PurchaseOrderListPage = lazy(() => import("./pages/PurchaseOrderListPage"));
const PurchaseOrderDetailPage = lazy(() => import("./pages/PurchaseOrderDetailPage"));
const CreatePurchaseOrderPage = lazy(() => import("./pages/CreatePurchaseOrderPage"));
const GoodsReceiptListPage = lazy(() => import("./pages/GoodsReceiptListPage"));
const GoodsReceiptDetailPage = lazy(() => import("./pages/GoodsReceiptDetailPage"));
const CreateGoodsReceiptPage = lazy(() => import("./pages/CreateGoodsReceiptPage"));
const EditGoodsReceiptPage = lazy(() => import("./pages/EditGoodsReceiptPage"));
const SupplierInvoiceListPage = lazy(() => import("./pages/SupplierInvoiceListPage"));
const SupplierInvoiceDetailPage = lazy(() => import("./pages/SupplierInvoiceDetailPage"));
const CreateSupplierInvoicePage = lazy(() => import("./pages/CreateSupplierInvoicePage"));
const ComplianceDashboardPage = lazy(() => import("./pages/ComplianceDashboardPage"));
const PurchaseReportsPage = lazy(() => import("./pages/PurchaseReportsPage"));
const PurchaseAuditLogPage = lazy(() => import("./pages/PurchaseAuditLogPage"));
const SupplierPerformancePage = lazy(() => import("./pages/SupplierPerformancePage"));
const PriceEvolutionPage = lazy(() => import("./pages/PriceEvolutionPage"));
const SupplierInvoiceAgingPage = lazy(() => import("./pages/SupplierInvoiceAgingPage"));

import { PluginGate } from "@/modules/shared/plugins";

export function PurchasesModule() {
  return (
    <PluginGate code="PL0025PURCHASES">
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Single source-of-truth dashboard (no redundant hub wrapper) */}
          <Route index element={<PurchaseDashboard />} />

          {/* Purchase Orders */}
          <Route path="orders" element={<PurchaseOrderListPage />} />
          <Route path="orders/add" element={<CreatePurchaseOrderPage />} />
          <Route path="orders/:id" element={<PurchaseOrderDetailPage />} />

          {/* Goods Receipts */}
          <Route path="receipts" element={<GoodsReceiptListPage />} />
          <Route path="receipts/add" element={<CreateGoodsReceiptPage />} />
          <Route path="receipts/:id" element={<GoodsReceiptDetailPage />} />
          <Route path="receipts/:id/edit" element={<EditGoodsReceiptPage />} />

          {/* Supplier Invoices */}
          <Route path="invoices" element={<SupplierInvoiceListPage />} />
          <Route path="invoices/add" element={<CreateSupplierInvoicePage />} />
          <Route path="invoices/:id" element={<SupplierInvoiceDetailPage />} />

          {/* Compliance & Audit */}
          <Route path="compliance" element={<ComplianceDashboardPage />} />
          <Route path="audit-log" element={<PurchaseAuditLogPage />} />

          {/* Reports — overview + drill-down sub-pages */}
          <Route path="reports" element={<PurchaseReportsPage />} />
          <Route path="reports/supplier-performance" element={<SupplierPerformancePage />} />
          <Route path="reports/price-evolution" element={<PriceEvolutionPage />} />
          <Route path="reports/aging" element={<SupplierInvoiceAgingPage />} />
        </Routes>
      </Suspense>
    </PluginGate>
  );
}
