import { Routes, Route, Navigate } from "react-router-dom";
import { PluginGate } from "@/modules/shared/plugins";
import TasksHomePage from "../pages/TasksHomePage";
import ProjectTasksPage from "../pages/ProjectTasksPage";
import DailyTasksPage from "../pages/DailyTasksPage";

export function TasksRoutes() {
  return (
    <Routes>
      {/* Default route redirects to projects */}
      <Route index element={<Navigate to="projects" replace />} />

      {/* Daily tasks route (kept for backward compatibility) */}
      <Route path="daily" element={<DailyTasksPage />} />

      {/* Projects routes — gated by the Projects module (PL0004PROJECTS) */}
      <Route path="projects" element={<PluginGate code="PL0004PROJECTS"><TasksHomePage /></PluginGate>} />
      <Route path="projects/:projectId" element={<PluginGate code="PL0004PROJECTS"><ProjectTasksPage /></PluginGate>} />

      {/* Catch all for tasks - redirect to projects */}
      <Route path="*" element={<Navigate to="projects" replace />} />
    </Routes>
  );
}