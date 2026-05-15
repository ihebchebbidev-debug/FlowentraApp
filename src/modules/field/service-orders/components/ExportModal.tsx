import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileSpreadsheet, CheckSquare } from "lucide-react";
import { ColumnSelectionModal } from "./ColumnSelectionModal";
import { ServiceOrder } from "../types";
import * as XLSX from 'xlsx';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ServiceOrder[];
}

export function ExportModal({ open, onOpenChange, data }: ExportModalProps) {
  const [showColumnSelection, setShowColumnSelection] = useState(false);

  const exportAllData = () => {
    const exportData = data.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Company': order.customer.company,
      'Contact Person': order.customer.contactPerson,
      'Phone': order.customer.phone,
      'Email': order.customer.email,
      'Status': order.status,
      'Priority': order.priority,
      'Service Type': order.repair?.description || '',
      'Location': order.repair?.location || '',
      'Urgency Level': order.repair?.urgencyLevel || '',
      'Promised Repair Date': order.repair?.promisedRepairDate?.toLocaleDateString() || '',
      'Estimated Cost': order.financials.estimatedCost,
      'Actual Cost': order.financials.actualCost,
      'Labor Cost': order.financials.laborCost,
      'Material Cost': order.financials.materialCost,
      'Total Amount': order.financials.totalAmount,
      'Payment Status': order.financials.paymentStatus,
      'Invoice Status': order.financials.invoiceStatus,
      'Address': `${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}`,
      'Country': order.customer.address.country,
      'Assigned Technicians': (order.assignedTechnicians || []).join(', '),
      'Created At': order.createdAt.toLocaleDateString(),
      'Updated At': order.updatedAt.toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Orders');
    
    const fileName = `service-orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    onOpenChange(false);
  };

  const handleColumnSelection = () => {
    setShowColumnSelection(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Service Orders Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Choose how you want to export your service orders data:
            </div>
            
            <div className="grid gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={exportAllData}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <FileSpreadsheet className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Export All Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Export all available fields for {data.length} service orders
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleColumnSelection}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Custom Selection</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose specific columns to include in your export
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <ColumnSelectionModal 
        open={showColumnSelection}
        onOpenChange={setShowColumnSelection}
        data={data}
        onExportComplete={() => onOpenChange(false)}
      />
    </>
  );
}