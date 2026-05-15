import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Download, ExternalLink, MessageCircle, Share2, Check } from 'lucide-react';
import { useState, useCallback, ReactElement } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { pdf } from '@react-pdf/renderer';

interface ShareLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'whatsapp' | 'facebook' | null;
  pdfDocument: ReactElement;
  fileName: string;
  shareText: string;
  translationNs?: string;
}

export function ShareLinkDialog({
  isOpen,
  onClose,
  platform,
  pdfDocument,
  fileName,
  shareText,
}: ShareLinkDialogProps) {
  const { t } = useTranslation('offers');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const shareUrl = window.location.href;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('pdfActions.linkCopied', 'Link copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('pdfActions.copyFailed', 'Failed to copy link'));
    }
  }, [shareUrl, t]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsDownloading(true);
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('pdfActions.downloadSuccess', 'PDF downloaded successfully'));
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(t('pdfActions.downloadFailed', 'Failed to download PDF'));
    } finally {
      setIsDownloading(false);
    }
  }, [pdfDocument, fileName, t]);

  const handleOpenPlatform = useCallback(() => {
    const encodedText = encodeURIComponent(`${shareText}\n${shareUrl}`);
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://wa.me/?text=${encodedText}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [platform, shareText, shareUrl]);

  const platformLabel = platform === 'whatsapp' ? 'WhatsApp' : 'Facebook';
  const PlatformIcon = platform === 'whatsapp' ? MessageCircle : Share2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlatformIcon className="h-5 w-5" />
            {t('pdfActions.shareVia', { platform: platformLabel, defaultValue: `Share via ${platformLabel}` })}
          </DialogTitle>
          <DialogDescription>
            {t('pdfActions.shareDescription', 'Share this link publicly. Anyone with the link can view and download the PDF — no login required.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Public Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('pdfActions.publicLink', 'Public Link')}
            </label>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('pdfActions.noLoginRequired', 'No login required — accessible to anyone with this link')}
            </p>
          </div>

          {/* Download PDF */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading
              ? t('pdfActions.preparing', 'Preparing...')
              : t('pdfActions.downloadPdfToShare', 'Download PDF to share')}
          </Button>

          {/* Open Platform */}
          <Button
            className="w-full justify-start gap-2"
            onClick={handleOpenPlatform}
          >
            <ExternalLink className="h-4 w-4" />
            {t('pdfActions.openInPlatform', { platform: platformLabel, defaultValue: `Open in ${platformLabel}` })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
