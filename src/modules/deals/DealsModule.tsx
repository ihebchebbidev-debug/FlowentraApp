import { Routes, Route } from "react-router-dom";
import { PluginGate } from "@/modules/shared/plugins";
import { DealsList } from "./components/DealsList";
import { DealDetail } from "./components/DealDetail";
import { AddDeal } from "./pages/AddDeal";
import { EditDeal } from "./pages/EditDeal";

export function DealsModule() {
  return (
    <PluginGate code="PL0003DEALS">
      <Routes>
        <Route index element={<DealsList />} />
        <Route path="add" element={<AddDeal />} />
        <Route path=":id" element={<DealDetail />} />
        <Route path=":id/edit" element={<EditDeal />} />
      </Routes>
    </PluginGate>
  );
}

export default DealsModule;
