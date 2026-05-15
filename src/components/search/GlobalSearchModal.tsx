import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  X, 
  Users, 
  Wrench, 
  Package, 
  FileText, 
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contactsApi } from '@/services/api/contactsApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { installationsApi } from '@/services/api/installationsApi';
import { articlesApi } from '@/services/api/articlesApi';
import { offersApi } from '@/services/api/offersApi';
import { getUniversalStatusColorClass } from '@/config/entity-statuses';

// Search result types
export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'service-order' | 'contact' | 'installation' | 'article' | 'offer';
  status?: string;
  priority?: string;
  location?: string;
  date?: string;
  cost?: string;
  description?: string;
  url: string;
}

type SearchType = 'all' | 'service-order' | 'contact' | 'installation' | 'article' | 'offer';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'service-order': return Wrench;
    case 'contact': return Users;
    case 'installation': return Building2;
    case 'article': return Package;
    case 'offer': return FileText;
    default: return Search;
  }
};

// Status color derived from centralized entity config (universal cross-entity resolver)
const getStatusColor = (status: string) => getUniversalStatusColorClass(status);

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<SearchType>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<SearchType, number>>({
    'all': 0,
    'service-order': 0,
    'contact': 0,
    'installation': 0,
    'article': 0,
    'offer': 0
  });
  const navigate = useNavigate();

  // Debounced search function
  const performSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      setCounts({
        'all': 0,
        'service-order': 0,
        'contact': 0,
        'installation': 0,
        'article': 0,
        'offer': 0
      });
      return;
    }

    setLoading(true);
    
    try {
      const searchResults: SearchResultItem[] = [];
      const newCounts: Record<SearchType, number> = {
        'all': 0,
        'service-order': 0,
        'contact': 0,
        'installation': 0,
        'article': 0,
        'offer': 0
      };

      // Parallel API calls for better performance using correct search params
      const [
        contactsResult,
        serviceOrdersResult,
        installationsResult,
        articlesResult,
        offersResult
      ] = await Promise.allSettled([
        contactsApi.getAll({ searchTerm: term, pageNumber: 1, pageSize: 10 }),
        serviceOrdersApi.getAll({ search: term, page: 1, pageSize: 10 }),
        installationsApi.getAll({ search: term, page: 1, pageSize: 10 }),
        articlesApi.getAll({ search: term, page: 1, limit: 10 }),
        offersApi.getAll({ search: term, page: 1, limit: 10 })
      ]);

      // Process contacts
      if (contactsResult.status === 'fulfilled' && contactsResult.value?.contacts) {
        const contacts = contactsResult.value.contacts;
        newCounts['contact'] = contacts.length;
        contacts.forEach((contact: any) => {
          searchResults.push({
            id: String(contact.id),
            title: contact.name || `${contact.firstName} ${contact.lastName}`,
            subtitle: contact.company || contact.email || '',
            type: 'contact',
            location: contact.city || contact.address,
            description: contact.notes,
            url: `/dashboard/contacts/${contact.id}`
          });
        });
      }

      // Process service orders
      if (serviceOrdersResult.status === 'fulfilled' && serviceOrdersResult.value?.data?.serviceOrders) {
        const orders = serviceOrdersResult.value.data.serviceOrders;
        newCounts['service-order'] = orders.length;
        orders.forEach((order: any) => {
          searchResults.push({
            id: order.orderNumber || String(order.id),
            title: order.title || order.description || `#${order.orderNumber}`,
            subtitle: order.contactName || '',
            type: 'service-order',
            status: order.status,
            priority: order.priority,
            date: order.startDate || order.createdDate,
            url: `/dashboard/field/service-orders/${order.id}`
          });
        });
      }

      // Process installations
      if (installationsResult.status === 'fulfilled' && installationsResult.value?.installations) {
        const installations = installationsResult.value.installations;
        newCounts['installation'] = installations.length;
        installations.forEach((inst: any) => {
          searchResults.push({
            id: String(inst.id),
            title: inst.name || inst.installationNumber || `#${inst.id}`,
            subtitle: inst.manufacturer || inst.category || '',
            type: 'installation',
            status: inst.status,
            location: inst.siteAddress,
            date: inst.installationDate || inst.createdDate,
            url: `/dashboard/installations/${inst.id}`
          });
        });
      }

      // Process articles
      if (articlesResult.status === 'fulfilled') {
        const articles = articlesResult.value?.data || [];
        newCounts['article'] = articles.length;
        articles.forEach((article: any) => {
          searchResults.push({
            id: article.sku || String(article.id),
            title: article.name || article.title,
            subtitle: article.category || article.type || '',
            type: 'article',
            cost: article.sellPrice ? `${article.sellPrice}` : undefined,
            description: article.description,
            url: `/dashboard/inventory/articles/${article.id}`
          });
        });
      }

      // Process offers
      if (offersResult.status === 'fulfilled' && offersResult.value?.data?.offers) {
        const offers = offersResult.value.data.offers;
        newCounts['offer'] = offers.length;
        offers.forEach((offer: any) => {
          searchResults.push({
            id: offer.offerNumber || String(offer.id),
            title: offer.title || offer.name || `#${offer.offerNumber}`,
            subtitle: offer.contactName || '',
            type: 'offer',
            status: offer.status,
            cost: offer.totalAmount ? `${offer.totalAmount}` : undefined,
            date: offer.createdDate || offer.validUntil,
            url: `/dashboard/offers/${offer.id}`
          });
        });
      }

      newCounts['all'] = searchResults.length;
      setCounts(newCounts);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  // Filter results by selected type
  const filteredResults = useMemo(() => {
    if (selectedType === 'all') return results;
    return results.filter(item => item.type === selectedType);
  }, [results, selectedType]);

  const handleResultClick = (result: SearchResultItem) => {
    navigate(result.url);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedType('all');
    setResults([]);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const input = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const typeFilters: { value: SearchType; labelKey: string; shortKey: string }[] = [
    { value: 'all', labelKey: 'search.filters.all', shortKey: 'search.filtersShort.all' },
    { value: 'service-order', labelKey: 'search.filters.serviceOrders', shortKey: 'search.filtersShort.service' },
    { value: 'contact', labelKey: 'search.filters.contacts', shortKey: 'search.filtersShort.contacts' },
    { value: 'installation', labelKey: 'search.filters.installations', shortKey: 'search.filtersShort.installations' },
    { value: 'offer', labelKey: 'search.filters.offers', shortKey: 'search.filtersShort.offers' },
    { value: 'article', labelKey: 'search.filters.articles', shortKey: 'search.filtersShort.articles' },
  ];

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'service-order': return t('search.types.serviceOrder', 'Service Order');
      case 'contact': return t('search.types.contact', 'Contact');
      case 'installation': return t('search.types.installation', 'Installation');
      case 'article': return t('search.types.article', 'Article');
      case 'offer': return t('search.types.offer', 'Offer');
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-4xl sm:max-h-[90vh] sm:h-auto p-0 gap-0 m-0 sm:mx-auto sm:rounded-lg rounded-none border-0 sm:border">
        {/* Header */}
        <DialogHeader className="p-3 sm:p-4 pb-2 sm:pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-semibold">
              {t('search.title', 'Search Everything')}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 sm:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Input */}
          <div className="relative mt-2 sm:mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-search-input
              placeholder={t('search.placeholder', 'Search contacts, orders, articles...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-12 text-sm sm:text-base"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Type Filters */}
          <ScrollArea className="w-full">
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 pb-2">
              {typeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={selectedType === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(filter.value)}
                  className="whitespace-nowrap text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">{t(filter.labelKey, filter.value)}</span>
                  <span className="sm:hidden">{t(filter.shortKey, filter.value)}</span>
                  <span className="ml-1">({counts[filter.value]})</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogHeader>

        {/* Results */}
        <ScrollArea className="flex-1 min-h-0 overflow-auto">
          <div className="p-2 sm:p-4 min-h-0">
            {loading && searchTerm.length >= 2 ? (
              <div className="text-center py-6 sm:py-8 px-4">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4 animate-spin" />
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                  {t('search.searching', 'Searching...')}
                </h3>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-6 sm:py-8 px-4">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm.length >= 2 
                    ? t('search.noResults', 'No results found') 
                    : t('search.startTyping', 'Start typing to search')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground px-2">
                  {searchTerm.length >= 2 
                    ? t('search.tryAdjusting', 'Try adjusting your search terms or filters')
                    : t('search.searchHint', 'Search across contacts, service orders, articles, and more')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredResults.map((result) => {
                  const IconComponent = getTypeIcon(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-3 sm:p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 text-left transition-colors"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5 sm:mt-1">
                          <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">{result.title}</h4>
                            <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                              {getTypeLabel(result.type)}
                            </Badge>
                            {result.status && (
                              <Badge className={`text-[10px] sm:text-xs shrink-0 ${getStatusColor(result.status)}`}>
                                {result.status}
                              </Badge>
                            )}
                          </div>
                          
                          {result.subtitle && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{result.subtitle}</p>
                          )}
                          
                          {result.description && (
                            <p className="text-[11px] sm:text-xs text-muted-foreground/80 line-clamp-2 mb-1 sm:mb-2 hidden sm:block">
                              {result.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                            {result.location && (
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span className="truncate">{result.location}</span>
                              </div>
                            )}
                            {result.date && (
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span>{result.date}</span>
                              </div>
                            )}
                            {result.cost && (
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span>{result.cost}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
