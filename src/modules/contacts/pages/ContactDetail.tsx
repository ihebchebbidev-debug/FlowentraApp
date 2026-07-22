import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Import services
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddNoteModal from "../components/AddNoteModal";
import { NewOfferInput } from "../components/AddOfferModal";
import AddTagModal from "../components/AddTagModal";
import { ContactProjectsManager } from "../components/ContactProjectsManager";
import { ContactTasksManager } from "../components/ContactTasksManager";
import { ContactSales } from "../components/ContactSales";
import { ContactInvoicesTab } from "@/modules/invoices/components/ContactInvoicesTab";
import { TrendingUp, FileText, PlusCircle, LayoutDashboard, FolderKanban, CheckSquare, StickyNote, Receipt } from "lucide-react";
import { ContactDetailHeader } from "../components/detail/ContactDetailHeader";
import { ContactOverviewCards } from "../components/detail/ContactOverviewCards";
import { ContactNotesSection } from "../components/detail/ContactNotesSection";
import { useContactDetail } from "../hooks/useContactDetail";
import { getInitials, getStatusColor } from "../utils/presentation";
import { contactsApi, contactNotesApi } from '@/services/contactsApi';
import { useToast } from '@/hooks/use-toast';


export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('contacts');
  const { t: tDashboard } = useTranslation('dashboard');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // IMPORTANT: call hooks unconditionally at top of component to preserve hook order
  // Move useContactDetail here so it's invoked on every render (even while loading)
  const { 
  notes, setNotes, isAddNoteOpen, setIsAddNoteOpen, handleAddNote,
  tags, setTags, isAddTagOpen, setIsAddTagOpen, handleAddTag,
  offers: _offers, setOffers, isAddOfferOpen, setIsAddOfferOpen,
  isEditStatusOpen, setIsEditStatusOpen, editingOffer, setEditingOffer,
  openEditStatus, handleUpdateOfferStatus,
  } = useContactDetail(contact, String(id));

  // Load contact data from API
  useEffect(() => {
    if (!id) return;
    
    const loadContact = async () => {
      try {
        // pass id through as string - mock API handles string or numeric ids
        const contactData = await contactsApi.getContactById(parseInt(id as string, 10));
        setContact(contactData);
      } catch (error) {
        toast({
          title: t('detail.toast.load_failed_title'),
          description: t('detail.toast.load_failed_description'),
          variant: "destructive"
        });
        navigate('/dashboard/contacts');
      } finally {
        setLoading(false);
      }
    };

    loadContact();
  }, [id, navigate, toast]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted/60 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Show error if no contact
  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('detail.not_found')}</p>
          <Button onClick={() => navigate('/dashboard/contacts')}>{tDashboard('backToContacts')}</Button>
        </div>
      </div>
    );
  }

  

  const _setNotes = setNotes; const _setTags = setTags; const _isAddOfferOpen = isAddOfferOpen; const _setIsAddOfferOpen = setIsAddOfferOpen; const _isEditStatusOpen = isEditStatusOpen; const _setIsEditStatusOpen = setIsEditStatusOpen; const _editingOffer = editingOffer; const _setEditingOffer = setEditingOffer; const _openEditStatus = openEditStatus; const _handleUpdateOfferStatus = handleUpdateOfferStatus;

  const _handleAddOffer = (input: NewOfferInput) => {
    const newOffer = {
      id: String(Date.now()),
      title: input.title,
      amount: input.amount,
      status: input.status,
      createdAt: new Date().toISOString(),
    };
    setOffers((prev: any) => [newOffer, ...prev]);
  };
 
 // Mock data for related information
 const _mockTodos = [
   { id: 1, title: "Follow up on contract proposal", status: "pending", dueDate: "2024-02-15", priority: "high" },
   { id: 2, title: "Schedule product demo", status: "completed", dueDate: "2024-01-20", priority: "medium" },
   { id: 3, title: "Send pricing information", status: "pending", dueDate: "2024-02-10", priority: "low" },
 ];


  return (
    <div className="min-h-screen bg-background">
      <ContactDetailHeader
        contact={contact}
        onBack={() => navigate('/dashboard/contacts')}
        getInitials={getInitials}
        getStatusColor={getStatusColor}
      />

      {/* Content */}
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full bg-white p-4 rounded-md">
          {/* Tabs navigation */}
          {(() => {
            const TABS = [
              { value: 'overview',   icon: LayoutDashboard, label: t('detail.tabs.overview') },
              { value: 'projects',   icon: FolderKanban,    label: t('detail.tabs.projects') },
              { value: 'todos',      icon: CheckSquare,     label: t('detail.tabs.tasks') },
              { value: 'sales',      icon: TrendingUp,      label: t('detail.tabs.sales') },
              { value: 'invoices',   icon: Receipt,         label: t('detail.tabs.invoices') },
              { value: 'notes',      icon: StickyNote,      label: t('detail.tabs.notes') },
              { value: 'documents',  icon: FileText,        label: t('detail.tabs.files') },
            ];
            const current = TABS.find(tab => tab.value === activeTab);
            return (
              <div className="border-b border-border mb-6">
                {/* Mobile: styled dropdown */}
                <div className="md:hidden py-2">
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
                {/* Desktop: tab pills */}
                <div className="hidden md:block">
                  <TabsList variant="underline">
                    <TabsTrigger value="overview">{t('detail.tabs.overview')}</TabsTrigger>
                    <TabsTrigger value="projects">{t('detail.tabs.projects')}</TabsTrigger>
                    <TabsTrigger value="todos">{t('detail.tabs.tasks')}</TabsTrigger>
                    <TabsTrigger value="sales">{t('detail.tabs.sales')}</TabsTrigger>
                    <TabsTrigger value="invoices">{t('detail.tabs.invoices')}</TabsTrigger>
                    <TabsTrigger value="notes">{t('detail.tabs.notes')}</TabsTrigger>
                    <TabsTrigger value="documents">{t('detail.tabs.files')}</TabsTrigger>
                  </TabsList>

                </div>
              </div>
            );
          })()}

          <TabsContent value="overview" className="mt-0 space-y-4 sm:space-y-6">
            <ContactOverviewCards contact={contact} tags={tags} onAddTag={() => setIsAddTagOpen(true)} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ContactNotesSection notes={notes} />
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <ContactProjectsManager 
              contactId={id!} 
              contactName={contact.name}
            />
          </TabsContent>

          <TabsContent value="todos" className="mt-0">
            <ContactTasksManager 
              contactId={id!} 
              contactName={contact.name}
            />
          </TabsContent>

          <TabsContent value="sales" className="mt-0">
            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('detail.salesPipeline')}
                </CardTitle>
                <Button size="sm" className="gap-2 w-full sm:w-auto" onClick={() => navigate(`/dashboard/sales/add?contactId=${id}`)}>
                  <PlusCircle className="h-4 w-4" />
                  {t('detail.createSale')}
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <ContactSales contactId={id!} contactName={contact.name} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0">
            <ContactInvoicesTab contactId={parseInt(id!, 10)} />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('detail.tabs.notes')}
                </CardTitle>
                <Button size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setIsAddNoteOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  {t('detail.notes.add')}
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {notes.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">{t('detail.notes.no_notes')}</p>
                    </div>
                  )}
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <AddNoteModal open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen} onAdd={handleAddNote} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <Card className="shadow-card border-0">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents & Files
                </CardTitle>
                <Button size="sm" className="gap-2 w-full sm:w-auto">
                  <PlusCircle className="h-4 w-4" />
                  Add Document
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload contracts, proposals, or other related files
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <AddTagModal
          open={isAddTagOpen}
          onOpenChange={setIsAddTagOpen}
          onAdd={handleAddTag}
        />
      </div>
    </div>
  );
}