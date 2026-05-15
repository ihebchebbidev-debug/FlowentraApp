import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Check, Square } from "lucide-react";
import { ExportConfig } from "./ExportModal";
import * as XLSX from 'xlsx';

interface ColumnSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  onExportComplete: () => void;
  exportConfig: ExportConfig;
  moduleName: string;
  moduleNameTranslated?: string;
}

export function ColumnSelectionModal({ 
  open, 
  onOpenChange, 
  data, 
  onExportComplete, 
  exportConfig,
  moduleName,
  moduleNameTranslated
}: ColumnSelectionModalProps) {
  const { t } = useTranslation('offers');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    exportConfig.availableColumns.slice(0, 6).map(col => col.key)
  );

  const displayName = moduleNameTranslated || moduleName;

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAll = () => {
    setSelectedColumns(exportConfig.availableColumns.map(col => col.key));
  };

  const selectNone = () => {
    setSelectedColumns([]);
  };

  const getNestedValue = (obj: any, path: string, transform?: (value: any, item: any) => any) => {
    const value = path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        // Handle special computed values
        if (key === 'count') {
          if (path.includes('jobs') || path.includes('dispatches') || path.includes('materials') || 
              path.includes('communications') || path.includes('changeLog') || path.includes('reminders') ||
              path.includes('stepsPerformed') || path.includes('timeTracking') || path.includes('photos') ||
              path.includes('checklists')) {
            return Array.isArray(current) ? current.length : 0;
          }
        }
        if (key === 'completed' && path.includes('jobs')) {
          return Array.isArray(current) ? current.filter((job: any) => job.status === 'completed').length : 0;
        }
        if (key === 'pending' && path.includes('jobs')) {
          return Array.isArray(current) ? current.filter((job: any) => job.status !== 'completed').length : 0;
        }
        if (key === 'active' && path.includes('dispatches')) {
          return Array.isArray(current) ? current.filter((dispatch: any) => dispatch.status === 'active').length : 0;
        }
        if (key === 'totalCost' && path.includes('materials')) {
          return Array.isArray(current) ? current.reduce((sum: number, material: any) => sum + (material.cost || 0), 0) : 0;
        }
        // Handle address concatenation
        if (key === 'address' && current.address && typeof current.address === 'object') {
          return `${current.address.street || ''}, ${current.address.city || ''}, ${current.address.state || ''} ${current.address.zipCode || ''}`.trim();
        }
        return current[key];
      }
      return undefined;
    }, obj);

    return transform ? transform(value, obj) : value;
  };

  const exportSelectedData = () => {
    const exportData = data.map(item => {
      const row: any = {};
      
      selectedColumns.forEach(columnKey => {
        const column = exportConfig.availableColumns.find(col => col.key === columnKey);
        if (column) {
          let value = getNestedValue(item, columnKey, column.transform);
          
          // Handle special cases
          if (Array.isArray(value)) {
            value = value.join(', ');
          } else if (value instanceof Date) {
            value = value.toLocaleDateString();
          } else if (columnKey.includes('Date') && typeof value === 'string') {
            try {
              value = new Date(value).toLocaleDateString();
            } catch (e) {
              // Keep original value if date parsing fails
            }
          }
          
          row[column.label] = value || '';
        }
      });
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, moduleName);
    
    const fileName = `${exportConfig.filename}-custom-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    onExportComplete();
  };

  const groupedColumns = exportConfig.availableColumns.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, typeof exportConfig.availableColumns>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh]">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-primary" />
            {t('export.selectColumns')}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('export.columnsSelected', { selected: selectedColumns.length, total: exportConfig.availableColumns.length })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                <Check className="h-4 w-4 mr-1" />
                {t('export.selectAll')}
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                <Square className="h-4 w-4 mr-1" />
                {t('export.selectNone')}
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[500px] border rounded-lg p-3">
          <div className="space-y-4">
            {Object.entries(groupedColumns).map(([category, columns]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-foreground text-sm sticky top-0 bg-background py-1 border-b">
                  {category} ({columns.filter(col => selectedColumns.includes(col.key)).length}/{columns.length})
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 ml-1">
                  {columns.map(column => (
                    <div key={column.key} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={column.key}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                        className="h-3.5 w-3.5"
                      />
                      <label
                        htmlFor={column.key}
                        className="text-xs text-foreground cursor-pointer leading-tight"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {t('export.willInclude', { count: data.length })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('export.cancel')}
            </Button>
            <Button 
              onClick={exportSelectedData}
              disabled={selectedColumns.length === 0}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('export.exportColumns', { count: selectedColumns.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
