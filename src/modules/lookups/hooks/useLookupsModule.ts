import { useEffect, useMemo, useState } from "react";
import type { LookupItem } from "../services/lookups.service";
import { LookupsService } from "../services/lookups.service";
import type { Category, Group } from "../types";

export function useLookupsModule(initialGroup: Group = 'crm', initialCategory: Category = 'todos') {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [group, setGroup] = useState<Group>(initialGroup);
  const [mode, setMode] = useState<'hub' | 'category'>('hub');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHasColor, setFilterHasColor] = useState<'all' | 'yes' | 'no'>('all');
  const [filterDefaultOnly, setFilterDefaultOnly] = useState(false);

  const [taskStatuses, setTaskStatuses] = useState<LookupItem[]>(LookupsService.getTaskStatuses());
  const [eventTypes, setEventTypes] = useState<LookupItem[]>(LookupsService.getEventTypes());
  const [serviceCategories, setServiceCategories] = useState<LookupItem[]>(LookupsService.getServiceCategories());
  const [technicianStatuses, setTechnicianStatuses] = useState<LookupItem[]>(LookupsService.getTechnicianStatuses());
  const [leaveTypes, setLeaveTypes] = useState<LookupItem[]>(LookupsService.getLeaveTypes());
  const [priorities, setPriorities] = useState<LookupItem[]>(LookupsService.getPriorities());
  const [currencies, setCurrencies] = useState<LookupItem[]>(LookupsService.getCurrencies());

  useEffect(() => { LookupsService.setTaskStatuses(taskStatuses); }, [taskStatuses]);
  useEffect(() => { LookupsService.setEventTypes(eventTypes); }, [eventTypes]);
  useEffect(() => { LookupsService.setServiceCategories(serviceCategories); }, [serviceCategories]);
  useEffect(() => { LookupsService.setTechnicianStatuses(technicianStatuses); }, [technicianStatuses]);
  useEffect(() => { LookupsService.setLeaveTypes(leaveTypes); }, [leaveTypes]);
  useEffect(() => { LookupsService.setPriorities(priorities); }, [priorities]);
  useEffect(() => { LookupsService.setCurrencies(currencies); }, [currencies]);

  function setDefaultCurrency(id: string) {
    const list = LookupsService.setDefaultCurrency(id);
    setCurrencies(list);
  }

  function getCurrentItems(): LookupItem[] {
    switch (category) {
      case 'todos': return taskStatuses;
      case 'events': return eventTypes;
      case 'services': return serviceCategories;
  case 'technicians': return technicianStatuses;
  case 'leavetypes': return leaveTypes;
    case 'priorities': return priorities;
      case 'currencies': return currencies;
      default: return [];
    }
  }

  function setCurrentItems(items: LookupItem[]) {
    switch (category) {
      case 'todos': setTaskStatuses(items); break;
      case 'events': setEventTypes(items); break;
      case 'services': setServiceCategories(items); break;
  case 'technicians': setTechnicianStatuses(items); break;
    case 'leavetypes': setLeaveTypes(items); break;
  case 'priorities': setPriorities(items); break;
      case 'currencies': break;
    }
  }

  const filteredItems = useMemo(() => {
    let items = getCurrentItems();
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(term) || (i.description?.toLowerCase().includes(term) ?? false));
    }
    if (category !== 'currencies' && filterHasColor !== 'all') {
      items = items.filter(i => (filterHasColor === 'yes' ? Boolean(i.color) : !i.color));
    }
    if (category === 'currencies' && filterDefaultOnly) {
      items = items.filter(i => i.isDefault);
    }
    return items;
  }, [category, searchTerm, filterHasColor, filterDefaultOnly, taskStatuses, eventTypes, serviceCategories, currencies, technicianStatuses, leaveTypes]);

  return {
    // state
    category, setCategory,
    group, setGroup,
    mode, setMode,
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    filterHasColor, setFilterHasColor,
    filterDefaultOnly, setFilterDefaultOnly,

    // data
  taskStatuses, setTaskStatuses,
  eventTypes, setEventTypes,
  serviceCategories, setServiceCategories,
  technicianStatuses, setTechnicianStatuses,
  leaveTypes, setLeaveTypes,
  priorities, setPriorities,
  currencies, setCurrencies,
    filteredItems,

    // actions
    setCurrentItems,
    setDefaultCurrency,
  } as const;
}
