import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AddTodoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (todo: { title: string; due?: string | null }) => Promise<void>;
}

export default function AddTodoModal({ open, onOpenChange, onAdd }: AddTodoModalProps) {
  const { t } = useTranslation('field_customers');
  const { t: tCommon } = useTranslation('common');
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDue(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    const t = title.trim();
    if (!t || isAdding) return;
    
    setIsAdding(true);
    try {
      await onAdd({ title: t, due });
      setTitle("");
      setDue(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Add todo error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('todos_section.add_todo')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="todo-title">{t('todos_section.table.title')}</Label>
            <Input id="todo-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tCommon('title_placeholder', 'e.g. Call customer, Schedule visit')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="todo-due">{t('todos_section.table.due')} ({tCommon('optional', 'optional')})</Label>
            <Input id="todo-due" type="date" value={due ?? ''} onChange={(e) => setDue(e.target.value || null)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>{tCommon('cancel', 'Cancel')}</Button>
            <Button onClick={handleSubmit} disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('add', 'Add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
