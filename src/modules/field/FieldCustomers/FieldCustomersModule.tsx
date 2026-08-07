import { Routes, Route } from "react-router-dom";
import ClientsList from "./components/ClientsList";
import ClientDetail from "./pages/ClientDetail";

export default function FieldCustomersModule() {
  console.log("FieldCustomersModule rendering");
  return (
    <Routes>
      <Route index element={<ClientsList />} />
      <Route path=":id" element={<ClientDetail />} />
    </Routes>
  );
}
