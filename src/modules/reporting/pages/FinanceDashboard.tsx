import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useReportingFinance } from '../hooks/useReporting';
import { Loader2, AlertCircle } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9'];

const RagDot = ({ status }: { status: string }) => {
  let colorClass = 'bg-gray-400';
  if (status === 'green') colorClass = 'bg-green-500';
  if (status === 'yellow') colorClass = 'bg-yellow-500';
  if (status === 'red') colorClass = 'bg-red-500';
  return <div className={`h-3 w-3 rounded-full ${colorClass}`} />;
};

const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div>
);

export const FinanceDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading, isError, error, refetch } = useReportingFinance();

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

  const kpis = data?.kpis ?? [];
  const invoiceStatusDonut = data?.invoiceStatusDonut ?? [];
  const expensesByCategory = data?.expensesByCategory ?? [];
  const invoiceTable = data?.invoiceTable ?? [];
  const empty = t('reporting.general.noData', 'No data');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.finance.title', 'Finance Dashboard')}</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {kpis.length === 0 ? (
          <Card className="col-span-full"><CardContent className="p-6 text-sm text-muted-foreground">{empty}</CardContent></Card>
        ) : kpis.map((kpi, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <RagDot status={kpi.ragStatus} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.formattedValue}</div>
              {kpi.trend && (
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.trend} {t('reporting.general.fromLastMonth', 'from last month')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.finance.invoiceStatus', 'Invoice Status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {invoiceStatusDonut.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invoiceStatusDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {invoiceStatusDonut.map((_, index) => (
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

        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.finance.expensesByCategory', 'Expenses by Category')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expensesByCategory.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.finance.recentInvoices', 'Recent Invoices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>{t('reporting.finance.invoiceNumber', 'Invoice')}</TableHead>
                  <TableHead>{t('reporting.finance.customer', 'Customer')}</TableHead>
                  <TableHead>{t('reporting.finance.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('reporting.finance.amount', 'Amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceTable.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>
                ) : invoiceTable.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell><RagDot status={invoice.ragDot} /></TableCell>
                    <TableCell className="font-medium">{invoice.title}</TableCell>
                    <TableCell>{invoice.subtitle}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount ?? 0)}
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
