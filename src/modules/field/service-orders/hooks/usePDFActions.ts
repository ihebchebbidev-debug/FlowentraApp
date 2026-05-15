import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PdfSettings } from '../utils/pdfSettings.utils';

interface UsePDFActionsProps {
  serviceOrder: any;
  formatCurrency?: (amount: number) => string;
  pdfSettings: PdfSettings;
}

export const usePDFActions = ({ serviceOrder, pdfSettings }: UsePDFActionsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Service Report ${serviceOrder.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .report-header { border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 20px; }
              .report-title { font-size: 24px; font-weight: bold; color: #3B82F6; }
              .report-id { font-size: 18px; color: #6B7280; }
              .content { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="report-title">SERVICE REPORT</div>
              <div class="report-id">#${serviceOrder.orderNumber}</div>
            </div>
            <div class="content">
              <h3>Service Order: ${serviceOrder.orderNumber}</h3>
              <p><strong>Customer:</strong> ${serviceOrder.customer.contactPerson} (${serviceOrder.customer.company})</p>
              <p><strong>Location:</strong> ${serviceOrder.customer.address.street}, ${serviceOrder.customer.address.city}</p>
              <p><strong>Status:</strong> ${(serviceOrder.status || 'pending').replace(/_/g, ' ').toUpperCase()}</p>
              <p><strong>Priority:</strong> ${(serviceOrder.priority || 'normal').toUpperCase()}</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      toast.success('Print dialog opened');
    } catch (error) {
      toast.error('Failed to print service report');
      console.error('Print error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [serviceOrder]);

  const handleShare = useCallback(async (platform?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Service Report ${serviceOrder.orderNumber}`,
          text: `Service Report for ${serviceOrder.orderNumber} - ${(serviceOrder.status || '').replace(/_/g, ' ')}`,
          url: window.location.href,
        });
        toast.success('Service report shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Service report URL copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share service report');
      console.error('Share error:', error);
    }
  }, [serviceOrder]);

  const handleDownloadSuccess = useCallback(() => {
    toast.success('Service report PDF downloaded successfully');
  }, []);

  const handleDownloadError = useCallback(() => {
    toast.error('Failed to download service report PDF');
  }, []);

  return {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  };
};
