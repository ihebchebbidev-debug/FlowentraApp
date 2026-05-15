import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Settings, Calendar, MapPin, X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Installation {
  id: string;
  title: string;
  location: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: string;
  estimatedDuration: string;
}

interface Props {
  assignedInstallations: string[];
  onAssignedInstallationsChange: (installationIds: string[]) => void;
}

export default function InstallationAssignment({ assignedInstallations, onAssignedInstallationsChange }: Props) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInstallations, setFilteredInstallations] = useState<Installation[]>([]);

  // Mock installations data
  const mockInstallations: Installation[] = [
    {
      id: "inst-001",
      title: "Server Rack Installation",
      location: "Building A - Server Room",
      scheduledDate: "2024-01-25T10:00:00.000Z",
      status: "scheduled",
      type: "Hardware Installation",
      estimatedDuration: "4 hours"
    },
    {
      id: "inst-002",
      title: "Network Equipment Setup",
      location: "Building B - IT Room",
      scheduledDate: "2024-01-26T14:00:00.000Z",
      status: "scheduled",
      type: "Network Installation",
      estimatedDuration: "6 hours"
    },
    {
      id: "inst-003",
      title: "Security Camera System",
      location: "Main Entrance - Lobby",
      scheduledDate: "2024-01-27T09:00:00.000Z",
      status: "in-progress",
      type: "Security Installation",
      estimatedDuration: "8 hours"
    },
    {
      id: "inst-004",
      title: "Cloud Server Migration",
      location: "Remote - Data Center",
      scheduledDate: "2024-01-28T08:00:00.000Z",
      status: "scheduled",
      type: "Software Installation",
      estimatedDuration: "12 hours"
    }
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = mockInstallations.filter(installation =>
      installation.title.toLowerCase().includes(term.toLowerCase()) ||
      installation.location.toLowerCase().includes(term.toLowerCase()) ||
      installation.type.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredInstallations(filtered);
  };

  // Show all installations initially
  useState(() => {
    setFilteredInstallations(mockInstallations);
  });

  const handleAssignInstallation = (installationId: string) => {
    if (!assignedInstallations.includes(installationId)) {
      onAssignedInstallationsChange([...assignedInstallations, installationId]);
    }
    setSearchTerm("");
    setFilteredInstallations([]);
  };

  const handleRemoveInstallation = (installationId: string) => {
    onAssignedInstallationsChange(assignedInstallations.filter(id => id !== installationId));
  };

  const getAssignedInstallations = () => {
    return mockInstallations.filter(installation => assignedInstallations.includes(installation.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-primary/10 text-primary border-primary/20';
      case 'in-progress': return 'bg-warning/10 text-warning border-warning/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Installation Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Link Related Installations</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search installations by title, location, or type..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Link existing installations that are related to this service order for better coordination
          </p>
        </div>

        {/* Search Results */}
        {filteredInstallations.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
            <Label className="text-xs font-medium text-muted-foreground">Available Installations</Label>
            {filteredInstallations.map((installation) => (
              <div
                key={installation.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleAssignInstallation(installation.id)}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{installation.title}</span>
                    <Badge variant="outline" className={getStatusColor(installation.status)}>
                      {installation.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {installation.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(installation.scheduledDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit">
                    {installation.type}
                  </Badge>
                </div>
                <Plus className="h-4 w-4 text-primary" />
              </div>
            ))}
          </div>
        )}

        {/* Assigned Installations */}
        {getAssignedInstallations().length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Linked Installations ({getAssignedInstallations().length})</Label>
            <div className="space-y-2">
              {getAssignedInstallations().map((installation) => (
                <div
                  key={installation.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{installation.title}</span>
                      <Badge variant="outline" className={getStatusColor(installation.status)}>
                        {installation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {installation.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(installation.scheduledDate), "MMM dd, yyyy")}
                      </span>
                      <span>Duration: {installation.estimatedDuration}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInstallation(installation.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}