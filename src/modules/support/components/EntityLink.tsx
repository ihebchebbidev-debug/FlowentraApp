import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  CheckSquare, 
  FileText, 
  Briefcase, 
  Truck, 
  Package, 
  Building2,
  ExternalLink,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  ParsedEntity, 
  EntityType, 
  getEntityRoute, 
  getEntityColor 
} from '../utils/entityLinkParser';

interface EntityLinkProps {
  entity: ParsedEntity;
  className?: string;
}

const entityIcons: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  contact: User,
  task: CheckSquare,
  offer: FileText,
  job: Briefcase,
  dispatch: Truck,
  article: Package,
  installation: Building2,
};

const entityLabels: Record<EntityType, string> = {
  contact: 'Contact',
  task: 'Task',
  offer: 'Offer',
  job: 'Job',
  dispatch: 'Dispatch',
  article: 'Article',
  installation: 'Installation',
};

export function EntityLink({ entity, className }: EntityLinkProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = entityIcons[entity.type] || ExternalLink;
  const colorClass = getEntityColor(entity.type);
  const route = getEntityRoute(entity.type, entity.id);
  const label = entityLabels[entity.type];
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(route);
  };
  
  const handleView = () => {
    navigate(route);
  };
  
  const handleEdit = () => {
    navigate(`${route}?edit=true`);
  };
  
  const handleOpenNewTab = () => {
    window.open(route, '_blank');
  };
  
  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-sm font-medium',
                  'transition-all duration-150 cursor-pointer',
                  'border border-transparent hover:border-current/20',
                  colorClass,
                  className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[150px]">{entity.name}</span>
                {isHovered && (
                  <MoreHorizontal className="h-3 w-3 flex-shrink-0 opacity-60" />
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{label}: {entity.name}</p>
            <p className="text-muted-foreground">ID: {entity.id}</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="h-4 w-4 mr-2" />
            View {label}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit {label}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
