import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateContactProjectModal } from "./CreateContactProjectModal";
import { 
  PlusCircle, 
  Calendar, 
  Users, 
  MoreHorizontal,
  FolderOpen
} from "lucide-react";
import { Project } from "@/modules/tasks/types";
import projectsData from "@/data/mock/projects.json";

interface ContactProjectsManagerProps {
  contactId: string;
  contactName: string;
}

export function ContactProjectsManager({ contactId, contactName }: ContactProjectsManagerProps) {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter projects for this contact
  const contactProjects = projectsData
    .filter(project => project.contactId === contactId)
    .map(project => ({
      ...project,
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      columns: project.columns.map(col => ({
        ...col,
        createdAt: new Date(col.createdAt)
      }))
    })) as Project[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'on-hold': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-primary/10 text-primary';
      case 'sales': return 'bg-success/10 text-success';
      case 'internal': return 'bg-secondary text-secondary-foreground';
      case 'custom': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'active': return <Clock className="h-4 w-4" />;
  //     case 'completed': return <CheckCircle className="h-4 w-4" />;
  //     case 'on-hold': return <AlertCircle className="h-4 w-4" />;
  //     case 'cancelled': return <AlertCircle className="h-4 w-4" />;
  //     default: return <FolderOpen className="h-4 w-4" />;
  //   }
  // };

  const calculateProgress = (project: Project) => {
    // Mock calculation - in real app, calculate based on completed tasks
    const progressMap = {
      'active': Math.floor(Math.random() * 70) + 20, // 20-90%
      'completed': 100,
      'on-hold': Math.floor(Math.random() * 50) + 10, // 10-60%
      'cancelled': Math.floor(Math.random() * 30) + 5, // 5-35%
    };
    return progressMap[project.status as keyof typeof progressMap] || 0;
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to the new project detail route
    navigate(`/dashboard/tasks/projects/${project.id}`);
  };

  const handleCreateProject = (projectData: Partial<Project>) => {
    console.log('Creating project for contact:', contactId, projectData);
    // In real app, this would create the project and refresh the list
  };

  if (contactProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Projects</h2>
            <p className="text-muted-foreground">
              Manage projects for {contactName}
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Projects Yet
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first project to start organizing tasks and tracking progress for {contactName}.
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>

        <CreateContactProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProject}
          contactId={contactId}
          contactName={contactName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground">
            {contactProjects.length} project{contactProjects.length !== 1 ? 's' : ''} for {contactName}
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="space-y-3">
        {contactProjects.map((project) => {
          const progress = calculateProgress(project);
          const formattedStartDate = project.startDate 
            ? new Date(project.startDate).toLocaleDateString()
            : 'Not set';
          // const formattedEndDate = project.endDate 
          //   ? new Date(project.endDate).toLocaleDateString()
          //   : 'Not set';

          return (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground truncate hover:text-primary">
                        {project.name}
                      </h3>
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {project.status}
                      </Badge>
                      <Badge className={getTypeColor(project.type)} variant="outline">
                        {project.type}
                      </Badge>
                    </div>
                    
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {project.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formattedStartDate}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.teamMembers.length} members</span>
                      </div>
                      
                      {progress > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project);
                      }}
                      className="text-primary z-10 relative"
                    >
                      Open
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="z-10 relative"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateContactProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
        contactId={contactId}
        contactName={contactName}
      />
    </div>
  );
}