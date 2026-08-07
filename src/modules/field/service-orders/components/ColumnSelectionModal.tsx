import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Check, Square } from "lucide-react";
import { ServiceOrder } from "../types";
import * as XLSX from 'xlsx';

interface ColumnSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ServiceOrder[];
  onExportComplete: () => void;
}

const availableColumns = [
  // Basic Information
  { key: 'orderNumber', label: 'Order Number', category: 'Basic' },
  { key: 'status', label: 'Status', category: 'Basic' },
  { key: 'priority', label: 'Priority', category: 'Basic' },
  { key: 'saleId', label: 'Sale ID', category: 'Basic' },
  { key: 'offerId', label: 'Offer ID', category: 'Basic' },
  
  // Customer Information
  { key: 'customer.company', label: 'Customer Company', category: 'Customer' },
  { key: 'customer.contactPerson', label: 'Contact Person', category: 'Customer' },
  { key: 'customer.phone', label: 'Phone', category: 'Customer' },
  { key: 'customer.email', label: 'Email', category: 'Customer' },
  { key: 'customer.address', label: 'Full Address', category: 'Customer' },
  { key: 'customer.address.street', label: 'Street', category: 'Customer' },
  { key: 'customer.address.city', label: 'City', category: 'Customer' },
  { key: 'customer.address.country', label: 'Country', category: 'Customer' },
  { key: 'customer.address.zipCode', label: 'Zip Code', category: 'Customer' },
  
  // Service & Repair Details
  { key: 'repair.description', label: 'Service Description', category: 'Service' },
  { key: 'repair.location', label: 'Service Location', category: 'Service' },
  { key: 'repair.urgencyLevel', label: 'Urgency Level', category: 'Service' },
  { key: 'repair.promisedRepairDate', label: 'Promised Repair Date', category: 'Service' },
  
  // Assignment & Scheduling
  { key: 'assignedTechnicians', label: 'Assigned Technicians', category: 'Assignment' },
  { key: 'scheduledAt', label: 'Scheduled Date', category: 'Assignment' },
  { key: 'startedAt', label: 'Started Date', category: 'Assignment' },
  { key: 'estimatedDuration', label: 'Estimated Duration (min)', category: 'Assignment' },
  { key: 'actualDuration', label: 'Actual Duration (min)', category: 'Assignment' },
  
  // Jobs & Tasks
  { key: 'jobs.count', label: 'Number of Jobs', category: 'Jobs' },
  { key: 'jobs.completed', label: 'Completed Jobs', category: 'Jobs' },
  { key: 'jobs.pending', label: 'Pending Jobs', category: 'Jobs' },
  
  // Dispatches
  { key: 'dispatches.count', label: 'Number of Dispatches', category: 'Dispatches' },
  { key: 'dispatches.active', label: 'Active Dispatches', category: 'Dispatches' },
  
  // Work Details
  { key: 'workDetails.stepsPerformed', label: 'Steps Performed Count', category: 'Work Details' },
  { key: 'workDetails.timeTracking', label: 'Time Entries Count', category: 'Work Details' },
  { key: 'workDetails.photos', label: 'Photos Count', category: 'Work Details' },
  { key: 'workDetails.checklists', label: 'Checklists Count', category: 'Work Details' },
  
  // Materials & Equipment
  { key: 'materials.count', label: 'Materials Used Count', category: 'Materials' },
  { key: 'materials.totalCost', label: 'Materials Total Cost', category: 'Materials' },
  
  // Financial Details
  { key: 'financials.estimatedCost', label: 'Estimated Cost', category: 'Financial' },
  { key: 'financials.actualCost', label: 'Actual Cost', category: 'Financial' },
  { key: 'financials.laborCost', label: 'Labor Cost', category: 'Financial' },
  { key: 'financials.materialCost', label: 'Material Cost', category: 'Financial' },
  { key: 'financials.travelCost', label: 'Travel Cost', category: 'Financial' },
  { key: 'financials.equipmentCost', label: 'Equipment Cost', category: 'Financial' },
  { key: 'financials.totalAmount', label: 'Total Amount', category: 'Financial' },
  { key: 'financials.paymentStatus', label: 'Payment Status', category: 'Financial' },
  { key: 'financials.invoiceStatus', label: 'Invoice Status', category: 'Financial' },
  { key: 'financials.paidAmount', label: 'Paid Amount', category: 'Financial' },
  { key: 'financials.remainingAmount', label: 'Remaining Amount', category: 'Financial' },
  
  // Follow-up & Communication
  { key: 'followUp.reminders', label: 'Reminders Count', category: 'Follow-up' },
  { key: 'communications.count', label: 'Communications Count', category: 'Follow-up' },
  { key: 'changeLog.count', label: 'Change Log Entries', category: 'Follow-up' },
  
  // Dates & Timeline
  { key: 'createdAt', label: 'Created Date', category: 'Dates' },
  { key: 'updatedAt', label: 'Updated Date', category: 'Dates' },
  { key: 'createdBy', label: 'Created By', category: 'Dates' },
  { key: 'modifiedBy', label: 'Modified By', category: 'Dates' },
];

