import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { useReportingPurchase } from '../hooks/useReporting';
import { Loader2, AlertCircle } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9', '#f97316', '#14b8a6'];

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

export const PurchaseDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading, isError, error, refetch } = useReportingPurchase();

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

  const spendBySupplier = data?.spendBySupplier ?? [];
  const spendByCategory = data?.spendByCategory ?? [];
  const receiptStatus = data?.receiptStatus ?? [];
  const poSpendTrend = data?.poSpendTrend ?? [];
  const poTable = data?.poTable ?? [];
  const empty = t('reporting.general.noData', 'No data');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.purchase.title', 'Purchase Dashboard')}</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('reporting.purchase.spendBySupplier', 'Spend by Supplier')}</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {spendBySupplier.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendBySupplier} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('reporting.purchase.spendByCategory', 'Spend by Category')}</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {spendByCategory.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={spendByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {spendByCategory.map((_, index) => (
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
          <CardHeader><CardTitle>{t('reporting.purchase.receiptStatus', 'Receipt Status')}</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {receiptStatus.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={receiptStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {receiptStatus.map((_, index) => (
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
          <CardHeader><CardTitle>{t('reporting.purchase.poSpendTrend', 'PO Spend Trend')}</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {poSpendTrend.length === 0 ? <EmptyChart label={empty} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={poSpendTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0] }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('reporting.purchase.poDetails', 'Purchase Order Details')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>{t('reporting.purchase.poNumber', 'PO Number')}</TableHead>
                  <TableHead>{t('reporting.purchase.supplier', 'Supplier')}</TableHead>
                  <TableHead>{t('reporting.purchase.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('reporting.purchase.amount', 'Amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poTable.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>
                ) : poTable.map((po) => (
                  <TableRow key={po.id} className={po.ragDot === 'red' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell><RagDot status={po.ragDot} /></TableCell>
                    <TableCell className="font-medium">{po.title}</TableCell>
                    <TableCell>{po.subtitle}</TableCell>
                    <TableCell>{po.status}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(po.amount ?? 0)}
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
