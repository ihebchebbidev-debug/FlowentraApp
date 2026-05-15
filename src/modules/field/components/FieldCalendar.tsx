import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { Clock, MapPin, User } from "lucide-react";

interface Dispatch {
  id: string;
  serviceOrderId: string;
  technicianName: string;
  customerName: string;
  location: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'pending' | 'assigned' | 'inProgress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: string;
}

// Mock dispatch data
const mockDispatches: Dispatch[] = [
  {
    id: '1',
    serviceOrderId: 'SO-001',
    technicianName: 'John Smith',
    customerName: 'ABC Corp',
    location: 'Downtown Office',
    scheduledStart: new Date(2024, 11, 15, 9, 0),
    scheduledEnd: new Date(2024, 11, 15, 12, 0),
    status: 'assigned',
    priority: 'high',
    type: 'Maintenance'
  },
  {
    id: '2', 
    serviceOrderId: 'SO-002',
    technicianName: 'Sarah Johnson',
    customerName: 'XYZ Industries',
    location: 'Factory Site',
    scheduledStart: new Date(2024, 11, 16, 14, 0),
    scheduledEnd: new Date(2024, 11, 16, 17, 0),
    status: 'pending',
    priority: 'medium',
    type: 'Repair'
  },
  {
    id: '3',
    serviceOrderId: 'SO-003', 
    technicianName: 'Mike Wilson',
    customerName: 'Tech Solutions',
    location: 'Client Office',
    scheduledStart: new Date(2024, 11, 18, 10, 0),
    scheduledEnd: new Date(2024, 11, 18, 15, 0),
    status: 'inProgress',
    priority: 'urgent',
    type: 'Installation'
  }
];

interface FieldCalendarProps {
  currentDate: Date;
}

export function FieldCalendar({ currentDate }: FieldCalendarProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for complete weeks
  const startDay = getDay(monthStart);
  const paddingStart = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  const endDay = getDay(monthEnd);
  const paddingEnd = Array.from({ length: 6 - endDay }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...paddingStart, ...monthDays, ...paddingEnd];

  const getDispatchesForDate = (date: Date) => {
    return mockDispatches.filter(dispatch => {
      const dispatchDate = new Date(dispatch.scheduledStart);
      return (
        dispatchDate.getDate() === date.getDate() &&
        dispatchDate.getMonth() === date.getMonth() &&
        dispatchDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (status: Dispatch['status']) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning';
      case 'assigned': return 'bg-info/20 text-info';
      case 'inProgress': return 'bg-primary/20 text-primary';
      case 'completed': return 'bg-success/20 text-success';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: Dispatch['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-primary';
      case 'low': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {allDays.map((date, index) => {
          const dispatches = getDispatchesForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isSelected = selectedDate && 
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-1 border border-border rounded-sm cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-card hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground'}
                ${isToday(date) ? 'ring-2 ring-primary' : ''}
                ${isSelected ? 'bg-primary/10 border-primary' : ''}
              `}
              onClick={() => setSelectedDate(date)}
            >
              <div className="flex flex-col h-full">
                <span className={`text-xs font-medium ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </span>
                <div className="flex-1 space-y-1 mt-1">
                  {dispatches.slice(0, 2).map(dispatch => (
                    <div 
                      key={dispatch.id}
                      className={`text-xs p-1 rounded ${getStatusColor(dispatch.status)} truncate`}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(dispatch.priority)}`} />
                        <span className="truncate">{dispatch.type}</span>
                      </div>
                    </div>
                  ))}
                  {dispatches.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dispatches.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h4>
              <Badge variant="outline">
                {getDispatchesForDate(selectedDate).length} {t('field:analytics.dispatchesTotal')}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {getDispatchesForDate(selectedDate).map(dispatch => (
                <div key={dispatch.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(dispatch.status)}>
                          {t(`field:status.${dispatch.status}`)}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(dispatch.priority)}`} />
                      </div>
                      <h5 className="font-medium text-foreground mt-1">{dispatch.type}</h5>
                      <p className="text-sm text-muted-foreground">{dispatch.serviceOrderId}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{dispatch.technicianName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{dispatch.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(dispatch.scheduledStart, 'HH:mm')} - {format(dispatch.scheduledEnd, 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Customer: </span>
                    <span className="text-muted-foreground">{dispatch.customerName}</span>
                  </div>
                </div>
              ))}
              
              {getDispatchesForDate(selectedDate).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('field:calendar.noDispatches')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}