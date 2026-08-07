import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import type { Column, RenderEditCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Minus, RotateCcw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExcelVisualizerProps {
  data: any[];
  headers: string[];
  onDataChange: (newData: any[], newHeaders: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  fileName: string;
}

interface GridRow {
  id: string;
  [key: string]: any;
}

function EditableCell({ row, column, onRowChange }: RenderEditCellProps<GridRow>) {
  const [value, setValue] = useState(row[column.key] || '');

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onRowChange({ ...row, [column.key]: newValue });
  };

  return (
    <Input
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="border-0 rounded-none h-full focus-visible:ring-1 focus-visible:ring-primary"
      placeholder="Enter value..."
    />
  );
}

// Lazy-load react-data-grid and normalize its export shape to avoid build-time named-export issues
const DataGridAsync = lazy(async () => {
  const mod = await import('react-data-grid');
  // prefer DataGrid named export, then default, then the module itself
  const Comp = (mod as any).DataGrid ?? (mod as any).default ?? (mod as any);
  return { default: Comp } as any;
});

export function ExcelVisualizer({ 
  data, 
  headers, 
  onDataChange, 
  onContinue, 
  onBack,
  fileName 
}: ExcelVisualizerProps) {
  const [gridData, setGridData] = useState<GridRow[]>(() => 
    data.map((row, index) => ({
      id: `row-${index}`,
      ...row
    }))
  );
  
  const [gridHeaders, setGridHeaders] = useState<string[]>(headers);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const columns = useMemo((): Column<GridRow>[] => [
    {
      key: 'select',
      name: '',
      width: 50,
      frozen: true,
      renderHeaderCell: () => (
        <input
          type="checkbox"
          checked={selectedRows.size === gridData.length && gridData.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows(new Set(gridData.map(row => row.id)));
            } else {
              setSelectedRows(new Set());
            }
          }}
          className="rounded border-gray-300"
        />
      ),
      renderCell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedRows);
            if (e.target.checked) {
              newSelected.add(row.id);
            } else {
              newSelected.delete(row.id);
            }
            setSelectedRows(newSelected);
          }}
          className="rounded border-gray-300"
        />
      )
    },
    {
      key: 'rowNumber',
      name: '#',
      width: 60,
      frozen: true,
      renderCell: ({ rowIdx }) => (
        <div className="text-center text-muted-foreground font-mono text-sm">
          {rowIdx + 1}
        </div>
      )
    },
    ...gridHeaders.map((header, index): Column<GridRow> => ({
      key: header,
      name: header,
      resizable: true,
      sortable: true,
      editable: true,
      width: 150,
      renderHeaderCell: () => (
        <div className="flex items-center justify-between w-full">
          <Input
            value={header}
            onChange={(e) => handleHeaderChange(index, e.target.value)}
            className="border-0 bg-transparent text-sm font-medium p-0 h-auto focus-visible:ring-0"
          />
        </div>
      ),
      renderEditCell: EditableCell
    }))
  ], [gridHeaders, gridData.length, selectedRows]);

  const handleHeaderChange = useCallback((index: number, newName: string) => {
    const newHeaders = [...gridHeaders];
    const oldHeader = newHeaders[index];
    newHeaders[index] = newName;
    
    // Update data keys
    const newData = gridData.map(row => {
      const newRow = { ...row };
      if (oldHeader !== newName && row[oldHeader] !== undefined) {
        newRow[newName] = row[oldHeader];
        delete newRow[oldHeader];
      }
      return newRow;
    });
    
    setGridHeaders(newHeaders);
    setGridData(newData);
    setHasChanges(true);
  }, [gridHeaders, gridData]);

  const handleRowsChange = useCallback((rows: GridRow[]) => {
    setGridData(rows);
    setHasChanges(true);
  }, []);

  const addRow = useCallback(() => {
    const newRow: GridRow = {
      id: `row-${Date.now()}`,
      ...gridHeaders.reduce((acc, header) => ({ ...acc, [header]: '' }), {})
    };
    setGridData([...gridData, newRow]);
    setHasChanges(true);
  }, [gridData, gridHeaders]);

  const addColumn = useCallback(() => {
    const newColumnName = `Column ${gridHeaders.length + 1}`;
    const newHeaders = [...gridHeaders, newColumnName];
    const newData = gridData.map(row => ({
      ...row,
      [newColumnName]: ''
    }));
    
    setGridHeaders(newHeaders);
    setGridData(newData);
    setHasChanges(true);
  }, [gridHeaders, gridData]);

  const deleteSelectedRows = useCallback(() => {
    const newData = gridData.filter(row => !selectedRows.has(row.id));
    setGridData(newData);
    setSelectedRows(new Set());
    setHasChanges(true);
  }, [gridData, selectedRows]);

  const deleteLastColumn = useCallback(() => {
    if (gridHeaders.length <= 1) return;
    
    const newHeaders = gridHeaders.slice(0, -1);
    const lastHeader = gridHeaders[gridHeaders.length - 1];
    const newData = gridData.map(row => {
      const newRow = { ...row };
      delete newRow[lastHeader];
      return newRow;
    });
    
    setGridHeaders(newHeaders);
    setGridData(newData);
    setHasChanges(true);
  }, [gridHeaders, gridData]);

  const resetChanges = useCallback(() => {
    const originalData = data.map((row, index) => ({
      id: `row-${index}`,
      ...row
    }));
    setGridData(originalData);
    setGridHeaders(headers);
    setSelectedRows(new Set());
    setHasChanges(false);
  }, [data, headers]);

  const handleContinue = useCallback(() => {
    // Convert back to plain objects without IDs
    const cleanData = gridData.map(({ id, ...row }) => row);
    onDataChange(cleanData, gridHeaders);
    onContinue();
  }, [gridData, gridHeaders, onDataChange, onContinue]);

  const getRowClassName = useCallback((row: GridRow) => {
    if (selectedRows.has(row.id)) {
      return 'bg-primary/10 border-primary/20';
    }
    return '';
  }, [selectedRows]);

  const stats = useMemo(() => {
    const totalCells = gridData.length * gridHeaders.length;
    const emptyCells = gridData.reduce((count, row) => {
      return count + gridHeaders.filter(header => 
        !row[header] || row[header].toString().trim() === ''
      ).length;
    }, 0);
    const filledCells = totalCells - emptyCells;
    
    return { totalCells, filledCells, emptyCells };
  }, [gridData, gridHeaders]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>Excel Editor</span>
                {hasChanges && <Badge variant="secondary">Modified</Badge>}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Edit your data directly. File: <strong>{fileName}</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">
                {gridData.length} rows
              </Badge>
              <Badge variant="outline">
                {gridHeaders.length} columns
              </Badge>
              <Badge variant="outline" className="text-success">
                {stats.filledCells} filled cells
              </Badge>
              {stats.emptyCells > 0 && (
                <Badge variant="outline" className="text-warning">
                  {stats.emptyCells} empty cells
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button variant="outline" size="sm" onClick={addColumn}>
              <Plus className="h-4 w-4 mr-1" />
              Add Column
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={deleteSelectedRows}
              disabled={selectedRows.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Rows ({selectedRows.size})
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={deleteLastColumn}
              disabled={gridHeaders.length <= 1}
            >
              <Minus className="h-4 w-4 mr-1" />
              Remove Column
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetChanges}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <div style={{ height: '500px' }}>
              <Suspense fallback={<div className="p-4">Loading table...</div>}>
                <DataGridAsync
                  columns={columns}
                  rows={gridData}
                  onRowsChange={handleRowsChange}
                  rowKeyGetter={(row) => row.id}
                  className="rdg-light fill-grid"
                  rowClass={getRowClassName}
                  headerRowHeight={40}
                  rowHeight={40}
                  enableVirtualization
                />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips:</strong> Click on cells to edit them directly. Use the toolbar to add/remove rows and columns. 
          Column headers are also editable - just click on them to rename.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
          )}
          <Button onClick={handleContinue} className="bg-primary text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue to Mapping
          </Button>
        </div>
      </div>
    </div>
  );
}