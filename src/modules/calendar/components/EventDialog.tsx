import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, FileText, Trash2, Save, Settings } from "lucide-react";
import { CalendarEvent } from "../types";
import { EventType } from "./EventTypeManager";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStart?: Date;
  initialEnd?: Date;
  event?: CalendarEvent | null;
  eventTypes: EventType[];
  onSave: (data: {
    title: string;
    start: Date;
    end: Date;
    type: string;
    description?: string;
    location?: string;
  }) => void;
  onUpdate: (eventId: string, data: Partial<CalendarEvent>) => void;
  onDelete: (eventId: string) => void;
  onManageTypes: () => void;
}

export function EventDialog({ 
  open, 
  onOpenChange, 
  initialStart, 
  initialEnd, 
  event, 
  eventTypes,
  onSave, 
  onUpdate, 
  onDelete,
  onManageTypes
}: EventDialogProps) {
  const { t } = useTranslation('calendar');
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type || eventTypes[0]?.id || "meeting");
      setDescription(event.description || "");
      setLocation(event.location || "");
      
      const s = new Date(event.start);
      s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
      setStart(s.toISOString().slice(0, 16));
      
      const e = new Date(event.end);
      e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
      setEnd(e.toISOString().slice(0, 16));
    } else {
      setTitle("");
      setType(eventTypes[0]?.id || "meeting");
      setDescription("");
      setLocation("");
      
      if (initialStart) {
        const s = new Date(initialStart);
        s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
        setStart(s.toISOString().slice(0, 16));
      }
      
      if (initialEnd) {
        const e = new Date(initialEnd);
        e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
        setEnd(e.toISOString().slice(0, 16));
      } else if (initialStart) {
        const e = new Date(initialStart.getTime() + 60 * 60 * 1000);
        e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
        setEnd(e.toISOString().slice(0, 16));
      }
    }
  }, [event, initialStart, initialEnd, open, eventTypes]);

  const handleSave = () => {
    if (!title || !start || !end || !type) return;
    
    const eventData = {
      title,
      start: new Date(start),
      end: new Date(end),
      type,
      description: description || undefined,
      location: location || undefined
    };

    if (event) {
      onUpdate(event.id, eventData);
    } else {
      onSave(eventData);
    }
    handleClose();
  };

  const handleDelete = () => {
    if (event) onDelete(event.id);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setType(eventTypes[0]?.id || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {event ? String(t('edit_event')) : String(t('create_event'))}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onManageTypes} className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              {String(t('manage_types'))}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> {String(t('event_title'))}
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="" className="text-base" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {String(t('event_type'))}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {eventTypes.length > 0 ? eventTypes.map((eventType) => (
                  <SelectItem key={eventType.id} value={eventType.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventType.color || '#6b7280' }} />
                      {eventType.name}
                    </div>
                  </SelectItem>
                )) : (
                  <SelectItem value="" disabled>{String(t('loading'))}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start" className="flex items-center gap-2"><Clock className="h-4 w-4" /> {String(t('start_date_time'))}</Label>
              <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end" className="flex items-center gap-2"><Clock className="h-4 w-4" /> {String(t('end_date_time'))}</Label>
              <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="text-base" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {String(t('location'))}</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="" className="text-base" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2"><FileText className="h-4 w-4" /> {String(t('event_description'))}</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="" rows={3} className="text-base resize-none" />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {event && (
            <Button variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-2" /> {String(t('delete'))}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>{String(t('cancel'))}</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            {event ? String(t('update_event')) : String(t('create_event'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
