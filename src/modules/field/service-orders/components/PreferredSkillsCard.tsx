import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, Plus, X, Loader2 } from "lucide-react";
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
  const [customValue, setCustomValue] = useState("");
  const [selectValue, setSelectValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

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
        /* silently ignore — user can still free-type */
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

  const handleAddCustom = async () => {
    const value = customValue.trim();
    if (!value) return;
    await addSkill(value);
    setCustomValue("");
  };

  const handleSelectCatalog = async (value: string) => {
    setSelectValue("");
    if (value) await addSkill(value);
  };

  return (
    <Card className="bg-white dark:bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Preferred skills
          {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {skills.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No preferred skills yet. Add the skills technicians should have for this service order.
            </span>
          )}
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
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
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="sm:w-64">
            <Select
              value={selectValue}
              onValueChange={handleSelectCatalog}
              disabled={saving || catalogOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    catalogOptions.length === 0
                      ? "No more skills in catalog"
                      : "Add from skills catalog"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {catalogOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Or type a custom skill..."
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddCustom();
                }
              }}
              disabled={saving}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCustom}
              disabled={saving || !customValue.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Technicians assigned to this service order should have these skills.
        </p>
      </CardContent>
    </Card>
  );
}

export default PreferredSkillsCard;