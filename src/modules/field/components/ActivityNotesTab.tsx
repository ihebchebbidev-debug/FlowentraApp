import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Trash2, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { usersApi } from "@/services/api/usersApi";

import { API_URL } from '@/config/api';

export interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  createdBy?: string;
  oldValue?: string;
  newValue?: string;
}

interface ActivityNotesTabProps {
  entityType: 'service_order' | 'dispatch';
  entityId: number;
  notes: any[];
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote?: (noteId: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function ActivityNotesTab({ 
  entityType, 
  entityId, 
  notes, 
  onAddNote, 
  onDeleteNote,
  onRefresh 
}: ActivityNotesTabProps) {
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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/Auth/user/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
    
    // Check if it looks like a numeric ID
    if (/^\d+$/.test(userId)) {
      fetchMainAdminUser(userId).then(name => {
        if (name) {
          setMainAdminNames(prev => ({ ...prev, [userId]: name }));
        }
      });
      return `User ${userId}`;
    }
    
    // It might be a name already
    return userId;
  };

  // Get current user info
  const getCurrentUserInfo = () => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        return {
          id: userData.userId || userData.id,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || 'Current User'
        };
      } catch {
        return { id: 'current', name: 'Current User' };
      }
    }
    return { id: 'current', name: 'Current User' };
  };

  // Convert notes to activities
  useEffect(() => {
    const mappedActivities: Activity[] = notes.map(note => ({
      id: note.id,
      type: note.type || 'note',
      description: note.content || note.note || note.description || '',
      createdAt: note.createdAt || note.createdDate || new Date().toISOString(),
      createdBy: note.createdBy,
    }));
    setActivities(mappedActivities);
  }, [notes]);

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
      await onAddNote(newNoteContent.trim());
      setNewNoteContent("");
      setIsAddingNote(false);
      toast.success("Note added successfully");
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error("Failed to add note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (activityId: number) => {
    if (!onDeleteNote) return;
    
    try {
      await onDeleteNote(activityId);
      toast.success("Note deleted");
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error("Cannot delete this note");
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
    } finally {
      setIsLoading(false);
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
      case 'dispatch_created':
        return '🚚';
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
      case 'note':
      case 'Note':
        return '📝';
      case 'general':
        return '📋';
      default:
        return '📋';
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-success/10 text-success border-success/20';
      case 'updated':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'status_changed':
        return 'bg-secondary text-secondary-foreground border-border';
      case 'dispatch_created':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'material_added':
        return 'bg-accent text-accent-foreground border-border';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'note':
      case 'Note':
      case 'general':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Activity & Notes ({allActivities.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : allActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet</p>
            <p className="text-sm">Notes, status changes, and other activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allActivities.map((activity) => (
              <Card key={activity.id} className="transition-all duration-200 hover:shadow-md group">
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getActivityBadgeColor(activity.type)} text-xs border`}>
                            {activity.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.createdAt), 'MMM d, yyyy • HH:mm')}
                          </span>
                          {activity.createdBy && (
                            <span className="text-xs text-muted-foreground">
                              by {getUserName(activity.createdBy)}
                            </span>
                          )}
                        </div>
                        
                        {(activity.type === 'note' || activity.type === 'Note' || activity.type === 'general') && onDeleteNote && (
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteNote(activity.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-sm text-foreground leading-relaxed">
                        {activity.description}
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
