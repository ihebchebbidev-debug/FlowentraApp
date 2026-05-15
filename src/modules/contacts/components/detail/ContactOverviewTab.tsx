import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase,
  Calendar,
  User,
  IdCard,
  FileText
} from "lucide-react";
import { format } from "date-fns";

interface ContactOverviewTabProps {
  contact: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    address?: string;
    status: string;
    type: string;
    lastContactDate?: string;
    createdAt?: string;
    updatedAt?: string;
    cin?: string;
    matriculeFiscale?: string;
  };
}

export function ContactOverviewTab({ contact }: ContactOverviewTabProps) {
  const { t } = useTranslation('contacts');

  const infoItems = [
    {
      icon: Mail,
      label: t('detail.info.email'),
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : undefined,
    },
    {
      icon: Phone,
      label: t('detail.info.phone'),
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone}` : undefined,
    },
    {
      icon: Building2,
      label: t('detail.info.company'),
      value: contact.company,
    },
    {
      icon: User,
      label: t('detail.info.position'),
      value: contact.position,
    },
    {
      icon: MapPin,
      label: t('detail.info.address'),
      value: contact.address,
    },
    {
      icon: IdCard,
      label: t('detail.info.cin'),
      value: contact.cin,
    },
    // Matricule Fiscale - for both types
    {
      icon: FileText,
      label: t('detail.info.matricule_fiscale'),
      value: contact.matriculeFiscale,
    },
    {
      icon: Briefcase,
      label: t('detail.info.last_contact'),
      value: contact.lastContactDate 
        ? format(new Date(contact.lastContactDate), 'PPP') 
        : undefined,
    },
    {
      icon: Calendar,
      label: t('detail.info.created_at'),
      value: contact.createdAt 
        ? format(new Date(contact.createdAt), 'PPP') 
        : undefined,
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('detail.info.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="p-2 rounded-lg bg-background shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {item.href && item.value ? (
                  <a 
                    href={item.href} 
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {item.value || '-'}
                  </a>
                ) : (
                  <p className="text-sm font-medium truncate">{item.value || '-'}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status & Type Row */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('detail.info.status')}:</span>
            <Badge variant="default" className="capitalize">
              {t(`detail.status.${contact.status}`, contact.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('detail.info.type')}:</span>
            <Badge variant="outline" className="capitalize">
              {t(`detail.type.${contact.type}`, contact.type)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
