import { Routes, Route } from "react-router-dom";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
import SuppliersPage from "./pages/SuppliersPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import AddSupplierPage from "./pages/AddSupplierPage";
import { PluginGate } from "@/modules/shared/plugins";

export function SuppliersModule() {
  return (
    <PluginGate code="PL0001CONTACTS">
      <Routes>
        <Route index element={<PermissionRoute module="contacts" action="read"><SuppliersPage /></PermissionRoute>} />
        <Route path="add" element={<PermissionRoute module="contacts" action="create"><AddSupplierPage /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="contacts" action="read"><ContactDetailPage /></PermissionRoute>} />
      </Routes>
      </PluginGate>
  );
}

