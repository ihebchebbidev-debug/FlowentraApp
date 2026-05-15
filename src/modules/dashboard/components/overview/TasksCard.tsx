import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/shared/components/Typography';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Task = { id: string; title: string; due?: string; assignee?: string };

interface CompletingTask {
  id: string;
  isStrikethrough: boolean;
  showCheck: boolean;
  isExiting: boolean;
}

export default function TasksCard({ tasks = [], onTaskComplete }: { tasks?: Task[]; onTaskComplete?: (taskId: string) => void }) {
  const { t } = useTranslation('dashboard');
  const [completingTasks, setCompletingTasks] = useState<Record<string, CompletingTask>>({});

  const handleCompleteTask = (taskId: string) => {
    // Initialize the completing state
    setCompletingTasks(prev => ({
      ...prev,
      [taskId]: { id: taskId, isStrikethrough: true, showCheck: false, isExiting: false }
    }));

    // Step 2: Show checkmark after strike-through (300ms)
    setTimeout(() => {
      setCompletingTasks(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], showCheck: true }
      }));
    }, 300);

    // Step 3: Start exit animation (600ms)
    setTimeout(() => {
      setCompletingTasks(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], isExiting: true }
      }));
    }, 600);

    // Step 4: Complete the task (900ms)
    setTimeout(() => {
      onTaskComplete?.(taskId);
      setCompletingTasks(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
    }, 900);
  };

  const getTaskState = (taskId: string): CompletingTask | undefined => {
    return completingTasks[taskId];
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-[var(--shadow-card)] bg-[image:var(--gradient-card)]">
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <Heading as="div" size="card">{t('tasksCard.title')}</Heading>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">{t('tasksCard.viewAll')}</Button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {tasks.length === 0 && <li><Text variant="muted">{t('tasksCard.noTasksToday')}</Text></li>}
          {tasks.map(task => {
            const state = getTaskState(task.id);
            const isCompleting = !!state;
            
            return (
              <li 
                key={task.id} 
                className={cn(
                  "flex items-start justify-between transition-all duration-300",
                  state?.isExiting && "translate-x-full opacity-0 scale-95"
                )}
              >
                <div className="min-w-0 flex-1">
                  <Text 
                    as="div" 
                    className={cn(
                      "font-medium truncate transition-all duration-300 text-[13px]",
                      state?.isStrikethrough && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </Text>
                  {task.due && (
                    <Text 
                      as="div" 
                      variant="muted-xs"
                      className={cn(
                        "transition-all duration-300 text-[11px]",
                        state?.isStrikethrough && "line-through opacity-50"
                      )}
                    >
                      {t('tasksCard.dueLabel')} {task.due}
                    </Text>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Circle checkbox with animation */}
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={isCompleting}
                    className={cn(
                      "relative h-5 w-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300 flex-shrink-0",
                      state?.showCheck 
                        ? "border-success bg-success" 
                        : "border-muted-foreground/25 hover:border-success hover:bg-success/10"
                    )}
                    aria-label={t('tasksCard.done')}
                  >
                    <Check 
                      className={cn(
                        "h-3 w-3 text-success-foreground transition-all duration-200",
                        state?.showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      )} 
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
