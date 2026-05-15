import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, Link, Share2, FileText, ExternalLink, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  action: (data: ShareData, content: string) => void;
}

interface ShareData {
  title: string;
  orderNumber: string;
  customerName: string;
  customerCompany: string;
  amount?: string;
  type: 'service_order' | 'dispatch';
  currentUrl: string;
}

interface ProfessionalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
  pdfComponent?: React.ReactElement;
  pdfFileName?: string;
}

export function ProfessionalShareModal({ 
  isOpen, 
  onClose, 
  data, 
  pdfComponent,
  pdfFileName = 'document.pdf'
}: ProfessionalShareModalProps) {
  const { t } = useTranslation('service_orders');
  const [activeTab, setActiveTab] = useState('quick');
  const [email, setEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const { toast } = useToast();

  // Generate professional message template
  const generateProfessionalMessage = useCallback((platform: string) => {
    const baseMessage = data.type === 'service_order' 
      ? `Service Report ${data.orderNumber} for ${data.customerCompany} is ready for review.`
      : `Dispatch Report ${data.orderNumber} for ${data.customerCompany} has been completed.`;
    
    const details = data.amount 
      ? `Total: ${data.amount}` 
      : 'Details available in the attached report.';

    switch (platform) {
      case 'email':
        return `Subject: ${data.title}\n\nDear Team,\n\n${baseMessage}\n\n${details}\n\nYou can view the complete report using the link below.\n\nBest regards,\nField Service Team`;
      
      default:
        return `${baseMessage} ${details}\n\nView report: ${data.currentUrl}`;
    }
  }, [data]);

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      name: 'Copy Link',
      icon: Link,
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/15',
      description: 'Copy link to clipboard',
      action: async (data, content) => {
        try {
          await navigator.clipboard.writeText(data.currentUrl);
          toast({
            title: "Link copied",
            description: "Link has been copied to clipboard",
          });
        } catch (error) {
          toast({
            title: "Copy failed",
            description: "Failed to copy link to clipboard",
            variant: "destructive",
          });
        }
      }
    }
  ];

  const handleQuickShare = async (optionId: string) => {
    const option = shareOptions.find(opt => opt.id === optionId);
    if (!option) return;

    const content = generateProfessionalMessage(optionId);
    option.action(data, content);
    
    if (optionId !== 'copy') {
      toast({
        title: "Sharing initiated",
        description: `Opening ${option.name} for sharing`,
      });
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter recipient email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsEmailSending(true);
    try {
      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Email sent",
        description: `Professional report sent to ${email}`,
      });
      setEmail("");
      setCustomMessage("");
      onClose();
    } catch (error) {
      toast({
        title: "Send failed",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span>Share Report</span>
              <span className="text-sm font-normal text-muted-foreground">{data.title}</span>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {data.customerCompany}
            </Badge>
            {data.amount && (
              <Badge variant="secondary" className="text-xs">
                {data.amount}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
            <TabsTrigger value="quick" className="gap-2 text-sm font-medium">
              <Share2 className="h-4 w-4" />
              Quick Share
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4">
            <TabsContent value="quick" className="space-y-4 mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Report Link</Label>
                    <Input
                      value={data.currentUrl}
                      disabled
                      className="w-full text-sm bg-muted/30"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Share Options</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {shareOptions.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className={`${option.bgColor} border justify-start p-4 h-auto`}
                        onClick={() => handleQuickShare(option.id)}
                      >
                        <option.icon className={`h-5 w-5 mr-3 ${option.color}`} />
                        <div className="text-left">
                          <div className="font-medium">{option.name}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                      </Button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-0 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Send Email</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Recipient Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="client@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        placeholder={generateProfessionalMessage('email')}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={6}
                        className="w-full resize-none text-sm"
                        maxLength={1000}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {customMessage.length}/1000
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendEmail}
                      disabled={isEmailSending || !email}
                      className="gap-2 min-w-[120px]"
                    >
                      {isEmailSending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}