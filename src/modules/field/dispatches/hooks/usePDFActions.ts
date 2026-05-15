import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PdfSettings } from '../utils/pdfSettings.utils';

interface UsePDFActionsProps {
  dispatch: any;
  formatCurrency?: (amount: number) => string;
  pdfSettings: PdfSettings;
}

export const usePDFActions = ({ dispatch, pdfSettings }: UsePDFActionsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Create a temporary window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Dispatch Report ${dispatch.dispatchNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .dispatch-header { border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 20px; }
              .dispatch-title { font-size: 24px; font-weight: bold; color: #3B82F6; }
              .dispatch-id { font-size: 18px; color: #6B7280; }
              .content { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="dispatch-header">
              <div class="dispatch-title">DISPATCH REPORT</div>
              <div class="dispatch-id">#${dispatch.dispatchNumber}</div>
            </div>
            <div class="content">
              <h3>Dispatch: ${dispatch.dispatchNumber}</h3>
              <p><strong>Status:</strong> ${dispatch.status}</p>
              <p><strong>Priority:</strong> ${dispatch.priority}</p>
              <p><strong>Scheduled:</strong> ${new Date(dispatch.scheduledDate).toLocaleDateString()} ${dispatch.scheduledStartTime} - ${dispatch.scheduledEndTime}</p>
              <p><strong>Technicians:</strong> ${dispatch.assignedTechnicians.join(', ')}</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      toast.success('Print dialog opened');
    } catch (error) {
      toast.error('Failed to print dispatch report');
      console.error('Print error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [dispatch]);

  const handleShare = useCallback(async (platform?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Dispatch Report ${dispatch.dispatchNumber}`,
          text: `Dispatch Report for ${dispatch.dispatchNumber} - ${dispatch.status}`,
          url: window.location.href,
        });
        toast.success('Dispatch report shared successfully');
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Dispatch report URL copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share dispatch report');
      console.error('Share error:', error);
    }
  }, [dispatch]);

  const handleDownloadSuccess = useCallback(() => {
    toast.success('Dispatch report PDF downloaded successfully');
  }, []);

  const handleDownloadError = useCallback(() => {
    toast.error('Failed to download dispatch report PDF');
  }, []);

  return {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  };
};