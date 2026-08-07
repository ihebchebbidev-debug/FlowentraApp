import { ProjectManager } from "../components/ProjectManager";
import { useNavigate } from "react-router-dom";

export default function TasksHomePage() {
  const navigate = useNavigate();

  const handleSwitchToTasks = () => {
    navigate("/dashboard/tasks/daily");
  };

  return (
    <ProjectManager onSwitchToTasks={handleSwitchToTasks} />
  );
}