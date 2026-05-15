/**
 * Table Data Visualizer Component
 * Shows test data in a clean table format per database table
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  Users, 
  FileText, 
  Tags, 
  FolderKanban,
  Server,
  Settings,
  Package,
  ShoppingCart,
  Wrench,
  Truck,
  Download,
  Copy,
  LayoutGrid,
  List,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TestDataRecord } from '../stores/testDataStore';

interface TableDataVisualizerProps {
  testData: TestDataRecord[];
}

const tableIcons: Record<string, React.ReactNode> = {
  Users: <Users className="h-4 w-4" />,
  Roles: <Settings className="h-4 w-4" />,
  Skills: <Tags className="h-4 w-4" />,
  Contacts: <Users className="h-4 w-4" />,
  ContactTags: <Tags className="h-4 w-4" />,
  ContactNotes: <FileText className="h-4 w-4" />,
  Articles: <Package className="h-4 w-4" />,
  Projects: <FolderKanban className="h-4 w-4" />,
  Tasks: <FolderKanban className="h-4 w-4" />,
  TaskComments: <FileText className="h-4 w-4" />,
  Installations: <Server className="h-4 w-4" />,
  Offers: <ShoppingCart className="h-4 w-4" />,
  Sales: <ShoppingCart className="h-4 w-4" />,
  ServiceOrders: <Wrench className="h-4 w-4" />,
  Dispatches: <Truck className="h-4 w-4" />,
  Lookups: <Database className="h-4 w-4" />,
  Preferences: <Settings className="h-4 w-4" />,
};

const operationColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600 border-green-500/30',
  update: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  delete: 'bg-red-500/10 text-red-600 border-red-500/30',
};

// Get all unique columns from records
const getUniqueColumns = (records: TestDataRecord[]): string[] => {
  const allKeys = new Set<string>();
  records.forEach(record => {
    if (record.data && typeof record.data === 'object') {
      Object.keys(record.data).forEach(key => allKeys.add(key));
    }
  });
  
  // Priority columns first
  const priorityOrder = ['id', 'name', 'title', 'email', 'firstName', 'lastName', 'status', 'type', 'description', 'category', 'createdAt', 'createdDate', 'modifiedAt', 'modifiedDate'];
  
  return Array.from(allKeys).sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aIndex = priorityOrder.findIndex(p => aLower.includes(p.toLowerCase()));
    const bIndex = priorityOrder.findIndex(p => bLower.includes(p.toLowerCase()));
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b);
  });
};

// Format cell value for display
const formatCellValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) return <span className="text-muted-foreground/50">-</span>;
  if (typeof value === 'boolean') return value ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>;
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return <Badge variant="outline" className="text-[10px]">[{value.length}]</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{'{...}'}</Badge>;
  }
  const strVal = String(value);
  if (strVal.length > 40) {
    return <span title={strVal}>{strVal.substring(0, 37)}...</span>;
  }
  return strVal;
};

export function TableDataVisualizer({ testData }: TableDataVisualizerProps) {
  const { t } = useTranslation('testing');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const { toast } = useToast();

  // Group data by table
  const dataByTable = useMemo(() => {
    const grouped = new Map<string, TestDataRecord[]>();
    testData.forEach(record => {
      const existing = grouped.get(record.table) || [];
      existing.push(record);
      grouped.set(record.table, existing);
    });
    return grouped;
  }, [testData]);

  const tables = useMemo(() => Array.from(dataByTable.keys()).sort(), [dataByTable]);
  
  // Auto-select first table if none selected
  const activeTable = selectedTable && tables.includes(selectedTable) ? selectedTable : tables[0];
  const activeRecords = activeTable ? (dataByTable.get(activeTable) || []) : [];
  const allColumns = useMemo(() => getUniqueColumns(activeRecords), [activeRecords]);
  const displayColumns = showAllColumns ? allColumns : allColumns.slice(0, 8);

  const getTableStats = (tableName: string) => {
    const records = dataByTable.get(tableName) || [];
    return {
      total: records.length,
      created: records.filter(r => r.operation === 'create').length,
      updated: records.filter(r => r.operation === 'update').length,
      deleted: records.filter(r => r.operation === 'delete').length,
    };
  };

  const exportTableData = () => {
    if (!activeTable) return;
    const data = {
      table: activeTable,
      exportedAt: new Date().toISOString(),
      records: activeRecords.map(r => r.data),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTable.toLowerCase()}-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('toast.exported'), description: t('toast.exported_desc', { table: activeTable }) });
  };

  const copyTableData = () => {
    if (!activeTable) return;
    const data = activeRecords.map(r => r.data);
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({ title: t('toast.copied'), description: t('toast.exported_desc', { table: activeTable }) });
  };

  if (testData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="font-medium">No test data tracked yet</p>
        <p className="text-sm text-center mt-1">
          Run tests to see data visualized by table
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Table Selector */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Table:</span>
          <Select value={activeTable || ''} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map(table => {
                const stats = getTableStats(table);
                return (
                  <SelectItem key={table} value={table}>
                    <div className="flex items-center gap-2">
                      {tableIcons[table] || <Database className="h-4 w-4" />}
                      <span>{table}</span>
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        {stats.total}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {activeTable && (
            <div className="flex items-center gap-2">
              {getTableStats(activeTable).created > 0 && (
                <Badge variant="outline" className={operationColors.create}>
                  +{getTableStats(activeTable).created} created
                </Badge>
              )}
              {getTableStats(activeTable).updated > 0 && (
                <Badge variant="outline" className={operationColors.update}>
                  ~{getTableStats(activeTable).updated} updated
                </Badge>
              )}
              {getTableStats(activeTable).deleted > 0 && (
                <Badge variant="outline" className={operationColors.delete}>
                  -{getTableStats(activeTable).deleted} deleted
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="text-xs"
          >
            {showAllColumns ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showAllColumns ? 'Less Columns' : 'All Columns'}
          </Button>
          <Button variant="outline" size="sm" onClick={copyTableData} disabled={!activeTable}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={exportTableData} disabled={!activeTable}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <ScrollArea className="flex-1">
        {activeTable && activeRecords.length > 0 ? (
          <div className="p-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[60px] font-semibold">Op</TableHead>
                    {displayColumns.map(col => (
                      <TableHead key={col} className="font-semibold text-xs">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRecords.map((record, idx) => (
                    <TableRow key={`${record.id}-${idx}`} className="hover:bg-muted/30">
                      <TableCell className="py-2">
                        <Badge 
                          variant="outline" 
                          className={cn('text-[10px] font-medium', operationColors[record.operation])}
                        >
                          {record.operation === 'create' ? 'C' : record.operation === 'update' ? 'U' : 'D'}
                        </Badge>
                      </TableCell>
                      {displayColumns.map(col => (
                        <TableCell key={col} className="py-2 font-mono text-xs max-w-[200px]">
                          {formatCellValue(record.data?.[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {allColumns.length > 8 && !showAllColumns && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Showing {displayColumns.length} of {allColumns.length} columns. Click "All Columns" to see more.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p>Select a table to view its data</p>
          </div>
        )}
      </ScrollArea>

      {/* Summary Footer */}
      <div className="p-3 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {tables.length} tables • {testData.length} total records
        </span>
        <span>
          {testData.filter(d => d.operation === 'create').length} created, 
          {testData.filter(d => d.operation === 'update').length} updated, 
          {testData.filter(d => d.operation === 'delete').length} deleted
        </span>
      </div>
    </div>
  );
}
