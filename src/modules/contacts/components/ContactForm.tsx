import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, User, Building2, Package } from 'lucide-react';
import { MapLocationPicker } from '@/components/shared/MapLocationPicker';
import { FieldError } from '@/components/ui/field-error';
import { useContactValidation } from '../hooks/useContactValidation';
import { UserGroupsPicker } from './UserGroupsPicker';
import type { Contact, CreateContactRequest, UpdateContactRequest } from '@/types/contacts';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateContactRequest | UpdateContactRequest) => Promise<void>;
  contact?: Contact | null;
  isLoading?: boolean;
}

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  status: 'active',
  type: 'individual',
  address: '',
  city: '',
  country: '',
  avatar: '',
  lastContactDate: '',
  cin: '',
  matriculeFiscale: '',
  // TEJ / RiTEJ fiscal identity
  categorieContribuable: '',
  isResident: 'true',
  idTaxpayerType: '',
  paysCode: 'TN',
  autreIdentifiantFiscal: '',
  latitude: '',
  longitude: '',
};

export function ContactForm({ open, onOpenChange, onSubmit, contact, isLoading }: ContactFormProps) {
  const { t } = useTranslation('contacts');
  const [formData, setFormData] = useState(initialFormState);
  const [userGroupIds, setUserGroupIds] = useState<number[]>([]);
  const { validateField, getError, hasErrors, clearErrors } = useContactValidation(t);

  // Sync form data when contact prop changes (for edit mode)
  useEffect(() => {
    if (contact) {
      const c = contact as any;
      let firstName = c.firstName || '';
      let lastName = c.lastName || '';
      if (!firstName && c.name) {
        const nameParts = c.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      setFormData({
        firstName,
        lastName,
        email: c.email || '',
        phone: c.phone || '',
        company: c.company || '',
        position: c.position || '',
        status: c.status || 'active',
        type: c.type || 'individual',
        address: c.address || '',
        city: c.city || '',
        country: c.country || '',
        avatar: c.avatar || '',
        lastContactDate: c.lastContactDate || '',
        cin: c.cin || '',
        matriculeFiscale: c.matriculeFiscale || '',
        categorieContribuable: c.categorieContribuable || (c.type === 'company' ? 'PM' : 'PP'),
        isResident: c.isResident === false ? 'false' : 'true',
        idTaxpayerType: c.idTaxpayerType != null ? String(c.idTaxpayerType) : '',
        paysCode: c.paysCode || 'TN',
        autreIdentifiantFiscal: c.autreIdentifiantFiscal || '',
        latitude: c.latitude != null ? String(c.latitude) : '',
        longitude: c.longitude != null ? String(c.longitude) : '',
      });
      setUserGroupIds((contact.userGroups ?? []).map((g) => g.id));
      clearErrors();
    } else {
      setFormData(initialFormState);
      setUserGroupIds([]);
      clearErrors();
    }
  }, [contact, clearErrors]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Real-time validation for key fields
    if (['email', 'phone', 'firstName', 'lastName'].includes(field)) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submit
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phone', formData.phone);
    const firstNameErr = validateField('firstName', formData.firstName);
    if (emailErr || phoneErr || firstNameErr) return;

    try {
      const submitData: Record<string, any> = {
        firstName: formData.firstName.trim() || null,
        lastName: formData.lastName.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        position: formData.position.trim() || null,
        status: formData.status || 'active',
        type: formData.type || 'individual',
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        cin: formData.cin.trim() || null,
        matriculeFiscale: formData.matriculeFiscale.trim() || null,
        categorieContribuable:
          formData.categorieContribuable || (formData.type === 'company' ? 'PM' : 'PP'),
        isResident: formData.isResident === 'true',
        idTaxpayerType: formData.idTaxpayerType ? parseInt(formData.idTaxpayerType, 10) : null,
        paysCode: formData.paysCode.trim().toUpperCase() || 'TN',
        autreIdentifiantFiscal: formData.autreIdentifiantFiscal.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      
      if (formData.avatar && formData.avatar.trim()) {
        submitData.avatar = formData.avatar.trim();
      }
      if (formData.lastContactDate && formData.lastContactDate.trim()) {
        submitData.lastContactDate = formData.lastContactDate.trim();
      }
      
      submitData.userGroupIds = userGroupIds;

      await onSubmit(submitData as any);
      onOpenChange(false);
      setFormData(initialFormState);
      clearErrors();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? t('detail.edit') : t('addPage.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">{t('addPage.fields.first_name_required_label')}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                placeholder={t('addPage.placeholders.first_name')}
                required
                maxLength={100}
                className={getError('firstName') ? 'border-destructive' : ''}
              />
              <FieldError error={getError('firstName')} />
            </div>

            <div>
              <Label htmlFor="lastName">{t('addPage.fields.last_name_required_label')}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                placeholder={t('addPage.placeholders.last_name')}
                required
                maxLength={100}
                className={getError('lastName') ? 'border-destructive' : ''}
              />
              <FieldError error={getError('lastName')} />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email">{t('addPage.fields.email_label')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder={t('addPage.placeholders.email')}
                maxLength={255}
                className={getError('email') ? 'border-destructive' : ''}
              />
              <FieldError error={getError('email')} />
            </div>

            <div>
              <Label htmlFor="phone">{t('addPage.fields.phone_label')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder={t('addPage.placeholders.phone')}
                maxLength={50}
                className={getError('phone') ? 'border-destructive' : ''}
              />
              <FieldError error={getError('phone')} />
            </div>

            <div>
              <Label htmlFor="company">{t('addPage.fields.company_label')}</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder={t('addPage.placeholders.company')}
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="position">{t('addPage.fields.position_label')}</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleFieldChange('position', e.target.value)}
                placeholder={t('addPage.placeholders.position')}
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="status">{t('addPage.fields.status_label')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('detail.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('detail.status.inactive')}</SelectItem>
                  <SelectItem value="lead">{t('detail.status.lead')}</SelectItem>
                  <SelectItem value="customer">{t('detail.status.customer')}</SelectItem>
                  <SelectItem value="partner">{t('detail.status.partner')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>{t('addPage.type.title')}</Label>
              <div className="flex items-center space-x-6 mt-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'individual' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`} 
                    onClick={() => setFormData({ ...formData, type: 'individual' })}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer" onClick={() => setFormData({ ...formData, type: 'individual' })}>{t('addPage.type.person_label')}</Label>
                    <p className="text-xs text-muted-foreground">{t('addPage.type.person_description')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'company' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`} 
                    onClick={() => setFormData({ ...formData, type: 'company' })}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer" onClick={() => setFormData({ ...formData, type: 'company' })}>{t('addPage.type.company_label')}</Label>
                    <p className="text-xs text-muted-foreground">{t('addPage.type.company_description')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'supplier' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`} 
                    onClick={() => setFormData({ ...formData, type: 'supplier' })}
                  >
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer" onClick={() => setFormData({ ...formData, type: 'supplier' })}>Supplier</Label>
                    <p className="text-xs text-muted-foreground">Supplier contact</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">{t('addPage.fields.address_label')}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder={t('addPage.placeholders.address')}
                maxLength={500}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="city">{t('addPage.fields.city_label')}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder={t('addPage.placeholders.city')}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="country">{t('addPage.fields.country_label')}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder={t('addPage.placeholders.country')}
                maxLength={100}
              />
            </div>

            {/* Geolocation Section with Map Picker */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <MapLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                height="250px"
                showCoordinateInputs={true}
              />
            </div>

            {/* CIN field */}
            <div>
              <Label htmlFor="cin">{t('addPage.fields.cin_label')}</Label>
              <Input
                id="cin"
                value={formData.cin}
                onChange={(e) => handleFieldChange('cin', e.target.value)}
                placeholder={t('addPage.placeholders.cin')}
                maxLength={50}
              />
            </div>

            {/* User groups (optional) */}
            <div className="col-span-2">
              <Label htmlFor="userGroups">
                {t('addPage.fields.user_groups_label')}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({t('addPage.fields.user_groups_optional_hint')})
                </span>
              </Label>
              <UserGroupsPicker value={userGroupIds} onChange={setUserGroupIds} />
            </div>

            {/* Matricule Fiscale field */}
            <div>
              <Label htmlFor="matriculeFiscale">{t('addPage.fields.matricule_fiscale_label')}</Label>
              <Input
                id="matriculeFiscale"
                value={formData.matriculeFiscale}
                onChange={(e) => handleFieldChange('matriculeFiscale', e.target.value)}
                placeholder={t('addPage.placeholders.matricule_fiscale')}
                maxLength={100}
              />
            </div>

            {/* TEJ / RS fiscal identity */}
            <div>
              <Label htmlFor="categorieContribuable">
                {t('addPage.fiscal.categorie_label', 'Catégorie de contribuable')}
              </Label>
              <Select
                value={formData.categorieContribuable || 'PP'}
                onValueChange={(value) => handleFieldChange('categorieContribuable', value)}
              >
                <SelectTrigger id="categorieContribuable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PM">{t('addPage.fiscal.categorie_pm', 'PM — Personne morale')}</SelectItem>
                  <SelectItem value="PP">{t('addPage.fiscal.categorie_pp', 'PP — Personne physique')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="isResident">{t('addPage.fiscal.resident_label', 'Résidence fiscale')}</Label>
              <Select
                value={formData.isResident}
                onValueChange={(value) => handleFieldChange('isResident', value)}
              >
                <SelectTrigger id="isResident">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('addPage.fiscal.resident_yes', 'Résident en Tunisie')}</SelectItem>
                  <SelectItem value="false">{t('addPage.fiscal.resident_no', 'Non résident')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="idTaxpayerType">{t('addPage.fiscal.id_type_label', "Type d'identifiant")}</Label>
              <Select
                value={formData.idTaxpayerType || '1'}
                onValueChange={(value) => handleFieldChange('idTaxpayerType', value)}
              >
                <SelectTrigger id="idTaxpayerType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('addPage.fiscal.id_type_1', '1 — Matricule fiscal')}</SelectItem>
                  <SelectItem value="2">{t('addPage.fiscal.id_type_2', '2 — CIN')}</SelectItem>
                  <SelectItem value="3">{t('addPage.fiscal.id_type_3', '3 — Carte de séjour')}</SelectItem>
                  <SelectItem value="4">{t('addPage.fiscal.id_type_4', '4 — Identifiant fiscal étranger')}</SelectItem>
                  <SelectItem value="5">{t('addPage.fiscal.id_type_5', '5 — Autre')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paysCode">{t('addPage.fiscal.pays_label', 'Code pays (ISO, ex. TN)')}</Label>
              <Input
                id="paysCode"
                value={formData.paysCode}
                onChange={(e) => handleFieldChange('paysCode', e.target.value.toUpperCase().slice(0, 3))}
                placeholder="TN"
                maxLength={3}
              />
            </div>

            {(formData.idTaxpayerType === '4' || formData.idTaxpayerType === '5') && (
              <div>
                <Label htmlFor="autreIdentifiantFiscal">
                  {t('addPage.fiscal.autre_id_label', 'Autre identifiant fiscal')}
                </Label>
                <Input
                  id="autreIdentifiantFiscal"
                  value={formData.autreIdentifiantFiscal}
                  onChange={(e) => handleFieldChange('autreIdentifiantFiscal', e.target.value)}
                  maxLength={50}
                />
              </div>
            )}

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('contacts.form.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || hasErrors()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? t('detail.edit') : t('addPage.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
