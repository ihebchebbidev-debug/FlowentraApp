import { useState, useEffect } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Trash2, Loader2, RefreshCw, Truck, History, Settings, User } from "lucide-react";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { dispatchesApi } from "@/services/api/dispatchesApi";
import { usersApi } from "@/services/api/usersApi";
import { logsApi } from "@/services/api/logsApi";
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
  source?: 'service-order' | 'dispatch';
  dispatchNumber?: string;
  isSystemLog?: boolean;
}

interface ServiceOrderActivityTabProps {
  serviceOrderId: number;
  initialNotes?: any[];
  onDataChange?: () => void;
}

export function ServiceOrderActivityTab({ serviceOrderId, initialNotes = [], onDataChange }: ServiceOrderActivityTabProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch notes/activities from service order AND all dispatches AND system logs
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Fetch service order notes, dispatches, and system logs in parallel
      const [notesData, dispatchList, systemLogsData] = await Promise.all([
        serviceOrdersApi.getNotes(serviceOrderId),
        serviceOrdersApi.getDispatches(serviceOrderId),
        logsApi.getAll({
          module: 'ServiceOrders',
          pageSize: 100,
        }).catch(() => ({ logs: [] })), // Fallback if logs API fails
      ]);

      // Filter system logs that belong to this service order
      const serviceOrderLogs = (systemLogsData.logs || []).filter(
        (log) => log.entityId === String(serviceOrderId) && log.entityType === 'ServiceOrder'
      );

      // Map system logs to activities
      const systemActivities: Activity[] = serviceOrderLogs.map((log) => ({
        id: `log-${log.id}`,
        type: mapLogActionToType(log.action, log.message),
        description: log.message,
        createdAt: log.timestamp,
        createdBy: log.userId,
        source: 'service-order' as const,
        isSystemLog: true,
      }));

      // Map service order notes
      const soActivities: Activity[] = (notesData || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'note',
        description: n.content || n.note || n.description || '',
        createdAt: n.createdAt || n.createdDate || new Date().toISOString(),
        createdBy: n.createdBy,
        source: 'service-order' as const,
      }));

      // Fetch notes from all dispatches in parallel
      const dispatchNotesPromises = (dispatchList || []).map(async (dispatch: any) => {
        try {
          const notes = await dispatchesApi.getNotes(dispatch.id);
          return (notes || []).map((n: any) => ({
            id: `dispatch-${dispatch.id}-${n.id}`,
            type: n.category || n.type || 'note',
            description: n.note || n.content || n.description || '',
            createdAt: n.createdDate || n.createdAt || new Date().toISOString(),
            createdBy: n.createdBy,
            source: 'dispatch' as const,
            dispatchNumber: dispatch.dispatchNumber || `Dispatch #${dispatch.id}`,
          }));
        } catch {
          return [];
        }
      });

      const dispatchNotesArrays = await Promise.all(dispatchNotesPromises);
      const dispatchActivities = dispatchNotesArrays.flat();

      // Combine all activities, avoiding duplicates
      const allActivitiesSet = new Map<string, Activity>();
      
      // Add system logs first (they are authoritative for creation events)
      systemActivities.forEach(a => allActivitiesSet.set(String(a.id), a));
      
      // Add notes (might override some log entries with more detail)
      soActivities.forEach(a => allActivitiesSet.set(String(a.id), a));
      dispatchActivities.forEach(a => allActivitiesSet.set(String(a.id), a));

      setActivities(Array.from(allActivitiesSet.values()));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Map log action/message to activity type
  const mapLogActionToType = (action: string, message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (action === 'create' || lowerMessage.includes('created')) {
      if (lowerMessage.includes('from sale') || lowerMessage.includes('from offer')) {
        return 'created_from_sale';
      }
      return 'created';
    }
    if (action === 'update' || lowerMessage.includes('updated')) {
      if (lowerMessage.includes('status')) return 'status_changed';
      return 'updated';
    }
    if (action === 'delete' || lowerMessage.includes('deleted')) return 'deleted';
    if (lowerMessage.includes('dispatch')) return 'dispatch_created';
    if (lowerMessage.includes('job')) return 'job_added';
    if (lowerMessage.includes('material')) return 'material_added';
    if (lowerMessage.includes('completed')) return 'completed';
    if (lowerMessage.includes('cancelled')) return 'cancelled';
    if (lowerMessage.includes('approved')) return 'approved';
    
    return 'activity';
  };

  useEffect(() => {
    // Use initial notes if provided, otherwise fetch
    if (initialNotes && initialNotes.length > 0) {
      const mapped: Activity[] = initialNotes.map((n: any) => ({
        id: n.id,
        type: n.type || 'note',
        description: n.content || n.note || n.description || '',
        createdAt: n.createdAt || n.createdDate || new Date().toISOString(),
        createdBy: n.createdBy,
      }));
      setActivities(mapped);
    } else {
      fetchActivities();
    }
  }, [serviceOrderId, initialNotes]);

  // Combined and sorted activities
  const allActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    setIsSaving(true);
    try {
      await serviceOrdersApi.addNote(serviceOrderId, { 
        content: newNoteContent.trim(), 
        type: 'Note' 
      });
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

  const handleDeleteNote = async (noteId: number) => {
    try {
      await serviceOrdersApi.deleteNote(serviceOrderId, noteId);
      setActivities(prev => prev.filter(a => a.id !== noteId));
      toast.success("Note deleted");
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error("Cannot delete this note");
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
      case 'created_from_sale':
      case 'creation':
        return '🆕';
      case 'updated':
        return '✏️';
      case 'status_changed':
        return '🔄';
      case 'dispatch_created':
        return '🚚';
      case 'job_added':
        return '📋';
      case 'material_added':
        return '📦';
      case 'time_entry':
        return '⏱️';
      case 'expense':
        return '💰';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'approved':
        return '✔️';
      case 'invoiced':
        return '🧾';
      case 'note':
      case 'Note':
        return '📝';
      default:
        return '📋';
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'created':
      case 'created_from_sale':
      case 'creation':
        return 'bg-success/10 text-success border-success/30';
      case 'updated':
      case 'activity':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'status_changed':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'dispatch_created':
        return 'bg-info/10 text-info border-info/30';
      case 'job_added':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'material_added':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'completed':
        return 'bg-success/10 text-success border-success/30';
      case 'cancelled':
      case 'deleted':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'approved':
        return 'bg-success/10 text-success border-success/30';
      case 'invoiced':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'note':
      case 'Note':
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
                          {activity.isSystemLog || activity.source === 'dispatch' || (activity.type !== 'note' && activity.type !== 'Note') ? (
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
                          {activity.source === 'dispatch' && activity.dispatchNumber && (
                            <Badge variant="outline" className="text-xs gap-1 ml-1">
                              <Truck className="h-3 w-3" />
                              {activity.dispatchNumber}
                            </Badge>
                          )}
                          {activity.isSystemLog && (
                            <Badge variant="secondary" className="text-xs gap-1 ml-1">
                              <History className="h-3 w-3" />
                              System
                            </Badge>
                          )}
                        </div>
                        
                        {(activity.type === 'note' || activity.type === 'Note') && activity.source !== 'dispatch' && typeof activity.id === 'number' && (
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteNote(activity.id as number)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-sm text-foreground leading-relaxed">
                        {translateNote(activity.description, currentLocale)}
                      </p>

                      {activity.oldValue && activity.newValue && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
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
