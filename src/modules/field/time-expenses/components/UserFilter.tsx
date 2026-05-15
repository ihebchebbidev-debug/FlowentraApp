import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, User, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User as UserType } from '../types';

interface UserFilterProps {
  users: UserType[];
  selectedUsers: string[];
  onUsersChange: (userIds: string[]) => void;
  className?: string;
}

export function UserFilter({ 
  users, 
  selectedUsers, 
  onUsersChange, 
  className 
}: UserFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Auto-select if there's only one user
  useEffect(() => {
    if (users.length === 1 && selectedUsers.length === 0) {
      onUsersChange([users[0].id]);
    }
  }, [users, selectedUsers.length, onUsersChange]);

  const toggleUser = (userId: string) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    onUsersChange(newSelection);
  };

  const selectAll = () => {
    onUsersChange(users.map(user => user.id));
  };

  const clearAll = () => {
    onUsersChange([]);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const getSelectedUsersText = () => {
    if (selectedUsers.length === 0) {
      return t('time-expenses:filters.select_users');
    }
    if (selectedUsers.length === users.length) {
      return t('time-expenses:filters.all_users');
    }
    if (selectedUsers.length === 1) {
      const user = users.find(u => u.id === selectedUsers[0]);
      return user?.name || '';
    }
    return `${selectedUsers.length} ${t('common:selected', 'selected')}`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 px-3 text-sm font-normal border-border bg-background hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedUsers.length > 1 ? (
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate text-foreground">{getSelectedUsersText()}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedUsers.length > 0 && selectedUsers.length < users.length && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal rounded-md">
                  {selectedUsers.length}
                </Badge>
              )}
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-180"
              )} />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[260px] p-0" align="start">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <Input
              placeholder={t('common:search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1 p-1.5 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-xs h-7 flex-1 text-muted-foreground hover:text-foreground"
            >
              {t('common:all')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7 flex-1 text-muted-foreground hover:text-foreground"
            >
              {t('common:clear')}
            </Button>
          </div>

          {/* User list */}
          <ScrollArea className="max-h-[220px]">
            <div className="p-1">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('common:not_found')}
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                        "hover:bg-accent/50",
                        isSelected && "bg-accent"
                      )}
                    >
                      {/* Checkbox indicator */}
                      <div className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        isSelected 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground/40"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-foreground truncate">
                          {user.name}
                        </p>
                        {user.role && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.role}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}