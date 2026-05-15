import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Send, Building, User, Phone, Mail, Calendar, DollarSign, ExternalLink } from "lucide-react";
import { Sale } from "@/modules/sales/types";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { getStatusColorClass, getStatusTranslationKey } from "@/config/entity-statuses";

// Mock data - replace with actual data fetching
const mockSale: Sale = {
  id: "S-2024-001",
  title: "Enterprise Software Solution",
  contactId: "contact-1",
  contactName: "John Smith",
  contactCompany: "TechCorp Inc.",
  amount: 25000,
  currency: 'USD',
  status: 'closed',
  stage: 'closed',
  priority: 'high',
  description: "Complete enterprise software solution implementation",
  notes: "Customer requires custom integration with existing systems",
  validUntil: new Date('2024-12-31'),
  estimatedCloseDate: new Date('2024-10-15'),
  actualCloseDate: new Date('2024-10-10'),
  items: [
    {
      id: "item-1",
      saleId: "S-2024-001",
      type: 'service',
      itemId: "srv-001",
      itemName: "Software Implementation",
      itemCode: "SRV-IMPL",
      quantity: 1,
      unitPrice: 20000,
      totalPrice: 20000,
      description: "Complete software implementation service",
    },
    {
      id: "item-2",
      saleId: "S-2024-001",
      type: 'article',
      itemId: "art-001",
      itemName: "Premium Support Package",
      itemCode: "SUP-PREM",
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
      description: "12 months premium support",
    }
  ],
  assignedTo: "user-1",
  assignedToName: "Sarah Johnson",
  tags: ["enterprise", "software", "implementation"],
  createdAt: new Date('2024-09-01'),
  updatedAt: new Date('2024-10-10'),
  createdBy: "user-1",
  lastActivity: new Date('2024-10-10'),
  customerEmail: "john.smith@techcorp.com",
  customerPhone: "+1-555-123-4567",
  customerAddress: "123 Business Ave, Tech City, TC 12345",
  deliveryDate: new Date('2024-11-01'),
  taxes: 2500,
  discount: 1000,
  totalAmount: 26500
};

export function SaleDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { format: formatCurrency } = useCurrency();

  // Use mock data for now - replace with actual data fetching
  const sale = mockSale;

  const getStatusColor = (status: string) => {
    return getStatusColorClass('sale', status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const totalItemsValue = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/dashboard/workflow')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sale {id}</h1>
            <p className="text-muted-foreground">Sale Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(sale.status)}>{t(getStatusTranslationKey('sale', sale.status), { defaultValue: (sale.status || '').toUpperCase() })}</Badge>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        </div>
      </div>

      {/* Sale Details - Comprehensive */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sale Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sale ID</label>
                <p className="text-foreground font-medium mt-1">{sale.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Sale Title</label>
                <p className="text-foreground font-medium mt-1">{sale.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground font-medium mt-1">{sale.description || 'No description provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Company</label>
                <div className="mt-1">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center md:max-w-none max-w-[200px] truncate"
                    onClick={() => navigate(`/dashboard/contacts/${sale.contactId}`)}
                  >
                    <span className="truncate">{sale.contactCompany || sale.contactName}</span>
                    <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Email</label>
                <p className="text-foreground font-medium mt-1">
                  {sale.customerEmail || "Not specified"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Phone</label>
                <p className="text-foreground font-medium mt-1">
                  {sale.customerPhone || "Not specified"}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sale Amount</label>
                <p className="text-foreground font-medium mt-1">{formatCurrency(sale.totalAmount || sale.amount)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Delivery Date</label>
                <p className="text-foreground font-medium mt-1">{sale.deliveryDate ? formatDate(sale.deliveryDate) : 'Not set'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority Level</label>
                <div className="mt-1">
                  <Badge className={`${getPriorityColor(sale.priority)} font-medium`}>
                    {sale.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                <div className="mt-1">
                  <Badge className={`${getStatusColor(sale.status)} font-medium`}>
                    <span className="ml-1">{t(getStatusTranslationKey('sale', sale.status), { defaultValue: (sale.status || '').toUpperCase() })}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Stage</label>
                <div className="mt-1">
                  <Badge variant="outline" className="font-medium">
                    {sale.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                <p className="text-foreground font-medium mt-1">
                  {sale.assignedToName || 'Unassigned'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Close Date</label>
                <p className="text-foreground font-medium mt-1">
                  {sale.actualCloseDate ? formatDate(sale.actualCloseDate) : 'Not closed'}
                </p>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground">Items Overview</label>
            </div>

            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Items Summary</h4>
                  <span className="text-xs text-muted-foreground">{sale.items.length} items</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Services:</span>
                    <span className="font-medium">{sale.items.filter(item => item.type === 'service').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Articles:</span>
                    <span className="font-medium">{sale.items.filter(item => item.type === 'article').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}