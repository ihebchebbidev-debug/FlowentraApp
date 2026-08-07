import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";

import PurchasesLayout from "./components/PurchasesLayout";

// Module landing
const PurchaseDashboard = lazy(() => import("./pages/PurchaseDashboard"));

// Purchase Orders
const PurchaseOrderListPage = lazy(() => import("./pages/PurchaseOrderListPage"));
const PurchaseOrderDetailPage = lazy(() => import("./pages/PurchaseOrderDetailPage"));
const CreatePurchaseOrderPage = lazy(() => import("./pages/CreatePurchaseOrderPage"));
const PurchaseOrderReportPage = lazy(() => import("./pages/PurchaseOrderReportPage"));

// Goods Receipts
const GoodsReceiptListPage = lazy(() => import("./pages/GoodsReceiptListPage"));
const GoodsReceiptDetailPage = lazy(() => import("./pages/GoodsReceiptDetailPage"));
const CreateGoodsReceiptPage = lazy(() => import("./pages/CreateGoodsReceiptPage"));
const EditGoodsReceiptPage = lazy(() => import("./pages/EditGoodsReceiptPage"));
const GoodsReceiptReportPage = lazy(() => import("./pages/GoodsReceiptReportPage"));

// Supplier Invoices
const SupplierInvoiceListPage = lazy(() => import("./pages/SupplierInvoiceListPage"));
const SupplierInvoiceDetailPage = lazy(() => import("./pages/SupplierInvoiceDetailPage"));
const CreateSupplierInvoicePage = lazy(() => import("./pages/CreateSupplierInvoicePage"));
const SupplierInvoiceReportPage = lazy(() => import("./pages/SupplierInvoiceReportPage"));

// Insights — now flat top-level routes (no more nested tabs).
const ComplianceDashboardPage = lazy(() => import("./pages/ComplianceDashboardPage"));
const PurchaseAuditLogPage = lazy(() => import("./pages/PurchaseAuditLogPage"));
const PurchaseReportsPage = lazy(() => import("./pages/PurchaseReportsPage"));
const SupplierPerformancePage = lazy(() => import("./pages/SupplierPerformancePage"));
const PriceEvolutionPage = lazy(() => import("./pages/PriceEvolutionPage"));
const SupplierInvoiceAgingPage = lazy(() => import("./pages/SupplierInvoiceAgingPage"));

/**
 * Purchases module routing.
 *
 * Structural alignment with Offers / Sales / Service-Orders:
 *  - Every section is a real, bookmarkable URL (no more `?tab=…` cockpit).
 *  - Per-entity routes follow the same quartet: list / add / :id / :id/report.
 *  - GoodsReceipt keeps its existing :id/edit route (already present); Edit
 *    pages for Purchase Orders and Supplier Invoices remain in-detail today —
 *    the `:id` route covers both view and (where allowed) edit.
 *  - Report pages mount OUTSIDE the layout so the PDF viewer / printable
 *    sheet takes the full viewport, matching OfferReportPage / SaleReportPage.
 */
export function PurchasesModule() {
  return (
    <PluginGate code="PL0025PURCHASES">
      <PermissionRoute module="purchases" action="read">
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Full-viewport report pages — no shared chrome */}
          <Route
            path="orders/:id/report"
            element={<PurchaseOrderReportPage />}
          />
          <Route
            path="receipts/:id/report"
            element={<GoodsReceiptReportPage />}
          />
          <Route
            path="invoices/:id/report"
            element={<SupplierInvoiceReportPage />}
          />

          {/* Everything else lives under the Purchases layout (sub-nav + Outlet) */}
          <Route element={<PurchasesLayout />}>
            <Route index element={<PurchaseDashboard />} />

            {/* Purchase Orders */}
            <Route path="orders" element={<PurchaseOrderListPage />} />
            <Route path="orders/add" element={
              <PermissionRoute module="purchases" action="create"><CreatePurchaseOrderPage /></PermissionRoute>
            } />
            <Route path="orders/:id" element={<PurchaseOrderDetailPage />} />

            {/* Goods Receipts */}
            <Route path="receipts" element={<GoodsReceiptListPage />} />
            <Route path="receipts/add" element={
              <PermissionRoute module="purchases" action="create"><CreateGoodsReceiptPage /></PermissionRoute>
            } />
            <Route path="receipts/:id" element={<GoodsReceiptDetailPage />} />
            <Route path="receipts/:id/edit" element={
              <PermissionRoute module="purchases" action="update"><EditGoodsReceiptPage /></PermissionRoute>
            } />

            {/* Supplier Invoices */}
            <Route path="invoices" element={<SupplierInvoiceListPage />} />
            <Route path="invoices/add" element={
              <PermissionRoute module="purchases" action="create"><CreateSupplierInvoicePage /></PermissionRoute>
            } />
            <Route path="invoices/:id" element={<SupplierInvoiceDetailPage />} />

            {/* Compliance & audit */}
            <Route path="compliance" element={<ComplianceDashboardPage />} />
            <Route path="audit-log" element={
              <PermissionRoute module="audit_logs" action="read"><PurchaseAuditLogPage /></PermissionRoute>
            } />

            {/* Reports (overview + dedicated sub-reports) */}
            <Route path="reports" element={<PurchaseReportsPage />} />

            <Route
              path="reports/supplier-performance"
              element={<SupplierPerformancePage />}
            />
            <Route
              path="reports/price-evolution"
              element={<PriceEvolutionPage />}
            />
            <Route
              path="reports/aging"
              element={<SupplierInvoiceAgingPage />}
            />

            {/* Legacy redirects — older bookmarks / external links resolved via
                the documented routes table. Anything unmatched falls back to
                the module landing. */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Route>
        </Routes>
      </Suspense>
      </PermissionRoute>
    </PluginGate>
  );
}
