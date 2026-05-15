import { useState, useEffect } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Loader2, RefreshCw, Settings, User } from "lucide-react";
import { dispatchesApi, type DispatchActivityLog } from "@/services/api/dispatchesApi";
import { usersApi } from "@/services/api/usersApi";
import { toast } from "sonner";
import { translateNote } from "@/modules/shared/utils/noteTranslation";

import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

interface Activity {
  id: number | string;
  type: string;
  description: string;
  createdAt: string;
  createdBy?: string;
  oldValue?: string;
  newValue?: string;
}

interface DispatchActivityTabProps {
  dispatchId: number;
  onDataChange?: () => void;
  createdAt?: string;
  dispatchedBy?: string;
  jobTitle?: string;
}

export function DispatchActivityTab({ dispatchId, onDataChange, createdAt, dispatchedBy, jobTitle }: DispatchActivityTabProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  
  const [notes, setNotes] = useState<Activity[]>([]);
  const [activityLogs, setActivityLogs] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  // Fetch users for name resolution
  const { data: usersData } = useQuery({
    queryKey: ['users-for-activity'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Cache for main admin user names
  const [mainAdminNames, setMainAdminNames] = useState<Record<string, string>>({});

  // Fetch main admin user info from Auth endpoint
  const fetchMainAdminUser = async (userId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/Auth/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const user = data.data || data;
        if (user.firstName || user.lastName) {
          return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        if (user.companyName) return user.companyName;
        return user.email || null;
      }
    } catch (e) {
      console.warn('Failed to fetch main admin user:', e);
    }
    return null;
  };

  // Helper to get user name by ID
  const getUserName = (userId: string | undefined): string => {
    if (!userId) return 'System';
    
    const users = usersData?.users || [];
    const user = users.find(u => u.id?.toString() === userId?.toString());
    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return name || user.email || `User ${userId}`;
    }
    
    if (mainAdminNames[userId]) {
      return mainAdminNames[userId];
    }
    
    if (/^\d+$/.test(userId)) {
      fetchMainAdminUser(userId).then(name => {
        if (name) {
          setMainAdminNames(prev => ({ ...prev, [userId]: name }));
        }
      });
      return `User ${userId}`;
    }
    
    return userId;
  };

  // Map action type to readable description
  const mapActionToDescription = (action: string, oldValue?: string, newValue?: string, changedBy?: string): string => {
    const actionLower = action.toLowerCase();
    
    switch (actionLower) {
      case 'created':
      case 'create':
        return `Dispatch created${changedBy ? ` by ${changedBy}` : ''}`;
      case 'status_changed':
      case 'status_change':
      case 'statuschanged':
        return `Status changed${oldValue && newValue ? ` from "${oldValue}" to "${newValue}"` : ''}${changedBy ? ` by ${changedBy}` : ''}`;
      case 'assigned':
      case 'technician_assigned':
        return `Technician assigned${newValue ? `: ${newValue}` : ''}${changedBy ? ` by ${changedBy}` : ''}`;
      case 'started':
      case 'start':
        return `Dispatch started${changedBy ? ` by ${changedBy}` : ''}`;
      case 'completed':
      case 'complete':
        return `Dispatch completed${changedBy ? ` by ${changedBy}` : ''}`;
      case 'cancelled':
      case 'cancel':
        return `Dispatch cancelled${changedBy ? ` by ${changedBy}` : ''}`;
      case 'updated':
      case 'update':
        return `Dispatch updated${changedBy ? ` by ${changedBy}` : ''}`;
      case 'material_added':
        return `Material added${newValue ? `: ${newValue}` : ''}${changedBy ? ` by ${changedBy}` : ''}`;
      case 'time_entry_added':
        return `Time entry added${changedBy ? ` by ${changedBy}` : ''}`;
      case 'expense_added':
        return `Expense added${newValue ? `: ${newValue}` : ''}${changedBy ? ` by ${changedBy}` : ''}`;
      case 'note_added':
        return `Note added${changedBy ? ` by ${changedBy}` : ''}`;
      default:
        return `${action.replace(/_/g, ' ')}${changedBy ? ` by ${changedBy}` : ''}`;
    }
  };

  // Fetch notes and activity logs
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Fetch both notes and activity logs in parallel
      const [notesData, activityData] = await Promise.all([
        dispatchesApi.getNotes(dispatchId).catch(() => []),
        dispatchesApi.getActivityLog(dispatchId).catch(() => []),
      ]);

      // Map notes to Activity format
      const mappedNotes: Activity[] = notesData.map((n: any) => ({
        id: `note-${n.id}`,
        type: n.noteType || n.category || n.type || 'note',
        description: n.note || n.content || n.description || '',
        createdAt: n.createdDate || n.createdAt || new Date().toISOString(),
        createdBy: n.createdBy,
      }));
      setNotes(mappedNotes);

      // Map activity logs to Activity format
      const mappedLogs: Activity[] = activityData.map((log: DispatchActivityLog) => ({
        id: `log-${log.id}`,
        type: log.action.toLowerCase().replace(/ /g, '_'),
        description: mapActionToDescription(log.action, log.oldValue, log.newValue, log.changedBy),
        createdAt: log.changedAt,
        createdBy: log.changedBy,
        oldValue: log.oldValue,
        newValue: log.newValue,
      }));
      setActivityLogs(mappedLogs);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [dispatchId]);

  // Build creation activity if dispatch has creation info (fallback if not in activity logs)
  const hasCreationLog = activityLogs.some(log => 
    log.type === 'created' || log.type === 'create'
  );

  const creationActivity: Activity | null = (createdAt && !hasCreationLog) ? {
    id: 'creation-event',
    type: 'created',
    description: jobTitle 
      ? `"${jobTitle}" planned${dispatchedBy ? ` by ${dispatchedBy}` : ''}`
      : `Dispatch planned${dispatchedBy ? ` by ${dispatchedBy}` : ''}`,
    createdAt: createdAt,
    createdBy: undefined,
  } : null;

  // Combined and sorted activities (notes + activity logs + creation event)
  const allActivities = [
    ...notes,
    ...activityLogs,
    ...(creationActivity ? [creationActivity] : [])
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    setIsSaving(true);
    try {
      await dispatchesApi.addNote(dispatchId, newNoteContent.trim(), 'general');
      setNewNoteContent("");
      setIsAddingNote(false);
      toast.success("Note added successfully");
      await fetchActivities();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error("Failed to add note");
    } finally {
      setIsSaving(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return '🆕';
      case 'updated':
        return '✏️';
      case 'status_changed':
        return '🔄';
      case 'started':
        return '▶️';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'material_added':
        return '📦';
      case 'time_entry':
        return '⏱️';
      case 'expense':
        return '💰';
      case 'note':
      case 'general':
        return '📝';
      case 'issue':
        return '⚠️';
      case 'work':
        return '🔧';
      default:
        return '📋';
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-success/10 text-success border-success/30';
      case 'updated':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'status_changed':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'started':
        return 'bg-info/10 text-info border-info/30';
      case 'completed':
        return 'bg-success/10 text-success border-success/30';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'issue':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'work':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'note':
      case 'general':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Activity & Notes ({allActivities.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => setIsAddingNote(true)}
              className="gap-2"
              disabled={isAddingNote}
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAddingNote && (
          <Card className="border-dashed border-primary/30">
            <CardContent className="pt-4 space-y-4">
              <Textarea
                placeholder="Enter your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent("");
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Note'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : allActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No activity recorded yet</p>
            <p className="text-sm">Notes, status changes, and other activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allActivities.map((activity) => (
              <Card key={activity.id} className="group">
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {activity.type !== 'note' && activity.type !== 'Note' && activity.type !== 'general' ? (
                            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground gap-1 border-0">
                              <Settings className="h-3 w-3" />
                              {t('field.systemActivity', { defaultValue: 'System Activity' })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 border-0">
                              <User className="h-3 w-3" />
                              {t('field.userNote', { defaultValue: 'User Note' })}
                            </Badge>
                          )}
                          <Badge className={`${getActivityBadgeColor(activity.type)} text-xs border`}>
                            {activity.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.createdAt), 'MMM d, yyyy • HH:mm')}
                          </span>
                          {activity.createdBy && (
                            <span className="text-sm text-muted-foreground">
                              by {getUserName(activity.createdBy)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground leading-relaxed">
                        {translateNote(activity.description, currentLocale)}
                      </p>

                      {activity.oldValue && activity.newValue && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="line-through">{activity.oldValue}</span>
                          <span>→</span>
                          <span className="font-medium">{activity.newValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
