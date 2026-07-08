import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useReportingFinance } from '../hooks/useReporting';
import { Loader2 } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9'];

const RagDot = ({ status }: { status: string }) => {
  let colorClass = 'bg-gray-400';
  if (status === 'green') colorClass = 'bg-green-500';
  if (status === 'yellow') colorClass = 'bg-yellow-500';
  if (status === 'red') colorClass = 'bg-red-500';
  
  return <div className={`h-3 w-3 rounded-full ${colorClass}`} />;
};

export const FinanceDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading } = useReportingFinance();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.finance.title', 'Finance Dashboard')}</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi, idx) => (
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
        
        {/* Invoice Status Donut */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.finance.invoiceStatus', 'Invoice Status')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.invoiceStatusDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.invoiceStatusDonut.map((entry, index) => (
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

      {/* Invoice Detail Table with RAG */}
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
                {data.invoiceTable.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell><RagDot status={invoice.ragDot} /></TableCell>
                    <TableCell className="font-medium">{invoice.title}</TableCell>
                    <TableCell>{invoice.subtitle}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}
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
