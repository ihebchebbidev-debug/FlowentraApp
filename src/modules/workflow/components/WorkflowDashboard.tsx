import '../styles/workflow.css';
import { WorkflowBuilder } from "./WorkflowBuilder";

export function WorkflowDashboard() {
  return (
    <div className="workflow-module h-screen flex flex-col">
      <WorkflowBuilder />
    </div>
  );
}
