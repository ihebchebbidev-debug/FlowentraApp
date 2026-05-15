import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, AlertCircle } from 'lucide-react';

interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
  labels?: string[];
  estimatedHours?: number;
}

interface TaskCardProps {
  data: TaskData;
}

const TaskCard = memo(({ data }: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="w-[200px]">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="bg-card border border-border rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3 space-y-2.5">
        {/* Priority + labels row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm ${getPriorityColor(data.priority)}`}>
            {data.priority}
          </Badge>
          {data.labels?.slice(0, 1).map((label, index) => (
            <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm">
              {label}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h3 className="font-medium text-[13px] text-foreground leading-snug line-clamp-2">
          {data.title}
        </h3>

        {/* Description — compact */}
        {data.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Footer: date + assignee */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{typeof data.dueDate === 'object' && data.dueDate ? (data.dueDate as any).toLocaleDateString() : (data.dueDate || '')}</span>
            </div>
            {data.estimatedHours && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>{data.estimatedHours}h</span>
              </div>
            )}
          </div>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {getInitials(data.assignee)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
