import { Routes, Route } from "react-router-dom";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
import { DealsList } from "./components/DealsList";
import { DealDetail } from "./components/DealDetail";
import { AddDeal } from "./pages/AddDeal";
import { EditDeal } from "./pages/EditDeal";

export function DealsModule() {
  return (
    <PluginGate code="PL0003DEALS">
      <Routes>
        <Route index element={<PermissionRoute module="deals" action="read"><DealsList /></PermissionRoute>} />
        <Route path="add" element={<PermissionRoute module="deals" action="create"><AddDeal /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="deals" action="read"><DealDetail /></PermissionRoute>} />
        <Route path=":id/edit" element={<PermissionRoute module="deals" action="update"><EditDeal /></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}

export default DealsModule;
