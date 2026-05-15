import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TableLayout from '@/components/shared/TableLayout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { 
  Package, Filter, MapPin, Calendar, 
  Trash2, Eye, MoreVertical, Star,
  List, Table as TableIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// inventory statuses mock
import inventoryStatuses from "@/data/mock/inventory-statuses.json";

// Use unified articles service
import { ArticlesService, type InventoryArticle } from "@/modules/articles/services/articles.service";

interface InventoryItem {
  id: number | string;
  name: string;
  category: string;
  status: "Available" | "In Use" | "Maintenance" | "Out of Stock" | string;
  location: string;
  serialNumber: string;
  quantity: number;
  lastMaintenance?: string;
  assignedTo?: string;
  tags?: string[];
  favorite?: boolean;
}

// Convert ArticlesService data to field inventory format
const convertArticleToFieldInventory = (article: InventoryArticle): InventoryItem => ({
  id: article.id,
  name: article.name,
  category: article.category,
  status: article.status === 'available' ? 'Available' : 
          article.status === 'low_stock' ? 'In Use' : 
          article.status === 'out_of_stock' ? 'Out of Stock' : 'Available',
  location: article.location || 'Warehouse A',
  serialNumber: article.sku || `SN-${article.id}`,
  quantity: article.stock || 0,
  lastMaintenance: article.lastUsed,
  assignedTo: article.lastUsedBy,
  tags: [article.category],
  favorite: false
});

export default function InventoryList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [query, setQuery] = useState("");
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    document.title = "Field Inventory — Assets";
  }, []);

  const handleItemClick = (item: InventoryItem) => {
    navigate(`/dashboard/field/inventory/${item.id}`);
  };

  const allArticles = ArticlesService.list();
  const inventoryItems: InventoryItem[] = allArticles.map(convertArticleToFieldInventory);
  const categories = Array.from(new Set(inventoryItems.map(i => i.category))).filter(Boolean);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return inventoryItems.filter(item => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (!q) return true;
      return [item.name, item.category, item.location, item.serialNumber].some(v => v?.toLowerCase().includes(q));
    });
  }, [inventoryItems, query, filterStatus, filterCategory]);

  const _getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'status-success';
      case 'In Use': return 'status-info';
      case 'Maintenance': return 'status-warning';
      case 'Out of Stock': return 'status-destructive';
      default: return 'status-info';
    }
  };

  return (
  <div className="flex flex-col text-[0.95rem]">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('inventory_field:title', 'Field Articles')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('inventory_field:subtitle', 'Manage inventory & assets on the field')}</p>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="md:hidden flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t('inventory_field:title', 'Field Articles')}</h1>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <section className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <CollapsibleSearch 
              placeholder={t('inventory_field:search_placeholder', 'Search inventory...')}
              value={query}
              onChange={setQuery}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 px-2 sm:px-3"
              onClick={() => setShowFilterBar(v => !v)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('inventory_field:filters', 'Filters')}</span>
              {(filterStatus !== 'all' || filterCategory !== 'all') && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">{(filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0)}</Badge>
              )}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <List className="h-4 w-4" />
              <span>{t('inventory_field:list', 'List')}</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <TableIcon className="h-4 w-4" />
              <span>{t('inventory_field:table', 'Table')}</span>
            </Button>
          </div>
        </div>
      </section>

      {showFilterBar && (
        <section className="p-3 sm:p-4 border-b border-border bg-background/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('inventory_field:filter_status', 'Status')}</label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm"
                >
                  <option value="all">{t('inventory_field:all', 'All')}</option>
                  {inventoryStatuses
                    .filter((s: any) => s.id !== 'All')
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('inventory_field:filter_category', 'Category')}</label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm"
                >
                  <option value="all">All</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setFilterStatus('all'); setFilterCategory('all'); }}>
                {t('inventory_field:clear_filters', 'Clear')}
              </Button>
              <div className="sm:ml-auto text-sm text-muted-foreground">{filtered.length} {t('inventory_field:items', 'items')}</div>
            </div>
          </div>
        </section>
      )}

      {/* List/Table View */}
      {viewMode === 'list' ? (
        <section className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filtered.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                            <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-foreground text-sm sm:text-base break-words line-clamp-2">{item.name}</h3>
                              {item.favorite && <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning fill-warning flex-shrink-0" />}
                            </div>
                            <Badge className={`${getStatusColor(item.status)} text-xs`}>{item.status}</Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                            <span className="truncate">{item.category} • Qty: {item.quantity}</span>
                            <span className="text-xs">#{item.serialNumber}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Last maintenance: {item.lastMaintenance}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                        <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                          {item.tags.slice(0, 1).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 1 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              +{item.tags.length - 1}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleItemClick(item)}
                            >
                              <Eye className="h-4 w-4" />
                              {t('inventory_field:view_details', 'View Details')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              {t('inventory_field:delete', 'Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-0">
              <TableLayout
                items={filtered}
                rowKey={(i: any) => i.id}
                onRowClick={handleItemClick}
                columns={[
                  {
                    key: 'item',
                    title: 'Item',
                    width: 'w-[200px]',
                    render: (item: any) => (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="text-sm bg-primary/10 text-primary">
                            <Package className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-foreground break-words line-clamp-2">{item.name}</p>
                            {item.favorite && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.assignedTo || 'Unassigned'}</p>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'category',
                    title: 'Category & Qty',
                    render: (item: any) => (
                      <div>
                        <p className="text-foreground">{item.category}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    )
                  },
                  {
                    key: 'location',
                    title: 'Location',
                    render: (item: any) => (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    render: (item: any) => <Badge className={`${getStatusColor(item.status)} text-xs`}>{item.status}</Badge>
                  },
                  {
                    key: 'serial',
                    title: 'Serial Number',
                    render: (item: any) => <span className="text-sm font-mono">{item.serialNumber}</span>
                  },
                  {
                    key: 'lastMaintenance',
                    title: 'Last Maintenance',
                    render: (item: any) => (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{item.lastMaintenance}</span>
                      </div>
                    )
                  },
                  {
                    key: 'tags',
                    title: 'Tags',
                    render: (item: any) => (
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.slice(0, 2).map((tag: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                        ))}
                        {item.tags.length > 2 && <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{item.tags.length - 2}</Badge>}
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    title: '',
                    width: 'w-[50px]',
                    render: (item: any) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e:any) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={(e:any) => { e.stopPropagation(); handleItemClick(item); }}>
                            <Eye className="h-4 w-4" />
                            {t('inventory_field:view_details', 'View Details')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={(e:any) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                            {t('inventory_field:delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}