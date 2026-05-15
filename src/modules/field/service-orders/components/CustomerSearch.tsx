import { useState, useEffect } from "react";
import { Search, User, Building2, Loader2, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { contactsApi } from "@/services/api/contactsApi";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  status: string;
  type: string;
  tags?: string[];
}

interface Props {
  onSelect: (customer: Customer) => void;
  selectedCustomer?: Customer | null;
}

export default function CustomerSearch({ onSelect, selectedCustomer }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await contactsApi.getAll({ 
          searchTerm: searchTerm || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          pageNumber: 1, 
          pageSize: 300 
        });
        
        // Handle different response structures
        const contactsList = response?.contacts || (response as any)?.data?.contacts || [];
        
        // Map contacts to Customer interface
        const mappedCustomers: Customer[] = contactsList.map((contact: any) => ({
          id: contact.id,
          name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          address: contact.address || '',
          status: contact.status || 'active',
          type: contact.type || 'individual',
          tags: contact.tags?.map((t: any) => typeof t === 'string' ? t : t.name) || [],
        }));
        
        setCustomers(mappedCustomers);
      } catch (err: any) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again.');
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, typeFilter]);

  const getTypeIcon = (type: string) => {
    return type === 'company' ? Building2 : User;
  };

  return (
    <div className="space-y-4">
      {/* Selected Customer - Compact View */}
      {selectedCustomer && (
        <div className="p-3 border-2 border-primary/50 rounded-lg bg-primary/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                {selectedCustomer.type === 'company' ? (
                  <Building2 className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{selectedCustomer.name}</span>
                  <Check className="h-4 w-4 text-primary shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedCustomer.company || selectedCustomer.email || selectedCustomer.phone}
                </p>
              </div>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => onSelect(null as any)}
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Customer Search */}
      {!selectedCustomer && (
        <>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Search Customers</Label>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <ToggleGroup 
                type="single" 
                value={typeFilter} 
                onValueChange={(value) => value && setTypeFilter(value)}
                className="justify-start"
              >
                <ToggleGroupItem value="all" size="sm" className="text-xs h-7 px-3">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="individual" size="sm" className="text-xs h-7 px-3">
                  <User className="h-3 w-3 mr-1" />
                  Person
                </ToggleGroupItem>
                <ToggleGroupItem value="company" size="sm" className="text-xs h-7 px-3">
                  <Building2 className="h-3 w-3 mr-1" />
                  Company
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted/60 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => setSearchTerm(searchTerm + ' ')} // Trigger refetch
                >
                  Retry
                </Button>
              </div>
            ) : customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No customers found.
              </p>
            ) : (
              customers.map((customer) => {
                const TypeIcon = getTypeIcon(customer.type);
                return (
                  <div
                    key={customer.id}
                    className="p-2.5 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 cursor-pointer transition-all group"
                    onClick={() => onSelect(customer)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm block truncate">{customer.name}</span>
                        <span className="text-xs text-muted-foreground block truncate">
                          {customer.company || customer.email || customer.phone || 'No details'}
                        </span>
                      </div>
                      <Badge 
                        variant={customer.type === 'company' ? 'default' : 'secondary'} 
                        className="text-[10px] shrink-0"
                      >
                        {customer.type === 'company' ? 'Company' : 'Person'}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
