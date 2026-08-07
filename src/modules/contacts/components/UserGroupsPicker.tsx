import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { userGroupsApi, type UserGroup } from '@/services/api/userGroupsApi';

export const USER_GROUPS_QUERY_KEY = ['user-groups', 'all'] as const;

export function useUserGroupsList() {
  return useQuery<UserGroup[]>({
    queryKey: USER_GROUPS_QUERY_KEY,
    queryFn: () => userGroupsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

interface UserGroupsPickerProps {
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
  /** Optional custom trigger label (used for the "+ Add" affordance). */
  triggerLabel?: string;
}

export function UserGroupsPicker({
  value,
  onChange,
  disabled,
  size = 'default',
  className,
  triggerLabel,
}: UserGroupsPickerProps) {
  const { t } = useTranslation('contacts');
  const [open, setOpen] = useState(false);
  const { data: groups = [], isLoading } = useUserGroupsList();

  const selected = useMemo(
    () => groups.filter((g) => value.includes(g.id)),
    [groups, value],
  );

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {triggerLabel
                ? triggerLabel
                : selected.length === 0
                  ? t('userGroups.placeholder')
                  : selected.map((g) => g.name).join(', ')}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('userGroups.search_placeholder')} />
          <CommandList>
            <CommandEmpty>
              <div className="p-3 text-sm text-muted-foreground space-y-2">
                <p>{t('userGroups.none_available')}</p>
                <Link
                  to="/dashboard/settings/user-groups"
                  className="text-primary hover:underline"
                >
                  {t('userGroups.manage_link')}
                </Link>
              </div>
            </CommandEmpty>
            {!isLoading && groups.length > 0 && (
              <CommandGroup>
                {groups.map((group) => {
                  const isSelected = value.includes(group.id);
                  return (
                    <CommandItem
                      key={group.id}
                      value={group.name}
                      onSelect={() => toggle(group.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{group.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function UserGroupBadges({ groups }: { groups?: { id: number; name: string }[] }) {
  if (!groups || groups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((g) => (
        <Badge key={g.id} variant="secondary" className="text-xs">
          {g.name}
        </Badge>
      ))}
    </div>
  );
}
