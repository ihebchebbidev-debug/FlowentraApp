export interface ReportKpi {
  title: string;
  value: number;
  formattedValue: string;
  trend: string;
  ragStatus: 'green' | 'yellow' | 'red' | 'neutral';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  target?: number;
  color?: string;
}

export interface MultiSeriesChartPoint {
  name: string;
  series1: number;
  series2: number;
  series3: number;
}

export interface RagTableItem {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  ragDot: 'green' | 'yellow' | 'red' | 'neutral';
  date: string;
}

export interface SalesReport {
  offersByStatus: ChartDataPoint[];
  salesByStatus: ChartDataPoint[];
  conversionTrend: ChartDataPoint[];
  yoyComparison: MultiSeriesChartPoint[];
  topCustomers: RagTableItem[];
}

export interface ServiceReport {
  completionByMonth: ChartDataPoint[];
  workOrdersByStatus: ChartDataPoint[];
  workOrdersByType: ChartDataPoint[];
  dispatchesPerTech: MultiSeriesChartPoint[];
  consumedVsPlanned: ChartDataPoint[];
  technicianTable: RagTableItem[];
}

export interface FinanceReport {
  kpis: ReportKpi[];
  invoiceStatusDonut: ChartDataPoint[];
  expensesByCategory: ChartDataPoint[];
  invoiceTable: RagTableItem[];
}

export interface HrReport {
  headcountByDepartment: ChartDataPoint[];
  salaryByDepartment: ChartDataPoint[];
  performanceDistribution: ChartDataPoint[];
  hiringVsTurnover: MultiSeriesChartPoint[];
  employeeTable: RagTableItem[];
}

export interface PurchaseReport {
  spendBySupplier: ChartDataPoint[];
  spendByCategory: ChartDataPoint[];
  receiptStatus: ChartDataPoint[];
  poSpendTrend: ChartDataPoint[];
  poTable: RagTableItem[];
}
