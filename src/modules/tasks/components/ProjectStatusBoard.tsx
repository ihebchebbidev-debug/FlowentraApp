import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProjectCard } from "./ProjectCard";
import type { Project, ProjectStats } from "../types";

interface ProjectStatusBoardProps {
  projects: Project[];
  projectStats: Record<string, ProjectStats>;
  onOpenProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleStatus: (projectId: string, status: Project["status"]) => void;
}

const COLUMNS: { status: Project["status"]; labelKey: string; fallback: string; color: string }[] = [
  { status: "active", labelKey: "projects.status.active", fallback: "Active", color: "#16a34a" },
  { status: "on-hold", labelKey: "projects.status.on-hold", fallback: "On hold", color: "#f59e0b" },
  { status: "completed", labelKey: "projects.status.completed", fallback: "Completed", color: "#0ea5e9" },
  { status: "cancelled", labelKey: "projects.status.cancelled", fallback: "Cancelled", color: "#ef4444" },
];

/** Projects grouped into status columns. Drag a card to another column to change its status. */
export function ProjectStatusBoard({
  projects,
  projectStats,
  onOpenProject,
  onEditProject,
  onDeleteProject,
  onToggleStatus,
}: ProjectStatusBoardProps) {
  const { t } = useTranslation("tasks");
  const [dragOver, setDragOver] = useState<Project["status"] | null>(null);

  const emptyStats: ProjectStats = { totalTasks: 0, completedTasks: 0, overdueTasks: 0, activeMembers: 0, completionPercentage: 0 };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const items = projects.filter((p) => (p.status || "active") === col.status);
        const isOver = dragOver === col.status;
        return (
          <div
            key={col.status}
            className={`flex-shrink-0 w-72 rounded-lg transition-colors ${isOver ? "bg-primary/5 ring-2 ring-primary/40" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
            onDragLeave={() => setDragOver((s) => (s === col.status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text/plain");
              const project = projects.find((p) => p.id === id);
              if (project && project.status !== col.status) onToggleStatus(id, col.status);
            }}
          >
            <div className="flex items-center justify-between px-2 py-2 mb-1 sticky top-0">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                {t(col.labelKey, { defaultValue: col.fallback })}
                <span className="ml-1 text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{items.length}</span>
              </span>
            </div>
            <div className="space-y-2 px-1 min-h-[60px]">
              {items.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", project.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <ProjectCard
                    project={project}
                    stats={projectStats[project.id] || emptyStats}
                    onOpenProject={onOpenProject}
                    onEditProject={onEditProject}
                    onDeleteProject={onDeleteProject}
                    onToggleStatus={onToggleStatus}
                  />
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-[11px] text-muted-foreground/60 text-center py-6 border border-dashed border-border/60 rounded-lg">
                  {t("projects.board.empty", { defaultValue: "No projects" })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProjectStatusBoard;
