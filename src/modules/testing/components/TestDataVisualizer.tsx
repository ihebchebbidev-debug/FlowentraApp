/**
 * Test Data Visualizer Component
 * Shows test data created/updated during test runs organized by table/entity
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronDown, 
  ChevronRight, 
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
  RefreshCw,
  Download,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TestDataRecord } from '../stores/testDataStore';

// Re-export for backward compatibility
export type { TestDataRecord };

interface TestDataVisualizerProps {
  testData: TestDataRecord[];
  onRefresh?: () => void;
  isLoading?: boolean;
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

// Get display columns for a table
const getTableColumns = (table: string, records: TestDataRecord[]): string[] => {
  if (records.length === 0) return [];
  
  // Collect all unique keys from all records
  const allKeys = new Set<string>();
  records.forEach(record => {
    Object.keys(record.data || {}).forEach(key => allKeys.add(key));
  });
  
  // Priority columns that should appear first
  const priorityColumns = ['id', 'name', 'title', 'email', 'status', 'type', 'createdAt', 'createdDate'];
  const sortedColumns = Array.from(allKeys).sort((a, b) => {
    const aIndex = priorityColumns.indexOf(a.toLowerCase());
    const bIndex = priorityColumns.indexOf(b.toLowerCase());
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b);
  });
  
  // Limit to first 8 columns for display
  return sortedColumns.slice(0, 8);
};

// Format cell value for display
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `[${value.length} items]`;
    return '{...}';
  }
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 47) + '...';
  }
  return String(value);
};

export function TestDataVisualizer({ testData, onRefresh, isLoading }: TestDataVisualizerProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { t } = useTranslation('testing');

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

  const toggleTable = (table: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(table)) {
        next.delete(table);
      } else {
        next.add(table);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedTables(new Set(tables));
  const collapseAll = () => setExpandedTables(new Set());

  const exportData = () => {
    const exportObj = {
      timestamp: new Date().toISOString(),
      totalRecords: testData.length,
      tables: Object.fromEntries(dataByTable),
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('toast.data_exported'), description: t('toast.data_exported_desc') });
  };

  const copyData = () => {
    const exportObj = {
      timestamp: new Date().toISOString(),
      totalRecords: testData.length,
      tables: Object.fromEntries(dataByTable),
    };
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    toast({ title: t('toast.copied'), description: t('toast.copied_desc') });
  };

  const getTableStats = (records: TestDataRecord[]) => ({
    created: records.filter(r => r.operation === 'create').length,
    updated: records.filter(r => r.operation === 'update').length,
    deleted: records.filter(r => r.operation === 'delete').length,
  });

  if (testData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Test Data Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium">No test data yet</p>
            <p className="text-sm text-center mt-1">
              Run tests to see data created/updated in each table
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Test Data Visualizer
            <Badge variant="outline" className="ml-2">
              {testData.length} records
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={copyData}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-3">
            {tables.map(table => {
              const records = dataByTable.get(table) || [];
              const isExpanded = expandedTables.has(table);
              const columns = getTableColumns(table, records);
              const stats = getTableStats(records);

              return (
                <Collapsible
                  key={table}
                  open={isExpanded}
                  onOpenChange={() => toggleTable(table)}
                >
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      'w-full p-3 rounded-lg border transition-all hover:shadow-md',
                      'bg-muted/30 hover:bg-muted/50'
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div className="p-1.5 rounded-md bg-primary/10">
                            {tableIcons[table] || <Database className="h-4 w-4" />}
                          </div>
                          <span className="font-semibold">{table}</span>
                          <Badge variant="outline" className="text-xs">
                            {records.length} records
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {stats.created > 0 && (
                            <Badge variant="outline" className={operationColors.create}>
                              +{stats.created}
                            </Badge>
                          )}
                          {stats.updated > 0 && (
                            <Badge variant="outline" className={operationColors.update}>
                              ~{stats.updated}
                            </Badge>
                          )}
                          {stats.deleted > 0 && (
                            <Badge variant="outline" className={operationColors.delete}>
                              -{stats.deleted}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-20">Op</TableHead>
                            {columns.map(col => (
                              <TableHead key={col} className="font-medium">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((record, idx) => (
                            <TableRow key={`${record.id}-${idx}`} className="hover:bg-muted/30">
                              <TableCell>
                                <Badge variant="outline" className={cn('text-xs', operationColors[record.operation])}>
                                  {record.operation.charAt(0).toUpperCase()}
                                </Badge>
                              </TableCell>
                              {columns.map(col => (
                                <TableCell key={col} className="font-mono text-xs">
                                  {formatCellValue(record.data?.[col])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
