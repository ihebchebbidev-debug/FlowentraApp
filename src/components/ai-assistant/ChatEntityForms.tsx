// Inline Entity Creation Forms for AI Chat
// Provides compact forms for creating contacts, installations, and articles directly in chat

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  Wrench, 
  Package, 
  Loader2, 
  X,
  Check,
  User,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { contactsApi } from '@/services/api/contactsApi';
import { installationsApi } from '@/services/api/installationsApi';
import { articlesApi } from '@/services/api/articlesApi';
import { toast } from '@/hooks/use-toast';
import type { CreateContactRequest } from '@/types/contacts';
import type { CreateInstallationDto } from '@/modules/field/installations/types';
import type { CreateArticleRequest } from '@/types/articles';

export type EntityFormType = 'contact' | 'installation' | 'article';

interface ChatEntityFormProps {
  type: EntityFormType;
  onSuccess: (entity: any, message: string) => void;
  onCancel: () => void;
}

// =====================================================
// Contact Form
// =====================================================

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  type: 'individual' | 'company';
  status: string;
  address: string;
}

function ContactInlineForm({ onSuccess, onCancel }: Omit<ChatEntityFormProps, 'type'>) {
  const { t } = useTranslation('contacts');
  const { t: tAi } = useTranslation('aiAssistant');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    type: 'individual',
    status: 'active',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: tAi('entityForms.validationError'),
        description: tAi('entityForms.nameRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const request: CreateContactRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        position: formData.position.trim() || undefined,
        type: formData.type,
        status: formData.status,
        address: formData.address.trim() || undefined,
      };
      
      const contact = await contactsApi.create(request);
      const successMessage = tAi('entityForms.contactCreated', { name: `${formData.firstName} ${formData.lastName}` });
      
      toast({
        title: '✅ ' + tAi('entityForms.success'),
        description: successMessage,
      });
      
      onSuccess(contact, successMessage);
    } catch (error) {
      toast({
        title: tAi('entityForms.error'),
        description: error instanceof Error ? error.message : tAi('entityForms.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-primary" />
          {tAi('entityForms.newContact')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cf-firstName" className="text-xs">
                {t('addPage.fields.first_name_required_label')} *
              </Label>
              <Input
                id="cf-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t('addPage.placeholders.first_name')}
                required
                maxLength={100}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cf-lastName" className="text-xs">
                {t('addPage.fields.last_name_required_label')} *
              </Label>
              <Input
                id="cf-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t('addPage.placeholders.last_name')}
                required
                maxLength={100}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cf-email" className="text-xs">{t('addPage.fields.email_label')}</Label>
              <Input
                id="cf-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('addPage.placeholders.email')}
                maxLength={255}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cf-phone" className="text-xs">{t('addPage.fields.phone_label')}</Label>
              <Input
                id="cf-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('addPage.placeholders.phone')}
                maxLength={50}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cf-company" className="text-xs">{t('addPage.fields.company_label')}</Label>
              <Input
                id="cf-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder={t('addPage.placeholders.company')}
                maxLength={255}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cf-position" className="text-xs">{t('addPage.fields.position_label')}</Label>
              <Input
                id="cf-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={t('addPage.placeholders.position')}
                maxLength={255}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">{t('addPage.type.title')}</Label>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'individual' })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all",
                  formData.type === 'individual' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                )}
              >
                <User className="h-3.5 w-3.5" />
                {t('addPage.type.person_label')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'company' })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all",
                  formData.type === 'company' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                {t('addPage.type.company_label')}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-1" />
              {tAi('entityForms.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {tAi('entityForms.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Installation Form
// =====================================================

interface InstallationFormData {
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  category: string;
  type: string;
  contactId: string;
  siteAddress: string;
}

function InstallationInlineForm({ onSuccess, onCancel }: Omit<ChatEntityFormProps, 'type'>) {
  const { t } = useTranslation('installations');
  const { t: tAi } = useTranslation('aiAssistant');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InstallationFormData>({
    name: '',
    model: '',
    manufacturer: '',
    serialNumber: '',
    category: 'general',
    type: 'external',
    contactId: '',
    siteAddress: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contactId.trim()) {
      toast({
        title: tAi('entityForms.validationError'),
        description: tAi('entityForms.installationRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    const contactIdNum = parseInt(formData.contactId, 10);
    if (isNaN(contactIdNum)) {
      toast({
        title: tAi('entityForms.validationError'),
        description: tAi('entityForms.invalidContactId'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const request: CreateInstallationDto = {
        contactId: contactIdNum,
        name: formData.name.trim(),
        model: formData.model.trim() || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        category: formData.category || 'general',
        type: formData.type || 'external',
        siteAddress: formData.siteAddress.trim() || undefined,
        status: 'active',
      };
      
      const installation = await installationsApi.create(request);
      const successMessage = tAi('entityForms.installationCreated', { name: formData.name });
      
      toast({
        title: '✅ ' + tAi('entityForms.success'),
        description: successMessage,
      });
      
      onSuccess(installation, successMessage);
    } catch (error) {
      toast({
        title: tAi('entityForms.error'),
        description: error instanceof Error ? error.message : tAi('entityForms.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-4 w-4 text-primary" />
          {tAi('entityForms.newInstallation')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="if-name" className="text-xs">{t('installation_name')} *</Label>
              <Input
                id="if-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('placeholders.name')}
                required
                maxLength={200}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="if-contactId" className="text-xs">{tAi('entityForms.contactId')} *</Label>
              <Input
                id="if-contactId"
                type="number"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                placeholder={tAi('entityForms.contactIdPlaceholder')}
                required
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="if-model" className="text-xs">{t('model')}</Label>
              <Input
                id="if-model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder={t('placeholders.model')}
                maxLength={200}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="if-manufacturer" className="text-xs">{t('manufacturer')}</Label>
              <Input
                id="if-manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder={t('placeholders.manufacturer')}
                maxLength={200}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="if-serialNumber" className="text-xs">{t('serial_number')}</Label>
              <Input
                id="if-serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder={t('placeholders.serial_number')}
                maxLength={100}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="if-type" className="text-xs">{t('type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t('internal_sold')}</SelectItem>
                  <SelectItem value="external">{t('external_owned')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="if-siteAddress" className="text-xs">{t('address')}</Label>
            <Input
              id="if-siteAddress"
              value={formData.siteAddress}
              onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
              placeholder={t('placeholders.address')}
              maxLength={500}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-1" />
              {tAi('entityForms.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {tAi('entityForms.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Article Form
// =====================================================

interface ArticleFormData {
  name: string;
  description: string;
  type: 'material' | 'service';
  category: string;
  stock: string;
  costPrice: string;
  sellPrice: string;
  basePrice: string; // For services
  duration: string;  // For services (in minutes)
}

function ArticleInlineForm({ onSuccess, onCancel }: Omit<ChatEntityFormProps, 'type'>) {
  const { t } = useTranslation('articles');
  const { t: tAi } = useTranslation('aiAssistant');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ArticleFormData>({
    name: '',
    description: '',
    type: 'material',
    category: 'general',
    stock: '',
    costPrice: '',
    sellPrice: '',
    basePrice: '',
    duration: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: tAi('entityForms.validationError'),
        description: tAi('entityForms.articleNameRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const request: CreateArticleRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        category: formData.category || 'general',
        status: 'available',
        // Material fields
        stock: formData.type === 'material' && formData.stock ? parseInt(formData.stock, 10) : undefined,
        costPrice: formData.type === 'material' && formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        sellPrice: formData.type === 'material' && formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
        // Service fields
        basePrice: formData.type === 'service' && formData.basePrice ? parseFloat(formData.basePrice) : undefined,
        duration: formData.type === 'service' && formData.duration ? parseInt(formData.duration, 10) : undefined,
      };
      
      const article = await articlesApi.create(request);
      const successMessage = tAi('entityForms.articleCreated', { name: formData.name });
      
      toast({
        title: '✅ ' + tAi('entityForms.success'),
        description: successMessage,
      });
      
      onSuccess(article, successMessage);
    } catch (error) {
      toast({
        title: tAi('entityForms.error'),
        description: error instanceof Error ? error.message : tAi('entityForms.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-primary" />
          {tAi('entityForms.newArticle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="af-name" className="text-xs">{t('add.article_name')} *</Label>
              <Input
                id="af-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('add.article_name_placeholder')}
                required
                maxLength={255}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="af-type" className="text-xs">{tAi('entityForms.articleType')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'material' | 'service') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">{tAi('entityForms.material')}</SelectItem>
                  <SelectItem value="service">{tAi('entityForms.service')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="af-description" className="text-xs">{tAi('entityForms.description')}</Label>
            <Textarea
              id="af-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={tAi('entityForms.descriptionPlaceholder')}
              maxLength={1000}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Material fields */}
          {formData.type === 'material' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="af-stock" className="text-xs">{t('add.current_stock')}</Label>
                <Input
                  id="af-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="af-costPrice" className="text-xs">{tAi('entityForms.costPrice')}</Label>
                <Input
                  id="af-costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="af-sellPrice" className="text-xs">{t('add.sell_price')}</Label>
                <Input
                  id="af-sellPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Service fields */}
          {formData.type === 'service' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="af-basePrice" className="text-xs">{tAi('entityForms.basePrice')}</Label>
                <Input
                  id="af-basePrice"
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="af-duration" className="text-xs">{tAi('entityForms.duration')}</Label>
                <Input
                  id="af-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder={tAi('entityForms.durationPlaceholder')}
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-1" />
              {tAi('entityForms.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {tAi('entityForms.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Main Export Component
// =====================================================

export function ChatEntityForm({ type, onSuccess, onCancel }: ChatEntityFormProps) {
  switch (type) {
    case 'contact':
      return <ContactInlineForm onSuccess={onSuccess} onCancel={onCancel} />;
    case 'installation':
      return <InstallationInlineForm onSuccess={onSuccess} onCancel={onCancel} />;
    case 'article':
      return <ArticleInlineForm onSuccess={onSuccess} onCancel={onCancel} />;
    default:
      return null;
  }
}
