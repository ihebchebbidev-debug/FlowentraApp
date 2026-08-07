import { Routes, Route } from "react-router-dom";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import AddContactPage from "./pages/AddContactPage";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";

export function ContactsModule() {
  return (
    <PluginGate code="PL0001CONTACTS">
      <Routes>
        <Route index element={<PermissionRoute module="contacts" action="read"><ContactsPage /></PermissionRoute>} />
        <Route path="add" element={<PermissionRoute module="contacts" action="create"><AddContactPage /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="contacts" action="read"><ContactDetailPage /></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}
