import { useState, useEffect } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Trash2, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Sale } from "../../types";
import { toast } from "sonner";
import { salesApi, SaleActivity } from "@/services/api/salesApi";
import { usersApi } from "@/services/api/usersApi";

import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

// Local storage key for sale notes
const getLocalNotesKey = (saleId: number | string) => `sale_notes_${saleId}`;

interface NotesTabProps {
  sale: Sale;
}

export function NotesTab({ sale }: NotesTabProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<SaleActivity[]>([]);
  const [localNotes, setLocalNotes] = useState<SaleActivity[]>([]);
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

  // Cache for main admin user names
  const [mainAdminNames, setMainAdminNames] = useState<Record<string, string>>({});

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
    
    fetchMainAdminUser(userId).then(name => {
      if (name) {
        setMainAdminNames(prev => ({ ...prev, [userId]: name }));
      }
    });
    
    return `User ${userId}`;
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

  // Load local notes from localStorage
  const loadLocalNotes = () => {
    const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : sale.id;
    const stored = localStorage.getItem(getLocalNotesKey(saleId));
    if (stored) {
      try {
        return JSON.parse(stored) as SaleActivity[];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Save local notes to localStorage
  const saveLocalNotes = (notes: SaleActivity[]) => {
    const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : sale.id;
    localStorage.setItem(getLocalNotesKey(saleId), JSON.stringify(notes));
  };

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
    setLocalNotes(loadLocalNotes());
  }, [sale.id]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : sale.id;
      const result = await salesApi.getActivities(saleId);
      setActivities(result.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combined activities (backend + local notes)
  const allActivities = [...localNotes, ...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error(t('notesTab.enterNoteContent'));
      return;
    }

    setIsSaving(true);
    const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : sale.id;
    const currentUser = getCurrentUserInfo();
    
    // Create a local note
    const newNote: SaleActivity = {
      id: Date.now(), // Use timestamp as unique ID
      saleId: saleId,
      type: 'note',
      description: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id?.toString(),
    };
    
    const updatedLocalNotes = [newNote, ...localNotes];
    setLocalNotes(updatedLocalNotes);
    saveLocalNotes(updatedLocalNotes);
    
    setNewNoteContent("");
    setIsAddingNote(false);
    setIsSaving(false);
    toast.success(t('notesTab.noteAddedSuccess'));
  };

  const handleDeleteNote = async (activityId: number) => {
    // Check if it's a local note
    const isLocalNote = localNotes.some(n => n.id === activityId);
    
    if (isLocalNote) {
      const updatedLocalNotes = localNotes.filter(n => n.id !== activityId);
      setLocalNotes(updatedLocalNotes);
      saveLocalNotes(updatedLocalNotes);
      toast.success(t('notesTab.noteDeleted'));
    } else {
      // Try to delete from backend (will likely fail with 405)
      try {
        const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : sale.id;
        await salesApi.deleteActivity(saleId, activityId);
        setActivities(prev => prev.filter(a => a.id !== activityId));
        toast.success(t('notesTab.noteDeleted'));
      } catch (error) {
        console.error('Failed to delete note:', error);
        toast.error(t('notesTab.cannotDeleteSystem'));
      }
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
      case 'converted_from_offer':
        return '📋';
      case 'converted_to_service_order':
        return '🔧';
      case 'won':
        return '✅';
      case 'lost':
        return '❌';
      case 'note':
        return '📝';
      case 'item_added':
        return '➕';
      case 'item_removed':
        return '➖';
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
        return 'bg-accent text-accent-foreground';
      case 'converted_from_offer':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'converted_to_service_order':
        return 'bg-accent text-accent-foreground';
      case 'won':
        return 'bg-success/10 text-success border-success/30';
      case 'lost':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'note':
        return 'bg-warning/10 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            {t('notesTab.title')} ({allActivities.length})
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
              {t('notesTab.addNote')}
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
                placeholder={t('notesTab.enterNote')}
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
                  {t('notesTab.cancel')}
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
                      {t('notesTab.saving')}
                    </>
                  ) : (
                    t('notesTab.saveNote')
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
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('notesTab.noActivity')}</p>
            <p className="text-sm">{t('notesTab.activitiesAppearHere')}</p>
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
                          <Badge className={`${getActivityBadgeColor(activity.type)} text-xs border`}>
                            {activity.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.createdAt), 'MMM d, yyyy • HH:mm')}
                          </span>
                          {activity.createdBy && (
                            <span className="text-xs text-muted-foreground">
                              {t('notesTab.by')} {getUserName(activity.createdBy)}
                            </span>
                          )}
                        </div>
                        
                        {activity.type === 'note' && (
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
