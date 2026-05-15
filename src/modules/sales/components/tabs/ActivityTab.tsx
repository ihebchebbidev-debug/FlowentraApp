import { useState, useEffect } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  History, MessageSquare, Mail, Phone, Calendar, Plus, 
  RefreshCw, Loader2, ArrowRightLeft, Briefcase, FileText,
  CheckCircle, XCircle, Edit, DollarSign, Package, ClipboardList, Truck, Clock, Receipt,
  Settings, User
} from "lucide-react";
import { Sale } from "../../types";
import { salesApi, SaleActivity } from "@/services/api/salesApi";
import { usersApi } from "@/services/api/usersApi";
import { toast } from "sonner";
import { translateNote } from "@/modules/shared/utils/noteTranslation";

import { API_URL } from '@/config/api';
import { getAuthHeaders } from '@/utils/apiHeaders';

interface ActivityTabProps {
  sale: Sale;
  onDataChange?: () => void;
}

export function ActivityTab({ sale, onDataChange }: ActivityTabProps) {
  const { t, i18n } = useTranslation('sales');
  const currentLocale = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  
  const [activities, setActivities] = useState<SaleActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [activityFilter, setActivityFilter] = useState<'all' | 'history' | 'notes'>('all');

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

  // Fetch activities
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const result = await salesApi.getActivities(Number(sale.id));
      setActivities(result.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [sale.id]);

  // Filter activities
  const filteredActivities = activities
    .filter(item => {
      if (activityFilter === 'all') return true;
      if (activityFilter === 'history') return item.type !== 'note';
      if (activityFilter === 'notes') return item.type === 'note';
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error(t('activityTab.enterNoteContent'));
      return;
    }

    setIsSaving(true);
    try {
      await salesApi.addActivity(Number(sale.id), {
        type: 'note',
        description: newNoteContent.trim(),
      });
      setNewNoteContent("");
      setIsAddingNote(false);
      toast.success(t('activityTab.noteAdded'));
      await fetchActivities();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error(t('activityTab.noteAddFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <FileText className="h-4 w-4 text-success" />;
      case 'created_from_offer':
        return <DollarSign className="h-4 w-4 text-success" />;
      case 'status_changed':
        return <ArrowRightLeft className="h-4 w-4 text-primary" />;
      case 'converted_to_service_order':
        return <Briefcase className="h-4 w-4 text-success" />;
      case 'service_order_status_changed':
        return <ClipboardList className="h-4 w-4 text-warning" />;
      case 'dispatch_status_changed':
        return <Truck className="h-4 w-4 text-info" />;
      case 'dispatch_time_entry':
        return <Clock className="h-4 w-4 text-info" />;
      case 'dispatch_expense':
        return <Receipt className="h-4 w-4 text-warning" />;
      case 'dispatch_material':
        return <Package className="h-4 w-4 text-info" />;
      case 'dispatch_activity':
        return <Truck className="h-4 w-4 text-muted-foreground" />;
      case 'won':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'lost':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'updated':
      case 'modified':
        return <Edit className="h-4 w-4 text-warning" />;
      case 'item_added':
        return <Package className="h-4 w-4 text-primary" />;
      case 'email':
        return <Mail className="h-4 w-4 text-primary" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-success" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'note':
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      default:
        return <History className="h-4 w-4 text-primary" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'created':
      case 'created_from_offer':
        return 'bg-success/10 text-success border-success/30';
      case 'status_changed':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'converted_to_service_order':
        return 'bg-success/10 text-success border-success/30';
      case 'service_order_status_changed':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'dispatch_status_changed':
        return 'bg-info/10 text-info border-info/30';
      case 'dispatch_time_entry':
        return 'bg-info/10 text-info border-info/30';
      case 'dispatch_expense':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'dispatch_material':
        return 'bg-info/10 text-info border-info/30';
      case 'dispatch_activity':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      case 'won':
        return 'bg-success/10 text-success border-success/30';
      case 'lost':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'updated':
      case 'modified':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'item_added':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'note':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'created': return t('activityTab.types.created');
      case 'created_from_offer': return t('activityTab.types.createdFromOffer');
      case 'status_changed': return t('activityTab.types.statusChanged');
      case 'converted_to_service_order': return t('activityTab.types.convertedToServiceOrder');
      case 'service_order_status_changed': return t('activityTab.types.serviceOrderStatusChanged');
      case 'dispatch_status_changed': return t('activityTab.types.dispatchStatusChanged');
      case 'dispatch_time_entry': return t('activityTab.types.dispatchTimeEntry');
      case 'dispatch_expense': return t('activityTab.types.dispatchExpense');
      case 'dispatch_material': return t('activityTab.types.dispatchMaterial');
      case 'dispatch_activity': return t('activityTab.types.dispatchActivity');
      case 'won': return t('activityTab.types.won');
      case 'lost': return t('activityTab.types.lost');
      case 'updated': return t('activityTab.types.updated');
      case 'modified': return t('activityTab.types.modified');
      case 'item_added': return t('activityTab.types.itemAdded');
      case 'note': return t('activityTab.types.note');
      default: return type.replace(/_/g, ' ');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {t('activityTab.title')} ({filteredActivities.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as 'all' | 'history' | 'notes')}
              className="px-3 py-1.5 border rounded-md text-sm bg-background"
            >
              <option value="all">{t('activityTab.filterAll')}</option>
              <option value="history">{t('activityTab.filterHistory')}</option>
              <option value="notes">{t('activityTab.filterNotes')}</option>
            </select>
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
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {t('activityTab.addNote')}
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
                placeholder={t('activityTab.notePlaceholder')}
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
                  {t('cancel')}
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
                      {t('saving')}
                    </>
                  ) : (
                    t('activityTab.saveNote')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('activityTab.noActivity')}</p>
            <p className="text-sm text-muted-foreground">{t('activityTab.noActivityHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
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
                            {getActivityLabel(activity.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.createdAt), 'MMM d, yyyy • HH:mm')}
                          </span>
                          {activity.createdBy && (
                            <span className="text-sm text-muted-foreground">
                              {t('activityTab.by')} {getUserName(activity.createdBy)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground leading-relaxed">
                        {translateNote(activity.description, currentLocale)}
                      </p>

                      {activity.details && (
                        <p className="text-sm text-muted-foreground">
                          {translateNote(activity.details, currentLocale)}
                        </p>
                      )}

                      {activity.oldValue && activity.newValue && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-normal">{activity.oldValue}</Badge>
                          <span>→</span>
                          <Badge variant="outline" className="font-normal">{activity.newValue}</Badge>
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
