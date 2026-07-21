import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DetailPageSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLayoutModeContext } from '@/hooks/useLayoutMode';
import {
  ArrowLeft,
  Edit2,
  Star,
  StarOff,
  Loader2,
  User,
  Lock,
  Wrench,
  FileText,
  ShoppingCart,
  ClipboardList,
  StickyNote,
  LayoutDashboard,
  Package,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { useContact, useContacts } from '../hooks/useContacts';
import { useContactNotes } from '../hooks/useNotes';
import { useContactRelatedRecords } from '../hooks/useContactRelatedRecords';
import { useState } from 'react';
import { ContactForm } from '../components/ContactForm';
import { AddNoteDialog } from '../components/AddNoteDialog';
import { ContactOverviewTab } from '../components/detail/ContactOverviewTab';
import { ContactTimelineTab } from '../components/detail/ContactTimelineTab';
import { ContactRelatedTab } from '../components/detail/ContactRelatedTab';
import { ContactPurchaseHistoryTab } from '../components/detail/ContactPurchaseHistoryTab';

import { SupplierArticlesTab } from '../components/detail/SupplierArticlesTab';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('contacts');
  const queryClient = useQueryClient();
  const { canUpdate, canDelete, isMainAdmin } = usePermissions();
  const contactId = id ? parseInt(id, 10) : null;
  
  const { data: contact, isLoading, error, refetch } = useContact(contactId);
  const { updateContact, deleteContact } = useContacts();
  const { 
    notes, 
    isLoading: notesLoading, 
    createNote, 
    updateNote,
    deleteNote,
    isCreating: isCreatingNote,
    isUpdating: isUpdatingNote,
    isDeleting: isDeletingNote 
  } = useContactNotes(contactId);
  
  const { isMobile } = useLayoutModeContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{ id: number; note: string } | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // Fetch related records
  const {
    installations,
    offers,
    sales,
    serviceOrders,
    isLoading: relatedRecordsLoading
  } = useContactRelatedRecords(contactId);

  // Permission checks
  const canEditContact = isMainAdmin || canUpdate('contacts');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdate = async (data: any) => {
    if (!contact) return;
    setIsSubmitting(true);
    try {
      await updateContact(contact.id, data);
      setIsEditOpen(false);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!contact) return;
    await updateContact(contact.id, { favorite: !contact.favorite });
    await refetch();
  };

  const handleAddNote = async (note: string) => {
    await createNote(note);
    await refetch();
  };

  const handleEditNote = async (note: string) => {
    if (!editingNote) return;
    await updateNote(editingNote.id, note);
    setEditingNote(null);
    await refetch();
  };

  const handleDeleteNote = async (noteId: number) => {
    setDeletingNoteId(noteId);
    try {
      await deleteNote(noteId);
      await refetch();
    } finally {
      setDeletingNoteId(null);
    }
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  // Determine back URL: if referrer is /dashboard/suppliers or current path includes it, go back to suppliers
  const isSupplierRoute = location.pathname.includes('/dashboard/suppliers');
  const backUrl = isSupplierRoute ? '/dashboard/suppliers' : '/dashboard/contacts';

  // For suppliers we don't show CRM-related tabs (offers, sales, service orders, installations).
  // Instead, we show an Articles tab listing articles linked via article-suppliers.
  // Purchases tab is supplier-only: the Purchases module deals exclusively with
  // supplier (fournisseur) transactions, so we hide it on contact/company detail pages.
  const tabConfig = isSupplierRoute
    ? (['overview', 'articles', 'purchases', 'timeline'] as const)
    : (['overview', 'installations', 'offers', 'sales', 'serviceOrders', 'timeline'] as const);

  const TAB_META: Record<string, { icon: LucideIcon; label: () => string }> = {
    overview:       { icon: LayoutDashboard, label: () => t('detail.tabs.overview') },
    installations:  { icon: Wrench,          label: () => t('detail.tabs.installations') },
    offers:         { icon: FileText,         label: () => t('detail.tabs.offers') },
    sales:          { icon: ShoppingCart,     label: () => t('detail.tabs.sales') },
    serviceOrders:  { icon: ClipboardList,    label: () => t('detail.tabs.service_orders') },
    purchases:      { icon: Package,          label: () => t('detail.tabs.purchases') },
    articles:       { icon: Package,          label: () => t('detail.tabs.articles', 'Articles') },
    timeline:       { icon: Activity,         label: () => t('detail.tabs.timeline', 'Timeline') },
  };

  if (error || !contact) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('detail.not_found')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('detail.not_found_description')}
          </p>
          <Button onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('detail.back')}
          </Button>
        </div>
      </div>
    );
  }

  const displayName = contact.name || 'Unknown';

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backUrl)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Contact Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className={`h-12 w-12 ${contact.favorite ? 'ring-2 ring-amber-400' : ''}`}>
                        <AvatarImage src={contact.avatar} alt={displayName} />
                        <AvatarFallback className="text-sm bg-primary/10 text-primary">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {contact.favorite && (
                        <Star className="absolute -top-1 -right-1 h-4 w-4 fill-warning text-warning" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl font-semibold break-words line-clamp-2">{displayName}</h1>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {contact.position && <span className="break-words line-clamp-1">{contact.position}</span>}
                        {contact.position && contact.company && <span>•</span>}
                        {contact.company && <span className="break-words line-clamp-1 font-medium">{contact.company}</span>}
                      </div>
                    </div>
                  </div>


                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={toggleFavorite}
                      className="h-9 w-9"
                    >
                      {contact.favorite ? (
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    {canEditContact ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {t('detail.edit')}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="opacity-50">
                        <Lock className="h-4 w-4 mr-2" />
                        {t('detail.edit')}
                      </Button>
                    )}
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
          <div className="w-full">
            {isMobile ? (
              /* Mobile: styled dropdown select */
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                  <SelectValue>
                    {(() => {
                      const meta = TAB_META[activeTab];
                      if (!meta) return null;
                      const Icon = meta.icon;
                      return (
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                          {meta.label()}
                        </span>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                  {tabConfig.map((tab) => {
                    const meta = TAB_META[tab];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <SelectItem key={tab} value={tab} className="rounded-lg cursor-pointer py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1 rounded-md ${activeTab === tab ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-3.5 w-3.5 ${activeTab === tab ? 'text-primary' : 'text-muted-foreground'}`} />
                          </span>
                          <span className={activeTab === tab ? 'text-primary font-medium' : ''}>{meta.label()}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              /* Desktop: tab pills */
              <TabsList variant="underline">
                {tabConfig.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {TAB_META[tab]?.label() ?? tab}
                  </TabsTrigger>
                ))}
              </TabsList>

            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <ContactOverviewTab contact={contact} />
          </TabsContent>

          {!isSupplierRoute && (
            <>
              <TabsContent value="installations">
                <ContactRelatedTab
                  contactId={contact.id}
                  type="installations"
                  records={installations}
                  isLoading={relatedRecordsLoading}
                />
              </TabsContent>

              <TabsContent value="offers">
                <ContactRelatedTab
                  contactId={contact.id}
                  type="offers"
                  records={offers}
                  isLoading={relatedRecordsLoading}
                />
              </TabsContent>

              <TabsContent value="sales">
                <ContactRelatedTab
                  contactId={contact.id}
                  type="sales"
                  records={sales}
                  isLoading={relatedRecordsLoading}
                />
              </TabsContent>

              <TabsContent value="serviceOrders">
                <ContactRelatedTab
                  contactId={contact.id}
                  type="serviceOrders"
                  records={serviceOrders}
                  isLoading={relatedRecordsLoading}
                />
              </TabsContent>
            </>
          )}

          {isSupplierRoute && (
            <TabsContent value="articles">
              <SupplierArticlesTab supplierId={contact.id} supplierName={contact.name} />
            </TabsContent>
          )}

          {/* Purchases Tab — supplier-only */}
          {isSupplierRoute && (
            <TabsContent value="purchases">
              <ContactPurchaseHistoryTab contactId={contact.id} contactName={contact.name || ''} />
            </TabsContent>
          )}

          {/* Timeline Tab — merged notes + activity feed */}
          <TabsContent value="timeline">
            <ContactTimelineTab
              contactId={contact.id}
              notes={notes}
              notesLoading={notesLoading}
              isCreatingNote={isCreatingNote}
              isDeletingNote={isDeletingNote}
              deletingNoteId={deletingNoteId}
              onAddNote={() => setAddNoteOpen(true)}
              onEditNote={(n) => setEditingNote({ id: n.id, note: n.note })}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>
        </Tabs>
      </div>


      {/* Dialogs */}
      <ContactForm
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleUpdate}
        contact={contact}
        isLoading={isSubmitting}
      />

      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        onSubmit={handleAddNote}
        isLoading={isCreatingNote}
      />

      <AddNoteDialog
        open={!!editingNote}
        onOpenChange={(open) => { if (!open) setEditingNote(null); }}
        onSubmit={handleEditNote}
        isLoading={isUpdatingNote}
        mode="edit"
        initialValue={editingNote?.note ?? ''}
      />
    </div>
  );
}
