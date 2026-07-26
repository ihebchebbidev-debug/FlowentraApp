import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { SalesList } from "./components/SalesList";
import { SaleDetail } from "./components/SaleDetail";
import { AddSale } from "./pages/AddSale";
import { EditSale } from "./pages/EditSale";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
const SaleReportPage = lazy(() => import("./pages/SaleReportPage"));

export function SalesModule() {
  return (
    <PluginGate code="PL0002SALES">
      <Routes>
        <Route index element={<PermissionRoute module="sales" action="read"><SalesList /></PermissionRoute>} />
        <Route path="add" element={<PermissionRoute module="sales" action="create"><AddSale /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="sales" action="read"><SaleDetail /></PermissionRoute>} />
        <Route path=":id/edit" element={<PermissionRoute module="sales" action="update"><EditSale /></PermissionRoute>} />
        <Route path=":id/report" element={<PermissionRoute module="sales" action="read"><Suspense fallback={null}><SaleReportPage /></Suspense></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}
