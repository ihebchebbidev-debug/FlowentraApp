import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  TrendingUp, 
  Package, 
  Wrench, 
  CheckSquare, 
  FileText,
  MapPin,
  ClipboardList,
  X,
  Clock,
  Loader2,
  UserCog,
  Shield
} from "lucide-react";
import { dispatchesApi } from "@/services/api/dispatchesApi";
import { useTranslation } from "react-i18next";

// Import real API services
import { contactsApi } from "@/services/api/contactsApi";
import { salesApi } from "@/services/api/salesApi";
import { offersApi } from "@/services/api/offersApi";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { articlesApi } from "@/services/api/articlesApi";
import { projectsApi } from "@/services/api/projectsApi";
import { installationsApi } from "@/services/api/installationsApi";
import { usersApi } from "@/services/api/usersApi";
import { rolesApi } from "@/services/api/rolesApi";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'contact' | 'sale' | 'offer' | 'service-order' | 'material' | 'service' | 'project' | 'installation' | 'dispatch' | 'user' | 'role';
  route: string;
  icon: any;
  status?: string;
  amount?: number;
  currency?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Navigate to a selected result
  const handleSelectResult = useCallback((result: SearchResult) => {
    navigate(result.route);
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelectResult]);

  // Dynamic search across all modules
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    const allResults: SearchResult[] = [];
    const searchTerms = searchQuery.toLowerCase().trim();

    try {
      // Parallel API calls for speed
      const [
        contactsRes,
        salesRes,
        offersRes,
        serviceOrdersRes,
        dispatchesRes,
        articlesRes,
        projectsRes,
        installationsRes,
        usersRes,
        rolesRes
      ] = await Promise.allSettled([
        contactsApi.getAll({ searchTerm: searchTerms, pageSize: 5 }),
        salesApi.getAll({ search: searchTerms, limit: 5 }),
        offersApi.getAll({ search: searchTerms, limit: 5 }),
        serviceOrdersApi.getAll({ search: searchTerms, pageSize: 5 }),
        dispatchesApi.getAll({ pageSize: 10 }),
        articlesApi.getAll({ search: searchTerms, limit: 10 }),
        projectsApi.getAll({ searchTerm: searchTerms, pageSize: 5 }),
        installationsApi.getAll({ search: searchTerms, pageSize: 5 }),
        usersApi.getAll(),
        rolesApi.getAll()
      ]);

      // Process Contacts
      if (contactsRes.status === 'fulfilled' && contactsRes.value?.contacts) {
        contactsRes.value.contacts.forEach((contact: any) => {
          allResults.push({
            id: String(contact.id),
            title: contact.name || `${contact.firstName} ${contact.lastName}`.trim(),
            subtitle: contact.email || contact.company,
            type: 'contact',
            route: `/dashboard/contacts/${contact.id}`,
            icon: Users,
            status: contact.status
          });
        });
      }

      // Process Sales (nested: data.sales)
      if (salesRes.status === 'fulfilled') {
        const salesData = salesRes.value?.data?.sales || [];
        salesData.forEach((sale: any) => {
          allResults.push({
            id: String(sale.id),
            title: sale.title || `Sale #${sale.id}`,
            subtitle: sale.contactName || sale.contact?.name,
            type: 'sale',
            route: `/dashboard/sales/${sale.id}`,
            icon: TrendingUp,
            status: sale.status,
            amount: sale.totalAmount || sale.amount,
            currency: sale.currency || 'TND'
          });
        });
      }

      // Process Offers (nested: data.offers)
      if (offersRes.status === 'fulfilled') {
        const offersData = offersRes.value?.data?.offers || [];
        offersData.forEach((offer: any) => {
          allResults.push({
            id: String(offer.id),
            title: offer.title || offer.offerNumber || `Offer #${offer.id}`,
            subtitle: offer.contactName || offer.contact?.name,
            type: 'offer',
            route: `/dashboard/offers/${offer.id}`,
            icon: FileText,
            status: offer.status,
            amount: offer.totalAmount || offer.amount,
            currency: offer.currency || 'TND'
          });
        });
      }

      // Process Service Orders (nested: data.serviceOrders)
      if (serviceOrdersRes.status === 'fulfilled') {
        const serviceOrdersData = serviceOrdersRes.value?.data?.serviceOrders || [];
        serviceOrdersData.forEach((so: any) => {
          allResults.push({
            id: String(so.id),
            title: so.title || so.orderNumber || `Service Order #${so.id}`,
            subtitle: so.contactName,
            type: 'service-order',
            route: `/dashboard/field/service-orders/${so.id}`,
            icon: ClipboardList,
            status: so.status
          });
        });
      }

      // Process Dispatches (nested: data array)
      if (dispatchesRes?.status === 'fulfilled') {
        const dispatchesData = dispatchesRes.value?.data || [];
        dispatchesData.forEach((d: any) => {
          const title = d.dispatchNumber || `Dispatch #${d.id}`;
          const subtitle = d.contactName || (d.serviceOrderId ? `SO ${d.serviceOrderId}` : undefined);
          // Basic local filtering by searchTerms to keep relevance
          const lowerTitle = (title || '').toLowerCase();
          const lowerSubtitle = (subtitle || '').toLowerCase();
          if (!lowerTitle.includes(searchTerms) && !lowerSubtitle.includes(searchTerms) && !(d.notes || '').toLowerCase().includes(searchTerms)) return;

          allResults.push({
            id: String(d.id),
            title,
            subtitle,
            type: 'dispatch',
            route: `/dashboard/field/dispatches/${d.id}`,
            icon: ClipboardList,
            status: d.status
          });
        });
      }

      // Process Articles (nested: data array)
      if (articlesRes.status === 'fulfilled') {
        const articlesData = articlesRes.value?.data || [];
        articlesData.forEach((article: any) => {
          const isMaterial = article.type === 'material';
          allResults.push({
            id: String(article.id),
            title: article.name,
            subtitle: article.category || article.description,
            type: isMaterial ? 'material' : 'service',
            route: isMaterial 
              ? `/dashboard/inventory-services/materials/${article.id}` 
              : `/dashboard/inventory-services/services/${article.id}`,
            icon: isMaterial ? Package : Wrench,
            status: article.stock > 0 ? 'In Stock' : article.stock === 0 ? 'Out of Stock' : undefined,
            amount: article.sellPrice || article.basePrice
          });
        });
      }

      // Process Projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value?.projects) {
        projectsRes.value.projects.forEach((project: any) => {
          allResults.push({
            id: String(project.id),
            title: project.name,
            subtitle: project.ownerName || project.description,
            type: 'project',
            route: `/dashboard/tasks/projects/${project.id}`,
            icon: CheckSquare,
            status: project.status
          });
        });
      }

      // Process Installations
      if (installationsRes.status === 'fulfilled' && installationsRes.value?.installations) {
        installationsRes.value.installations.forEach((installation: any) => {
          allResults.push({
            id: String(installation.id),
            title: installation.name || installation.siteName || `Installation #${installation.id}`,
            subtitle: installation.address || installation.location?.address,
            type: 'installation',
            route: `/dashboard/field/installations/${installation.id}`,
            icon: MapPin,
            status: installation.status
          });
        });
      }

      // Process Users
      if (usersRes.status === 'fulfilled') {
        const usersData = usersRes.value?.users || usersRes.value || [];
        const filteredUsers = Array.isArray(usersData) 
          ? usersData.filter((user: any) => {
              const name = (user.name || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase();
              const email = (user.email || '').toLowerCase();
              return name.includes(searchTerms) || email.includes(searchTerms);
            }).slice(0, 5)
          : [];
        
        filteredUsers.forEach((user: any) => {
          allResults.push({
            id: String(user.id),
            title: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            subtitle: user.email || user.department,
            type: 'user',
            route: `/dashboard/settings?tab=users&user=${user.id}`,
            icon: UserCog,
            status: user.isActive ? 'Active' : 'Inactive'
          });
        });
      }

      // Process Roles
      if (rolesRes.status === 'fulfilled') {
        const rolesData = rolesRes.value || [];
        const filteredRoles = Array.isArray(rolesData) 
          ? rolesData.filter((role: any) => {
              const name = (role.name || '').toLowerCase();
              const description = (role.description || '').toLowerCase();
              return name.includes(searchTerms) || description.includes(searchTerms);
            }).slice(0, 5)
          : [];
        
        filteredRoles.forEach((role: any) => {
          allResults.push({
            id: String(role.id),
            title: role.name,
            subtitle: role.description || `${role.permissions?.length || 0} permissions`,
            type: 'role',
            route: `/dashboard/settings?tab=roles&role=${role.id}`,
            icon: Shield
          });
        });
      }

      // Sort by relevance (exact title match first)
      const sortedResults = allResults
        .sort((a, b) => {
          const aExactMatch = a.title.toLowerCase().startsWith(searchTerms);
          const bExactMatch = b.title.toLowerCase().startsWith(searchTerms);
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          const aContains = a.title.toLowerCase().includes(searchTerms);
          const bContains = b.title.toLowerCase().includes(searchTerms);
          if (aContains && !bContains) return -1;
          if (!aContains && bContains) return 1;
          
          return 0;
        })
        .slice(0, 12);

      setResults(sortedResults);
      setSelectedIndex(-1);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Global search error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contact': return 'bg-primary/10 text-primary';
      case 'sale': return 'bg-success/10 text-success';
      case 'offer': return 'bg-warning/10 text-warning';
      case 'service-order': return 'bg-accent text-accent-foreground';
      case 'material': return 'bg-secondary text-secondary-foreground';
      case 'service': return 'bg-warning/10 text-warning';
      case 'project': return 'bg-primary/10 text-primary';
      case 'installation': return 'bg-success/10 text-success';
      case 'dispatch': return 'bg-destructive/10 text-destructive';
      case 'user': return 'bg-accent text-accent-foreground';
      case 'role': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    return t(`globalSearch.types.${type}`, { defaultValue: type });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('globalSearch.placeholder')}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-10 h-10 md:h-11 w-full bg-background border-border focus:border-primary transition-colors text-sm md:text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            onClick={clearSearch}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[28rem] overflow-y-auto">
          <div className="p-2 border-b border-border bg-muted/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              {isLoading ? t('globalSearch.searching') : (results.length === 1 ? t('globalSearch.results_found', { count: results.length }) : t('globalSearch.results_found_plural', { count: results.length }))}
            </p>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="py-1">
            {results.map((result, index) => {
              const Icon = result.icon;
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  className={`w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors flex items-center gap-3 ${
                    isSelected ? 'bg-accent/70' : ''
                  }`}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      {result.status && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {result.status}
                        </Badge>
                      )}
                      {result.amount && (
                        <span className="text-xs font-medium text-primary">
                          {formatCurrency(result.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="p-2 border-t border-border bg-muted/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('globalSearch.keyboard_hint')}
            </p>
          </div>
        </div>
      )}
      
      {/* No results */}
      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('globalSearch.no_results', { query })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('globalSearch.try_suggestion')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
