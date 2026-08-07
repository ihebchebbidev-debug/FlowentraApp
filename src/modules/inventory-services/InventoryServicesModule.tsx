import { Routes, Route } from "react-router-dom";
import { InventoryServicesList } from "./components/InventoryServicesList";
import InventoryDetail from "./pages/InventoryDetail";
import ServiceDetail from "./pages/ServiceDetail";
import AddUnifiedArticle from "./pages/AddUnifiedArticle";
import EditUnifiedArticle from "./pages/EditUnifiedArticle";
import { ArticleDetails } from "./pages/ArticleDetails";
import { PluginGate } from "@/modules/shared/plugins";

export default function InventoryServicesModule() {
  return (
    <PluginGate code="PL0008INVSERVICES">
      <Routes>
          <Route index element={<InventoryServicesList />} />
          <Route path="add-article" element={<AddUnifiedArticle />} />
          <Route path="article/:id" element={<ArticleDetails />} />
          <Route path="article/:id/edit" element={<EditUnifiedArticle />} />
        <Route path="inventory/:id" element={<InventoryDetail />} />
        <Route path="service/:id" element={<ServiceDetail />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="add-item" element={<AddUnifiedArticle />} />
        <Route path="add-service" element={<AddUnifiedArticle />} />
      </Routes>
      </PluginGate>
  );
}