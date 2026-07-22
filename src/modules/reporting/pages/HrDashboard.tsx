import { useReportFilters } from '../store/useReportFiltersStore';
import { filterByStatusName, sliceByPeriod } from '../utils/applyFilters';
import { exportSingleReport } from '../utils/exportReport';
import { useXlsxI18n } from '../hooks/useXlsxI18n';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, Award, UserPlus } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ReportShell } from '../components/ReportShell';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { RagBadge } from '../components/RagDot';
import { CHART_COLORS, AXIS_TICK, GRID_STROKE, tooltipStyle } from '../components/chartTheme';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useReportingHr } from '../hooks/useReporting';
import { useCurrency } from '@/shared/hooks/useCurrency';

const SOURCE = 'HR' as const;

export const HrDashboard = () => {
  const { t } = useTranslation('reporting');
  const xlsxI18n = useXlsxI18n();
  const { current: currency } = useCurrency();
  const { values: appliedFilters, setValues: setAppliedFilters } = useReportFilters('hr');
  const { data, isLoading, refetch, isFetching, error } = useReportingHr(appliedFilters);

  const filters = [
    { key: 'period', label: t('filters.period', 'Period'), options: [
      { value: '12m', label: t('filters.last12', 'Last 12 Months') },
      { value: 'ytd', label: t('filters.ytd', 'This Year') },
    ]},
    { key: 'dept', label: t('hr.department', 'Department'), options: [
      { value: 'all', label: t('filters.all', 'All') },
    ]},
  ];

  const period = appliedFilters.period;
  const dept = appliedFilters.dept;
  const headcount = filterByStatusName(data?.headcountByDepartment ?? [], dept);
  const salary = filterByStatusName(data?.salaryByDepartment ?? [], dept);
  const performance = data?.performanceDistribution ?? [];
  const hiring = sliceByPeriod(data?.hiringVsTurnover ?? [], period);
  const employees = data?.employeeTable ?? [];
  const totalHeadcount = headcount.reduce((s, x) => s + Number(x.value ?? 0), 0);
  const totalHires = hiring.reduce((s, x) => s + Number(x.series1 ?? 0), 0);

  return (
    <ReportShell
      icon={Users}
      tone="purple"
      title={t('hr.title', 'HR Dashboard')}
      subtitle={t('hr.subtitle', 'Headcount, salaries, performance & hiring')}
      onRefresh={() => refetch()}
      onExport={() => data && exportSingleReport('hr', data, 'xlsx', xlsxI18n)}
      isRefreshing={isFetching}
      error={error}
    >
      <FilterBar filters={filters} onApply={setAppliedFilters} />
      {isLoading ? (
        <DashboardSkeleton kpis={4} rows={[2,2,1]} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard favorite={{ id: 'h-kpi-head', title: 'Total Headcount', source: SOURCE }} icon={Users} tone="purple" tag="LIVE" value={totalHeadcount || '—'} label={t('hr.kpi.headcount', 'Total Headcount')} />
            <KpiCard favorite={{ id: 'h-kpi-sal', title: 'Monthly Salary Cost', source: SOURCE }} icon={Briefcase} tone="info" tag="MONTH" value={new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(salary.reduce((s, x) => s + Number(x.value ?? 0), 0))} label={t('hr.kpi.salary', 'Monthly Salary Cost')} />
            <KpiCard favorite={{ id: 'h-kpi-perf', title: 'Avg Performance Grade', source: SOURCE }} icon={Award} tone="success" tag="AVG" value="B+" label={t('hr.kpi.performance', 'Avg Performance Grade')} />
            <KpiCard favorite={{ id: 'h-kpi-hires', title: 'New Hires', source: SOURCE }} icon={UserPlus} tone="accent" tag="YTD" value={totalHires || '—'} label={t('hr.kpi.hires', 'New Hires')} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartCard title={t('hr.headcount', 'Headcount by Department')} favorite={{ id: 'h-head', title: 'Headcount by Department', source: SOURCE }} empty={!headcount.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={headcount}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--chart-6))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('hr.salary', 'Salary Cost by Department')} favorite={{ id: 'h-sal', title: 'Salary Cost by Department', source: SOURCE }} empty={!salary.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salary}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartCard title={t('hr.performance', 'Performance Distribution')} favorite={{ id: 'h-perf', title: 'Performance Distribution', source: SOURCE }} empty={!performance.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={performance} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                    {performance.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t('hr.hiring', 'Hiring vs Turnover')} favorite={{ id: 'h-hire', title: 'Hiring vs Turnover', source: SOURCE }} empty={!hiring.length} emptyLabel={t('hr.empty', 'HR data will appear once populated')}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={hiring}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="series1" name={t('hr.hires', 'Hires')} stroke="hsl(var(--chart-3))" strokeWidth={2} />
                  <Line type="monotone" dataKey="series2" name={t('hr.leavers', 'Leavers')} stroke="hsl(var(--rag-red))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-3">
            <ChartCard title={t('hr.employeeTable', 'Employee Detail')} favorite={{ id: 'h-emp', title: 'Employees', source: SOURCE }} bodyClassName="p-0" empty={!employees.length} emptyLabel={t('hr.empty', 'Employee table not yet populated')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('hr.employee', 'Employee')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('hr.department', 'Department')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-left">{t('hr.grade', 'Grade')}</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">{t('hr.salaryCol', 'Salary')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e) => (
                      <tr key={e.id} className="border-t hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-2 font-medium">{e.title}</td>
                        <td className="whitespace-nowrap px-3 py-2">{e.subtitle}</td>
                        <td className="whitespace-nowrap px-3 py-2"><RagBadge status={(e.ragDot as any) || 'neutral'}>{e.status}</RagBadge></td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(Number(e.amount ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </ReportShell>
  );
};
