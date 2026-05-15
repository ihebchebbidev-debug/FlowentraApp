import { useMemo, useState } from 'react';
import { usePaginatedData } from "@/shared/hooks/usePagination";

export function useSalesList(sales: any[]) {
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterStage, setFilterStage] = useState<'all' | string>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | string>('all');
  const [filterAssigned, setFilterAssigned] = useState<'all' | string>('all');
  const [selectedStat, setSelectedStat] = useState<string>('all');

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = q === '' ||
        sale.title.toLowerCase().includes(q) ||
        sale.contactName.toLowerCase().includes(q) ||
        (sale.contactCompany || '').toLowerCase().includes(q) ||
        sale.id.toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
      const matchesStage = filterStage === 'all' || sale.stage === filterStage;
      const matchesPriority = filterPriority === 'all' || sale.priority === filterPriority;
      const matchesAssigned = filterAssigned === 'all' || (sale.assignedToName || '').toLowerCase() === (filterAssigned || '').toLowerCase();

      return matchesSearch && matchesStatus && matchesStage && matchesPriority && matchesAssigned;
    });
  }, [sales, searchTerm, filterStatus, filterStage, filterPriority, filterAssigned]);

  const pagination = usePaginatedData(filteredSales, 5);

  const handleStatClick = (stat: any) => {
    setSelectedStat(stat.filter);
    // map stats to filters as before, keep simple defaults
    if (stat.filter === 'won') {
      setFilterStatus('won');
    } else if (stat.filter === 'active') {
      setFilterStatus('all');
    } else {
      setFilterStatus('all');
    }
    setFilterStage('all');
    setFilterPriority('all');
    setFilterAssigned('all');
  };

  return {
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterStage, setFilterStage,
    filterPriority, setFilterPriority,
    filterAssigned, setFilterAssigned,
    selectedStat, setSelectedStat,
    filteredSales,
    pagination,
    handleStatClick,
  };
}
