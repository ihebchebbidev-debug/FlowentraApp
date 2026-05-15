import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Link2, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dynamicFormsService } from '../services/dynamicFormsService';
import { DynamicForm } from '../types';
import { useToast } from '@/hooks/use-toast';

interface FormSharingSettingsProps {
  form: DynamicForm;
  onFormUpdate: (form: DynamicForm) => void;
}

export function FormSharingSettings({ form, onFormUpdate }: FormSharingSettingsProps) {
  const { t } = useTranslation('dynamic-forms');
  const { toast } = useToast();
  
  const [isPublic, setIsPublic] = useState(form.is_public);
  const [publicSlug, setPublicSlug] = useState(form.public_slug || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const isReleased = form.status === 'released';
  const publicUrl = publicSlug ? `${window.location.origin}/public/forms/${publicSlug}` : '';
  
  useEffect(() => {
    setIsPublic(form.is_public);
    setPublicSlug(form.public_slug || '');
  }, [form]);
  
  const handleTogglePublic = async (enabled: boolean) => {
    if (!isReleased && enabled) {
      toast({
        title: t('sharing.requires_release', 'Form must be released to enable public sharing'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const updated = await dynamicFormsService.updatePublicSharing(form.id, enabled);
      setIsPublic(updated.is_public);
      setPublicSlug(updated.public_slug || '');
      onFormUpdate(updated);
      
      toast({
        title: enabled 
          ? t('sharing.enabled', 'Public sharing enabled')
          : t('sharing.disabled', 'Not shared publicly'),
      });
    } catch (error) {
      toast({
        title: t('sharing.update_error'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCopyLink = async () => {
    if (!publicUrl) return;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      setIsCopied(true);
      toast({
        title: t('sharing.link_copied', 'Link copied!'),
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('sharing.copy_error'),
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{t('sharing.title', 'Public Sharing')}</CardTitle>
            <CardDescription className="text-xs">
              {t('sharing.description', 'Allow anyone to access and submit responses to this form without logging in')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="public-toggle" className="flex flex-col gap-1">
            <span>
              {isPublic 
                ? t('sharing.disable', 'Disable Public Access')
                : t('sharing.enable', 'Enable Public Access')
              }
            </span>
            {!isReleased && (
              <span className="text-xs text-warning">
                {t('sharing.requires_release', 'Form must be released to enable public sharing')}
              </span>
            )}
          </Label>
          <Switch
            id="public-toggle"
            checked={isPublic}
            disabled={isUpdating || !isReleased}
            onCheckedChange={handleTogglePublic}
          />
        </div>
        
        {/* Public URL */}
        {isPublic && publicSlug && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {t('sharing.public_link', 'Public Link')}
            </Label>
            <div className="flex gap-2">
              <Input 
                value={publicUrl}
                readOnly
                className="font-mono text-xs bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shrink-0"
              >
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
        
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('common.loading', 'Loading...')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
