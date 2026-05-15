import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { 
  Package, 
  MapPin, 
  Shield, 
  User, 
  Calendar, 
  ExternalLink,
  Building,
  Hash,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import type { InstallationDto } from "../../types";

interface InstallationOverviewTabProps {
  installation: InstallationDto;
  contact?: {
    id: number;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
  } | null;
  getUserName: (userId: string | undefined) => string;
}

export function InstallationOverviewTab({ 
  installation, 
  contact,
  getUserName 
}: InstallationOverviewTabProps) {
  const { t } = useTranslation('installations');

  const getWarrantyStatus = () => {
    if (!installation.warranty?.hasWarranty) {
      return { status: 'none', color: 'bg-muted text-muted-foreground', text: t('no_warranty') };
    }
    
    if (installation.warranty?.warrantyTo) {
      const now = new Date();
      const warrantyEnd = new Date(installation.warranty.warrantyTo);
      const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-destructive/10 text-destructive', text: t('warranty_expired') };
      if (daysUntilExpiry < 30) return { status: 'expiring', color: 'bg-warning/10 text-warning', text: t('warranty_expiring') };
      return { status: 'active', color: 'bg-success/10 text-success', text: t('warranty_active') };
    }
    
    return { status: 'active', color: 'bg-success/10 text-success', text: t('warranty_active') };
  };

  const warrantyStatus = getWarrantyStatus();

  // Helper to translate category/status values
  const translateValue = (value: string | undefined, prefix: string) => {
    if (!value) return undefined;
    const key = `${prefix}.${value.toLowerCase().replace(/\s+/g, '_')}`;
    const translated = t(key, { defaultValue: '' });
    // If translation exists, use it; otherwise capitalize the raw value
    return translated || value.charAt(0).toUpperCase() + value.slice(1);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Installation Details */}
      <div className="space-y-6">
        {/* Installation Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t('installation_details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Package} label={t('installation_name')} value={installation.name} />
            <InfoRow icon={Hash} label={t('detail.installation_number')} value={installation.installationNumber} />
            <InfoRow icon={Package} label={t('model')} value={installation.model} />
            <InfoRow icon={Building} label={t('manufacturer')} value={installation.manufacturer} />
            <InfoRow icon={Hash} label={t('detail.serial_number')} value={installation.serialNumber} />
            <InfoRow icon={Hash} label={t('matricule')} value={installation.matricule} />
            <InfoRow icon={Package} label={t('detail.category')} value={translateValue(installation.category, 'categories')} />
            <InfoRow icon={Calendar} label={t('detail.status')} value={translateValue(installation.status, 'statuses')} />
            {installation.siteAddress && (
              <InfoRow icon={MapPin} label={t('location')} value={installation.siteAddress} />
            )}
          </CardContent>
        </Card>

      </div>

      {/* Right Column - Contact & Audit */}
      <div className="space-y-6">
        {/* Contact Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t('contact_information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {installation.contactId && installation.contactId !== 0 && contact ? (
              <>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{t('detail.contact_name')}</p>
                    <Link 
                      to={`/dashboard/contacts/${contact.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {contact.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                {contact.company && (
                  <InfoRow icon={Building} label={t('detail.company')} value={contact.company} />
                )}
                {contact.phone && (
                  <InfoRow icon={Phone} label={t('detail.phone')} value={contact.phone} />
                )}
                {contact.email && (
                  <InfoRow icon={Mail} label={t('detail.email')} value={contact.email} />
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{t('detail.type')}</p>
                    <Badge className="status-info">{t('internal')}</Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{t('detail.customer')}</p>
                    <p className="text-sm font-medium text-muted-foreground">-</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('audit_trail')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('created')}</p>
                <p className="text-sm font-medium">
                  {installation.createdDate ? format(new Date(installation.createdDate), 'PPP') : '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('detail.by')} {getUserName(installation.createdBy)}
                </p>
              </div>
            </div>
            {installation.modifiedDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('last_modified')}</p>
                  <p className="text-sm font-medium">
                    {format(new Date(installation.modifiedDate), 'PPP')}
                  </p>
                  {installation.modifiedBy && (
                    <p className="text-xs text-muted-foreground">
                      {t('detail.by')} {getUserName(installation.modifiedBy)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ 
  icon: Icon, 
  label, 
  value, 
  capitalize = false 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value?: string | null; 
  capitalize?: boolean;
}) {
  if (!value) return null;
  
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
