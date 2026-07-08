import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useReportingHr } from '../hooks/useReporting';
import { Loader2 } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0ea5e9'];

export const HrDashboard = () => {
  const { t } = useTranslation('reporting');
  const { data, isLoading } = useReportingHr();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.hr.title', 'HR Dashboard')}</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        
        {/* Headcount by Department */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.hr.headcountByDept', 'Headcount by Department')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.headcountByDepartment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Salary Cost by Department */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.hr.salaryByDept', 'Salary Cost by Department')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salaryByDepartment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Bar dataKey="value" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.hr.performance', 'Performance Distribution')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.performanceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring vs Turnover */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reporting.hr.hiringVsTurnover', 'Hiring vs Turnover')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hiringVsTurnover}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="series1" name="Hired" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="series2" name="Turnover" fill={COLORS[3]} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.hr.employeeList', 'Employee Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reporting.hr.employee', 'Employee')}</TableHead>
                  <TableHead>{t('reporting.hr.department', 'Department')}</TableHead>
                  <TableHead>{t('reporting.hr.performanceGrade', 'Grade')}</TableHead>
                  <TableHead className="text-right">{t('reporting.hr.salary', 'Salary')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.employeeTable.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.title}</TableCell>
                    <TableCell>{emp.subtitle}</TableCell>
                    <TableCell>{emp.status}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(emp.amount)}
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
