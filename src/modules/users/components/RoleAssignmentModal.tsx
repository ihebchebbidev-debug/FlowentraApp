import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { rolesApi } from "@/services/rolesApi";
import { User, Role } from "@/types/users";
import { Loader2, Shield, X } from "lucide-react";
import { broadcastPermissionChange } from "@/utils/permissionBroadcast";

interface RoleAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onRoleAssigned: () => void;
}

export function RoleAssignmentModal({ open, onOpenChange, user, onRoleAssigned }: RoleAssignmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchRoles();
      fetchUserRoles();
    }
  }, [open, user]);

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await rolesApi.getAll();
      setRoles(response.filter((role: Role) => role.isActive));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive"
      });
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    if (!user) return;
    try {
      const data = await rolesApi.getUserRoles(user.id);
      setUserRoles(data);
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
      setUserRoles([]);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId || !user) return;

    try {
      setLoading(true);
      await rolesApi.assignToUser(parseInt(selectedRoleId), user.id);
      toast({
        title: "Success",
        description: "Role assigned successfully"
      });
      
      // Broadcast permission change so the user gets updated permissions in real-time
      broadcastPermissionChange();
      
      setSelectedRoleId("");
      fetchUserRoles();
      onRoleAssigned();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to assign role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!user) return;

    try {
      await rolesApi.removeFromUser(roleId, user.id);
      toast({
        title: "Success",
        description: "Role removed successfully"
      });
      
      // Broadcast permission change so the user gets updated permissions in real-time
      broadcastPermissionChange();
      
      fetchUserRoles();
      onRoleAssigned();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  const availableRoles = roles.filter(role => 
    !userRoles.some(userRole => userRole.id === role.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-chart-1" />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            Assign and manage roles for {user?.firstName} {user?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Roles */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Roles</Label>
            {userRoles.length > 0 ? (
              <div className="space-y-2">
                {userRoles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-chart-1" />
                      <div>
                        <p className="font-medium text-sm capitalize">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm bg-muted/10 rounded-lg">
                No roles assigned
              </div>
            )}
          </div>

          {/* Assign New Role */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assign New Role</Label>
            <div className="flex gap-2">
              <Select 
                value={selectedRoleId} 
                onValueChange={setSelectedRoleId}
                disabled={rolesLoading || availableRoles.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={
                    rolesLoading ? "Loading roles..." : 
                    availableRoles.length === 0 ? "No available roles" :
                    "Select a role"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex flex-col">
                        <span className="capitalize">{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">{role.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAssignRole}
                disabled={!selectedRoleId || loading}
                className="gradient-primary"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}