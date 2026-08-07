import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/shared/components/Typography';
import { QuickTaskModal } from '@/modules/tasks/components/QuickTaskModal';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { buildStatusColumns } from '@/modules/tasks/utils/columns';
import { useNavigate } from 'react-router-dom';

export default function TodayTodoCard({ task }: { task?: { id: string; title: string } }) {
  const { t } = useTranslation('dashboard');
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const navigate = useNavigate();
  const { taskStatuses } = useLookups();

  const columns = buildStatusColumns(taskStatuses || []);

  const handleCreate = () => setIsQuickOpen(true);

  return (
    <>
      <Card className="flex flex-col h-full min-h-[285px] justify-between border-0 shadow-[var(--shadow-card)] bg-[image:var(--gradient-card)]">
        <CardHeader>
          <Heading as={CardTitle as any} size="card">{t('todayTodo.title')}</Heading>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-center items-center">
          {task ? (
            <>
              <Text as="div" variant="body" className="mb-2">{t('todayTodo.hasTask')}</Text>
              <Text as="div" variant="metric-sm" className="mb-4">{task.title}</Text>
              <Button variant="secondary" disabled>{t('todayTodo.taskCreated')}</Button>
            </>
          ) : (
            <>
              <Text as="div" variant="body" className="mb-4">{t('todayTodo.noTodo')}</Text>
              <Button variant="outline" onClick={handleCreate}>{t('todayTodo.createTodo')}</Button>
            </>
          )}
        </CardContent>
      </Card>

      <QuickTaskModal
        isOpen={isQuickOpen}
        onClose={() => setIsQuickOpen(false)}
        onCreateTask={(newTask: any) => navigate('/dashboard/tasks/daily', { state: { newTask } })}
        technicians={[]}
        columns={columns}
        projects={[]}
      />
    </>
  );
}

