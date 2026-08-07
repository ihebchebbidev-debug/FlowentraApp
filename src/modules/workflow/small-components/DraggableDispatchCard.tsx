import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Clock, 
  User, 
  MoreHorizontal,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import { WorkflowDispatch } from "../types";

interface DraggableDispatchCardProps {
  dispatch: WorkflowDispatch;
  onEdit: (id: string) => void;
  onAssign: (id: string) => void;
  className?: string;
}

export function DraggableDispatchCard({
  dispatch,
  onEdit,
  onAssign,
  className
}: DraggableDispatchCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dispatch.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = (priority: WorkflowDispatch['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-3 shadow-lg' : ''
      } ${className || ''}`}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2 flex-1">
              {dispatch.title}
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(dispatch.id);
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>

          {/* Description */}
          {dispatch.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {dispatch.description}
            </p>
          )}

          {/* Priority and Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${getPriorityColor(dispatch.priority)}`}>
              {dispatch.priority}
            </Badge>
            {dispatch.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{dispatch.location.address}</span>
          </div>

          {/* Time information */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(dispatch.estimatedDuration)}</span>
            </div>
            {dispatch.startAt && dispatch.endAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatTime(dispatch.startAt)} - {formatTime(dispatch.endAt)}</span>
              </div>
            )}
          </div>

          {/* Technician */}
          <div className="flex items-center justify-between">
            {dispatch.assignedTechnician ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={dispatch.assignedTechnician.avatar} />
                  <AvatarFallback className="text-xs">
                    {dispatch.assignedTechnician.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {dispatch.assignedTechnician.name}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  dispatch.assignedTechnician.status === 'available' ? 'bg-success' :
                  dispatch.assignedTechnician.status === 'busy' ? 'bg-warning' : 'bg-destructive'
                }`} />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(dispatch.id);
                }}
              >
                <User className="h-3 w-3 mr-1" />
                Assigner
              </Button>
            )}

            {/* Status indicator */}
            {dispatch.priority === 'urgent' && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}