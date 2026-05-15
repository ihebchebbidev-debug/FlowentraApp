import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Clock, Calendar, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUniversalStatusColorClass } from "@/config/entity-statuses";

interface CompactCardAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

interface CompactCardBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

interface CompactCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  actions?: CompactCardAction[];
  badges?: CompactCardBadge[];
  avatar?: string;
  onClick?: () => void;
  className?: string;
  timestamp?: Date;
  assignee?: string;
}

export function CompactCard({
  title,
  subtitle,
  status,
  actions = [],
  badges = [],
  avatar,
  onClick,
  className,
  timestamp,
  assignee
}: CompactCardProps) {
  // Derive status color from centralized config (no hardcoded switch needed)
  const getStatusColor = (status: string) => getUniversalStatusColorClass(status);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer group hover-lift ${className || ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {avatar && (
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {title.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground line-clamp-1">{title}</h4>
                {subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
                )}
              </div>
              
              {/* Status and badges */}
              {(status || badges.length > 0) && (
                <div className="flex gap-1 flex-wrap">
                  {status && (
                    <Badge className={`text-xs border ${getStatusColor(status)}`}>
                      {status}
                    </Badge>
                  )}
                  {badges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant || 'secondary'} className="text-xs">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Meta information */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {assignee && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate">{assignee}</span>
                  </div>
                )}
                {timestamp && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(timestamp)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {actions.length > 0 && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {actions.slice(0, 2).map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className="h-7 text-xs px-2"
                >
                  {action.label}
                </Button>
              ))}
              {actions.length > 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 w-7 p-0"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.slice(2).map((action, index) => (
                      <DropdownMenuItem 
                        key={index} 
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}