import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Trash2, 
  Users,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from "../../types";

interface Technician {
  id: string;
  name: string;
  email?: string;
}

interface ProjectTeamTabProps {
  project: Project | null;
  technicians: Technician[];
  tasksState: any[];
  onTeamUpdated?: () => void;
}

export function ProjectTeamTab({
  project,
  technicians,
  tasksState,
  onTeamUpdated,
}: ProjectTeamTabProps) {
  const { t } = useTranslation("tasks");
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<string | null>(null);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>("");

  if (!project) return null;

  // Get team members from project by matching IDs with technicians
  const teamMembers: Technician[] = project.teamMembers ? 
    project.teamMembers
      .map((memberId) => technicians.find((tech) => tech.id === String(memberId)))
      .filter((member): member is Technician => member !== undefined)
    : [];

  // Get available users to add (those not already in team)
  const availableUsers = technicians.filter(
    (tech) => !teamMembers.some((member) => member.id === tech.id)
  );

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Count tasks assigned to a member
  const getTasksAssigned = (memberId: string) => {
    return tasksState.filter((task) => task.assigneeId === memberId).length;
  };

  const getTasksCompleted = (memberId: string) => {
    return tasksState.filter(
      (task) => task.assigneeId === memberId && (task.columnId === "done" || task.completedAt)
    ).length;
  };

  const handleAddMember = async () => {
    if (!selectedMemberToAdd) return;
    // TODO: Call ProjectsService.assignTeamMember(project.id, selectedMemberToAdd)
    // Then call onTeamUpdated() to refresh
    setSelectedMemberToAdd("");
  };

  const handleRemoveMember = async () => {
    if (!selectedMemberToRemove) return;
    // TODO: Call ProjectsService.removeTeamMember(project.id, selectedMemberToRemove)
    // Then call onTeamUpdated() to refresh
    setSelectedMemberToRemove(null);
  };

  const isOwner = (memberId: string) => memberId === project.ownerId;

  return (
    <div className="space-y-6">
      {/* Add Member Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("projects.detail.team.addMember")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={selectedMemberToAdd} onValueChange={setSelectedMemberToAdd}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t("projects.detail.team.selectMember")} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    {t("projects.detail.team.allAdded")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember} disabled={!selectedMemberToAdd || availableUsers.length === 0}>
              {t("projects.detail.team.addMember")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("projects.detail.team.title")} ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {t("projects.detail.team.noMembers")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("projects.detail.team.noMembersHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const tasksAssigned = getTasksAssigned(member.id);
                const tasksCompleted = getTasksCompleted(member.id);
                const isOwnerMember = isOwner(member.id);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          {isOwnerMember && (
                            <Badge variant="outline" className="text-xs">
                              {t("projects.detail.team.owner")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email || "-"}</p>
                      </div>
                    </div>

                    {/* Task Stats */}
                    <div className="flex items-center gap-4 ml-2">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle className="h-3 w-3 text-success" />
                          <span className="text-xs font-medium">
                            {tasksCompleted}/{tasksAssigned}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {t("projects.detail.team.tasksAssigned")}
                        </p>
                      </div>

                      {/* Remove Button */}
                      {!isOwnerMember && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMemberToRemove(member.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workload Summary */}
      {teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {t("projects.detail.team.workload")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const tasksAssigned = getTasksAssigned(member.id);
                const tasksCompleted = getTasksCompleted(member.id);
                const completionPercent = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

                return (
                  <div key={member.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tasksCompleted}/{tasksAssigned} ({completionPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!selectedMemberToRemove} onOpenChange={() => setSelectedMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.detail.team.confirmRemove", { name: teamMembers.find(m => m.id === selectedMemberToRemove)?.name || "" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("projects.detail.team.confirmRemoveDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("projects.detail.team.removeMember")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
