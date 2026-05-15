import { Routes, Route } from "react-router-dom";
import ContactsPage from "./pages/ContactsPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import AddContactPage from "./pages/AddContactPage";
import { PluginGate } from "@/modules/shared/plugins";

export function ContactsModule() {
  return (
    <PluginGate code="PL0001CONTACTS">
      <Routes>
        <Route index element={<ContactsPage />} />
        <Route path="add" element={<AddContactPage />} />
        <Route path=":id" element={<ContactDetailPage />} />
      </Routes>
    </PluginGate>
  );
}
