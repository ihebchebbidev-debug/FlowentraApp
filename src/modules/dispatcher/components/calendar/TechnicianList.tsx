import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, Clock, Briefcase, MapPin, Send, User, Search, CheckCircle, AlertTriangle, XCircle, Circle } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { Technician } from "../../types";
import type { TechnicianScheduleInfo } from "../../hooks/useTechnicianSchedule";
import { lookupHexColorForStatus } from '@/modules/scheduling/utils';
import { LookupsService } from '@/modules/lookups/services/lookups.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTechnicianSchedule } from "../../hooks/useTechnicianSchedule";
import { ComposeEmailDialog, type ComposeEmailData } from "@/modules/email-calendar/components/ComposeEmailDialog";
import { emailAccountsApi, type ConnectedEmailAccountDto } from "@/services/api/emailAccountsApi";
import { toast } from "@/hooks/use-toast";

type TechnicianStatus = 'available' | 'busy' | 'not_working' | 'offline' | 'on_leave' | 'over_capacity';

interface TechnicianListProps {
  technicians: Technician[];
  /** Optional dynamic row heights keyed by technician id (must match calendar grid row heights). */
  rowHeights?: Record<string, number>;
}

export function TechnicianList({
  technicians,
  rowHeights
}: TechnicianListProps) {
  const { t } = useTranslation();
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedEffectiveStatus, setSelectedEffectiveStatus] = useState<string>('available');
  const [selectedScheduleInfo, setSelectedScheduleInfo] = useState<TechnicianScheduleInfo | null>(null);
  
  // Email compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeToEmail, setComposeToEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<ConnectedEmailAccountDto[]>([]);
  
  // Fetch connected email accounts once
  useEffect(() => {
    emailAccountsApi.getAll().then(res => setEmailAccounts(Array.isArray(res) ? res : (res as any)?.data || [])).catch(() => {});
  }, []);
  
  // Fetch real-time schedule data for all technicians
  const technicianIds = useMemo(() => technicians.map(tech => tech.id), [technicians]);
  const { scheduleMap } = useTechnicianSchedule(technicianIds);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success/10 text-success border-success/20';
      case 'busy': return 'bg-warning/10 text-warning border-warning/20';
      case 'offline': return 'bg-muted text-muted-foreground border-border';
      case 'on_leave': return 'bg-secondary text-secondary-foreground border-border';
      case 'not_working': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'over_capacity': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusDotColor = (status: string, hex?: string) => {
    if (hex) return '';
    switch (status) {
      case 'available': return 'bg-success';
      case 'busy': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      case 'on_leave': return 'bg-secondary-foreground';
      case 'not_working': return 'bg-destructive';
      case 'over_capacity': return 'bg-warning';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = `dispatcher.status_${status}`;
    const translated = t(statusKey);
    if (translated === statusKey) {
      const schedulingKey = `scheduling.status_${status}`;
      const schedulingTranslated = t(schedulingKey);
      return schedulingTranslated !== schedulingKey ? schedulingTranslated : status;
    }
    return translated;
  };

  const getTimeAwareStatus = (
    baseStatus: string, 
    workingHours: { start: string; end: string } | null,
    isOnLeave: boolean
  ): { status: string; label: string } => {
    if (isOnLeave) {
      return { status: 'on_leave', label: getStatusLabel('on_leave') };
    }
    
    if (!workingHours) {
      return { status: 'not_working', label: getStatusLabel('not_working') };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < startMinutes) {
      return { 
        status: 'not_working', 
        label: `${t('dispatcher.starts_at', { time: workingHours.start }) || `Starts at ${workingHours.start}`}` 
      };
    }
    
    if (currentMinutes >= endMinutes) {
      return { status: 'offline', label: getStatusLabel('offline') };
    }
    
    if (baseStatus === 'available') {
      return { 
        status: 'available', 
        label: t('dispatcher.available_until', { time: workingHours.end, defaultValue: 'Available until {{time}}' })
      };
    }
    
    return { status: baseStatus, label: getStatusLabel(baseStatus) };
  };

  const handleOpenCompose = useCallback((email: string) => {
    setComposeToEmail(email);
    setComposeOpen(true);
  }, []);

  const handleSendEmail = useCallback(async (data: ComposeEmailData) => {
    if (emailAccounts.length === 0) {
      toast({ title: t('dispatcher.no_email_account'), description: t('dispatcher.no_email_account_desc'), variant: 'destructive' });
      return;
    }
    const account = emailAccounts[0];
    setSendingEmail(true);
    try {
      const raw = await emailAccountsApi.sendEmail(account.id, {
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        attachments: data.attachments,
      });
      const result = (raw as any)?.data || raw;
      if (result.success) {
        toast({ title: t('dispatcher.email_sent_success') });
        setComposeOpen(false);
      } else {
        toast({ title: t('dispatcher.email_sent_error'), description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: t('dispatcher.email_sent_error'), variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  }, [emailAccounts, t]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter technicians by search
  const filteredTechnicians = useMemo(() => {
    if (!searchTerm.trim()) return technicians;
    const term = searchTerm.toLowerCase();
    return technicians.filter(tech => {
      const fullName = `${tech.firstName} ${tech.lastName}`.toLowerCase();
      const skillMatch = tech.skills?.some(s => s.toLowerCase().includes(term));
      const statusMatch = (scheduleMap[tech.id]?.effectiveStatus || tech.status)?.toLowerCase().includes(term);
      return fullName.includes(term) || skillMatch || statusMatch;
    });
  }, [technicians, searchTerm, scheduleMap]);

  // Status icon for accessibility (not color-only)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-2.5 w-2.5 text-success" />;
      case 'busy': return <AlertTriangle className="h-2.5 w-2.5 text-warning" />;
      case 'on_leave': return <Circle className="h-2.5 w-2.5 text-secondary-foreground" />;
      case 'not_working': return <XCircle className="h-2.5 w-2.5 text-destructive" />;
      case 'offline': return <XCircle className="h-2.5 w-2.5 text-muted-foreground" />;
      case 'over_capacity': return <AlertTriangle className="h-2.5 w-2.5 text-warning" />;
      default: return <Circle className="h-2.5 w-2.5 text-muted-foreground" />;
    }
  };

  return (
    <>
      <div className="w-52 border-r bg-card/50 backdrop-blur-sm flex-shrink-0 flex flex-col">
        <ScrollArea className="flex-1">
          {filteredTechnicians.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {t('dispatcher.no_technicians_found', 'No technicians found')}
            </div>
          ) : (
          filteredTechnicians.map(technician => {
            const scheduleInfo = scheduleMap[technician.id];
            const effectiveStatus = scheduleInfo?.effectiveStatus || technician.status;
            const workingHours = scheduleInfo?.workingHours || technician.workingHours;
            
            const lookup = LookupsService.getTechnicianStatuses().find(i => i.id === effectiveStatus);
            const hex = lookup?.color;
            const avatarClass = getStatusColor(effectiveStatus);
            
            return (
              <div 
                key={technician.id} 
                className="border-b p-4 flex items-center gap-3 hover:bg-accent/30 transition-all duration-200 group cursor-pointer"
                style={{ height: `${rowHeights?.[technician.id] ?? 80}px` }}
                onClick={() => { setSelectedTechnician(technician); setSelectedEffectiveStatus(effectiveStatus); setSelectedScheduleInfo(scheduleInfo || null); }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    src={technician.avatar}
                    name={`${technician.firstName} ${technician.lastName}`}
                    seed={technician.id}
                    size="sm"
                    className="!h-8 !w-8 !rounded-full"
                  />
                  <span 
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${getStatusDotColor((() => {
                      const timeAwareStatus = getTimeAwareStatus(
                        effectiveStatus, 
                        workingHours, 
                        scheduleInfo?.isOnLeave || false
                      );
                      return timeAwareStatus.status;
                    })(), lookupHexColorForStatus(effectiveStatus as TechnicianStatus))}`}
                    style={(() => {
                      const statusHex = lookupHexColorForStatus(effectiveStatus as TechnicianStatus);
                      return statusHex ? { backgroundColor: statusHex } : undefined;
                    })()}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate text-foreground group-hover:text-primary transition-colors">
                    {technician.firstName} {technician.lastName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {(() => {
                      const timeAwareStatus = getTimeAwareStatus(
                        effectiveStatus, 
                        workingHours, 
                        scheduleInfo?.isOnLeave || false
                      );
                      return (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getStatusIcon(timeAwareStatus.status)}
                          <span className="truncate">
                            {scheduleInfo?.isOnLeave && scheduleInfo.leaveType 
                              ? `${timeAwareStatus.label} (${scheduleInfo.leaveType})`
                              : timeAwareStatus.label
                            }
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </ScrollArea>
      </div>

      {/* Technician Details Modal */}
      <Dialog open={!!selectedTechnician} onOpenChange={(open) => !open && setSelectedTechnician(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dispatcher.technician_details')}</DialogTitle>
          </DialogHeader>
          
          {selectedTechnician && (() => {
            const liveScheduleInfo = scheduleMap[selectedTechnician.id];
            const liveEffectiveStatus = liveScheduleInfo?.effectiveStatus || selectedTechnician.status;
            const liveTimeAware = getTimeAwareStatus(
              liveEffectiveStatus,
              liveScheduleInfo?.workingHours || selectedTechnician.workingHours,
              liveScheduleInfo?.isOnLeave || false
            );

            return (
            <div className="space-y-5">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar
                    src={selectedTechnician.avatar}
                    name={`${selectedTechnician.firstName} ${selectedTechnician.lastName}`}
                    seed={selectedTechnician.id}
                    size="lg"
                    className="!h-16 !w-16 !rounded-full"
                  />
                  <span 
                    className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${getStatusDotColor(liveTimeAware.status)}`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedTechnician.firstName} {selectedTechnician.lastName}
                  </h3>
                  <Badge variant="secondary" className={`mt-1 ${getStatusColor(liveTimeAware.status)}`}>
                    {liveTimeAware.label}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Schedule Info Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  {t('dispatcher.schedule_info')}
                </h4>

                {/* Dynamic Schedule Status */}
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{t('dispatcher.schedule_status')}:</span>
                  <span className="font-medium">
                    {liveScheduleInfo?.isOnLeave
                      ? `${t('dispatcher.on_leave')}${liveScheduleInfo.leaveType ? ` (${liveScheduleInfo.leaveType})` : ''}`
                      : !liveScheduleInfo?.isWorkingToday
                        ? t('dispatcher.not_working_today')
                        : liveTimeAware.label
                    }
                  </span>
                </div>

                {/* Dynamic Working Hours for today */}
                {liveScheduleInfo?.workingHours && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t('dispatcher.working_hours_today')}:</span>
                    <span className="font-medium">
                      {liveScheduleInfo.workingHours.start} - {liveScheduleInfo.workingHours.end}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Contact Info Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  {t('dispatcher.contact_info')}
                </h4>

                {selectedTechnician.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t('dispatcher.email')}:</span>
                    <button 
                      className="font-medium text-primary hover:underline cursor-pointer truncate"
                      onClick={() => handleOpenCompose(selectedTechnician.email)}
                    >
                      {selectedTechnician.email}
                    </button>
                  </div>
                )}
                
                {selectedTechnician.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t('dispatcher.phone')}:</span>
                    <a href={`tel:${selectedTechnician.phone}`} className="font-medium text-primary hover:underline">
                      {selectedTechnician.phone}
                    </a>
                  </div>
                )}

                {selectedTechnician.location?.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t('dispatcher.location')}:</span>
                    <span className="font-medium truncate">{selectedTechnician.location.address}</span>
                  </div>
                )}
              </div>

              {/* Skills Section */}
              {selectedTechnician.skills && selectedTechnician.skills.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      {t('dispatcher.skills')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTechnician.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Quick Actions */}
              {selectedTechnician.email && (
                <>
                  <Separator />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => handleOpenCompose(selectedTechnician.email)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {t('dispatcher.send_email')}
                    </Button>
                    {selectedTechnician.phone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        asChild
                      >
                        <a href={`tel:${selectedTechnician.phone}`}>
                          <Phone className="h-3.5 w-3.5" />
                          {t('dispatcher.call')}
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setComposeToEmail('');
        }}
        senderHandle={emailAccounts[0]?.handle || ''}
        sending={sendingEmail}
        onSend={handleSendEmail}
        initialTo={composeToEmail}
      />
    </>
  );
}