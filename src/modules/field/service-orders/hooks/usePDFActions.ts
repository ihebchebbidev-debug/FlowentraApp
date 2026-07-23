import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { toast } from 'sonner';
import { openPdfForPrint, sharePdfDocument } from '@/shared/pdf/browserActions';

interface UsePDFActionsProps {
  serviceOrder: any;
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

export const usePDFActions = ({ serviceOrder, pdfDocument, fileName, shareTitle, shareText }: UsePDFActionsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = useCallback(async () => {
    try {
      setIsGenerating(true);
      await openPdfForPrint(pdfDocument, fileName);
      toast.success('Print dialog opened');
    } catch (error) {
      toast.error('Failed to print service report');
      console.error('Print error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfDocument, fileName]);

  const handleShare = useCallback(async (platform?: string) => {
    try {
      setIsGenerating(true);
      await sharePdfDocument({ document: pdfDocument, fileName, title: shareTitle, text: shareText });
      toast.success('Service report shared successfully');
    } catch (error) {
      toast.error('Failed to share service report');
      console.error('Share error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfDocument, fileName, shareTitle, shareText]);

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
