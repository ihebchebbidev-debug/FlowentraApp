import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { contactsApi, contactTagsApi } from "@/services/contactsApi";
import {
  ArrowLeft, User, Building2, MapPin, 
  Tag, FileText, Save, X, Plus, Lock, Loader2
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { FieldError } from "@/components/ui/field-error";
import { useContactValidation } from "../hooks/useContactValidation";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';

export default function EditContact() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { t: tContacts } = useTranslation('contacts');
  const { toast } = useToast();
  const { canUpdate, isMainAdmin, isLoading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState("basic");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { viewAll, targetTenantId, handleTenantChange } = useTargetTenant();

  // Permission check
  const hasEditPermission = isMainAdmin || canUpdate('contacts');
  
  // Redirect if no permission
  useEffect(() => {
    if (!permissionsLoading && !hasEditPermission) {
      toast({
        title: t('accessDenied'),
        description: t('accessDeniedEditContacts'),
        variant: "destructive"
      });
      navigate('/dashboard/contacts');
    }
  }, [permissionsLoading, hasEditPermission, navigate, toast, t]);

  const { validateField, getError } = useContactValidation(tContacts);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    status: "",
    type: "individual",
    address: "",
    notes: "",
    favorite: false
  });

  // Load contact data
  useEffect(() => {
    if (!id) return;
    
    const loadContact = async () => {
      try {
        const contact = await contactsApi.getContactById(parseInt(id));
        console.log('[EditContact] Loaded contact data:', contact);
        
        // Handle both frontend Contact type and backend response format
        const contactData = contact as any;
        setFormData({
          name: contactData.name || `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim(),
          email: contactData.email || "",
          phone: contactData.phone || "",
          company: contactData.company || "",
          position: contactData.position || "",
          status: contactData.status || "active",
          type: contactData.type || "individual",
          address: contactData.address || "",
          notes: "", // Notes are handled separately
          favorite: contactData.favorite ?? contactData.isFavorite ?? false
        });
        
        // Handle tags - API may return as tags or empty array
        const contactTags = contactData.tags || [];
        setTags(contactTags.map((tag: any) => typeof tag === 'string' ? tag : tag.name));
      } catch (error) {
        console.error('[EditContact] Failed to load contact:', error);
        toast({
          title: tContacts('editPage.load_failed'),
          description: tContacts('editPage.load_failed_desc'),
          variant: "destructive"
        });
        navigate('/dashboard/contacts');
      } finally {
        setLoading(false);
      }
    };

    loadContact();
  }, [id, navigate, toast]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (typeof value === 'string' && ['email', 'phone', 'name'].includes(field)) {
      validateField(field, value);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: tContacts('addPage.validation.required_fields_missing'),
        description: tContacts('addPage.validation.required_fields_missing_desc'),
        variant: "destructive"
      });
      return;
    }

    // Validate fields before submit
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phone', formData.phone);
    const nameErr = validateField('name', formData.name);
    if (emailErr || phoneErr || nameErr) return;

    setSaving(true);
    try {
      // Update contact
      await contactsApi.updateContact(parseInt(id!), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        position: formData.position || undefined,
        status: formData.status || undefined,
        type: formData.type as "individual" | "company",
        address: formData.address || undefined,
        favorite: formData.favorite
      });

      toast({
        title: tContacts('editPage.update_success'),
        description: tContacts('editPage.update_success_desc', { name: formData.name }),
      });

      navigate('/dashboard/contacts');
    } catch (error) {
      toast({
        title: tContacts('editPage.update_failed'),
        description: tContacts('editPage.update_failed_desc'),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasEditPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('accessDenied')}</h3>
        <p className="text-muted-foreground mb-4">{t('accessDeniedEditContacts')}</p>
        <Button onClick={() => navigate('/dashboard/contacts')}>
          {t('backToContacts')}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tContacts('editPage.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard/contacts')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {tContacts('editPage.back')}
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {formData.type === 'company' ? <Building2 className="h-6 w-6" /> : getInitials(formData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  {tContacts('editPage.title', { name: formData.name })}
                </h1>
                <p className="text-muted-foreground">
                  {formData.position && formData.company 
                    ? tContacts('editPage.position_at', { position: formData.position, company: formData.company })
                    : tContacts('editPage.subtitle')
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard/contacts')}
              className="gap-2"
              disabled={saving}
            >
              <X className="h-4 w-4" />
              {tContacts('editPage.cancel')}
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit}
              className="gap-2 gradient-primary"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? tContacts('editPage.saving') : tContacts('editPage.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Tenant Selector for View All mode (read-only for edit) */}
        <TenantSelector value={targetTenantId} onChange={handleTenantChange} readOnly />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">{tContacts('editPage.tabs.basic')}</TabsTrigger>
            <TabsTrigger value="details">{tContacts('editPage.tabs.details')}</TabsTrigger>
            <TabsTrigger value="additional">{tContacts('editPage.tabs.additional')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {tContacts('editPage.sections.personal')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{tContacts('editPage.labels.full_name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={tContacts('editPage.placeholders.full_name')}
                      className={`w-full ${getError('name') ? 'border-destructive' : ''}`}
                    />
                    <FieldError error={getError('name')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{tContacts('editPage.labels.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={tContacts('editPage.placeholders.email')}
                      className={`w-full ${getError('email') ? 'border-destructive' : ''}`}
                    />
                    <FieldError error={getError('email')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{tContacts('editPage.labels.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={tContacts('editPage.placeholders.phone')}
                      className={`w-full ${getError('phone') ? 'border-destructive' : ''}`}
                    />
                    <FieldError error={getError('phone')} />
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {tContacts('editPage.sections.company')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{tContacts('editPage.labels.contact_type')}</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">{tContacts('editPage.types.individual')}</SelectItem>
                        <SelectItem value="company">{tContacts('editPage.types.company')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{tContacts('editPage.labels.company')}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder={tContacts('editPage.placeholders.company')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">{tContacts('editPage.labels.position')}</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder={tContacts('editPage.placeholders.position')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{tContacts('editPage.labels.status')}</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={tContacts('editPage.placeholders.status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{tContacts('editPage.statuses.active')}</SelectItem>
                        <SelectItem value="prospect">{tContacts('editPage.statuses.prospect')}</SelectItem>
                        <SelectItem value="customer">{tContacts('editPage.statuses.customer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {tContacts('editPage.sections.address')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">{tContacts('editPage.labels.address')}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={tContacts('editPage.placeholders.address')}
                      className="w-full min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    {tContacts('editPage.sections.tags')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newTag">{tContacts('editPage.labels.add_tags')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="newTag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder={tContacts('editPage.placeholders.tag')}
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button onClick={handleAddTag} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="mt-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {tContacts('editPage.sections.additional')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="favorite">{tContacts('editPage.labels.favorite')}</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="favorite"
                      checked={formData.favorite}
                      onChange={(e) => handleInputChange('favorite', e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="favorite" className="text-sm font-normal">
                      {tContacts('editPage.labels.mark_favorite')}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}