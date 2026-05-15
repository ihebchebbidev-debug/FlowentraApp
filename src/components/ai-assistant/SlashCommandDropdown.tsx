import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckSquare, 
  Navigation, 
  HelpCircle, 
  Calendar,
  Users,
  BarChart3,
  FileText,
  Folder,
  UserPlus,
  Wrench,
  Package,
  PieChart,
  ClipboardList,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  prompt?: string;
  category: 'actions' | 'queries' | 'navigation' | 'create';
}

interface SlashCommandDropdownProps {
  isOpen: boolean;
  searchQuery: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandDropdown({ 
  isOpen, 
  searchQuery, 
  onSelect, 
  onClose 
}: SlashCommandDropdownProps) {
  const { t } = useTranslation('aiAssistant');
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available slash commands
  const commands: SlashCommand[] = [
    // Create Actions (NEW)
    {
      id: 'newcontact',
      name: t('slashCommands.newContact'),
      description: t('slashCommands.newContactDesc'),
      icon: <UserPlus className="h-4 w-4" />,
      prompt: t('slashCommands.newContactPrompt'),
      category: 'create'
    },
    {
      id: 'newinstallation',
      name: t('slashCommands.newInstallation'),
      description: t('slashCommands.newInstallationDesc'),
      icon: <Wrench className="h-4 w-4" />,
      prompt: t('slashCommands.newInstallationPrompt'),
      category: 'create'
    },
    {
      id: 'newarticle',
      name: t('slashCommands.newArticle'),
      description: t('slashCommands.newArticleDesc'),
      icon: <Package className="h-4 w-4" />,
      prompt: t('slashCommands.newArticlePrompt'),
      category: 'create'
    },
    {
      id: 'form',
      name: t('slashCommands.form'),
      description: t('slashCommands.formDesc'),
      icon: <FileSpreadsheet className="h-4 w-4" />,
      prompt: t('slashCommands.formPrompt'),
      category: 'create'
    },
    // Actions
    {
      id: 'task',
      name: t('slashCommands.task'),
      description: t('slashCommands.taskDesc'),
      icon: <CheckSquare className="h-4 w-4" />,
      prompt: t('slashCommands.taskPrompt'),
      category: 'actions'
    },
    {
      id: 'schedule',
      name: t('slashCommands.schedule'),
      description: t('slashCommands.scheduleDesc'),
      icon: <Calendar className="h-4 w-4" />,
      prompt: t('slashCommands.schedulePrompt'),
      category: 'actions'
    },
    {
      id: 'note',
      name: t('slashCommands.note'),
      description: t('slashCommands.noteDesc'),
      icon: <FileText className="h-4 w-4" />,
      prompt: t('slashCommands.notePrompt'),
      category: 'actions'
    },
    // Queries
    {
      id: 'stats',
      name: t('slashCommands.stats'),
      description: t('slashCommands.statsDesc'),
      icon: <BarChart3 className="h-4 w-4" />,
      prompt: t('slashCommands.statsPrompt'),
      category: 'queries'
    },
    {
      id: 'team',
      name: t('slashCommands.team'),
      description: t('slashCommands.teamDesc'),
      icon: <Users className="h-4 w-4" />,
      prompt: t('slashCommands.teamPrompt'),
      category: 'queries'
    },
    {
      id: 'projects',
      name: t('slashCommands.projects'),
      description: t('slashCommands.projectsDesc'),
      icon: <Folder className="h-4 w-4" />,
      prompt: t('slashCommands.projectsPrompt'),
      category: 'queries'
    },
    {
      id: 'reports',
      name: t('slashCommands.reports'),
      description: t('slashCommands.reportsDesc'),
      icon: <PieChart className="h-4 w-4" />,
      prompt: t('slashCommands.reportsPrompt'),
      category: 'queries'
    },
    // Navigation
    {
      id: 'calendar',
      name: t('slashCommands.calendar'),
      description: t('slashCommands.calendarDesc'),
      icon: <Calendar className="h-4 w-4" />,
      prompt: t('slashCommands.calendarPrompt'),
      category: 'navigation'
    },
    {
      id: 'contacts',
      name: t('slashCommands.contacts'),
      description: t('slashCommands.contactsDesc'),
      icon: <Users className="h-4 w-4" />,
      prompt: t('slashCommands.contactsPrompt'),
      category: 'navigation'
    },
    {
      id: 'installations',
      name: t('slashCommands.installations'),
      description: t('slashCommands.installationsDesc'),
      icon: <MapPin className="h-4 w-4" />,
      prompt: t('slashCommands.installationsPrompt'),
      category: 'navigation'
    },
    {
      id: 'articles',
      name: t('slashCommands.articles'),
      description: t('slashCommands.articlesDesc'),
      icon: <ClipboardList className="h-4 w-4" />,
      prompt: t('slashCommands.articlesPrompt'),
      category: 'navigation'
    },
    {
      id: 'goto',
      name: t('slashCommands.goto'),
      description: t('slashCommands.gotoDesc'),
      icon: <Navigation className="h-4 w-4" />,
      prompt: t('slashCommands.gotoPrompt'),
      category: 'navigation'
    },
    {
      id: 'help',
      name: t('slashCommands.help'),
      description: t('slashCommands.helpDesc'),
      icon: <HelpCircle className="h-4 w-4" />,
      prompt: t('slashCommands.helpPrompt'),
      category: 'navigation'
    }
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = {
    create: filteredCommands.filter(c => c.category === 'create'),
    actions: filteredCommands.filter(c => c.category === 'actions'),
    queries: filteredCommands.filter(c => c.category === 'queries'),
    navigation: filteredCommands.filter(c => c.category === 'navigation')
  };

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        onSelect(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          onSelect(filteredCommands[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderCommandGroup = (title: string, cmds: SlashCommand[], startIndex: number) => {
    if (cmds.length === 0) return null;

    return (
      <div key={title} className="mb-2">
        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
        {cmds.map((cmd, idx) => {
          const globalIndex = startIndex + idx;
          return (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                "hover:bg-primary/10",
                globalIndex === selectedIndex && "bg-primary/10 text-primary"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md",
                globalIndex === selectedIndex 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                {cmd.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">/{cmd.id}</span>
                  <span className="text-xs text-muted-foreground truncate">{cmd.name}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Calculate start indices for each group
  let createStartIndex = 0;
  let actionsStartIndex = groupedCommands.create.length;
  let queriesStartIndex = actionsStartIndex + groupedCommands.actions.length;
  let navigationStartIndex = queriesStartIndex + groupedCommands.queries.length;

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div className="px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{t('slashCommands.title')}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('slashCommands.hint')}
        </p>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="py-1 pr-3">
          {filteredCommands.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t('slashCommands.noResults')}
            </div>
          ) : (
            <>
              {renderCommandGroup(t('slashCommands.categoryCreate'), groupedCommands.create, createStartIndex)}
              {renderCommandGroup(t('slashCommands.categoryActions'), groupedCommands.actions, actionsStartIndex)}
              {renderCommandGroup(t('slashCommands.categoryQueries'), groupedCommands.queries, queriesStartIndex)}
              {renderCommandGroup(t('slashCommands.categoryNavigation'), groupedCommands.navigation, navigationStartIndex)}
            </>
          )}
        </div>
      </ScrollArea>
      
      <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            {t('navigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            {t('select')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
            {t('close')}
          </span>
        </div>
      </div>
    </div>
  );
}
