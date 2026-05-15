import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, User, MapPin, Briefcase, Clock } from "lucide-react";

export interface TechnicianInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  status: string;
  workingHours?: {
    start: string;
    end: string;
  };
  avatar?: string;
}

interface TechnicianDetailModalProps {
  technician: TechnicianInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianDetailModal({
  technician,
  open,
  onOpenChange,
}: TechnicianDetailModalProps) {
  const { t } = useTranslation();
  
  if (!technician) return null;

  const fullName = `${technician.firstName} ${technician.lastName}`.trim() || t('dispatcher.unknown');
  const initials = `${technician.firstName?.[0] || ''}${technician.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success';
      case 'busy': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-primary';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = `dispatcher.status_${status}`;
    const translated = t(statusKey);
    return translated !== statusKey ? translated : status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('dispatcher.technician_details')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar
                src={technician.avatar}
                name={fullName}
                seed={technician.id}
                size="lg"
                className="!h-16 !w-16 !rounded-full"
              />
              <span 
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${getStatusColor(technician.status)}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{fullName}</h3>
              <Badge variant="outline" className="capitalize">
                {getStatusLabel(technician.status)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('dispatcher.contact_info')}
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('dispatcher.email')}</p>
                  <a 
                    href={`mailto:${technician.email}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {technician.email || t('dispatcher.not_specified')}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('dispatcher.phone')}</p>
                  <a 
                    href={`tel:${technician.phone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {technician.phone || t('dispatcher.not_specified')}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          {technician.workingHours && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {t('dispatcher.working_hours')}
                </h4>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {technician.workingHours.start} - {technician.workingHours.end}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Skills */}
          {technician.skills && technician.skills.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {t('dispatcher.skills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {technician.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `mailto:${technician.email}`}
              disabled={!technician.email}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('dispatcher.send_email')}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `tel:${technician.phone}`}
              disabled={!technician.phone}
            >
              <Phone className="h-4 w-4 mr-2" />
              {t('dispatcher.call')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
