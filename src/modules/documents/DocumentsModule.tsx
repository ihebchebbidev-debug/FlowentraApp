import { Routes, Route } from "react-router-dom";
import { DocumentsList } from "./components/DocumentsList";
import { PluginGate } from "@/modules/shared/plugins";

export function DocumentsModule() {
  return (
    <PluginGate code="PL0012DOCUMENTS">
      <Routes>
        <Route index element={<DocumentsList />} />
      </Routes>
      </PluginGate>
  );
}