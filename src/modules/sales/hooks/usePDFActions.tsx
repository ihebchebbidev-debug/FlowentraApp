import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { SalePDFDocument } from '../components/SalePDFDocument';
import { PdfSettings } from '../utils/pdfSettings.utils';

interface UsePDFActionsProps {
  sale: any;
  formatCurrency: (amount: number) => string;
  pdfSettings: PdfSettings;
}

export function usePDFActions({ sale, formatCurrency, pdfSettings }: UsePDFActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { i18n } = useTranslation('sales');

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      const doc = <SalePDFDocument sale={sale} formatCurrency={formatCurrency} settings={pdfSettings} language={i18n.language} currencyCode={sale?.currency || 'TND'} />;
      const blob = await pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
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
      const doc = <SalePDFDocument sale={sale} formatCurrency={formatCurrency} settings={pdfSettings} language={i18n.language} currencyCode={sale?.currency || 'TND'} />;
      const blob = await pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const fileName = `sale-order-${sale.id}.pdf`;
      const title = `Sale Order ${sale.id} - ${sale.title}`;
      
      if (platform) {
        let shareUrl = '';
        switch (platform) {
          case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
            break;
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
            break;
          case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Please find the attached sale order: ${url}`)}`;
            break;
        }
        window.open(shareUrl, '_blank');
        toast({
          title: "Shared Successfully",
          description: `PDF shared via ${platform}`
        });
      } else if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        await navigator.share({
          title,
          text: title,
          files: [file]
        });
        toast({
          title: "Shared Successfully",
          description: "PDF has been shared"
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "PDF link copied to clipboard"
        });
      }
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