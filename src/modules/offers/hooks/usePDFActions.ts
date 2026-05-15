import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PdfSettings } from '../utils/pdfSettings.utils';

interface UsePDFActionsProps {
  offer: any;
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
  printLinkRef?: React.RefObject<HTMLAnchorElement>;
}

export const usePDFActions = ({ offer, formatCurrency, pdfSettings, printLinkRef }: UsePDFActionsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Trigger the hidden print link to generate and open PDF
      if (printLinkRef?.current) {
        printLinkRef.current.click();
        toast.success('Opening PDF for printing...');
      } else {
        toast.error('Print functionality not ready. Please try again.');
        console.warn('Print link ref not available');
      }
    } catch (error) {
      toast.error('Failed to print offer');
      console.error('Print error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [printLinkRef]);

  const handleShare = useCallback(async (platform?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Quote ${offer.id}`,
          text: `Quote for ${offer.title} - ${formatCurrency(offer.totalAmount || offer.amount)}`,
          url: window.location.href,
        });
        toast.success('Quote shared successfully');
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Quote URL copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share quote');
      console.error('Share error:', error);
    }
  }, [offer, formatCurrency]);

  const handleDownloadSuccess = useCallback(() => {
    toast.success('Quote PDF downloaded successfully');
  }, []);

  const handleDownloadError = useCallback(() => {
    toast.error('Failed to download quote PDF');
  }, []);

  return {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  };
};