import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { skillsApi } from "@/services/api/skillsApi";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";

interface PreferredSkillsCardProps {
  serviceOrderId: number;
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function PreferredSkillsCard({
  serviceOrderId,
  skills,
  onChange,
}: PreferredSkillsCardProps) {
  const [catalog, setCatalog] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    skillsApi
      .getAll()
      .then((all) => {
        if (cancelled) return;
        const names = (all || [])
          .map((s: any) => s?.name)
          .filter((n: any): n is string => typeof n === "string" && n.trim().length > 0);
        setCatalog(Array.from(new Set(names)));
      })
      .catch(() => {
        /* silently ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentLower = useMemo(
    () => new Set(skills.map((s) => s.toLowerCase())),
    [skills],
  );

  const catalogOptions = useMemo(
    () => catalog.filter((s) => !currentLower.has(s.toLowerCase())),
    [catalog, currentLower],
  );

  const persist = async (next: string[]) => {
    setSaving(true);
    try {
      await serviceOrdersApi.update(serviceOrderId, { preferredSkills: next });
      onChange(next);
    } catch (err) {
      console.error("Failed to update preferred skills", err);
      toast.error("Failed to update preferred skills");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (currentLower.has(value.toLowerCase())) {
      toast.info(`"${value}" is already added`);
      return;
    }
    await persist([...skills, value]);
  };

  const removeSkill = async (skill: string) => {
    await persist(skills.filter((s) => s.toLowerCase() !== skill.toLowerCase()));
  };

  const handleSelectCatalog = async (value: string) => {
    setSelectValue("");
    if (value) await addSkill(value);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Preferred skills
        </span>
        {saving && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {skills.length === 0 && (
          <span className="text-sm text-muted-foreground">Not specified</span>
        )}
        {skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="text-xs gap-1 pl-2 pr-1 py-0 h-6 font-normal"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              disabled={saving}
              aria-label={`Remove ${skill}`}
              className="rounded-sm p-0.5 hover:bg-background/60 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={saving}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 space-y-2" align="start">
            <div className="text-xs font-medium text-muted-foreground">
              Add skill from catalog
            </div>
            <Select
              value={selectValue}
              onValueChange={handleSelectCatalog}
              disabled={saving || catalogOptions.length === 0}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue
                  placeholder={
                    catalogOptions.length === 0
                      ? "No more skills in catalog"
                      : "From skills catalog"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {catalogOptions.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default PreferredSkillsCard;
