import { useState, useEffect, useMemo } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageSquare, Trash2, Loader2, RefreshCw, Settings, User } from "lucide-react";
import { format } from "date-fns";
import { Offer } from "../../types";
import { toast } from "sonner";
import { offersApi, OfferActivity } from "@/services/api/offersApi";
import { usersApi } from "@/services/api/usersApi";

import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

interface NotesTabProps {
  offer: Offer;
}

export function NotesTab({ offer }: NotesTabProps) {
  const { t } = useTranslation('offers');
  const [activities, setActivities] = useState<OfferActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  // Fetch users (both regular users and main admin users) for name resolution
  const { data: usersData } = useQuery({
    queryKey: ['users-for-activity'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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

  // Helper to get user name by ID - checks regular users first, then main admin users
  const getUserName = (userId: string | undefined): string => {
    if (!userId) return 'System';
    
    // Check regular users first
    const users = usersData?.users || [];
    const user = users.find(u => u.id?.toString() === userId?.toString());
    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return name || user.email || `User ${userId}`;
    }
    
    // Check cached main admin names
    if (mainAdminNames[userId]) {
      return mainAdminNames[userId];
    }
    
    // Trigger fetch for main admin user (async, will update on next render)
    fetchMainAdminUser(userId).then(name => {
      if (name) {
        setMainAdminNames(prev => ({ ...prev, [userId]: name }));
      }
    });
    
    return `User ${userId}`;
  };

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, [offer.id]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const offerId = parseInt(offer.id, 10);
      const result = await offersApi.getActivities(offerId);
      setActivities(result.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      // Don't show error toast on initial load - just show empty state
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error(t("notesTab.pleaseEnterNoteContent"));
      return;
    }

    try {
      setIsSaving(true);
      const offerId = parseInt(offer.id, 10);
      const newActivity = await offersApi.addActivity(offerId, {
        type: 'note',
        description: newNoteContent.trim(),
      });
      
      setActivities(prev => [newActivity, ...prev]);
      setNewNoteContent("");
      setIsAddingNote(false);
      toast.success(t("notesTab.noteAddedSuccessfully"));
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error(t("notesTab.failedToAddNote"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (activityId: number) => {
    try {
      const offerId = parseInt(offer.id, 10);
      await offersApi.deleteActivity(offerId, activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      toast.success(t("notesTab.noteDeleted"));
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error(t("notesTab.failedToDeleteNote"));
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
      case 'sent':
        return '📤';
      case 'accepted':
        return '✅';
      case 'declined':
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
      case 'sent':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'accepted':
        return 'bg-success/10 text-success border-success/30';
      case 'declined':
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
            {t('notesTab.activityNotes')} ({activities.length})
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
                placeholder={t('notesTab.enterNoteHere')}
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
                  {t('common.cancel', { defaultValue: 'Cancel' })}
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
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('notesTab.noActivityRecorded')}</p>
            <p className="text-sm">{t('notesTab.activitiesDescription')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="group">
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {activity.type === 'note' || activity.type === 'Note' ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 border-0">
                              <User className="h-3 w-3" />
                              {t('activityTab.userNote')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground gap-1 border-0">
                              <Settings className="h-3 w-3" />
                              {t('activityTab.systemActivity')}
                            </Badge>
                          )}
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