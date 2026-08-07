import React, { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Check, X, AlertTriangle, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { ImportPreview } from '../../types/import';
import { VirtualTable } from '@/components/ui/virtual-table';
import { DuplicateActionsModal } from './DuplicateActionsModal';

interface ImportPreviewTableProps {
  preview: ImportPreview;
  onToggleRow: (rowId: string) => void;
  onToggleAll: (selected: boolean) => void;
  onDeleteDuplicates?: (duplicateIds: string[]) => void;
  onKeepDuplicates?: (duplicateIds: string[]) => void;
}

export function ImportPreviewTable({ preview, onToggleRow, onToggleAll, onDeleteDuplicates, onKeepDuplicates }: ImportPreviewTableProps) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const allValidSelected = preview.rows.filter(row => row.status === 'valid').every(row => row.selected);
  
  // Prepare data for virtual table
  const tableData = useMemo(() => {
    return preview.rows.map(row => ({
      ...row.data,
      _rowId: row.id,
      _status: row.status,
      _selected: row.selected,
      _errors: row.errors,
      _warnings: row.warnings,
      _duplicateFields: row.duplicateFields,
      _duplicateOf: row.duplicateOf
    }));
  }, [preview.rows]);

  // Define table columns based on available data
  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: '_selected',
        label: '',
        width: 40,
        render: (value: boolean, row: any) => (
          <div className="flex items-center justify-center">
            {row._status === 'valid' ? (
              <Checkbox 
                checked={value}
                className="h-4 w-4"
                onChange={(checked) => onToggleRow(row._rowId)}
              />
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
        )
      }
    ];

    // Get all unique field keys from the data
    const fieldKeys = new Set<string>();
    preview.rows.forEach(row => {
      Object.keys(row.data).forEach(key => fieldKeys.add(key));
    });

    // Prioritize important fields and limit columns for compact view
    const importantFields = ['fullName', 'email', 'phone', 'companyName', 'position'];
    const sortedFields = Array.from(fieldKeys).sort((a, b) => {
      const aIndex = importantFields.indexOf(a);
      const bIndex = importantFields.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    // Show either top 5 important fields or all fields based on toggle
    const fieldsToShow = showAllColumns ? sortedFields : sortedFields.slice(0, 5);
    const dataColumns = fieldsToShow.map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
      width: key === 'email' ? 200 : key === 'fullName' ? 180 : 140,
      render: (value: any) => (
        <div className="truncate text-sm" title={value}>
          {value || '-'}
        </div>
      )
    }));

    const statusColumn = {
      key: '_status',
      label: 'Status',
      width: 80,
      render: (status: string, row: any) => (
        <div className="flex items-center justify-center gap-1">
          {status === 'valid' ? (
            <div className="flex items-center gap-1 text-success">
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Valid</span>
            </div>
          ) : status === 'duplicate' ? (
            <div className="flex items-center gap-1 text-warning" title={`Duplicate: ${row._duplicateFields?.join(', ')}`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Duplicate</span>
            </div>
          ) : status === 'empty' ? (
            <div className="flex items-center gap-1 text-muted-foreground" title="Empty row">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Empty</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-destructive" title={row._errors?.join(', ')}>
              <X className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Error</span>
            </div>
          )}
        </div>
      )
    };

    return [...baseColumns, ...dataColumns, statusColumn];
  }, [preview.rows, onToggleRow, showAllColumns]);

  const handleRowClick = (row: any, index: number) => {
    if (row._status === 'valid') {
      onToggleRow(row._rowId);
    }
  };

  const isLargeDataset = preview.isLargeDataset;
  
  // Calculate if there are more columns available
  const fieldKeys = new Set<string>();
  preview.rows.forEach(row => {
    Object.keys(row.data).forEach(key => fieldKeys.add(key));
  });
  const hasMoreColumns = fieldKeys.size > 5;
  
  // Get duplicates for the modal
  const duplicateRows = preview.rows.filter(row => row.status === 'duplicate');

  return (
    <div className="space-y-3">
      {/* Large dataset warning */}
      {isLargeDataset && (
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <span className="font-medium">Large dataset detected.</span> Showing {preview.previewRows?.toLocaleString()} of {preview.totalRows.toLocaleString()} rows for performance.
            All rows will be imported based on your mappings.
          </AlertDescription>
        </Alert>
      )}

      {/* Compact Summary with Column Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={allValidSelected}
            onCheckedChange={(checked) => onToggleAll(checked === true)}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">
            Select All Valid
          </span>
          {hasMoreColumns && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllColumns(!showAllColumns)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showAllColumns ? (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3 mr-1" />
                  Show All Columns ({fieldKeys.size})
                </>
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <Check className="h-3 w-3 mr-1" />
            {preview.validRows} Valid
          </Badge>
          {preview.duplicateRows > 0 && (
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setShowDuplicateModal(true)}
              className="bg-warning/5 text-warning border-warning/20 hover:bg-warning/10 gap-1 h-6 px-2"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">{preview.duplicateRows} Duplicates</span>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {preview.invalidRows > 0 && (
            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <X className="h-3 w-3 mr-1" />
              {preview.invalidRows} Errors
            </Badge>
          )}
          {preview.emptyRows > 0 && (
            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
              <X className="h-3 w-3 mr-1" />
              {preview.emptyRows} Empty
            </Badge>
          )}
        </div>
      </div>

      {/* Horizontally Scrollable Virtual Table */}
      <div className="border rounded-lg bg-background overflow-hidden">
        <div className={`${showAllColumns ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent' : 'overflow-hidden'}`}>
          <div style={{ minWidth: showAllColumns ? `${columns.reduce((acc, col) => acc + (col.width || 140), 0)}px` : '100%' }}>
            <VirtualTable
              data={tableData}
              columns={columns}
              height={450}
              onRowClick={handleRowClick}
              className="compact-table"
              rowHeight={40}
            />
          </div>
        </div>
      </div>
      
      {preview.invalidRows > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1 px-2">
          <AlertTriangle className="h-3 w-3" />
          Hover over error rows to see details
        </div>
      )}
      
      {/* Duplicate Actions Modal */}
      {onDeleteDuplicates && onKeepDuplicates && (
        <DuplicateActionsModal
          open={showDuplicateModal}
          onOpenChange={setShowDuplicateModal}
          duplicates={duplicateRows}
          onDeleteDuplicates={onDeleteDuplicates}
          onKeepDuplicates={onKeepDuplicates}
        />
      )}
    </div>
  );
}