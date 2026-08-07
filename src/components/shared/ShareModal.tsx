import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Copy, Mail, Link, Check, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentUrl: string;
}

export function ShareModal({ isOpen, onClose, title, currentUrl }: ShareModalProps) {
  const { t } = useTranslation('service_orders');
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({
        title: t('share.link_copied'),
        description: t('share.link_copied_description'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('share.copy_failed'),
        description: t('share.copy_failed_description'),
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: t('share.email_required'),
        description: t('share.email_required_description'),
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: t('share.invalid_email'),
        description: t('share.invalid_email_description'),
        variant: "destructive",
      });
      return;
    }

    setIsEmailSending(true);
    try {
      // In a real app, this would make an API call to send the email
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast({
        title: t('share.email_sent'),
        description: t('share.email_sent_description', { email }),
      });
      setEmail("");
      setMessage("");
      onClose();
    } catch (error) {
      toast({
        title: t('share.send_failed'),
        description: t('share.send_failed_description'),
        variant: "destructive",
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span>{t('share.title')}</span>
              <span className="text-sm font-normal text-muted-foreground">{title}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
            <TabsTrigger value="link" className="gap-2 text-sm font-medium py-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">{t('share.copy_link')}</span>
              <span className="sm:hidden">{t('share.link')}</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 text-sm font-medium py-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">{t('share.send_email')}</span>
              <span className="sm:hidden">{t('share.email')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-6 mt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{t('share.share_link')}</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('share.share_link_description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={currentUrl}
                  readOnly
                  className="flex-1 bg-muted/30 font-mono text-xs sm:text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2 min-w-[100px] justify-center"
                  variant={copied ? "default" : "outline"}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('share.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t('share.copy')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{t('share.send_via_email')}</Label>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('share.recipient_email')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('share.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    {t('share.message_optional')}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={t('share.message_placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/500
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="order-2 sm:order-1"
                >
                  {t('common:cancel')}
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={isEmailSending || !email}
                  className="gap-2 order-1 sm:order-2 min-w-[120px] justify-center"
                >
                  {isEmailSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {t('share.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t('share.send_email')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}