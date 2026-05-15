import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  Filter,
  LayoutGrid,
  List,
  PlusCircle,
  CalendarIcon,
  Check,
  FolderOpen,
  Loader2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Project } from "../../types";
import { KanbanBoard } from "../KanbanBoard";
import TaskListView from "../TaskListView";
import { ContentSkeleton } from "@/components/ui/page-skeleton";

interface Technician {
  id: string;
  name: string;
  email?: string;
}

interface ProjectTasksTabProps {
  project: Project | null;
  tasksState: any[];
  technicians: Technician[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: "all" | "todo" | "in-progress" | "review" | "done";
  setFilterStatus: (status: "all" | "todo" | "in-progress" | "review" | "done") => void;
  filterPriority: "all" | "urgent" | "high" | "medium" | "low";
  setFilterPriority: (priority: "all" | "urgent" | "high" | "medium" | "low") => void;
  filterAssignee: "all" | string;
  setFilterAssignee: (assignee: "all" | string) => void;
  showFilterBar: boolean;
  setShowFilterBar: (show: boolean) => void;
  showAllDates: boolean;
  setShowAllDates: (show: boolean) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  taskViewMode: "board" | "list";
  setTaskViewMode: (mode: "board" | "list") => void;
  showCompletedSection: boolean;
  setShowCompletedSection: (show: boolean) => void;
  isColumnEditorOpen: boolean;
  setIsColumnEditorOpen: (open: boolean) => void;
  isQuickTaskModalOpen: boolean;
  setIsQuickTaskModalOpen: (open: boolean) => void;
  isLoadingTasks: boolean;
  tasksError: string | null;
  openTasks: any[];
  completedTasks: any[];
  handleTaskClick: (task: Task) => void;
  handleAddTask: () => void;
  handleTaskComplete: (taskId: string) => void;
  fetchTasks: () => void;
  lookupPriorities: any[];
  setTasksState: (tasks: any[]) => void;
}

export function ProjectTasksTab({
  project,
  tasksState,
  technicians,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterAssignee,
  setFilterAssignee,
  showFilterBar,
  setShowFilterBar,
  showAllDates,
  setShowAllDates,
  selectedDate,
  setSelectedDate,
  taskViewMode,
  setTaskViewMode,
  showCompletedSection,
  setShowCompletedSection,
  isColumnEditorOpen,
  setIsColumnEditorOpen,
  isQuickTaskModalOpen,
  setIsQuickTaskModalOpen,
  isLoadingTasks,
  tasksError,
  openTasks,
  completedTasks,
  handleTaskClick,
  handleAddTask,
  handleTaskComplete,
  fetchTasks,
  lookupPriorities,
  setTasksState,
}: ProjectTasksTabProps) {
  const { t } = useTranslation("tasks");

  // Date navigation helpers
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (!project) return null;

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToPreviousDay}
              disabled={showAllDates}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[180px] justify-center text-left font-medium gap-2 bg-background",
                    !showAllDates && isToday(selectedDate) && "border-primary/50"
                  )}
                  disabled={showAllDates}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {showAllDates ? (
                    <span>{t("projects.dateFilter.allDates", "All Dates")}</span>
                  ) : isToday(selectedDate) ? (
                    <span>
                      {t("daily.today")} - {format(selectedDate, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span>{format(selectedDate, "EEE, MMM d, yyyy")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextDay}
              disabled={showAllDates}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {!showAllDates && !isToday(selectedDate) && (
              <Button variant="ghost" size="sm" onClick={goToToday} className="text-primary">
                {t("daily.today")}
              </Button>
            )}
          </div>

          <Button
            variant={showAllDates ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllDates(!showAllDates)}
            className={cn("gap-2", !showAllDates && "bg-background hover:bg-muted")}
          >
            {showAllDates
              ? t("projects.dateFilter.showingAll", "Showing All")
              : t("projects.dateFilter.filterByDate", "Filter by Date")}
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="space-y-3 bg-card border border-border/50 rounded-lg p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full">
            <CollapsibleSearch
              placeholder={t("projects.header.searchPlaceholder")}
              value={searchTerm}
              onChange={setSearchTerm}
              className="flex-1"
            />
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 px-2 sm:px-3"
                onClick={() => setShowFilterBar(!showFilterBar)}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t("projects.filters.filters")}</span>
                {(filterStatus !== "all" ||
                  filterPriority !== "all" ||
                  filterAssignee !== "all") && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {[
                      filterStatus !== "all" ? 1 : 0,
                      filterPriority !== "all" ? 1 : 0,
                      filterAssignee !== "all" ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={taskViewMode === "board" ? "default" : "outline"}
              size="sm"
              onClick={() => setTaskViewMode("board")}
              className={`flex-1 sm:flex-none ${
                taskViewMode === "board"
                  ? "bg-primary text-white hover:bg-primary/90"
                  : ""
              }`}
            >
              <LayoutGrid className={`h-4 w-4 ${taskViewMode === "board" ? "text-white" : ""}`} />
            </Button>
            <Button
              variant={taskViewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setTaskViewMode("list")}
              className={`flex-1 sm:flex-none ${
                taskViewMode === "list" ? "bg-primary text-white hover:bg-primary/90" : ""
              }`}
            >
              <List className={`h-4 w-4 ${taskViewMode === "list" ? "text-white" : ""}`} />
            </Button>
          </div>
        </div>

        {showFilterBar && (
          <div className="p-3 sm:p-4 border-t border-border bg-background/50 rounded">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="relative">
                  <select
                    className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                  >
                    <option value="all">{t("projects.filters.all")}</option>
                    <option value="todo">{t("projects.filters.todo")}</option>
                    <option value="in-progress">{t("projects.filters.inProgress")}</option>
                    <option value="review">{t("projects.filters.review")}</option>
                    <option value="done">{t("projects.filters.done")}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select
                    className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                  >
                    <option value="all">{t("projects.filters.all")}</option>
                    {lookupPriorities.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select
                    className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full"
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                  >
                    <option value="all">{t("projects.filters.allAssignees")}</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full">
                    <option value="any">{t("projects.filters.anyTime")}</option>
                    <option value="7">{t("projects.filters.last7")}</option>
                    <option value="30">{t("projects.filters.last30")}</option>
                    <option value="365">{t("projects.filters.last365")}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-full border border-border text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setFilterAssignee("all");
                    setShowFilterBar(false);
                  }}
                >
                  {t("projects.filters.clear")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Content */}
      {isLoadingTasks ? (
        <ContentSkeleton rows={6} />
      ) : tasksError ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border border-border/50 rounded-lg">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{t("projects.noTasks.none")}</p>
          <Button onClick={fetchTasks} variant="outline" className="gap-2">
            <Loader2 className="h-4 w-4" />
            {t("projects.noTasks.refresh")}
          </Button>
        </div>
      ) : (
        <>
          {/* Completed Tasks Banner */}
          {completedTasks.length > 0 && (
            <div className="bg-success/5 border border-success/20 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowCompletedSection(!showCompletedSection)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-success/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t("projects.completedSection.completed", { count: completedTasks.length })}
                  </span>
                  <Badge variant="secondary" className="bg-success/10 text-success border-0">
                    {completedTasks.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {showCompletedSection ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {showCompletedSection && (
                <div className="px-4 pb-3 pt-1">
                  <div className="flex flex-wrap gap-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm group hover:border-success/30 transition-colors cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-success flex items-center justify-center text-white">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span className="text-muted-foreground line-through max-w-[200px] truncate">
                          {task.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1.5 py-0 h-4 opacity-60",
                            task.priority === "urgent" && "border-destructive/50 text-destructive",
                            task.priority === "high" && "border-warning/50 text-warning",
                            task.priority === "medium" && "border-warning/50 text-warning",
                            task.priority === "low" && "border-success/50 text-success"
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Task View */}
          {taskViewMode === "list" ? (
            <TaskListView
              tasks={openTasks.map((t) => ({
                ...t,
                status: t.columnId,
                dueDate: new Date(t.dueDate || Date.now()),
                createdAt: new Date(t.createdAt || Date.now()),
                updatedAt: new Date(),
                tags: [],
                position: 0,
              })) as Task[]}
              columns={project?.columns}
              onTaskClick={handleTaskClick}
              onAddTask={() => handleAddTask()}
              onTaskComplete={(id) => handleTaskComplete(id)}
            />
          ) : (
            <KanbanBoard
              onSwitchToProjects={() => {}}
              isDailyTasks={false}
              hideHeader={true}
              project={project}
              technicians={technicians}
              columnEditorOpen={isColumnEditorOpen}
              onColumnEditorOpenChange={(open) => setIsColumnEditorOpen(open)}
              quickTaskModalOpen={isQuickTaskModalOpen}
              onQuickTaskModalOpenChange={(open) => setIsQuickTaskModalOpen(open)}
              initialTasks={openTasks}
              onTasksChange={(next) => setTasksState(next)}
            />
          )}
        </>
      )}
    </div>
  );
}
