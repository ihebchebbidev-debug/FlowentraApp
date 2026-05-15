import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home, Users, TrendingUp, Package, Wrench, CheckSquare,
  Settings, BarChart3, Calendar, FileText, Bell, Globe,
  Plus, Search, Moon, Sun, Monitor, ArrowRight, Clock,
  Mail, Workflow, Database, ClipboardList, Zap,
} from 'lucide-react';
import { loadSidebarConfig, type SidebarItemConfig } from '@/modules/dashboard/services/sidebar.service';
import { ICON_REGISTRY, type IconName } from '@/modules/dashboard/components/sidebarIcons';
import { useTheme } from '@/hooks/useTheme';

// Recent items stored in localStorage
const RECENT_KEY = 'command-palette-recent';
const MAX_RECENT = 5;

interface RecentItem {
  label: string;
  path: string;
  icon?: string;
  timestamp: number;
}

function getRecentItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addRecentItem(item: Omit<RecentItem, 'timestamp'>) {
  const recent = getRecentItems().filter(r => r.path !== item.path);
  recent.unshift({ ...item, timestamp: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

// Quick action definitions
const QUICK_ACTIONS = [
  { id: 'new-contact', label: 'commandPalette.newContact', icon: Users, path: '/dashboard/contacts', action: 'create' },
  { id: 'new-offer', label: 'commandPalette.newOffer', icon: TrendingUp, path: '/dashboard/sales', action: 'create' },
  { id: 'new-task', label: 'commandPalette.newTask', icon: CheckSquare, path: '/dashboard/tasks', action: 'create' },
  { id: 'new-service', label: 'commandPalette.newService', icon: Wrench, path: '/dashboard/service-orders', action: 'create' },
] as const;

// Fallback icon resolver
function resolveIcon(iconName?: string) {
  if (!iconName) return ArrowRight;
  const reg = ICON_REGISTRY as Record<string, any>;
  return reg[iconName] || ArrowRight;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [recentItems, setRecentItems] = useState<RecentItem[]>(getRecentItems);

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Refresh recent items when opening
  useEffect(() => {
    if (open) setRecentItems(getRecentItems());
  }, [open]);

  // Load sidebar navigation items
  const navItems = useMemo(() => {
    const config = loadSidebarConfig();
    if (!config) return [];
    return config.filter(i => i.active).map(item => ({
      ...item,
      resolvedIcon: resolveIcon(item.icon),
    }));
  }, [open]); // re-compute when palette opens

  const groupedNav = useMemo(() => {
    const groups: Record<string, typeof navItems> = {};
    navItems.forEach(item => {
      const group = item.group || 'workspace';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [navItems]);

  const groupLabels: Record<string, string> = {
    workspace: t('sidebar.workspace', 'Workspace'),
    crm: t('sidebar.crm', 'CRM'),
    service: t('sidebar.service', 'Service'),
    system: t('sidebar.system', 'System'),
  };

  const handleNavigate = useCallback((path: string, label: string, icon?: string) => {
    addRecentItem({ label, path, icon });
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    setOpen(false);
  }, [setTheme]);

  // Translate sidebar item title
  const resolveTitle = (key: string) => {
    if (!key) return key;
    if (key === 'service orders' || key === 'service-orders') return t('services');
    if (key === 'sales' || key === 'sales-offers') return t('sales');
    if (key === 'todo') return t('todo');
    if (key === 'time-expenses') return t('timeExpenses');
    const translation = t(key);
    if (typeof translation === 'string' && translation !== key) return translation;
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('commandPalette.placeholder', 'Type a command or search...')} />
      <CommandList className="max-h-[420px]">
        <CommandEmpty className="py-8 text-center">
          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('commandPalette.noResults', 'No results found.')}</p>
        </CommandEmpty>

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <CommandGroup heading={t('commandPalette.recent', 'Recent')}>
            {recentItems.map((item) => {
              const Icon = resolveIcon(item.icon);
              return (
                <CommandItem
                  key={item.path}
                  value={`recent-${item.label}`}
                  onSelect={() => handleNavigate(item.path, item.label, item.icon)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground/60" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {recentItems.length > 0 && <CommandSeparator />}

        {/* Quick Actions */}
        <CommandGroup heading={t('commandPalette.quickActions', 'Quick Actions')}>
          {QUICK_ACTIONS.map((action) => (
            <CommandItem
              key={action.id}
              value={`action-${action.id}`}
              onSelect={() => handleNavigate(action.path, t(action.label, action.label))}
            >
              <Plus className="mr-2 h-4 w-4 text-primary" />
              <span>{t(action.label, action.label.split('.').pop())}</span>
              <CommandShortcut>
                <ArrowRight className="h-3 w-3" />
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation — grouped by sidebar groups */}
        {Object.entries(groupedNav).map(([group, items]) => (
          <CommandGroup key={group} heading={groupLabels[group] || group}>
            {items.map((item) => {
              const Icon = item.resolvedIcon;
              const title = resolveTitle(item.title);
              return (
                <CommandItem
                  key={item.url}
                  value={`nav-${item.title}-${title}`}
                  onSelect={() => handleNavigate(item.url, title, item.icon)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />

        {/* Theme switcher */}
        <CommandGroup heading={t('commandPalette.appearance', 'Appearance')}>
          <CommandItem value="theme-light" onSelect={() => handleThemeChange('light')}>
            <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('commandPalette.lightMode', 'Light Mode')}</span>
          </CommandItem>
          <CommandItem value="theme-dark" onSelect={() => handleThemeChange('dark')}>
            <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('commandPalette.darkMode', 'Dark Mode')}</span>
          </CommandItem>
          <CommandItem value="theme-system" onSelect={() => handleThemeChange('system')}>
            <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('commandPalette.systemTheme', 'System Theme')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer with keyboard hints */}
      <div className="border-t border-border/40 px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            {t('commandPalette.navigate', 'Navigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            {t('commandPalette.select', 'Select')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
            {t('commandPalette.close', 'Close')}
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
