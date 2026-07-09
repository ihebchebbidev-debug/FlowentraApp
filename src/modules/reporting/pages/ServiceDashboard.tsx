import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Line, Legend, Cell, PieChart, Pie } from 'recharts';
import { useReportingService } from '../hooks/useReporting';
import { Loader2, AlertCircle } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9'];

const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div>
);

export const ServiceDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading, isError, error, refetch } = useReportingService();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? t('reporting.general.loadError', 'Failed to load report')}</p>
        <button onClick={() => refetch()} className="text-sm text-primary underline">{t('reporting.general.retry', 'Retry')}</button>
      </div>
    );
  }

  const completionByMonth = data?.completionByMonth ?? [];
  const workOrdersByStatus = data?.workOrdersByStatus ?? [];
  const workOrdersByType = data?.workOrdersByType ?? [];
  const dispatchesPerTech = data?.dispatchesPerTech ?? [];
  const consumedVsPlanned = data?.consumedVsPlanned ?? [];
  const technicianTable = data?.technicianTable ?? [];

  const currentYear = new Date().getFullYear();
  const yoyLabels = [currentYear - 2, currentYear - 1, currentYear].map(String);
  const empty = t('reporting.general.noData', 'No data');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.service.title', 'Service Dashboard')}</h2>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('reporting.service.completionTrend', 'Completion % vs 90% Target')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            {completionByMonth.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={completionByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" name="Completion %" fill={COLORS[1]} radius={[4, 4, 0, 0]} barSize={40} />
                  <Line type="step" dataKey="target" name="Target" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('reporting.service.woByStatus', 'Work Orders by Status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {workOrdersByStatus.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={workOrdersByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {workOrdersByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.service.woByType', 'Work Orders by Type')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {workOrdersByType.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workOrdersByType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.service.dispatchesPerTech', 'Dispatches per Technician (YoY)')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dispatchesPerTech.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dispatchesPerTech}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="series1" name={yoyLabels[0]} fill={COLORS[0]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="series2" name={yoyLabels[1]} fill={COLORS[1]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="series3" name={yoyLabels[2]} fill={COLORS[2]} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.service.consumedVsPlanned', 'Consumed vs Planned')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {consumedVsPlanned.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumedVsPlanned}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" name="Consumed" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Planned" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.service.technicianPerformance', 'Technician Performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reporting.service.technician', 'Technician')}</TableHead>
                  <TableHead>{t('reporting.service.role', 'Role')}</TableHead>
                  <TableHead>{t('reporting.service.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('reporting.service.jobs', 'Jobs')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianTable.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>
                ) : technicianTable.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className="font-medium">{tech.title}</TableCell>
                    <TableCell>{tech.subtitle}</TableCell>
                    <TableCell>{tech.status}</TableCell>
                    <TableCell className="text-right font-semibold">{tech.amount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
