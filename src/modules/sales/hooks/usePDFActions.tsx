import { useState } from 'react';
import type { ReactElement } from 'react';
import { useToast } from '@/hooks/use-toast';
import { openPdfForPrint, sharePdfDocument } from '@/shared/pdf/browserActions';

interface UsePDFActionsProps {
  sale: any;
  pdfDocument: ReactElement;
  fileName: string;
  shareTitle: string;
  shareText: string;
}

export function usePDFActions({ sale, pdfDocument, fileName, shareTitle, shareText }: UsePDFActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      await openPdfForPrint(pdfDocument, fileName);
      toast({
        title: "Print Ready",
        description: "PDF opened in new window for printing"
      });
    } catch (error) {
      toast({
        title: "Print Error",
        description: "Failed to prepare PDF for printing",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (platform?: string) => {
    try {
      setIsGenerating(true);
      await sharePdfDocument({ document: pdfDocument, fileName, title: shareTitle, text: shareText });
      toast({
        title: "Shared Successfully",
        description: "PDF has been shared"
      });
    } catch (error) {
      toast({
        title: "Share Error",
        description: "Failed to share PDF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSuccess = () => {
    toast({
      title: "Download Complete",
      description: `Sale order ${sale.id} has been downloaded successfully`
    });
  };

  const handleDownloadError = () => {
    toast({
      title: "Download Error",
      description: "Failed to download the PDF",
      variant: "destructive"
    });
  };

  return {
    isGenerating,
    handlePrint,
    handleShare,
    handleDownloadSuccess,
    handleDownloadError
  };
}