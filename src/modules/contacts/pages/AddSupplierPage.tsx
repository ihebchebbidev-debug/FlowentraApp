import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, User, Building2, Lock } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContacts } from '../hooks/useContacts';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { MapLocationPicker } from '@/components/shared/MapLocationPicker';
import { FieldError } from '@/components/ui/field-error';
import { useContactValidation } from '../hooks/useContactValidation';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  status: 'active',
  type: 'supplier',
  address: '',
  city: '',
  country: '',
  cin: '',
  matriculeFiscale: '',
  latitude: '',
  longitude: '',
};

export default function AddSupplierPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('suppliers');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation();
  const { createContact } = useContacts();
  const { canCreate, isMainAdmin, isLoading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState(initialFormState);
  const [subType, setSubType] = useState<'individual' | 'company'>('individual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateField, getError, hasErrors, clearErrors } = useContactValidation(t);

  // Clear validation errors when switching between Person/Company so stale errors
  // from a hidden field (e.g. lastName when switching to Company) don't block submit.
  useEffect(() => {
    clearErrors();
  }, [subType, clearErrors]);


  const hasCreatePermission = isMainAdmin || canCreate('contacts');
  
  useEffect(() => {
    if (!permissionsLoading && !hasCreatePermission) {
      toast.error(tDashboard('accessDeniedCreateContacts'));
      navigate('/dashboard/suppliers');
    }
  }, [permissionsLoading, hasCreatePermission, navigate, tDashboard]);

  if (permissionsLoading) {
    return <PageSkeleton />;
  }

  if (!hasCreatePermission) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{tDashboard('accessDenied')}</h3>
        <p className="text-muted-foreground mb-4">{tDashboard('accessDeniedCreateContacts')}</p>
        <Button onClick={() => navigate('/dashboard/suppliers')}>
          {tDashboard('backToContacts')}
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (['email', 'phone', 'firstName', 'lastName'].includes(field)) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error(subType === 'individual' ? t('addPage.validation.first_name_required') : t('addPage.validation.company_name_required'));
      return;
    }
    
    if (subType === 'individual' && !formData.lastName.trim()) {
      toast.error(t('addPage.validation.last_name_required'));
      return;
    }

    // Validate key fields
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phone', formData.phone);
    const firstNameErr = validateField('firstName', formData.firstName);
    const lastNameErr = subType === 'individual' ? validateField('lastName', formData.lastName) : null;
    if (emailErr || phoneErr || firstNameErr || lastNameErr) return;

    setIsSubmitting(true);
    try {
      const isCompany = subType === 'company';
      const submitData = {
        firstName: formData.firstName,
        lastName: isCompany ? '' : formData.lastName,
        name: isCompany
          ? formData.firstName.trim()
          : `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email || null,
        phone: formData.phone || null,
        company: isCompany ? formData.firstName : (formData.company || null),
        position: isCompany ? null : (formData.position || null),
        status: formData.status,
        type: 'supplier',
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        avatar: null,
        lastContactDate: null,
        cin: isCompany ? null : (formData.cin || null),
        matriculeFiscale: formData.matriculeFiscale || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      await createContact(submitData as any);
      toast.success(t('addPage.toasts.created_success'));
      navigate('/dashboard/suppliers');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(t('addPage.toasts.create_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/suppliers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tDashboard('backToContacts')}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{t('addPage.title')}</h1>
          <p className="text-muted-foreground">{t('addPage.description')}</p>
        </div>
      </div>

      {/* Supplier Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('addPage.type.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div 
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  subType === 'individual' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                }`} 
                onClick={() => setSubType('individual')}
              >
                <User className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-medium cursor-pointer" onClick={() => setSubType('individual')}>{t('addPage.type.person_label')}</Label>
                <p className="text-sm text-muted-foreground">{t('addPage.type.person_description')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div 
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  subType === 'company' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                }`} 
                onClick={() => setSubType('company')}
              >
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-medium cursor-pointer" onClick={() => setSubType('company')}>{t('addPage.type.company_label')}</Label>
                <p className="text-sm text-muted-foreground">{t('addPage.type.company_description')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {subType === 'individual' ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
                {subType === 'individual' ? t('addPage.basic.person_title') : t('addPage.basic.company_title')}
              </CardTitle>
              <CardDescription>{t('addPage.basic.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{subType === 'individual' ? t('addPage.fields.first_name_required_label') : t('addPage.fields.company_name_required_label')}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  placeholder={subType === 'individual' ? t('addPage.placeholders.first_name') : t('addPage.placeholders.company_name')}
                  required
                  maxLength={100}
                  className={getError('firstName') ? 'border-destructive' : ''}
                />
                <FieldError error={getError('firstName')} />
              </div>

              {subType === 'individual' && (
                <div className="space-y-2">
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
              )}

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              {subType === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="matriculeFiscale">{t('addPage.fields.matricule_fiscale_label')}</Label>
                  <Input
                    id="matriculeFiscale"
                    value={formData.matriculeFiscale}
                    onChange={(e) => setFormData({ ...formData, matriculeFiscale: e.target.value })}
                    placeholder={t('addPage.placeholders.matricule_fiscale')}
                    maxLength={100}
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{t('addPage.fields.address_label')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('addPage.placeholders.address')}
                  maxLength={500}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t('addPage.fields.city_label')}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('addPage.placeholders.city')}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t('addPage.fields.country_label')}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('addPage.placeholders.country')}
                  maxLength={100}
                />
              </div>

              {subType === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="cin">{t('addPage.fields.cin_label')}</Label>
                  <Input
                    id="cin"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    placeholder={t('addPage.placeholders.cin')}
                    maxLength={50}
                  />
                </div>
              )}

              {subType === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="matriculeFiscale">{t('addPage.fields.matricule_fiscale_label')}</Label>
                  <Input
                    id="matriculeFiscale"
                    value={formData.matriculeFiscale}
                    onChange={(e) => setFormData({ ...formData, matriculeFiscale: e.target.value })}
                    placeholder={t('addPage.placeholders.matricule_fiscale')}
                    maxLength={100}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('addPage.work.title')}</CardTitle>
              <CardDescription>{t('addPage.work.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subType === 'individual' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('addPage.fields.company_label')}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder={t('addPage.placeholders.company')}
                      maxLength={255}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">{t('addPage.fields.position_label')}</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder={t('addPage.placeholders.position')}
                      maxLength={255}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
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
            </CardContent>
          </Card>

          {/* Geolocation with Map Picker */}
          <MapLocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
            height="300px"
            showCoordinateInputs={true}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link to="/dashboard/suppliers">
              <Button type="button" variant="outline">
                {tCommon('cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || hasErrors()}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('addPage.actions.create')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
