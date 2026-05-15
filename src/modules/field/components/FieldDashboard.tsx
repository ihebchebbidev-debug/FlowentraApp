import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnalyticsChart } from "@/components/charts/AnalyticsChart";
import { FieldCalendar } from "./FieldCalendar";
import { format, addMonths, subMonths } from "date-fns";

// Mock data for demonstration
const mockKPIData = {
  activeServiceOrders: 24,
  technicianWorkingToday: 8,
  todayDispatches: 12,
  firstTimeFixRate: 87
};

const mockAnalyticsData = [
  { name: 'Tech A', completed: 15, planned: 18, hours: 120 },
  { name: 'Tech B', completed: 12, planned: 14, hours: 98 },
  { name: 'Tech C', completed: 20, planned: 22, hours: 156 },
  { name: 'Tech D', completed: 8, planned: 12, hours: 76 },
  { name: 'Tech E', completed: 18, planned: 20, hours: 142 }
];

const mockRevenueData = [
  { name: 'Week 1', revenue: 8500, costs: 3200 },
  { name: 'Week 2', revenue: 9200, costs: 3600 },
  { name: 'Week 3', revenue: 11000, costs: 4100 },
  { name: 'Week 4', revenue: 12430, costs: 4800 }
];

const mockCompletionData = [
  { name: 'Maintenance', avgTime: 2.5, target: 3.0 },
  { name: 'Repair', avgTime: 4.2, target: 5.0 },
  { name: 'Installation', avgTime: 6.8, target: 8.0 },
  { name: 'Inspection', avgTime: 1.8, target: 2.0 }
];

export function FieldDashboard() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedChart, setSelectedChart] = useState('performance');

  const chartOptions = [
    {
      key: 'performance',
      label: t('field:analytics.technicianPerformance'),
      data: mockAnalyticsData,
      series: [
        { key: 'completed', name: 'Completed', color: 'hsl(var(--success))' },
        { key: 'planned', name: 'Planned', color: 'hsl(var(--primary))' }
      ]
    },
    {
      key: 'revenue',
      label: t('field:analytics.revenueInsights'),
      data: mockRevenueData,
      series: [
        { key: 'revenue', name: 'Revenue', color: 'hsl(var(--success))' },
        { key: 'costs', name: 'Costs', color: 'hsl(var(--destructive))' }
      ]
    },
    {
      key: 'completion',
      label: t('field:analytics.jobCompletionTimes'),
      data: mockCompletionData,
      series: [
        { key: 'avgTime', name: 'Average Time (hrs)', color: 'hsl(var(--accent))' },
        { key: 'target', name: 'Target (hrs)', color: 'hsl(var(--muted-foreground))' }
      ]
    }
  ];

  const currentChart = chartOptions.find(opt => opt.key === selectedChart) || chartOptions[0];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('field:dashboard')}</h1>
          <p className="text-sm text-muted-foreground">Overview of field operations and technician performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button variant="default" size="sm">
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="gradient-card shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('field:kpis.activeServiceOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockKPIData.activeServiceOrders}</div>
            <p className="text-xs text-muted-foreground">+12% vs last month</p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('field:kpis.technicianWorking')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockKPIData.technicianWorkingToday}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('field:kpis.todayDispatches')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockKPIData.todayDispatches}</div>
            <p className="text-xs text-muted-foreground">8 completed, 4 pending</p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('field:kpis.firstTimeFixRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockKPIData.firstTimeFixRate}%</div>
            <p className="text-xs text-muted-foreground">+5% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Schedule Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('field:calendar')}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    Dispatch schedule for {format(currentDate, 'MMMM yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    {t('field:calendar.today')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FieldCalendar currentDate={currentDate} />
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Insights Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Performance Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">Select metric to analyze</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {chartOptions.map((option) => (
                  <Button
                    key={option.key}
                    variant={selectedChart === option.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedChart(option.key)}
                    className="justify-start text-xs"
                  >
                    {option.key === 'performance' && 'Performance'}
                    {option.key === 'revenue' && 'Revenue'}
                    {option.key === 'completion' && 'Completion'}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <AnalyticsChart 
                  data={currentChart.data}
                  height={180}
                  series={currentChart.series}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Key Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">Current period summary</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Service Orders</span>
                  <span className="text-lg font-bold text-foreground">156</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Time Postings</span>
                  <span className="text-lg font-bold text-foreground">1,240</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Total Dispatches</span>
                  <span className="text-lg font-bold text-foreground">342</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Quality Score</span>
                  <span className="text-lg font-bold text-success">96%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}