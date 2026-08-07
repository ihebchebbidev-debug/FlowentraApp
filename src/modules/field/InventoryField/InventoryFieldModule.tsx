import { Routes, Route } from "react-router-dom";
import InventoryList from "./components/InventoryList";
import InventoryDetail from "./pages/InventoryDetail";

export default function InventoryFieldModule() {
  console.log("InventoryFieldModule rendering");
  return (
    <Routes>
      <Route index element={<InventoryList />} />
      <Route path=":id" element={<InventoryDetail />} />
    </Routes>
  );
}