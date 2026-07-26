import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, X, Loader2 } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

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
    // Optimistic — flip badges instantly, revert on failure.
    const previous = skills;
    onChange(next);
    setSaving(true);
    try {
      await serviceOrdersApi.update(serviceOrderId, { preferredSkills: next });
    } catch (err) {
      console.error("Failed to update preferred skills", err);
      toast.error("Failed to update preferred skills");
      onChange(previous);
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
    setQuery("");
    setOpen(false);
    await persist([...skills, value]);
  };

  const removeSkill = async (skill: string) => {
    await persist(skills.filter((s) => s.toLowerCase() !== skill.toLowerCase()));
  };

  const trimmedQuery = query.trim();
  const canCreate =
    trimmedQuery.length > 0 &&
    !currentLower.has(trimmedQuery.toLowerCase()) &&
    !catalog.some((c) => c.toLowerCase() === trimmedQuery.toLowerCase());

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
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setQuery("");
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={saving}
              className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-dashed border-border/70 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Search className="h-3 w-3" />
              <span>
                {skills.length === 0 ? "Add skill" : "Add another"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command shouldFilter>
              <CommandInput
                placeholder="Search or type to create…"
                value={query}
                onValueChange={setQuery}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {canCreate ? (
                    <button
                      type="button"
                      onClick={() => addSkill(trimmedQuery)}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded-sm"
                    >
                      Create "{trimmedQuery}"
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No matches
                    </span>
                  )}
                </CommandEmpty>
                {catalogOptions.length > 0 && (
                  <CommandGroup heading="From catalog">
                    {catalogOptions.map((s) => (
                      <CommandItem
                        key={s}
                        value={s}
                        onSelect={() => addSkill(s)}
                        className="text-xs"
                      >
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {canCreate && catalogOptions.length > 0 && (
                  <CommandGroup heading="Create new">
                    <CommandItem
                      value={`__create__${trimmedQuery}`}
                      onSelect={() => addSkill(trimmedQuery)}
                      className="text-xs"
                    >
                      + Create "{trimmedQuery}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {skills.length === 0 && !open && (
          <span className="text-xs text-muted-foreground italic">Not specified</span>
        )}
      </div>
    </div>
  );
}

export default PreferredSkillsCard;
