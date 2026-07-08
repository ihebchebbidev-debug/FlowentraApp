import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Line, Legend, Cell, PieChart, Pie } from 'recharts';
import { useReportingService } from '../hooks/useReporting';
import { Loader2 } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9'];

export const ServiceDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading } = useReportingService();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.service.title', 'Service Dashboard')}</h2>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Completion % vs Target (Composed Chart) */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('reporting.service.completionTrend', 'Completion % vs 90% Target')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.completionByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name="Completion %" fill={COLORS[1]} radius={[4, 4, 0, 0]} barSize={40} />
                <Line type="step" dataKey="target" name="Target" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Orders by Status */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('reporting.service.woByStatus', 'Work Orders by Status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.workOrdersByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.workOrdersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        {/* Work Orders by Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.service.woByType', 'Work Orders by Type')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workOrdersByType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Bar dataKey="value" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dispatches per Technician (YoY) */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.service.dispatchesPerTech', 'Dispatches per Technician (YoY)')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dispatchesPerTech}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="series1" name="2024" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="series2" name="2025" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="series3" name="2026" fill={COLORS[2]} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
