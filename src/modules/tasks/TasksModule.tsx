import { TasksRoutes } from "./routes/TasksRoutes";
import { PluginGate } from "@/modules/shared/plugins";

export default function TasksModule() {
  return (
    <PluginGate code="PL0011TASKS">
      <TasksRoutes />
    </PluginGate>
  );
}