export function ColumnSelectionModal({ open, onOpenChange, data, onExportComplete }: ColumnSelectionModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'orderNumber', 'customer.company', 'customer.contactPerson', 'status', 'priority', 'financials.totalAmount'
  ]);

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAll = () => {
    setSelectedColumns(availableColumns.map(col => col.key));
  };

  const selectNone = () => {
    setSelectedColumns([]);
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key === 'address' && current.address) {
          return `${current.address.street}, ${current.address.city}, ${current.address.state} ${current.address.zipCode}`;
        }
        // Handle special computed values
        if (key === 'count') {
          if (path.includes('jobs')) return current.length || 0;
          if (path.includes('dispatches')) return current.length || 0;
          if (path.includes('materials')) return current.length || 0;
          if (path.includes('communications')) return current.length || 0;
          if (path.includes('changeLog')) return current.length || 0;
          if (path.includes('reminders')) return current.length || 0;
          if (path.includes('stepsPerformed')) return current.length || 0;
          if (path.includes('timeTracking')) return current.length || 0;
          if (path.includes('photos')) return current.length || 0;
          if (path.includes('checklists')) return current.length || 0;
        }
        if (key === 'completed' && path.includes('jobs')) {
          return current.filter((job: any) => job.status === 'completed').length || 0;
        }
        if (key === 'pending' && path.includes('jobs')) {
          return current.filter((job: any) => job.status !== 'completed').length || 0;
        }
        if (key === 'active' && path.includes('dispatches')) {
          return current.filter((dispatch: any) => dispatch.status === 'active').length || 0;
        }
        if (key === 'totalCost' && path.includes('materials')) {
          return current.reduce((sum: number, material: any) => sum + (material.cost || 0), 0);
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  const exportSelectedData = () => {
    const exportData = data.map(order => {
      const row: any = {};
      
      selectedColumns.forEach(columnKey => {
        const column = availableColumns.find(col => col.key === columnKey);
        if (column) {
          let value = getNestedValue(order, columnKey);
          
          // Handle special cases
          if (columnKey === 'assignedTechnicians' && Array.isArray(value)) {
            value = value.join(', ');
          } else if (columnKey.includes('Date') && value instanceof Date) {
            value = value.toLocaleDateString();
          }
          
          row[column.label] = value || '';
        }
      });
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Orders');
    
    const fileName = `service-orders-custom-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    onExportComplete();
  };

  const groupedColumns = availableColumns.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, typeof availableColumns>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh]">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-primary" />
            Select Columns to Export
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedColumns.length} of {availableColumns.length} columns selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                <Check className="h-4 w-4 mr-1" />
                All
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                <Square className="h-4 w-4 mr-1" />
                None
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
            Export will include {data.length} service orders
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={exportSelectedData}
              disabled={selectedColumns.length === 0}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {selectedColumns.length} columns
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}