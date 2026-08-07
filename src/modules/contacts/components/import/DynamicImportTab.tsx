import { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileX, CheckCircle, AlertCircle } from 'lucide-react';
import { useContactImport } from '../../hooks/useContactImport';
import { ColumnMapping, FIELD_LABELS, ALL_FIELDS } from '../../types/import';

interface DynamicImportTabProps {
  importHook: ReturnType<typeof useContactImport>;
}

export function DynamicImportTab({ importHook }: DynamicImportTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    // File type validation
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    
    // File size validation (50MB limit)
    const maxSizeMB = 50;
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      alert(`File size (${fileSizeMB.toFixed(1)}MB) exceeds the maximum limit of ${maxSizeMB}MB. Please use a smaller file or contact support for help with large datasets.`);
      return;
    }
    
    if (fileSizeMB > 10) {
      const confirmed = confirm(`This is a large file (${fileSizeMB.toFixed(1)}MB). Processing may take longer and some features may be optimized for performance. Continue?`);
      if (!confirmed) return;
    }
    
    setSelectedFile(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      importHook.processFile(selectedFile, 'dynamic');
    }
  }, [selectedFile, importHook]);

  const handleColumnMapping = useCallback((sourceColumn: string, targetField: string | null) => {
    const newMapping: ColumnMapping = {
      ...importHook.columnMapping,
      [sourceColumn]: targetField === 'skip' ? null : targetField
    };
    importHook.updateColumnMapping(newMapping);
  }, [importHook]);

  const canProceed = () => {
    const mappedFields = Object.values(importHook.columnMapping).filter(field => field && field !== 'skip');
    const hasRequiredName = mappedFields.includes('fullName') || mappedFields.includes('companyName');
    return hasRequiredName; // At least one name field must be mapped
  };

  return (
    <div className="space-y-6">
      {!importHook.headers.length ? (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                {selectedFile ? (
                  <CheckCircle className="h-8 w-8 text-success" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              {selectedFile ? (
                <div className="space-y-2">
                  <h3 className="font-semibold">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button onClick={handleUpload} disabled={importHook.isLoading}>
                    {importHook.isLoading ? 'Processing...' : 'Upload & Process'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-semibold">Drop your Excel file here</h3>
                  <p className="text-sm text-muted-foreground">
                    Or click to browse and select a file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button variant="outline" type="button" onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}>
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {importHook.isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing file...</span>
                <span>{importHook.uploadProgress}%</span>
              </div>
              <Progress value={importHook.uploadProgress} />
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported formats:</strong> Excel files (.xlsx, .xls)<br />
              <strong>Required:</strong> Either Full Name OR Company Name<br />
              <strong>Optional:</strong> Email, Phone, Contact Type, Position, Address (any columns you don't map will be ignored)
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              File processed successfully! Found <strong>{importHook.headers.length}</strong> columns
              {importHook.fileMetadata?.isLargeDataset && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  📊 Large dataset ({importHook.fileMetadata.totalRows.toLocaleString()} rows) - using optimized processing
                </span>
              )}
            </AlertDescription>
          </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Column Mapping</CardTitle>
                <CardDescription>
                  Map your file columns to contact fields. At least one name field (Full Name OR Company Name) is required. Unmapped columns will be ignored.
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid gap-4" key="column-mapping-grid">{/* Force re-render */}
                {importHook.headers.map((header) => (
                  <div key={header} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium truncate">
                        {header}
                      </Label>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={importHook.columnMapping[header] || 'skip'}
                        onValueChange={(value) => handleColumnMapping(header, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">-- Skip this column --</SelectItem>
                          {ALL_FIELDS.map((field) => (
                            <SelectItem key={field} value={field}>
                              {FIELD_LABELS[field]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(importHook.columnMapping).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    onClick={() => importHook.generatePreview()}
                    disabled={!canProceed()}
                    className="w-full"
                  >
                    {canProceed() ? 'Generate Preview' : 'Map at least one Name field to continue'}
                  </Button>
                  {canProceed() && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Ready to generate preview with mapped columns
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}