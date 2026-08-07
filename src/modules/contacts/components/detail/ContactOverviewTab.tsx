import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { format } from "date-fns";
import { ContactUserGroupsInline } from "../ContactUserGroupsInline";

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
    userGroups?: { id: number; name: string }[];
  };
  onUserGroupsChange?: (groups: { id: number; name: string }[]) => void;
}

export function ContactOverviewTab({ contact, onUserGroupsChange }: ContactOverviewTabProps) {
  const { t } = useTranslation('contacts');

  const notSpecified = t('detail.info.not_specified', '-');
  const fmtDate = (d?: string) => {
    if (!d) return notSpecified;
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return notSpecified;
    return format(parsed, 'PPP');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {t('detail.info.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <DetailField label={t('detail.info.name', 'Name')} value={contact.name || notSpecified} />
              <DetailField
                label={t('detail.info.email')}
                value={contact.email || notSpecified}
                href={contact.email ? `mailto:${contact.email}` : undefined}
              />
              <DetailField
                label={t('detail.info.phone')}
                value={contact.phone || notSpecified}
                href={contact.phone ? `tel:${contact.phone}` : undefined}
              />
              <DetailField label={t('detail.info.company')} value={contact.company || notSpecified} />
              <DetailField label={t('detail.info.position')} value={contact.position || notSpecified} />
              <DetailField label={t('detail.info.address')} value={contact.address || notSpecified} />

              <ContactUserGroupsInline
                contactId={contact.id}
                groups={contact.userGroups ?? []}
                variant="labeled"
                editable
                onChange={onUserGroupsChange}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">{t('detail.info.status')}</span>
                <div className="mt-1">
                  <Badge variant="default" className="capitalize">
                    {t(`detail.status.${contact.status}`, contact.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('detail.info.type')}</span>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {t(`detail.type.${contact.type}`, contact.type)}
                  </Badge>
                </div>
              </div>
              <DetailField label={t('detail.info.cin')} value={contact.cin || notSpecified} />
              <DetailField
                label={t('detail.info.matricule_fiscale')}
                value={contact.matriculeFiscale || notSpecified}
              />
              <DetailField label={t('detail.info.last_contact')} value={fmtDate(contact.lastContactDate)} />
              <DetailField label={t('detail.info.created_at')} value={fmtDate(contact.createdAt)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      {href ? (
        <a
          href={href}
          className="mt-1 block text-sm text-primary hover:underline truncate"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-foreground mt-1 break-words">{value}</p>
      )}
    </div>
  );
}
