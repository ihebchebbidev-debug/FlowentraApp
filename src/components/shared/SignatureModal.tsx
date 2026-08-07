import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SignaturePad } from './SignaturePad';
import { signatureApi } from '@/services/signatureApi';
import { uploadThingClientService } from '@/services/uploadThingClientService';
import { imageUrlToBase64 } from '@/utils/imageToBase64';
import { toast } from 'sonner';
import { Loader2, PenLine, RotateCcw, Check, Trash2 } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSaved: (signatureBase64: string) => void;
}

export function SignatureModal({ isOpen, onClose, onSignatureSaved }: SignatureModalProps) {
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);
  const [savedSignatureBase64, setSavedSignatureBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mode, setMode] = useState<'draw' | 'saved'>('draw');
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved signature on open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    
    const load = async () => {
      setIsLoading(true);
      try {
        const url = await signatureApi.getMySignature();
        if (!cancelled && url) {
          setSavedSignatureUrl(url);
          const base64 = await imageUrlToBase64(url);
          if (!cancelled) {
            setSavedSignatureBase64(base64);
            setMode('saved');
          }
        } else {
          setMode('draw');
        }
      } catch {
        setMode('draw');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleUseSaved = () => {
    if (savedSignatureBase64) {
      onSignatureSaved(savedSignatureBase64);
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await signatureApi.deleteMySignature();
      setSavedSignatureUrl(null);
      setSavedSignatureBase64(null);
      setMode('draw');
      toast.success('Signature deleted successfully');
    } catch {
      toast.error('Failed to delete signature');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNew = async () => {
    // Get the canvas element from the DOM
    const canvas = document.querySelector('canvas') as HTMLCanvasElement & { __signaturePad?: any };
    if (!canvas?.__signaturePad) return;

    const pad = canvas.__signaturePad;
    if (!pad.hasDrawn) {
      toast.error('Please draw your signature first');
      return;
    }

    setIsSaving(true);
    try {
      // Get blob from canvas
      const blob = await pad.toBlob();
      if (!blob) throw new Error('Failed to export signature');

      const file = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Upload via UploadThing
      const result = await uploadThingClientService.uploadFile(file);
      if (!result.success) throw new Error(result.error || 'Upload failed');

      // Save URL to backend
      await signatureApi.saveMySignature(result.fileUrl);

      // Convert to base64 for PDF embedding
      const dataUrl = pad.toDataURL();
      
      setSavedSignatureUrl(result.fileUrl);
      setSavedSignatureBase64(dataUrl);
      
      onSignatureSaved(dataUrl);
      toast.success('Signature saved successfully');
      onClose();
    } catch (error: any) {
      console.error('Signature save error:', error);
      toast.error(error.message || 'Failed to save signature');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            E-Signature
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 space-y-4 animate-pulse">
            <div className="h-[120px] w-full bg-muted/60 rounded-lg" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-muted rounded" />
              <div className="h-9 flex-1 bg-muted rounded" />
            </div>
          </div>
        ) : mode === 'saved' && savedSignatureBase64 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Your saved signature:</p>
            <div className="border rounded-lg p-4 bg-white flex items-center justify-center">
              <img src={savedSignatureBase64} alt="Saved signature" className="max-h-[120px] object-contain" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleDelete} disabled={isDeleting} className="shrink-0 text-destructive hover:text-destructive">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setMode('draw')}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Draw New
              </Button>
              <Button className="flex-1" onClick={handleUseSaved}>
                <Check className="h-4 w-4 mr-2" />
                Use This Signature
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SignaturePad onSignatureChange={setHasDrawn} />
            {savedSignatureUrl && (
              <Button variant="ghost" size="sm" onClick={() => setMode('saved')}>
                Use saved signature instead
              </Button>
            )}
          </div>
        )}

        {mode === 'draw' && !isLoading && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={isSaving || !hasDrawn}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save & Apply
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
