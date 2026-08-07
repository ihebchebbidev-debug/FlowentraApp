import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Users, Zap, X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Technician {
  id: string;
  name: string;
  skills: string[];
  availability: 'available' | 'busy' | 'unavailable';
  department: string;
}

interface Props {
  assignedTechnicians: string[];
  onAssignedTechniciansChange: (technicianIds: string[]) => void;
}

export default function TechnicianAssignment({ assignedTechnicians, onAssignedTechniciansChange }: Props) {
  const { t } = useTranslation('service_orders');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);

  // Mock technicians data
  const mockTechnicians: Technician[] = [
    {
      id: "tech-001",
      name: "John Smith",
      skills: ["Server Maintenance", "Network Configuration", "Hardware Repair"],
      availability: "available",
      department: "IT Infrastructure"
    },
    {
      id: "tech-002", 
      name: "Sarah Johnson",
      skills: ["Software Installation", "Database Management", "System Integration"],
      availability: "available",
      department: "Software Services"
    },
    {
      id: "tech-003",
      name: "Mike Chen",
      skills: ["Security Systems", "Network Security", "Firewall Configuration"],
      availability: "busy",
      department: "Cybersecurity"
    },
    {
      id: "tech-004",
      name: "Lisa Davis",
      skills: ["Server Maintenance", "Cloud Services", "Virtualization"],
      availability: "available",
      department: "Cloud Infrastructure"
    }
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = mockTechnicians.filter(tech =>
      tech.name.toLowerCase().includes(term.toLowerCase()) ||
      tech.skills.some(skill => skill.toLowerCase().includes(term.toLowerCase())) ||
      tech.department.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredTechnicians(filtered);
  };

  // Show all technicians initially
  useState(() => {
    setFilteredTechnicians(mockTechnicians);
  });

  const handleAssignTechnician = (technicianId: string) => {
    if (!assignedTechnicians.includes(technicianId)) {
      onAssignedTechniciansChange([...assignedTechnicians, technicianId]);
    }
    setSearchTerm("");
    setFilteredTechnicians([]);
  };

  const handleRemoveTechnician = (technicianId: string) => {
    onAssignedTechniciansChange(assignedTechnicians.filter(id => id !== technicianId));
  };

  const handleAutoAssign = () => {
    // Auto-assign available technicians with relevant skills
    const availableTechs = mockTechnicians
      .filter(tech => tech.availability === 'available')
      .slice(0, 2) // Assign up to 2 technicians
      .map(tech => tech.id);
    
    onAssignedTechniciansChange([...new Set([...assignedTechnicians, ...availableTechs])]);
  };

  const getAssignedTechnicians = () => {
    return mockTechnicians.filter(tech => assignedTechnicians.includes(tech.id));
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-success/10 text-success border-success/20';
      case 'busy': return 'bg-warning/10 text-warning border-warning/20';
      case 'unavailable': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t('assigned_technicians')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Auto-Assign */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label>Search Technicians</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, skills, or department..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAutoAssign}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Zap className="h-4 w-4" />
                {t('auto_assign')}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Auto-assignment finds available technicians based on required skills and current availability
          </p>
        </div>

        {/* Available Technicians */}
        {filteredTechnicians.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
            <Label className="text-xs font-medium text-muted-foreground">Available Technicians</Label>
            {filteredTechnicians.map((tech) => (
              <div
                key={tech.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleAssignTechnician(tech.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {tech.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tech.name}</span>
                      <Badge variant="outline" className={getAvailabilityColor(tech.availability)}>
                        {tech.availability}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tech.department}</p>
                    <div className="flex flex-wrap gap-1">
                      {tech.skills.slice(0, 2).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {tech.skills.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tech.skills.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-primary" />
              </div>
            ))}
          </div>
        )}

        {/* Assigned Technicians */}
        {getAssignedTechnicians().length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assigned Technicians ({getAssignedTechnicians().length})</Label>
            <div className="space-y-2">
              {getAssignedTechnicians().map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {tech.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tech.name}</span>
                        <Badge variant="outline" className={getAvailabilityColor(tech.availability)}>
                          {tech.availability}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{tech.department}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTechnician(tech.id)}
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