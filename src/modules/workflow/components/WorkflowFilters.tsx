import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  List,
  Table as TableIcon,
  Calendar,
  Kanban,
  ChevronDown
} from "lucide-react";
import { useLookups } from '@/shared/contexts/LookupsContext';

const WORKFLOW_TYPES = [
  { id: 'offer', name: 'Offer' },
  { id: 'sale', name: 'Sale' },
  { id: 'service', name: 'Service' },
];
const WORKFLOW_STATUSES = [
  { id: 'draft', name: 'Created' },
  { id: 'sent', name: 'Sent' },
  { id: 'accepted', name: 'Accepted' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
];
const TIMEFRAMES = [
  { id: 'any', name: 'Any time' },
  { id: '7', name: 'Last 7 days' },
  { id: '30', name: 'Last 30 days' },
  { id: '365', name: 'Last year' },
];


interface WorkflowFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'list' | 'table' | 'kanban' | 'calendar';
  onViewModeChange: (mode: 'list' | 'table' | 'kanban' | 'calendar') => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (priority: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
}

export function WorkflowFilters({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  filterType,
  onFilterTypeChange
}: WorkflowFiltersProps) {
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>(filterStatus || 'all');
  const [localPriority, setLocalPriority] = useState<string>(filterPriority || 'all');
  const [localType, setLocalType] = useState<string>(filterType || 'all');
  const [localTimeframe, setLocalTimeframe] = useState<string>('any');
  const activeFiltersCount = [
    filterStatus !== 'all' ? 1 : 0,
    filterPriority !== 'all' ? 1 : 0,
    filterType !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const { t } = useTranslation();

  const viewModes = [
    { mode: 'list' as const, icon: List, label: t('view.list') },
    { mode: 'table' as const, icon: TableIcon, label: t('view.table') },
    { mode: 'kanban' as const, icon: Kanban, label: t('view.kanban') },
    { mode: 'calendar' as const, icon: Calendar, label: t('view.calendar') }
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
      <div className="flex gap-2 sm:gap-3 flex-1 w-full">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 sm:h-10 border-border bg-background text-sm"
          />
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar(s => !s)}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t('filters')}</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      {showFilterBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={localStatus} onChange={e => { setLocalStatus(e.target.value); onFilterStatusChange(e.target.value); }}>
                  <option value="all">{t('all')}</option>
                  {WORKFLOW_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={localPriority} onChange={e => { setLocalPriority(e.target.value); onFilterPriorityChange(e.target.value); }}>
                  <option value="all">{t('all')}</option>
                  {/** Use lookup priorities (seeded from mock JSON) */}
                  {useLookups().priorities.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={localType} onChange={e => { setLocalType(e.target.value); onFilterTypeChange(e.target.value); }}>
                  <option value="all">{t('allTypes')}</option>
                  {WORKFLOW_TYPES.map((wt) => (
                    <option key={wt.id} value={wt.id}>{wt.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <select className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm" value={localTimeframe} onChange={e => setLocalTimeframe(e.target.value)}>
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf.id} value={tf.id}>{tf.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full border border-border text-sm" onClick={() => { setLocalStatus('all'); setLocalPriority('all'); setLocalType('all'); setLocalTimeframe('any'); setShowFilterBar(false); onFilterStatusChange('all'); onFilterPriorityChange('all'); onFilterTypeChange('all'); }}>{t('clear')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 w-full sm:w-auto bg-muted/50 rounded-lg p-1">
        {viewModes.map((mode) => (
          <Button
            key={mode.mode}
            variant={viewMode === mode.mode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange(mode.mode)}
            className={`flex-1 sm:flex-none h-8 px-2 sm:px-3 ${viewMode === mode.mode
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
            title={mode.label}
          >
            <mode.icon className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{mode.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}