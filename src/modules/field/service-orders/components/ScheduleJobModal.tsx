import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { usersApi } from "@/services/api/usersApi";
import { dispatchesApi, type CreateDispatchFromJobRequest } from "@/services/api/dispatchesApi";
import type { User } from "@/types/users";

interface ScheduleJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    id: string;
    title: string;
    priority?: string;
    serviceOrderId?: string;
  };
  onScheduled?: () => void;
}

// Generate time slots from 06:00 to 22:00 in 30-min increments
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 22) slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function ScheduleJobModal({ open, onOpenChange, job, onScheduled }: ScheduleJobModalProps) {
  const { t } = useTranslation("service_orders");
  const { t: tCommon } = useTranslation("common");

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeFrom, setTimeFrom] = useState<string>("08:00");
  const [timeTo, setTimeTo] = useState<string>("10:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await usersApi.getAll();
        setUsers(response.users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error(t("schedule_modal.error_loading_users"));
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open, t]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedUserId("");
      setSelectedDate(undefined);
      setTimeFrom("08:00");
      setTimeTo("10:00");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error(t("schedule_modal.select_technician_required"));
      return;
    }
    if (!selectedDate) {
      toast.error(t("schedule_modal.select_date_required"));
      return;
    }
    if (timeFrom >= timeTo) {
      toast.error(t("schedule_modal.invalid_time_range"));
      return;
    }

    try {
      setSubmitting(true);

      // Combine date + time into ISO string
      const [fromH, fromM] = timeFrom.split(":").map(Number);
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(fromH, fromM, 0, 0);

      const request: CreateDispatchFromJobRequest = {
        assignedTechnicianIds: [selectedUserId],
        scheduledDate: scheduledDate.toISOString(),
        scheduledStartTime: `${timeFrom}:00`,
        scheduledEndTime: `${timeTo}:00`,
        priority: job.priority || "medium",
        notes: notes.trim() || undefined,
      };

      await dispatchesApi.createFromJob(Number(job.id), request);
      toast.success(t("schedule_modal.success"));
      onOpenChange(false);
      onScheduled?.();
    } catch (error: any) {
      console.error("Failed to schedule job:", error);
      toast.error(error?.message || t("schedule_modal.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUser = users.find(u => String(u.id) === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {t("schedule_modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("schedule_modal.description", { jobTitle: job.title })}
          </DialogDescription>
        </DialogHeader>

        {/* Job Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <Badge variant="outline" className="text-xs">{job.id}</Badge>
          <span className="text-sm font-medium truncate">{job.title}</span>
        </div>

        <Separator />

        <div className="space-y-5">
          {/* Technician Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("schedule_modal.technician")}</Label>
            {loadingUsers ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 w-full bg-muted rounded-md" />
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("schedule_modal.select_technician")} />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {(user.firstName?.[0] || "").toUpperCase()}
                            {(user.lastName?.[0] || "").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                        {(user as any).isMainAdmin && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("schedule_modal.date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : t("schedule_modal.pick_date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time From / To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t("schedule_modal.time_from")}
              </Label>
              <Select value={timeFrom} onValueChange={setTimeFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={`from-${slot}`} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t("schedule_modal.time_to")}
              </Label>
              <Select value={timeTo} onValueChange={setTimeTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={`to-${slot}`} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("schedule_modal.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("schedule_modal.notes_placeholder")}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedUserId || !selectedDate}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("schedule_modal.scheduling")}
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t("schedule_modal.confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
