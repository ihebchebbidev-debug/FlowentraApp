import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';

interface ColumnData {
  title: string;
  count: number;
  color: string;
  description?: string;
}

interface TaskColumnProps {
  data: ColumnData;
}

const getTagClasses = (color: string) => {
  const map: Record<string, string> = {
    'bg-slate-500': 'bg-slate-100 text-slate-700 border-slate-200',
    'bg-primary': 'bg-primary/15 text-primary border-primary/25',
    'bg-warning': 'bg-warning/15 text-warning border-warning/25',
    'bg-success': 'bg-success/15 text-success border-success/25',
    'bg-destructive': 'bg-destructive/15 text-destructive border-destructive/25',
    'bg-blue-500': 'bg-blue-100 text-blue-700 border-blue-200',
    'bg-orange-500': 'bg-orange-100 text-orange-700 border-orange-200',
    'bg-purple-500': 'bg-purple-100 text-purple-700 border-purple-200',
    'bg-green-500': 'bg-green-100 text-green-700 border-green-200',
  };
  return map[color] || 'bg-muted text-muted-foreground border-border';
};

const TaskColumn = memo(({ data }: TaskColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-[200px]">
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className="h-full min-h-[600px] bg-background flex flex-col">
        {/* Header — Twenty style */}
        <div
          className="flex items-center justify-between px-2 py-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Badge
              variant="outline"
              className={`text-[11px] font-medium px-2 py-0.5 rounded-sm shrink-0 ${getTagClasses(data.color)}`}
            >
              {data.title}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-normal">
              {data.count}
            </span>
          </div>

          <div className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Cards container — clean, no dashed borders */}
        <div className="flex-1 flex flex-col gap-2 px-2 pb-2">
          {/* Task cards will be positioned here by React Flow */}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
});

TaskColumn.displayName = 'TaskColumn';

export default TaskColumn;
