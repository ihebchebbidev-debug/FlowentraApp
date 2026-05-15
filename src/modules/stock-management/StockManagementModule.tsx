import { Routes, Route } from 'react-router-dom';
import StockManagementPage from './pages/StockManagementPage';
import { PluginGate } from "@/modules/shared/plugins";

export default function StockManagementModule() {
  return (
    <PluginGate code="PL0009STOCK">
      <Routes>
        <Route index element={<StockManagementPage />} />
      </Routes>
      </PluginGate>
  );
}
