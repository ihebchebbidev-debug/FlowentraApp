import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  GripVertical,
  Users,
  Columns,
  X,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Column } from "../types";
import { usersApi } from "@/services/usersApi";
import type { User } from "@/types/users";

interface ColumnManagerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  onUpdateColumns: (columns: Column[]) => void;
  teamMembers?: string[];
  onUpdateTeamMembers?: (members: string[]) => void;
  projectId?: string;
}

const availableColors = [
  'bg-muted-foreground',
  'bg-primary', 
  'bg-accent',
  'bg-success',
  'bg-warning',
  'bg-destructive',
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5'
];

export function ColumnManager({ 
  isOpen, 
  onClose, 
  columns, 
  onUpdateColumns,
  teamMembers = [],
  onUpdateTeamMembers,
  projectId
}: ColumnManagerProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const { user: currentUser, isMainAdmin } = useAuth();
  const [localColumns, setLocalColumns] = useState(columns);
  const [localTeamMembers, setLocalTeamMembers] = useState<string[]>(teamMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [activeTab, setActiveTab] = useState('columns');
  
  // Users state for team management
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersMap, setUsersMap] = useState<Map<number, User>>(new Map());
  const [memberSelectKey, setMemberSelectKey] = useState(0);

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Sync local state with props only when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalColumns(columns);
      setLocalTeamMembers(teamMembers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await usersApi.getAll();
      let usersList = response.users || [];
      
      // Include MainAdminUser (id=1) in the team members list if logged in as admin
      if (isMainAdmin && currentUser) {
        const adminAsUser: User = {
          id: currentUser.id || 1,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.phoneNumber || '',
          country: currentUser.country || '',
          isActive: true,
          createdDate: currentUser.createdAt || new Date().toISOString(),
          createdUser: 'system',
          role: 'Admin',
        };
        // Add admin at the beginning if not already in the list
        if (!usersList.some(u => u.id === adminAsUser.id)) {
          usersList = [adminAsUser, ...usersList];
        }
      }
      
      setUsers(usersList);
      const map = new Map<number, User>();
      usersList.forEach(u => map.set(u.id, u));
      setUsersMap(map);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSave = () => {
    onUpdateColumns(localColumns);
    if (onUpdateTeamMembers) {
      onUpdateTeamMembers(localTeamMembers);
    }
    toast({
      title: t('settings.toast.success'),
      description: t('settings.toast.saved'),
    });
    onClose();
  };

  // Column management functions
  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: 'New Column',
      color: availableColors[localColumns.length % availableColors.length],
      position: localColumns.length,
      isDefault: false,
      createdAt: new Date(),
    };
    setLocalColumns([...localColumns, newColumn]);
    setEditingId(newColumn.id);
    setEditName(newColumn.title);
  };

  const handleEditColumn = (column: Column) => {
    setEditingId(column.id);
    setEditName(column.title);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editingId) {
      setLocalColumns(localColumns.map(col => 
        col.id === editingId 
          ? { ...col, title: editName.trim() }
          : col
      ));
      setEditingId(null);
      setEditName('');
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    if (localColumns.length > 1) {
      setLocalColumns(localColumns.filter(col => col.id !== columnId));
    } else {
      toast({
        title: t('settings.columns.cannotDelete'),
        description: t('settings.columns.cannotDeleteDesc'),
        variant: "destructive",
      });
    }
  };

  const handleChangeColor = (columnId: string, color: string) => {
    setLocalColumns(localColumns.map(col => 
      col.id === columnId 
        ? { ...col, color }
        : col
    ));
  };

  // Team management functions
  const handleAddTeamMember = (userId: string) => {
    if (!localTeamMembers.includes(userId)) {
      setLocalTeamMembers([...localTeamMembers, userId]);
    }
    // Reset the select to show placeholder again
    setMemberSelectKey(prev => prev + 1);
  };

  const handleRemoveTeamMember = (userId: string) => {
    setLocalTeamMembers(localTeamMembers.filter(id => id !== userId));
  };

  const getTeamMemberName = (memberId: string): string => {
    const user = usersMap.get(parseInt(memberId, 10));
    if (user) {
      return `${user.firstName} ${user.lastName}`.trim() || user.email;
    }
    return `User #${memberId}`;
  };

  const availableUsers = users.filter(u => !localTeamMembers.includes(String(u.id)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="columns" className="flex items-center gap-2">
              <Columns className="h-4 w-4" />
              {t('settings.tabs.columns')}
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('settings.tabs.teamMembers')}
            </TabsTrigger>
          </TabsList>

          {/* Columns Tab */}
          <TabsContent value="columns" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              {t('settings.columns.description')}
            </div>

            <div className="space-y-3">
              {localColumns.map((column, _index) => (
                <Card key={column.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      
                      <div className={`w-4 h-4 rounded ${column.color}`} />
                      
                      {editingId === column.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            onBlur={handleSaveEdit}
                            className="flex-1"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-medium flex-1">{column.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Color Picker */}
                      <div className="flex gap-1">
                        {availableColors.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            onClick={() => handleChangeColor(column.id, color)}
                            className={`w-6 h-6 rounded border-2 ${color} ${
                              column.color === color ? 'border-foreground' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditColumn(column)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      {localColumns.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteColumn(column.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button 
              onClick={handleAddColumn}
              variant="outline" 
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('settings.columns.addColumn')}
            </Button>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              {t('settings.team.description')}
            </div>

            {/* Add team member dropdown */}
            <div className="space-y-2">
              <Select key={memberSelectKey} onValueChange={handleAddTeamMember} value="">
                <SelectTrigger>
                  {isLoadingUsers ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('settings.team.loadingUsers')}
                    </div>
                  ) : (
                    <SelectValue placeholder={t('settings.team.selectPlaceholder')} />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {isLoadingUsers ? t('columnManager.loading') : t('settings.team.allInTeam')}
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {user.firstName} {user.lastName}
                          {user.role && <span className="text-muted-foreground">- {user.role}</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Current team members list */}
            <div className="space-y-3">
              {localTeamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('settings.team.noMembers')}</p>
                  <p className="text-sm">{t('settings.team.noMembersHint')}</p>
                </div>
              ) : (
                localTeamMembers.map((memberId) => {
                  const user = usersMap.get(parseInt(memberId, 10));
                  return (
                    <Card key={memberId} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{getTeamMemberName(memberId)}</p>
                            {user?.email && (
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(memberId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {localTeamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground">{t('settings.team.quickView')}</span>
                {localTeamMembers.map((memberId) => (
                  <Badge key={memberId} variant="secondary" className="gap-1">
                    {getTeamMemberName(memberId)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTeamMember(memberId)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('settings.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('settings.saveChanges')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
