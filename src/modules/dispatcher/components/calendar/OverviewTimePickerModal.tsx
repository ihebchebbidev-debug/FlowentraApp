import { useState } from "react";
import { format } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OverviewTimePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  technicianName: string;
  jobTitle: string;
  onConfirm: (hour: number, minute: number) => void;
}

export function OverviewTimePickerModal({
  open,
  onOpenChange,
  date,
  technicianName,
  jobTitle,
  onConfirm,
}: OverviewTimePickerModalProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const [selectedHour, setSelectedHour] = useState("8");
  const [selectedMinute, setSelectedMinute] = useState("0");

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8-17
  const minutes = [0, 15, 30, 45];

  const handleConfirm = () => {
    onConfirm(parseInt(selectedHour), parseInt(selectedMinute));
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t('dispatcher.overview_select_time')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date & Assignment Info */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dispatcher.scheduled_date')}</span>
              <span className="font-medium">{format(date, 'EEEE, dd MMMM yyyy', { locale: dateLocale })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dispatcher.assigned_technician')}</span>
              <span className="font-medium">{technicianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dispatcher.job')}</span>
              <span className="font-medium truncate ml-2 max-w-[200px]">{jobTitle}</span>
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dispatcher.overview_hour')}</Label>
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map(h => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('dispatcher.overview_minute')}</Label>
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map(m => (
                    <SelectItem key={m} value={String(m)}>
                      :{String(m).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-center text-lg font-semibold text-primary">
            {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('dispatcher.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('dispatcher.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
