import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tag: string) => void;
}

export default function AddTagModal({ open, onOpenChange, onAdd }: AddTagModalProps) {
  const [tag, setTag] = useState("");

  const reset = () => setTag("");

  const handleSubmit = () => {
    const value = tag.trim();
    if (!value) return;
    onAdd(value);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Tag name</Label>
            <Input id="tag-name" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. VIP, Prospect" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button onClick={handleSubmit}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
