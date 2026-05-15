import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface AddMaintenanceLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (log: { title: string; description: string; date?: string | null }) => void;
}

export default function AddMaintenanceLogModal({ open, onOpenChange, onAdd }: AddMaintenanceLogModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setDate(null);
    }
  }, [open]);

  const handleSubmit = () => {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;
    onAdd({ title: t, description: d, date });
    setTitle("");
    setDescription("");
    setDate(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Log</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="log-title">Title</Label>
            <Input 
              id="log-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Routine inspection, Oil change" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-description">Description</Label>
            <Textarea 
              id="log-description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the maintenance work performed..."
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-date">Date (optional)</Label>
            <Input 
              id="log-date" 
              type="date" 
              value={date ?? ''} 
              onChange={(e) => setDate(e.target.value || null)} 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Add Log</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}