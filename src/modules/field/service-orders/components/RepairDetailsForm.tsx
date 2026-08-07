import { useTranslation } from "react-i18next";
import { CalendarIcon, Settings2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import urgencyLevels from '@/data/mock/urgencyLevels.json';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { CreateServiceOrderData } from "../types";

interface Props {
  formData: CreateServiceOrderData;
  promisedDate: Date | undefined;
  setPromisedDate: (date: Date | undefined) => void;
  updateRepair: (field: string, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<CreateServiceOrderData>>;
}

export default function RepairDetailsForm({ 
  formData, 
  promisedDate, 
  setPromisedDate, 
  updateRepair, 
  setFormData 
}: Props) {
  const { t } = useTranslation('service_orders');
  const location = useLocation();
  const { priorities } = useLookups();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('repair_details')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="description">{t('description')} *</Label>
          <Textarea
            id="description"
            required
            placeholder="Describe the problem or service needed"
            value={formData.repair.description}
            onChange={(e) => updateRepair('description', e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location">{t('location')} *</Label>
            <Input
              id="location"
              required
              placeholder="e.g., Server Room A, Production Line 2"
              value={formData.repair.location}
              onChange={(e) => updateRepair('location', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="urgencyLevel">{t('urgency_level')}</Label>
            <Select
              value={formData.repair.urgencyLevel}
              onValueChange={(value) => updateRepair('urgencyLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {urgencyLevels.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {t(`urgency_levels.${u.id}`, u.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('promised_repair_date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {promisedDate ? format(promisedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={promisedDate}
                  onSelect={setPromisedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="priority">{t('priority')}</Label>
              <Link 
                to={`/dashboard/lookups?tab=priorities&returnUrl=${encodeURIComponent(currentPath)}`}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Settings2 className="h-3 w-3" />
                {t('common.manage', 'Manage')}
              </Link>
            </div>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {t(`priorities.${p.id}`, p.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}