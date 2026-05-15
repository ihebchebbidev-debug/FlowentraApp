import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { contactsApi } from "@/services/contactsApi";
import {
  ArrowLeft, User, Building2, MapPin, 
  Tag, FileText, Save, X, Plus, CreditCard
} from "lucide-react";

export default function AddContact() {
  const navigate = useNavigate();
  const { t } = useTranslation('contacts');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    status: "",
    type: "person",
    address: "",
    notes: "",
    favorite: false,
    cin: "",
    matriculeFiscale: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    if (!formData.firstName || !formData.email) {
      toast({
        title: t('contacts.form.validation.required_fields'),
        description: t('contacts.form.validation.required_fields_desc'),
        variant: "destructive"
      });
      return;
    }

    try {
      // Create contact via API
      const newContact = await contactsApi.createContact({
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        position: formData.position || undefined,
        status: formData.status || 'active',
        type: formData.type === 'company' ? 'company' : 'individual',
        address: formData.address || undefined,
        favorite: formData.favorite,
        cin: formData.cin || undefined,
        matriculeFiscale: formData.matriculeFiscale || undefined
      });

      toast({
        title: t('contacts.form.success.title'),
        description: t('contacts.form.success.description', { name: `${formData.firstName} ${formData.lastName}`.trim() }),
      });

      navigate('/dashboard/contacts');
    } catch (error) {
      toast({
        title: t('contacts.form.error.title'),
        description: t('contacts.form.error.description'),
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard/contacts')}
              className="gap-2 px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('contacts.form.back')}</span>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {formData.type === 'company' ? <Building2 className="h-5 w-5 sm:h-6 sm:w-6" /> : getInitials(`${formData.firstName} ${formData.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {`${formData.firstName} ${formData.lastName}`.trim() || t('contacts.form.new_contact')}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formData.position && formData.company 
                    ? `${formData.position} at ${formData.company}`
                    : t('contacts.form.add_info_below')
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard/contacts')}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">{t('contacts.form.cancel')}</span>
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit}
              className="gap-2 gradient-primary"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{t('contacts.form.save')}</span>
              <span className="sm:hidden">{t('contacts.form.save_short')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="basic" className="px-2 sm:px-4">{t('contacts.form.tabs.basic')}</TabsTrigger>
            <TabsTrigger value="details" className="px-2 sm:px-4">{t('contacts.form.tabs.details')}</TabsTrigger>
            <TabsTrigger value="additional" className="px-2 sm:px-4">{t('contacts.form.tabs.additional')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {t('contacts.form.personal_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('contacts.form.labels.first_name')} *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder={t('contacts.form.placeholders.first_name')}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('contacts.form.labels.last_name')}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder={t('contacts.form.placeholders.last_name')}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contacts.form.labels.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t('contacts.form.placeholders.email')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('contacts.form.labels.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={t('contacts.form.placeholders.phone')}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {t('contacts.form.company_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('contacts.form.labels.contact_type')}</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">{t('contacts.form.types.person')}</SelectItem>
                        <SelectItem value="company">{t('contacts.form.types.company')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('contacts.form.labels.company')}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder={t('contacts.form.placeholders.company')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">{t('contacts.form.labels.position')}</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder={t('contacts.form.placeholders.position')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('contacts.form.labels.status')}</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('contacts.form.placeholders.status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">{t('contacts.form.statuses.lead')}</SelectItem>
                        <SelectItem value="prospect">{t('contacts.form.statuses.prospect')}</SelectItem>
                        <SelectItem value="active">{t('contacts.form.statuses.active')}</SelectItem>
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
                    {t('contacts.form.address_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('contacts.form.labels.address')}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={t('contacts.form.placeholders.address')}
                      className="w-full min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Fiscal Information - CIN & Matricule */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    {t('contacts.form.fiscal_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cin">{t('contacts.form.labels.cin')}</Label>
                    <Input
                      id="cin"
                      value={formData.cin}
                      onChange={(e) => handleInputChange('cin', e.target.value)}
                      placeholder={t('contacts.form.placeholders.cin')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matriculeFiscale">{t('contacts.form.labels.matricule_fiscale')}</Label>
                    <Input
                      id="matriculeFiscale"
                      value={formData.matriculeFiscale}
                      onChange={(e) => handleInputChange('matriculeFiscale', e.target.value)}
                      placeholder={t('contacts.form.placeholders.matricule_fiscale')}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tags */}
            <Card className="shadow-card border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  {t('contacts.form.tags_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newTag">{t('contacts.form.labels.add_tags')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newTag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder={t('contacts.form.placeholders.tag')}
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
          </TabsContent>

          <TabsContent value="additional" className="mt-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('contacts.form.additional_info')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('contacts.form.labels.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder={t('contacts.form.placeholders.notes')}
                    className="w-full min-h-[150px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}