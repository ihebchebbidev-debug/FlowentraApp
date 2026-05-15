import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Bot, 
  GitBranch, 
  Zap, 
  Settings,
  Webhook,
  Database,
  Mail,
  Calendar,
  FileText,
  Users,
  DollarSign,
  ShoppingCart,
  Truck,
  Send,
  Brain,
  Sparkles,
  Clipboard,
  Menu,
  RotateCcw,
  Split,
  Shield,
  Bell,
  RefreshCw,
  UserCheck,
  Code
} from "lucide-react";

interface WorkflowToolbarProps {
  onAddNode: (type: string) => void;
}
import { useTranslation } from 'react-i18next';

interface NodeItem { type: string; labelKey?: string; icon: any; descKey?: string }

const nodeCategories = [
  {
    titleKey: 'gettingStartedTitle',
      items: [
      { type: 'template-business', labelKey: 'node.template-business.label', icon: Clipboard, descKey: 'node.template-business.desc' },
    ] as NodeItem[]
  },
  // Status Triggers Category - NEW
  {
    titleKey: 'statusTriggersTitle',
    items: [
      { type: 'offer-status-trigger', labelKey: 'node.offer-status-trigger.label', icon: FileText, descKey: 'node.offer-status-trigger.desc' },
      { type: 'sale-status-trigger', labelKey: 'node.sale-status-trigger.label', icon: DollarSign, descKey: 'node.sale-status-trigger.desc' },
      { type: 'service-order-status-trigger', labelKey: 'node.service-order-status-trigger.label', icon: ShoppingCart, descKey: 'node.service-order-status-trigger.desc' },
      { type: 'dispatch-status-trigger', labelKey: 'node.dispatch-status-trigger.label', icon: Truck, descKey: 'node.dispatch-status-trigger.desc' },
    ] as NodeItem[]
  },
  // Status Actions Category - NEW
  {
    titleKey: 'statusActionsTitle',
    items: [
      { type: 'update-offer-status', labelKey: 'node.update-offer-status.label', icon: RefreshCw, descKey: 'node.update-offer-status.desc' },
      { type: 'update-sale-status', labelKey: 'node.update-sale-status.label', icon: RefreshCw, descKey: 'node.update-sale-status.desc' },
      { type: 'update-service-order-status', labelKey: 'node.update-service-order-status.label', icon: RefreshCw, descKey: 'node.update-service-order-status.desc' },
      { type: 'update-dispatch-status', labelKey: 'node.update-dispatch-status.label', icon: RefreshCw, descKey: 'node.update-dispatch-status.desc' },
      { type: 'send-notification', labelKey: 'node.send-notification.label', icon: Bell, descKey: 'node.send-notification.desc' },
      { type: 'send-workflow-email', labelKey: 'node.send-workflow-email.label', icon: Mail, descKey: 'node.send-workflow-email.desc' },
      { type: 'request-approval', labelKey: 'node.request-approval.label', icon: UserCheck, descKey: 'node.request-approval.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'processTitle',
    items: [
      { type: 'contact', labelKey: 'node.contact.label', icon: Users, descKey: 'node.contact.desc' },
      { type: 'offer', labelKey: 'node.offer.label', icon: FileText, descKey: 'node.offer.desc' },
      { type: 'sale', labelKey: 'node.sale.label', icon: DollarSign, descKey: 'node.sale.desc' },
      { type: 'service-order', labelKey: 'node.service-order.label', icon: ShoppingCart, descKey: 'node.service-order.desc' },
      { type: 'dispatch', labelKey: 'node.dispatch.label', icon: Truck, descKey: 'node.dispatch.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'communicationTitle',
    items: [
      { type: 'email', labelKey: 'node.email.label', icon: Mail, descKey: 'node.email.desc' },
      { type: 'email-template', labelKey: 'node.email-template.label', icon: Send, descKey: 'node.email-template.desc' },
      { type: 'email-llm', labelKey: 'node.email-llm.label', icon: Sparkles, descKey: 'node.email-llm.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'aiTitle',
    items: [
      { type: 'llm-writer', labelKey: 'node.llm-writer.label', icon: Brain, descKey: 'node.llm-writer.desc' },
      { type: 'llm-analyzer', labelKey: 'node.llm-analyzer.label', icon: Bot, descKey: 'node.llm-analyzer.desc' },
      { type: 'llm-personalizer', labelKey: 'node.llm-personalizer.label', icon: Sparkles, descKey: 'node.llm-personalizer.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'triggersTitle',
    items: [
      { type: 'trigger', labelKey: 'node.trigger.label', icon: Play, descKey: 'node.trigger.desc' },
      { type: 'webhook', labelKey: 'node.webhook.label', icon: Webhook, descKey: 'node.webhook.desc' },
      { type: 'scheduled', labelKey: 'node.scheduled.label', icon: Calendar, descKey: 'node.scheduled.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'advancedLogicTitle',
    items: [
      { type: 'if-else', labelKey: 'node.if-else.label', icon: GitBranch, descKey: 'node.if-else.desc' },
      { type: 'switch', labelKey: 'node.switch.label', icon: Menu, descKey: 'node.switch.desc' },
      { type: 'loop', labelKey: 'node.loop.label', icon: RotateCcw, descKey: 'node.loop.desc' },
      { type: 'parallel', labelKey: 'node.parallel.label', icon: Split, descKey: 'node.parallel.desc' },
      { type: 'try-catch', labelKey: 'node.try-catch.label', icon: Shield, descKey: 'node.try-catch.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'simpleLogicTitle',
    items: [
      { type: 'condition', labelKey: 'node.condition.label', icon: GitBranch, descKey: 'node.condition.desc' },
      { type: 'filter', labelKey: 'node.filter.label', icon: Settings, descKey: 'node.filter.desc' },
    ] as NodeItem[]
  },
  {
    titleKey: 'genericActionsTitle',
    items: [
      { type: 'action', labelKey: 'node.action.label', icon: Zap, descKey: 'node.action.desc' },
      { type: 'database', labelKey: 'node.database.label', icon: Database, descKey: 'node.database.desc' },
      { type: 'api', labelKey: 'node.api.label', icon: Settings, descKey: 'node.api.desc' },
      { type: 'code', labelKey: 'node.code.label', icon: Code, descKey: 'node.code.desc' },
    ] as NodeItem[]
  }
];

export function WorkflowToolbar({ onAddNode }: WorkflowToolbarProps) {
  const { t } = useTranslation();
  return (
    <Card className="h-full rounded-none border-0 border-r border-border/60 bg-background">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-[13px] font-semibold text-foreground">{t('componentsTitle')}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-4 space-y-4">
            {nodeCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h4 className="text-[10px] font-semibold text-muted-foreground/60 mb-1.5 px-2 uppercase tracking-[0.1em]">
                  {t(category.titleKey)}
                </h4>
                
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <Button
                      key={itemIndex}
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddNode(item.type)}
                      className="w-full justify-start h-auto p-2.5 hover:bg-muted/50 rounded-lg transition-all group/node"
                    >
                      <div className="flex items-start gap-2.5 w-full">
                        <div className="p-1.5 rounded-md bg-primary/8 group-hover/node:bg-primary/15 transition-colors mt-0.5">
                          <item.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[12px] font-medium text-foreground">
                            {item.labelKey ? t(item.labelKey) : ''}
                          </div>
                          <div className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5">
                            {item.descKey ? t(item.descKey) : ''}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {categoryIndex < nodeCategories.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
