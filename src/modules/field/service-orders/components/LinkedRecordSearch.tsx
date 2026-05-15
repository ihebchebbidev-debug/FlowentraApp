import { useState, useEffect } from "react";
import { Search, ExternalLink, Calendar, DollarSign, Building2, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import offers from '@/data/mock/offers.json';
import sales from '@/data/mock/sales.json';
import { format } from "date-fns";

interface LinkedRecord {
  id: string;
  title: string;
  contactName: string;
  contactCompany: string;
  amount: number;
  currency: string;
  status: string;
  validUntil?: string;
  actualCloseDate?: string;
}

interface Props {
  onSelect: (record: LinkedRecord, type: 'offer' | 'sale') => void;
  selectedRecord?: { record: LinkedRecord; type: 'offer' | 'sale' } | null;
}

export default function LinkedRecordSearch({ onSelect, selectedRecord }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'offers' | 'sales'>('offers');
  const [filteredRecords, setFilteredRecords] = useState<LinkedRecord[]>([]);

  useEffect(() => {
    let records: LinkedRecord[] = [];
    
    switch (activeTab) {
      case 'offers':
        records = offers.filter(offer => 
          offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.contactCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      case 'sales':
        records = sales.filter(sale => 
          sale.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.contactCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
    }
    
    setFilteredRecords(records);
  }, [searchTerm, activeTab]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'accepted': 'bg-success/10 text-success border-success/20',
      'sent': 'bg-warning/10 text-warning border-warning/20', 
      'declined': 'bg-destructive/10 text-destructive border-destructive/20',
      'won': 'bg-success/10 text-success border-success/20',
      'lost': 'bg-destructive/10 text-destructive border-destructive/20',
      'scheduled': 'bg-primary/10 text-primary border-primary/20',
      'completed': 'bg-success/10 text-success border-success/20'
    };
    return colors[status] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'offers': return <ExternalLink className="h-4 w-4" />;
      case 'sales': return <DollarSign className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Link to Existing Offer or Sale</span>
          <span className="sm:hidden">Link Record</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedRecord && (
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(selectedRecord.record.status)}>
                    {selectedRecord.record.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">
                    {selectedRecord.type}
                  </span>
                </div>
                <h4 className="font-medium">{selectedRecord.record.title}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {selectedRecord.record.contactCompany}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedRecord.record.contactName}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(selectedRecord.record.amount, selectedRecord.record.currency)}
                  </span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => onSelect(selectedRecord.record, selectedRecord.type)}
              >
                Change
              </Button>
            </div>
          </div>
        )}

        {!selectedRecord && (
          <>
            <div className="space-y-2">
              <Label>Search Records</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, title, company, or contact name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="offers" className="flex items-center gap-2">
                  {getTabIcon('offers')}
                  Offers
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  {getTabIcon('sales')}
                  Sales
                </TabsTrigger>
              </TabsList>

              <TabsContent value="offers" className="space-y-2 max-h-60 overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm ? 'No offers found matching your search.' : 'Start typing to search offers...'}
                  </p>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSelect(record, 'offer')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{record.title}</span>
                            <Badge variant="outline" className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{record.contactCompany}</span>
                            <span>{formatCurrency(record.amount, record.currency)}</span>
                            {record.validUntil && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Valid until {format(new Date(record.validUntil), "MMM dd")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-2 max-h-60 overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm ? 'No sales found matching your search.' : 'Start typing to search sales...'}
                  </p>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSelect(record, 'sale')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{record.title}</span>
                            <Badge variant="outline" className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{record.contactCompany}</span>
                            <span>{formatCurrency(record.amount, record.currency)}</span>
                            {record.actualCloseDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Closed {format(new Date(record.actualCloseDate), "MMM dd")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}