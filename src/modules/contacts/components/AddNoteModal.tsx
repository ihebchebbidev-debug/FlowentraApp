import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (content: string) => void;
}

export default function AddNoteModal({ open, onOpenChange, onAdd }: AddNoteModalProps) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    const text = content.trim();
    if (!text) return;
    onAdd(text);
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
