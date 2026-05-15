import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { usersApi } from '@/services/api/usersApi';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserOption {
  id: number;
  name: string;
  email: string;
  isMainAdmin?: boolean;
  roles?: { name: string }[];
}

interface UserMentionDropdownProps {
  isOpen: boolean;
  searchQuery: string;
  onSelect: (user: UserOption) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function UserMentionDropdown({
  isOpen,
  searchQuery,
  onSelect,
  onClose,
  position
}: UserMentionDropdownProps) {
  const { t } = useTranslation('aiAssistant');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await usersApi.getAll();
        const userOptions: UserOption[] = (response.users || []).map((user: any) => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email || '',
          isMainAdmin: user.isMainAdmin,
          roles: user.roles || []
        }));
        setUsers(userOptions);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen, users.length]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.roles?.some(r => r.name?.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
    setSelectedIndex(0);
  }, [searchQuery, users]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredUsers[selectedIndex]) {
          onSelect(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredUsers, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = dropdownRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-72 bg-popover border border-border rounded-lg shadow-lg bottom-full mb-2 left-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">{t('mentionUsers', 'Mention a team member')}</span>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="max-h-[200px]">
        {/* Loading state */}
        {isLoading && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            {t('loadingUsers', 'Loading users...')}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            {t('noUsersFound', 'No users found')}
          </div>
        )}

        {/* User list */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="py-1">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                data-index={index}
                onClick={() => onSelect(user)}
                className={cn(
                  "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                )}
              >
                {/* Avatar initials */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium",
                  index === selectedIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                {/* User name only */}
                <span className="text-sm font-medium truncate">{user.name}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer hint */}
      <div className="bg-popover border-t border-border px-3 py-1.5">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>↑↓ {t('navigate', 'Navigate')}</span>
          <span>↵ {t('select', 'Select')}</span>
          <span>Esc {t('close', 'Close')}</span>
        </div>
      </div>
    </div>
  );
}

export default UserMentionDropdown;
