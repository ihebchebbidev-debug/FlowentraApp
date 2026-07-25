import { Routes, Route } from "react-router-dom";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";

export function InvoicesModule() {
  return (
    <PluginGate code="PL0004INVOICES">
      <Routes>
        <Route index element={<PermissionRoute module="sales" action="read"><InvoicesPage /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="sales" action="read"><InvoiceDetailPage /></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}

export default InvoicesModule;
