import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditableEntityNumberProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  validate?: (newValue: string) => Promise<string | null>;
  className?: string;
}

export function EditableEntityNumber({ value, onSave, validate, className }: EditableEntityNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("Number cannot be empty");
      return;
    }
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }
    try {
      setIsSaving(true);
      if (validate) {
        const error = await validate(trimmed);
        if (error) {
          toast.error(error);
          setIsSaving(false);
          return;
        }
      }
      await onSave(trimmed);
      setIsEditing(false);
      toast.success("Number updated successfully");
    } catch (error) {
      console.error("Failed to update number:", error);
      toast.error("Failed to update number");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-lg font-semibold w-auto min-w-[180px] max-w-[300px]"
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-primary hover:text-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <h1 className={cn("text-xl font-semibold text-foreground truncate", className)}>
        {value}
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Edit number"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
