import { Routes, Route } from "react-router-dom";
import { DispatcherPage } from "./pages/DispatcherPage";
import { DispatchingInterface } from "./components/DispatchingInterface";
import { SchedulerManager } from "../scheduling/pages/SchedulerManager";
import ScheduleEditorPage from "../scheduling/pages/ScheduleEditorPage";
// Import dispatch job detail from field module
import DispatchJobDetail from "../field/dispatches/pages/DispatchJobDetail";
import { PluginGate } from "@/modules/shared/plugins";

export function DispatcherModule() {
  return (
    <PluginGate code="PL0024DISPATCHER">
      <Routes>
        <Route index element={<DispatcherPage />} />
        <Route path="interface" element={<DispatchingInterface />} />
        <Route path="job/:id" element={<DispatchJobDetail />} />
        <Route path="manage-scheduler" element={<SchedulerManager />} />
        <Route path="manage-scheduler/edit/:technicianId" element={<ScheduleEditorPage />} />
      </Routes>
    </PluginGate>
  );
}
