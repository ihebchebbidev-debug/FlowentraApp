import { useState } from "react";
import { getStatusColorClass } from "@/config/entity-statuses";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { 
  Plus, Eye, Clock, 
  Truck, AlertTriangle, CheckCircle, Calendar,
  User, MapPin, Filter, ChevronDown, Circle, X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ServiceOrderDispatch } from "../entities/dispatches/types";

interface DispatchesTableProps {
  dispatches: ServiceOrderDispatch[];
  onDispatchUpdate?: () => void;
}

export function DispatchesTable({ dispatches, onDispatchUpdate }: DispatchesTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTechnician, setFilterTechnician] = useState('all');

  // Filter the dispatches based on current filters and search term
  const filteredDispatches = dispatches.filter(dispatch => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const techNames = getTechnicianNames(dispatch.assignedTechnicians).toLowerCase();
      const matchesSearch = 
        dispatch.dispatchNumber.toLowerCase().includes(searchLower) ||
        dispatch.id.toLowerCase().includes(searchLower) ||
        techNames.includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && dispatch.status !== filterStatus) return false;
    if (filterPriority !== 'all' && dispatch.priority !== filterPriority) return false;
    if (filterTechnician !== 'all' && !dispatch.assignedTechnicians.includes(filterTechnician)) return false;
    return true;
  });

  // Count active filters
  const activeFiltersCount = [
    filterStatus !== 'all' ? 1 : 0,
    filterPriority !== 'all' ? 1 : 0,
    filterTechnician !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const getStatusColor = (status: ServiceOrderDispatch['status']) => {
    return getStatusColorClass('dispatch', status);
  };

  const getPriorityColor = (priority: ServiceOrderDispatch['priority']) => {
    switch (priority) {
      case 'urgent':
        return "bg-destructive/10 text-destructive border-destructive/20 transition-colors";
      case 'high':
        return "bg-warning/10 text-warning border-warning/20 transition-colors";
      case 'medium':
        return "bg-primary/10 text-primary border-primary/20 transition-colors";
      case 'low':
        return "bg-success/10 text-success border-success/20 transition-colors";
      default:
        return "bg-muted/50 text-muted-foreground border-muted transition-colors";
    }
  };

  const getStatusIcon = (status: ServiceOrderDispatch['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'in_progress':
        return <Clock className="h-3 w-3" />;
      case 'on_site':
        return <MapPin className="h-3 w-3" />;
      case 'en_route':
        return <Truck className="h-3 w-3" />;
      case 'assigned':
        return <User className="h-3 w-3" />;
      case 'cancelled':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getTechnicianNames = (technicians: string[]) => {
    // The assignedTechnicians array now contains actual names from the backend
    // Filter out any "Unassigned" entries and join the names
    const validNames = technicians.filter(name => name && name !== 'Unassigned');
    return validNames.length > 0 ? validNames.join(', ') : '';
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between mb-4 mt-6">
        <div className="flex-1">
          <CollapsibleSearch 
            placeholder="Search dispatches..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 px-3 z-20" 
            onClick={() => setShowFilterBar(s => !s)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="border-border bg-background hover:bg-muted"
            onClick={() => window.location.href = '/dashboard/dispatcher/manage-scheduler'}
          >
            <Calendar className="mr-2 h-4 w-4" />
            View Schedules
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilterBar && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="on_site">On Site</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Technician</label>
              <Select value={filterTechnician} onValueChange={setFilterTechnician}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Technicians" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">All Technicians</SelectItem>
                  <SelectItem value="tech-001">Alex Johnson</SelectItem>
                  <SelectItem value="tech-002">Sarah Wilson</SelectItem>
                  <SelectItem value="tech-003">Mike Chen</SelectItem>
                  <SelectItem value="tech-004">Emma Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterStatus !== 'all' || filterPriority !== 'all' || filterTechnician !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { 
                  setSearchTerm('');
                  setFilterStatus('all'); 
                  setFilterPriority('all'); 
                  setFilterTechnician('all'); 
                  setShowFilterBar(false); 
                }}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
      
      {filteredDispatches.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {dispatches.length === 0 ? "No dispatches scheduled yet" : "No dispatches match the current filters"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dispatch</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Technician</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Schedule</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDispatches.map((dispatch) => (
                <tr 
                  key={dispatch.id} 
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/field/dispatcher/job/${dispatch.id.replace('dispatch-', '')}`)}
                >
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{dispatch.dispatchNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Dispatch #{dispatch.id.slice(-4)}
                      </div>
                    </div>
                  </td>
                   <td className="px-4 py-3">
                     <Badge variant="secondary" className={getStatusColor(dispatch.status)}>
                       <div className="flex items-center gap-1.5">
                         {getStatusIcon(dispatch.status)}
                         <span className="capitalize font-medium">{dispatch.status.replace('_', ' ')}</span>
                       </div>
                     </Badge>
                   </td>
                   <td className="px-4 py-3">
                     <Badge variant="secondary" className={getPriorityColor(dispatch.priority)}>
                       <span className="capitalize font-medium">{dispatch.priority}</span>
                     </Badge>
                   </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getTechnicianNames(dispatch.assignedTechnicians).split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{getTechnicianNames(dispatch.assignedTechnicians) || 'Unassigned'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {dispatch.scheduledDate ? (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(dispatch.scheduledDate, 'MMM dd')}
                        </div>
                        {dispatch.scheduledStartTime && (
                          <div className="text-xs text-muted-foreground">
                            {dispatch.scheduledStartTime} - {dispatch.scheduledEndTime}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/field/dispatcher/job/${dispatch.id.replace('dispatch-', '')}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}