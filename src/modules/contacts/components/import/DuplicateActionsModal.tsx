import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';
import { ImportedRow } from '../../types/import';

interface DuplicateActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: ImportedRow[];
  onDeleteDuplicates: (duplicateIds: string[]) => void;
  onKeepDuplicates: (duplicateIds: string[]) => void;
}

export function DuplicateActionsModal({ 
  open, 
  onOpenChange, 
  duplicates, 
  onDeleteDuplicates,
  onKeepDuplicates 
}: DuplicateActionsModalProps) {
  
  const handleDeleteAll = () => {
    onDeleteDuplicates(duplicates.map(d => d.id));
    onOpenChange(false);
  };

  const handleKeepAll = () => {
    onKeepDuplicates(duplicates.map(d => d.id));
    onOpenChange(false);
  };

  const groupedDuplicates = duplicates.reduce((acc, dup) => {
    const key = dup.duplicateOf || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(dup);
    return acc;
  }, {} as Record<string, ImportedRow[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Duplicate Records Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} potential duplicate records. Review and choose how to handle them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-warning/20 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-foreground">
              Duplicates are detected based on matching email addresses, names, or company names.
            </AlertDescription>
          </Alert>

          {/* Duplicate Groups */}
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {Object.entries(groupedDuplicates).map(([originalId, duplicateList]) => (
              <div key={originalId} className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Duplicate Group ({duplicateList.length} records)
                  </span>
                  <div className="flex gap-1">
                    {duplicateList[0]?.duplicateFields?.map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {duplicateList.map((dup, index) => (
                  <div key={dup.id} className="text-xs text-muted-foreground mb-1">
                    Row {(dup.originalIndex || 0) + 2}: {dup.data.fullName || dup.data.companyName} - {dup.data.email}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              className="flex-1 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove All Duplicates
            </Button>
            <Button
              variant="outline"
              onClick={handleKeepAll}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              Keep All as Separate Records
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Review Manually
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}