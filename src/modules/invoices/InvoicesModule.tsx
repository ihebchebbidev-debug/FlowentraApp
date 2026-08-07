import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";

const InvoiceReportPage = lazy(() => import("./pages/InvoiceReportPage"));
const InvoiceReconciliationPage = lazy(() => import("./pages/InvoiceReconciliationPage"));

export function InvoicesModule() {
  return (
    <PluginGate code="PL0004INVOICES">
      <Routes>
        <Route index element={<PermissionRoute module="sales" action="read"><InvoicesPage /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="sales" action="read"><InvoiceDetailPage /></PermissionRoute>} />
        <Route path=":id/report" element={<PermissionRoute module="sales" action="read"><Suspense fallback={null}><InvoiceReportPage /></Suspense></PermissionRoute>} />
        <Route path="reconciliation" element={<PermissionRoute module="sales" action="read"><Suspense fallback={null}><InvoiceReconciliationPage /></Suspense></PermissionRoute>} />
        <Route path=":id/reconciliation" element={<PermissionRoute module="sales" action="read"><Suspense fallback={null}><InvoiceReconciliationPage /></Suspense></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}

export default InvoicesModule;
