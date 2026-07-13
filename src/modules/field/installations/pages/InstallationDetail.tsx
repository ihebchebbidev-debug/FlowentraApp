import { useParams, useNavigate } from "react-router-dom";
import { DetailPageSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Edit,
  Package,
  Loader2,
  LayoutDashboard,
  ClipboardList,
  FileText,
  ShoppingCart,
  StickyNote,
  Wrench,
  FolderOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { installationsApi } from "@/services/api/installationsApi";
import { contactsApi } from "@/services/api/contactsApi";
import { usersApi } from "@/services/api/usersApi";
import { useInstallationNotes } from "../hooks/useInstallationNotes";
import { useInstallationRelatedRecords } from "../hooks/useInstallationRelatedRecords";
import { InstallationOverviewTab } from "../components/detail/InstallationOverviewTab";
import { InstallationNotesTab } from "../components/detail/InstallationNotesTab";
import { InstallationRelatedTab } from "../components/detail/InstallationRelatedTab";
import { InstallationDocumentsTab } from "../components/detail/InstallationDocumentsTab";
import { useActionLogger } from "@/hooks/useActionLogger";
import { CompanyBadge } from "@/components/CompanyBadge";
import { TenantSelector } from "@/components/TenantSelector";

export default function InstallationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('installations');
  const { logAction, logButtonClick } = useActionLogger('Installations');
  const [activeTab, setActiveTab] = useState('overview');
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  
  const installationId = id ? parseInt(id, 10) : null;

  // Log page view
  useEffect(() => {
    if (id) {
      logAction('view_detail', `Viewed installation details`, { 
        entityType: 'Installation', 
        entityId: id 
      });
    }
  }, [id]);

  const { data: installation, isLoading, error } = useQuery({
    queryKey: ['installation', id],
    queryFn: () => installationsApi.getById(id!),
    enabled: !!id,
  });

  // Fetch contact details if installation has contactId
  const { data: contact } = useQuery({
    queryKey: ['contact', installation?.contactId],
    queryFn: () => contactsApi.getById(installation!.contactId),
    enabled: !!installation?.contactId,
  });

  // Fetch all users to map createdBy/modifiedBy IDs to names
  const { data: usersData } = useQuery({
    queryKey: ['users-for-audit'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch notes
  const {
    notes,
    isLoading: notesLoading,
    createNote,
    deleteNote,
    isCreating: isCreatingNote,
    isDeleting: isDeletingNote,
  } = useInstallationNotes(installationId);

  // Fetch related records
  const {
    serviceOrders,
    offers,
    sales,
    isLoading: relatedLoading,
  } = useInstallationRelatedRecords(installationId);

  // Get MainAdminUser from localStorage
  const getMainAdminUser = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) return JSON.parse(userData);
    } catch {
      return null;
    }
    return null;
  };

  // Helper to get user name by ID
  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'Unknown';
    
    const users = usersData?.users || [];
    const mainAdmin = getMainAdminUser();
    const numericId = parseInt(userId, 10);
    
    // Check if it's the MainAdminUser (ID 1)
    if (numericId === 1 && mainAdmin) {
      const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
      return name || mainAdmin.email || 'Admin';
    }
    
    // Check in regular users
    const user = users.find(u => u.id?.toString() === userId?.toString());
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      return fullName || user.email || `User ${userId}`;
    }
    
    // Check if it's an email
    if (userId.includes('@')) {
      if (mainAdmin && mainAdmin.email === userId) {
        const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
        return name || userId;
      }
      const userByEmail = users.find(u => u.email === userId);
      if (userByEmail) {
        const fullName = [userByEmail.firstName, userByEmail.lastName].filter(Boolean).join(' ');
        return fullName || userId;
      }
    }
    
    return `User ${userId}`;
  };

  const handleDeleteNote = async (noteId: number) => {
    setDeletingNoteId(noteId);
    try {
      await deleteNote(noteId);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      internal: "bg-success/10 text-success",
      external: "bg-primary/10 text-primary",
      active: "bg-success/10 text-success",
    };
    return colors[type?.toLowerCase()] || "bg-muted text-muted-foreground";
  };
  
  if (isLoading) {
    return <DetailPageSkeleton />;
  }
  
  if (error || !installation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('detail.not_found')}</h3>
          <p className="text-muted-foreground mb-4">{t('detail.not_found_description')}</p>
          <Button onClick={() => navigate('/dashboard/field/installations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('detail.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard/field/installations')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Installation Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Icon + Name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold truncate">{installation.name}</h1>
                        <CompanyBadge tenantId={(installation as any)?.tenantId} />
                        <TenantSelector value={(installation as any)?.tenantId} onChange={() => {}} readOnly compact />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {installation.model && <span className="truncate">{installation.model}</span>}
                        {installation.model && installation.manufacturer && <span>•</span>}
                        {installation.manufacturer && <span className="truncate font-medium">{installation.manufacturer}</span>}
                      </div>
                    </div>
                  </div>


                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/dashboard/field/installations/${installation.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('detail.edit')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile: Select dropdown */}
          {(() => {
            const TABS = [
              { value: 'overview',      icon: LayoutDashboard, label: t('detail.tabs.overview') },
              { value: 'serviceOrders', icon: Wrench,          label: t('detail.tabs.service_orders') },
              { value: 'offers',        icon: FileText,        label: t('detail.tabs.offers') },
              { value: 'sales',         icon: ShoppingCart,    label: t('detail.tabs.sales') },
              { value: 'documents',     icon: FolderOpen,      label: t('detail.tabs.documents') },
              { value: 'notes',         icon: StickyNote,      label: t('detail.tabs.notes') },
            ];
            const current = TABS.find(tab => tab.value === activeTab);
            return (
              <div className="md:hidden">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                    <SelectValue>
                      {current && (
                        <span className="flex items-center gap-2">
                          <current.icon className="h-4 w-4 text-primary flex-shrink-0" />
                          {current.label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                    {TABS.map(({ value, icon: Icon, label }) => (
                      <SelectItem key={value} value={value} className="rounded-lg cursor-pointer py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1 rounded-md ${activeTab === value ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-3.5 w-3.5 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
                          </span>
                          <span className={activeTab === value ? 'text-primary font-medium' : ''}>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
          {/* Desktop: tab pills */}
          <div className="hidden md:block">
            <TabsList variant="underline">
              <TabsTrigger value="overview">{t('detail.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="serviceOrders">{t('detail.tabs.service_orders')}</TabsTrigger>
              <TabsTrigger value="offers">{t('detail.tabs.offers')}</TabsTrigger>
              <TabsTrigger value="sales">{t('detail.tabs.sales')}</TabsTrigger>
              <TabsTrigger value="documents">{t('detail.tabs.documents')}</TabsTrigger>
              <TabsTrigger value="notes">{t('detail.tabs.notes')}</TabsTrigger>
            </TabsList>

          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <InstallationOverviewTab 
              installation={installation} 
              contact={contact}
              getUserName={getUserName}
            />
          </TabsContent>

          {/* Service Orders Tab */}
          <TabsContent value="serviceOrders">
            <InstallationRelatedTab
              type="serviceOrders"
              records={serviceOrders}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <InstallationRelatedTab
              type="offers"
              records={offers}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales">
            <InstallationRelatedTab
              type="sales"
              records={sales}
              isLoading={relatedLoading}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            {installationId && (
              <InstallationDocumentsTab
                installationId={installationId}
                installationName={installation.name}
              />
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <InstallationNotesTab
              notes={notes}
              isLoading={notesLoading}
              isCreating={isCreatingNote}
              isDeleting={isDeletingNote}
              deletingNoteId={deletingNoteId}
              onAddNote={createNote}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}