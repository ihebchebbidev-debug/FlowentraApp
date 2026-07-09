import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useReportingSales } from '../hooks/useReporting';
import { Loader2, AlertCircle } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9'];

const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div>
);

export const SalesDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading, isError, error, refetch } = useReportingSales();

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

  const offersByStatus = data?.offersByStatus ?? [];
  const salesByStatus = data?.salesByStatus ?? [];
  const conversionTrend = data?.conversionTrend ?? [];
  const yoyComparison = data?.yoyComparison ?? [];
  const topCustomers = data?.topCustomers ?? [];

  const currentYear = new Date().getFullYear();
  const yoyLabels = [currentYear - 2, currentYear - 1, currentYear].map(String);
  const empty = t('reporting.general.noData', 'No data');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.sales.title', 'Sales Dashboard')}</h2>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('reporting.sales.yoyComparison', 'Year-over-Year Comparison')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            {yoyComparison.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yoyComparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="series1" name={yoyLabels[0]} stroke={COLORS[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="series2" name={yoyLabels[1]} stroke={COLORS[1]} strokeWidth={2} />
                  <Line type="monotone" dataKey="series3" name={yoyLabels[2]} stroke={COLORS[2]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('reporting.sales.offersByStatus', 'Offers by Status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {offersByStatus.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={offersByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {offersByStatus.map((_, index) => (
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
            <CardTitle>{t('reporting.sales.salesByStatus', 'Sales Orders by Status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {salesByStatus.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.sales.conversionTrend', 'Conversion Rate Trend (%)')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {conversionTrend.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="value" name="Actual %" stroke={COLORS[1]} strokeWidth={2} />
                  <Line type="step" dataKey="target" name="Target %" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.sales.topCustomers', 'Top Customers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reporting.sales.customer', 'Customer')}</TableHead>
                  <TableHead className="text-right">{t('reporting.sales.revenue', 'Revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>
                ) : topCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.title}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(customer.amount ?? 0)}
                    </TableCell>
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
