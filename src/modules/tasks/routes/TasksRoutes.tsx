import { Routes, Route, Navigate } from "react-router-dom";
import TasksHomePage from "../pages/TasksHomePage";
import ProjectTasksPage from "../pages/ProjectTasksPage";
import DailyTasksPage from "../pages/DailyTasksPage";

export function TasksRoutes() {
  return (
    <Routes>
      {/* Default route redirects to daily tasks */}
      <Route index element={<Navigate to="daily" replace />} />
      
      {/* Daily tasks route */}
      <Route path="daily" element={<DailyTasksPage />} />
      
      {/* Projects routes */}
      <Route path="projects" element={<TasksHomePage />} />
      <Route path="projects/:projectId" element={<ProjectTasksPage />} />
      
      {/* Catch all for tasks - redirect to daily */}
      <Route path="*" element={<Navigate to="daily" replace />} />
    </Routes>
  );
}