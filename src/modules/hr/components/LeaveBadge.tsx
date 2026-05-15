import { Badge } from '@/components/ui/badge';
import { CalendarOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useActiveLeaves } from '../hooks/useActiveLeaves';

/**
 * Drop-in badge for use in Planning / Tasks / Calendar UIs.
 * Renders nothing if the user is not on leave for the given date.
 *
 *   <LeaveBadge userId={user.id} date={selectedDate} />
 */
export function LeaveBadge({ userId, date, className }: { userId: number; date?: Date | string; className?: string }) {
  const { t } = useTranslation('hr');
  const { isUserOnLeave, leaveOf } = useActiveLeaves(date);
  if (!isUserOnLeave(userId)) return null;
  const leave = leaveOf(userId);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className={`gap-1 ${className ?? ''}`}>
            <CalendarOff className="h-3 w-3" />
            {t('planning.onLeave', 'On leave')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">{t(`leaveType.${leave?.leaveType}`, { defaultValue: leave?.leaveType ?? '' })}</div>
            <div className="text-muted-foreground">{leave?.startDate?.slice(0, 10)} → {leave?.endDate?.slice(0, 10)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Confirmation guard: returns true if it's OK to assign a task to `userId`
 * on `date`, false if they're on leave AND the user cancels the warning.
 * Use inline before assigning: `if (!await guardLeaveAssignment(...)) return;`
 * (Caller is responsible for prompting; this returns a small reason object.)
 */
export function checkLeaveAssignment(
  userId: number,
  leaves: Array<{ userId: number; startDate: string; endDate: string; leaveType: string }>,
  date: Date | string,
): { onLeave: boolean; reason?: string } {
  const d = typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 10);
  const match = leaves.find(l => l.userId === userId && l.startDate.slice(0, 10) <= d && l.endDate.slice(0, 10) >= d);
  if (!match) return { onLeave: false };
  return { onLeave: true, reason: `${match.leaveType} (${match.startDate.slice(0, 10)} → ${match.endDate.slice(0, 10)})` };
}