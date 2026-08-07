import { Routes, Route, Navigate } from "react-router-dom";
import InstallationsList from "./pages/InstallationsList";
import InstallationDetail from "./pages/InstallationDetail";
import CreateInstallation from "./pages/CreateInstallation";
import EditInstallation from "./pages/EditInstallation";

export default function InstallationsModule() {
  console.log("InstallationsModule rendering, current path:", window.location.pathname);
  return (
    <Routes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<InstallationsList />} />
      <Route path="create" element={<CreateInstallation />} />
      <Route path=":id" element={<InstallationDetail />} />
      <Route path=":id/edit" element={<EditInstallation />} />
    </Routes>
  );
}