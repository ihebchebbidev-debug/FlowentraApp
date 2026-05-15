import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, Search, Filter, Mail, Phone, Building2, 
  Edit, Trash2, Eye, MoreVertical, Calendar, Star,
  List, Table as TableIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import mock data from JSON file
import fieldCustomersData from "@/data/mock/fieldCustomers.json";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "Customer" | "Lead" | "Prospect";
  type: "individual" | "company";
  keyUsers?: string[];
  tags: string[];
  lastContact: string;
  favorite?: boolean;
}

export default function ClientsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterType, setFilterType] = useState<'all' | string>('all');

  useEffect(() => {
    document.title = "Field Customers — Clients";
  }, []);

  const handleClientClick = (client: Client) => {
    navigate(`/dashboard/field/customers/${client.id}`);
  };

  const clients: Client[] = fieldCustomersData as Client[];

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = query === '' || [c.name, c.email, c.phone, c.company].some(v => v?.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchesType = filterType === 'all' || c.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [clients, query, filterStatus, filterType]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Customer': return 'status-success';
      case 'Lead': return 'status-warning';
      case 'Prospect': return 'status-info';
      default: return 'status-info';
    }
  };

  return (
    <div className="flex flex-col">
      <header className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-border bg-background/95 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shadow-soft">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">{t('field_customers:title', 'Field Customers')}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{t('field_customers:subtitle', 'Manage customers on the field — clients and to-dos')}</p>
          </div>
        </div>
      </header>

      {/* Search and Controls */}
      <section className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full sm:max-w-md">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('field_customers:search_placeholder', 'Search clients...')}
                className="pl-10 h-9 sm:h-10 border-border bg-background text-sm"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('field_customers:filters', 'Filters')}</span>
                  {(filterStatus !== 'all' || filterType !== 'all') && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                      {[filterStatus !== 'all' ? 1 : 0, filterType !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  All Statuses {filterStatus === 'all' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Customer')}>
                  Customer {filterStatus === 'Customer' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Lead')}>
                  Lead {filterStatus === 'Lead' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Prospect')}>
                  Prospect {filterStatus === 'Prospect' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  All Types {filterType === 'all' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('individual')}>
                  Individual {filterType === 'individual' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('company')}>
                  Company {filterType === 'company' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <List className="h-4 w-4" />
              <span>{t('field_customers:list', 'List')}</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <TableIcon className="h-4 w-4" />
              <span>{t('field_customers:table', 'Table')}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* List/Table View */}
      {viewMode === 'list' ? (
        <section className="p-3 sm:p-4 lg:p-6">
          <Card className="shadow-card border-0 bg-card">
            
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filtered.map((client) => (
                  <div 
                    key={client.id} 
                    className="p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors group cursor-pointer"
                    onClick={() => handleClientClick(client)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                            {client.type === 'company' ? <Building2 className="h-4 w-4 sm:h-6 sm:w-6" /> : getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground text-sm sm:text-base break-words line-clamp-2">{client.name}</h3>
                              {client.favorite && <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning fill-warning flex-shrink-0" />}
                            </div>
                            <Badge className={`${getStatusColor(client.status)} text-xs`}>{client.status}</Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                            <span className="break-words line-clamp-1">{client.type === 'company' ? client.company : client.name}</span>
                            {client.type === 'company' && client.keyUsers && (
                              <span className="text-xs">
                                {client.keyUsers.length} key users
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{client.phone}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Last: {client.lastContact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 mt-2 sm:mt-0">
                        <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
                          {client.tags.slice(0, 1).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                          {client.tags.length > 1 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              +{client.tags.length - 1}
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
                              onClick={() => handleClientClick(client)}
                            >
                              <Eye className="h-4 w-4" />
                              {t('field_customers:view_details', 'View Details')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Edit className="h-4 w-4" />
                              {t('field_customers:edit', 'Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              {t('field_customers:delete', 'Delete')}
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{t('field_customers:all_clients', 'All Clients')}</CardTitle>
              <CardDescription>
                {t('field_customers:clients_count', { defaultValue: '{{count}} clients in your database', count: filtered.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Client</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((client) => (
                      <TableRow 
                        key={client.id} 
                        className="cursor-pointer hover:bg-muted/50 group"
                        onClick={() => handleClientClick(client)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback className="text-sm bg-primary/10 text-primary">
                                {client.type === 'company' ? <Building2 className="h-5 w-5" /> : getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground break-words line-clamp-2">{client.name}</p>
                                {client.favorite && <Star className="h-4 w-4 text-warning fill-warning flex-shrink-0" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{client.type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <p className="font-medium text-foreground">{client.company}</p>
                            {client.type === 'company' && client.keyUsers && (
                              <p className="text-sm text-muted-foreground">{client.keyUsers.length} key users</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{client.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${getStatusColor(client.status)} text-xs`}>
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex gap-1 flex-wrap">
                            {client.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                            {client.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                +{client.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{client.lastContact}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClientClick(client);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                {t('field_customers:view_details', 'View Details')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="h-4 w-4" />
                                {t('field_customers:edit', 'Edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2 text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t('field_customers:delete', 'Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
