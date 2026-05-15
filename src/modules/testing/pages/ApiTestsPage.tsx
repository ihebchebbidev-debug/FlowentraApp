import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Loader2, Zap, Filter, Activity, Server, Database, Users, FolderKanban, FileText, Tags, Settings, BarChart3, Download, Copy, FileCode, Rocket, Terminal, Trash2, Eye, ArrowRight, ArrowLeft, Upload, ToggleLeft, ToggleRight, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ApiTestRunner, TestResult, getTestCategories, allTests, getTotalTestCount, generateTestLog } from '../services/apiTestRunner';
import { backendLogsService, BackendLogEntry } from '../services/backendLogsService';
import { API_URL } from '../utils/testUtils';
import { TestFileUploadModal, registerModalCallback } from '../components/TestFileUploadModal';
import { TestDataVisualizer, TestDataRecord } from '../components/TestDataVisualizer';
import { TableDataVisualizer } from '../components/TableDataVisualizer';
import { 
  getTestDataRecords, 
  clearTestDataRecords, 
  addTestDataRecord, 
  getAutoCleanup, 
  setAutoCleanup,
  getCategoryTableName,
  subscribeToTestData 
} from '../stores/testDataStore';

// Mask API URL for security display
const maskApiUrl = (url: string): string => {
  if (!url) return url;
  // Replace the actual API domain with masked version
  return url.replace(/https?:\/\/[^\/]+/gi, 'https://******.onrender.com');
};

// Mask URLs in curl commands
const maskCurlCommand = (curl: string): string => {
  if (!curl) return curl;
  return curl.replace(/https?:\/\/[^'"\s]+/gi, (match) => maskApiUrl(match));
};

// Mask URLs in objects recursively
const maskUrlsInObject = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj === 'string') return maskApiUrl(obj);
  if (Array.isArray(obj)) return obj.map(maskUrlsInObject);
  if (typeof obj === 'object') {
    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'url' && typeof value === 'string') {
        masked[key] = maskApiUrl(value);
      } else if (key === 'curl' && typeof value === 'string') {
        masked[key] = maskCurlCommand(value);
      } else if (key === 'curlCommands' && typeof value === 'string') {
        masked[key] = maskCurlCommand(value);
      } else {
        masked[key] = maskUrlsInObject(value);
      }
    }
    return masked;
  }
  return obj;
};
import { useToast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ReactNode> = {
  'Setup': <Rocket className="h-4 w-4" />,
  'System Health': <Activity className="h-4 w-4" />,
  'Authentication': <Users className="h-4 w-4" />,
  'Users': <Users className="h-4 w-4" />,
  'Roles': <Settings className="h-4 w-4" />,
  'Skills': <Tags className="h-4 w-4" />,
  'Contacts': <Users className="h-4 w-4" />,
  'Contact Tags': <Tags className="h-4 w-4" />,
  'Contact Notes': <FileText className="h-4 w-4" />,
  'Articles': <FileText className="h-4 w-4" />,
  'Lookups': <Database className="h-4 w-4" />,
  'Preferences': <Settings className="h-4 w-4" />,
  'Projects': <FolderKanban className="h-4 w-4" />,
  'Tasks': <FolderKanban className="h-4 w-4" />,
  'Installations': <Server className="h-4 w-4" />,
  'Uploads': <Upload className="h-4 w-4" />,
};

const StatusIcon = ({ status, size = 'default' }: { status: TestResult['status']; size?: 'small' | 'default' }) => {
  const sizeClass = size === 'small' ? 'h-4 w-4' : 'h-5 w-5';
  switch (status) {
    case 'passed':
      return <CheckCircle2 className={cn(sizeClass, 'text-green-500')} />;
    case 'failed':
      return <XCircle className={cn(sizeClass, 'text-red-500')} />;
    case 'running':
      return <Loader2 className={cn(sizeClass, 'text-blue-500 animate-spin')} />;
    case 'skipped':
      return <AlertCircle className={cn(sizeClass, 'text-yellow-500')} />;
    default:
      return <Clock className={cn(sizeClass, 'text-muted-foreground')} />;
  }
};

const StatusBadge = ({ status }: { status: TestResult['status'] }) => {
  const variants: Record<TestResult['status'], string> = {
    passed: 'bg-success/10 text-success border-success/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
    running: 'bg-primary/10 text-primary border-primary/20',
    skipped: 'bg-warning/10 text-warning border-warning/20',
    pending: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge variant="outline" className={cn('capitalize text-xs', variants[status])}>
      {status}
    </Badge>
  );
};

export default function ApiTestsPage() {
  const { t } = useTranslation('testing');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [detailedLog, setDetailedLog] = useState('');
  const [backendLogs, setBackendLogs] = useState<BackendLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [showBackendLogs, setShowBackendLogs] = useState(false);
  const [selectedTestResult, setSelectedTestResult] = useState<TestResult | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ testName: string; acceptedTypes?: string; resolve: (file: File) => void; reject: () => void } | null>(null);
  const [autoCleanup, setAutoCleanupState] = useState(getAutoCleanup());
  const [testData, setTestData] = useState<TestDataRecord[]>(getTestDataRecords());
  const [activeTab, setActiveTab] = useState<'results' | 'data' | 'tables'>('results');
  const { toast } = useToast();

  // Subscribe to test data store changes
  useEffect(() => {
    const unsubscribe = subscribeToTestData(() => {
      setTestData(getTestDataRecords());
      setAutoCleanupState(getAutoCleanup());
    });
    return unsubscribe;
  }, []);

  const categories = useMemo(() => getTestCategories(), []);
  const totalTests = useMemo(() => getTotalTestCount(), []);

  const handleResultsUpdate = useCallback((newResults: TestResult[]) => {
    setResults([...newResults]);
  }, []);

  const runner = useMemo(() => new ApiTestRunner(handleResultsUpdate), [handleResultsUpdate]);

  // Register file upload modal callback
  useEffect(() => {
    registerModalCallback((pending) => {
      setPendingUpload(pending);
    });
  }, []);

  // Check auth on mount
  const isAuthenticated = useMemo(() => !!localStorage.getItem('access_token'), []);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({
        title: 'Auto-Setup Enabled',
        description: 'Tests will auto-create and login a test user. Click Run All Tests to start.',
      });
    } else {
      toast({
        title: 'Ready to Test',
        description: 'Session found. Click "RUN ALL TESTS" to start.',
      });
    }
  }, [toast]);

  // Toggle auto-cleanup setting
  const handleAutoCleanupToggle = (enabled: boolean) => {
    setAutoCleanup(enabled);
    setAutoCleanupState(enabled);
    toast({
      title: enabled ? 'Auto-Cleanup Enabled' : 'Auto-Cleanup Disabled',
      description: enabled 
        ? 'Test data will be cleaned at start and end of each run' 
        : 'Test data will only be cleaned at start of next run (data preserved after tests)',
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setDetailedLog('');
    // Clear test data visualizer at the start of each run
    clearTestDataRecords();
    const testStartTime = Date.now();
    setStartTime(testStartTime);
    setEndTime(null);
    setExpandedCategories(new Set(categories));
    setActiveTab('results');
    
    toast({
      title: 'Running API Tests',
      description: `Starting ${totalTests} tests${autoCleanup ? ' with auto-cleanup' : ' (data will be preserved)'}...`,
    });
    
    await runner.runAllTests(autoCleanup);
    
    const testEndTime = Date.now();
    setEndTime(testEndTime);
    setIsRunning(false);
    
    const finalResults = runner.getResults();
    const passed = finalResults.filter(r => r.status === 'passed').length;
    const failed = finalResults.filter(r => r.status === 'failed').length;
    
    // Generate detailed log
    const log = generateTestLog(finalResults, testStartTime, testEndTime);
    setDetailedLog(log);
    
    toast({
      title: failed === 0 ? 'All Tests Passed!' : 'Tests Completed',
      description: `${passed} passed, ${failed} failed out of ${finalResults.length} tests`,
      variant: failed === 0 ? 'default' : 'destructive',
    });
  };

  const runCategoryTests = async (category: string) => {
    setIsRunning(true);
    setSelectedCategory(category);
    setStartTime(Date.now());
    setEndTime(null);
    setExpandedCategories(new Set([category]));
    
    setResults((prev) => prev.filter((r) => r.category !== category));
    
    await runner.runTestsByCategory(category);
    
    setEndTime(Date.now());
    setIsRunning(false);
    setSelectedCategory(null);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      duration: startTime && endTime ? `${((endTime - startTime) / 1000).toFixed(2)}s` : null,
      summary: stats,
      results: results.map(r => ({
        ...r,
        timestamp: r.timestamp?.toISOString(),
      })),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Results Exported',
      description: 'Test results saved to JSON file',
    });
  };

  const copyResults = () => {
    // Use detailed log if available, otherwise generate quick summary
    const logToCopy = detailedLog || `API Test Results - ${new Date().toLocaleString()}
Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Skipped: ${stats.skipped}
Duration: ${stats.duration || 'N/A'}

${results.filter(r => r.status === 'failed').map(r => `❌ ${r.category} > ${r.name}: ${r.error}`).join('\n')}`;
    
    navigator.clipboard.writeText(logToCopy);
    toast({
      title: 'Copied to Clipboard',
      description: 'Detailed test log copied - ready to paste!',
    });
  };

  const viewDetailedLog = () => {
    if (!detailedLog && results.length > 0 && startTime && endTime) {
      setDetailedLog(generateTestLog(results, startTime, endTime));
    }
    setShowLogDialog(true);
  };

  const fetchBackendLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await backendLogsService.getLogs(200);
      setBackendLogs(response.logs);
    } catch (error) {
      toast({
        title: 'Error fetching logs',
        description: 'Could not fetch backend logs. The endpoint may not be deployed yet.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const clearBackendLogs = async () => {
    try {
      await backendLogsService.clearLogs();
      setBackendLogs([]);
      toast({ title: t('toast.logs_cleared') });
    } catch (error) {
      toast({ title: t('toast.error_clearing_logs'), variant: 'destructive' });
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-500 bg-red-500/10';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10';
      case 'information': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = results.length || totalTests;
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const pending = results.filter((r) => r.status === 'pending').length;
    const running = results.filter((r) => r.status === 'running').length;
    const completed = passed + failed + skipped;
    const progress = results.length > 0 ? (completed / results.length) * 100 : 0;
    const duration = startTime && endTime ? ((endTime - startTime) / 1000).toFixed(2) : null;
    const avgDuration = results.length > 0 
      ? (results.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / results.filter(r => r.duration).length).toFixed(0)
      : null;

    return { total, passed, failed, skipped, pending, running, completed, progress, duration, avgDuration };
  }, [results, startTime, endTime, totalTests]);

  // Group results by category
  const resultsByCategory = useMemo(() => {
    const grouped = new Map<string, TestResult[]>();
    categories.forEach((cat) => grouped.set(cat, []));
    results.forEach((result) => {
      const existing = grouped.get(result.category) || [];
      existing.push(result);
      grouped.set(result.category, existing);
    });
    return grouped;
  }, [results, categories]);

  const getCategoryStats = (category: string) => {
    const categoryResults = resultsByCategory.get(category) || [];
    const categoryTests = allTests.filter((t) => t.category === category);
    return {
      total: categoryTests.length,
      passed: categoryResults.filter((r) => r.status === 'passed').length,
      failed: categoryResults.filter((r) => r.status === 'failed').length,
      skipped: categoryResults.filter((r) => r.status === 'skipped').length,
      running: categoryResults.filter((r) => r.status === 'running').length,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Auto-Setup Info Banner */}
        {!isAuthenticated && (
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Rocket className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-primary">Auto-Setup Ready</p>
                    <p className="text-sm text-primary/80">Tests will auto-create a test user & authenticate. If signup fails, check backend logs.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => window.open('https://api.flowentra.app/swagger', '_blank')}
                  >
                    Swagger API
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Manual Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              API Integration Test Suite
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive testing for {totalTests} API endpoints across {categories.length} categories
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {isAuthenticated ? '✓ Logged in - Ready to run tests' : '🚀 Auto-setup enabled - Tests will create and login a test user automatically'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.length > 0 && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={copyResults}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Detailed Log</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={viewDetailedLog}>
                      <FileCode className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Full Log</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={exportResults}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export JSON</TooltipContent>
                </Tooltip>
              </>
            )}
            {/* Auto-Cleanup Toggle */}
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2">
                {autoCleanup ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-yellow-500" />
                )}
                <Switch
                  id="auto-cleanup"
                  checked={autoCleanup}
                  onCheckedChange={handleAutoCleanupToggle}
                  disabled={isRunning}
                />
                <Label htmlFor="auto-cleanup" className="text-sm cursor-pointer">
                  {autoCleanup ? 'Auto-Clean' : 'Keep Data'}
                </Label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium">{autoCleanup ? 'Auto-Cleanup ON' : 'Auto-Cleanup OFF'}</p>
                  <p className="text-xs mt-1">
                    {autoCleanup 
                      ? 'Data is cleaned at start and end of tests' 
                      : 'Data is only cleaned at start of NEXT run - preserved after tests complete'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                runner.reset();
                setResults([]);
                setStartTime(null);
                setEndTime(null);
                setDetailedLog('');
                clearTestDataRecords();
              }}
              disabled={isRunning}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning} 
              size="lg"
              className="min-w-[180px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  RUN ALL TESTS
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Tests</p>
                  <div className="text-2xl font-bold text-foreground">{totalTests}</div>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-success font-medium">Passed</p>
                  <div className="text-2xl font-bold text-success">{stats.passed}</div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-destructive font-medium">Failed</p>
                  <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
                </div>
                <XCircle className="h-8 w-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Skipped</p>
                  <div className="text-2xl font-bold text-yellow-500">{stats.skipped}</div>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Duration</p>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.duration ? `${stats.duration}s` : '-'}
                  </div>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avg Latency</p>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.avgDuration ? `${stats.avgDuration}ms` : '-'}
                  </div>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {(isRunning || stats.completed > 0) && (
          <Card className="overflow-hidden">
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Test Progress</span>
                <span className="font-semibold">
                  {stats.completed} / {results.length || totalTests} ({Math.round(stats.progress)}%)
                </span>
              </div>
              <div className="relative">
                <Progress value={stats.progress} className="h-3" />
                {stats.running > 0 && (
                  <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-blue-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Running {stats.running}...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Categories & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Test Categories
              </CardTitle>
              <CardDescription>
                Click a category to run its tests
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                <div className="p-4 space-y-2">
                  {categories.map((category) => {
                    const catStats = getCategoryStats(category);
                    const isActive = selectedCategory === category;
                    const hasResults = catStats.passed + catStats.failed + catStats.skipped > 0;
                    const allPassed = hasResults && catStats.failed === 0 && catStats.skipped === 0;
                    const hasFailed = catStats.failed > 0;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => !isRunning && runCategoryTests(category)}
                        disabled={isRunning}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all duration-200',
                          'hover:shadow-md hover:border-primary/30',
                          isActive && 'bg-primary/5 border-primary shadow-md',
                          allPassed && 'bg-success/5 border-success/30',
                          hasFailed && 'bg-destructive/5 border-destructive/30',
                          isRunning && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'p-1.5 rounded-md',
                              allPassed ? 'bg-green-500/10' : hasFailed ? 'bg-red-500/10' : 'bg-muted'
                            )}>
                              {categoryIcons[category] || <Database className="h-4 w-4" />}
                            </div>
                            <span className="font-medium">{category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {catStats.running > 0 && (
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            )}
                            {catStats.passed > 0 && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs px-1.5">
                                ✓{catStats.passed}
                              </Badge>
                            )}
                            {catStats.failed > 0 && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 text-xs px-1.5">
                                ✗{catStats.failed}
                              </Badge>
                            )}
                            {catStats.skipped > 0 && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 text-xs px-1.5">
                                ⊘{catStats.skipped}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 pl-8">
                          {catStats.total} test{catStats.total !== 1 ? 's' : ''}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Results / Data Visualizer Tabs */}
          <Card className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'results' | 'data' | 'tables')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TabsList className="grid w-fit grid-cols-3">
                      <TabsTrigger value="results" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Results
                      </TabsTrigger>
                      <TabsTrigger value="tables" className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Tables
                        {testData.length > 0 && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {new Set(testData.map(d => d.table)).size}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="data" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        JSON
                        {testData.length > 0 && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {testData.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </CardTitle>
                  {activeTab === 'results' && results.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {results.length} tests executed
                    </span>
                  )}
                  {(activeTab === 'data' || activeTab === 'tables') && testData.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {testData.length} records in {new Set(testData.map(d => d.table)).size} tables
                    </span>
                  )}
                </div>
                <CardDescription>
                  {activeTab === 'results' 
                    ? 'Detailed results with HTTP status, timing, and error details'
                    : activeTab === 'tables'
                    ? 'View test data in clean table format per database table'
                    : 'View raw JSON data organized by table'
                  }
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="results" className="mt-0">
                <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8">
                    <div className="p-4 bg-primary/5 rounded-full mb-4">
                      <Zap className="h-12 w-12 text-primary/50" />
                    </div>
                    <p className="font-medium text-lg">No tests run yet</p>
                    <p className="text-sm text-center mt-1">
                      Click <strong>"RUN ALL TESTS"</strong> to start comprehensive API testing
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {categories.map((category) => {
                      const categoryResults = resultsByCategory.get(category) || [];
                      if (categoryResults.length === 0) return null;

                      const isExpanded = expandedCategories.has(category);
                      const catStats = getCategoryStats(category);
                      const allPassed = catStats.failed === 0 && catStats.skipped === 0;

                      return (
                        <Collapsible
                          key={category}
                          open={isExpanded}
                          onOpenChange={() => toggleCategory(category)}
                        >
                          <CollapsibleTrigger asChild>
                            <button className={cn(
                              'w-full p-3 rounded-lg transition-colors',
                              allPassed ? 'bg-green-500/10 hover:bg-green-500/15' : 
                              catStats.failed > 0 ? 'bg-red-500/10 hover:bg-red-500/15' : 
                              'bg-muted/50 hover:bg-muted'
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  {categoryIcons[category] || <Database className="h-4 w-4" />}
                                  <span className="font-semibold">{category}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  {catStats.passed > 0 && (
                                    <span className="text-green-500 font-medium">
                                      ✓ {catStats.passed}
                                    </span>
                                  )}
                                  {catStats.failed > 0 && (
                                    <span className="text-red-500 font-medium">
                                      ✗ {catStats.failed}
                                    </span>
                                  )}
                                  {catStats.skipped > 0 && (
                                    <span className="text-yellow-500 font-medium">
                                      ⊘ {catStats.skipped}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-4 pt-2 space-y-2">
                              {categoryResults.map((result) => (
                                <div
                                  key={result.id}
                                  onClick={() => {
                                    if (result.status !== 'pending' && result.status !== 'running') {
                                      setSelectedTestResult(result);
                                      setShowDetailDialog(true);
                                    }
                                  }}
                                  className={cn(
                                    'p-3 rounded-lg border transition-all',
                                    result.status !== 'pending' && result.status !== 'running' && 'cursor-pointer hover:shadow-md hover:scale-[1.005]',
                                    result.status === 'passed' && 'border-success/20 bg-success/5 hover:bg-success/10',
                                    result.status === 'failed' && 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10',
                                    result.status === 'skipped' && 'border-warning/20 bg-warning/5 hover:bg-warning/10',
                                    result.status === 'running' && 'border-primary/20 bg-primary/5',
                                    result.status === 'pending' && 'border-border bg-muted/30'
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <StatusIcon status={result.status} size="small" />
                                      <span className="font-medium truncate">{result.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {result.httpStatus && (
                                        <Badge variant="outline" className={cn(
                                          'text-xs',
                                          result.httpStatus >= 200 && result.httpStatus < 300 
                                            ? 'text-green-600 border-green-500/30' 
                                            : 'text-red-600 border-red-500/30'
                                        )}>
                                          HTTP {result.httpStatus}
                                        </Badge>
                                      )}
                                      {result.duration !== undefined && (
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          {result.duration.toFixed(0)}ms
                                        </span>
                                      )}
                                      <StatusBadge status={result.status} />
                                      {result.status !== 'pending' && result.status !== 'running' && (
                                        <Eye className="h-4 w-4 text-muted-foreground/50 hover:text-foreground" />
                                      )}
                                    </div>
                                  </div>
                                  {result.details && (
                                    <p className="text-sm text-muted-foreground mt-2 pl-6">
                                      {result.details}
                                    </p>
                                  )}
                                  {result.responseSize && (
                                    <p className="text-xs text-muted-foreground/70 mt-1 pl-6">
                                      Response: {result.responseSize}
                                    </p>
                                  )}
                                  {result.error && (
                                    <div className="mt-2 pl-6">
                                      <pre className="text-xs text-red-500 font-mono bg-red-500/10 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                                        {typeof result.error === 'string' 
                                          ? result.error 
                                          : typeof result.error === 'object' && result.error !== null 
                                            ? JSON.stringify(result.error, null, 2) 
                                            : 'Unknown error'}
                                      </pre>
                                    </div>
                                  )}
                                  {result.status !== 'pending' && result.status !== 'running' && (
                                    <p className="text-xs text-primary/60 mt-2 pl-6 hover:text-primary">
                                      Click to view request/response details →
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
              </TabsContent>
              
              <TabsContent value="data" className="mt-0">
                <CardContent className="p-0">
                  <ScrollArea className="h-[550px]">
                    {testData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8">
                        <div className="p-4 bg-primary/5 rounded-full mb-4">
                          <Database className="h-12 w-12 text-primary/50" />
                        </div>
                        <p className="font-medium text-lg">No test data tracked yet</p>
                        <p className="text-sm text-center mt-1">
                          Run tests to see data created/updated in each table
                        </p>
                        <p className="text-xs text-center mt-2 text-muted-foreground/70">
                          {autoCleanup 
                            ? 'Auto-cleanup is ON - data will be cleaned after tests' 
                            : 'Auto-cleanup is OFF - data will be preserved after tests'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        {/* Group data by table */}
                        {Array.from(new Set(testData.map(d => d.table))).sort().map(table => {
                          const tableRecords = testData.filter(d => d.table === table);
                          const stats = {
                            created: tableRecords.filter(r => r.operation === 'create').length,
                            updated: tableRecords.filter(r => r.operation === 'update').length,
                            deleted: tableRecords.filter(r => r.operation === 'delete').length,
                          };
                          
                          return (
                            <Collapsible key={table}>
                              <CollapsibleTrigger asChild>
                                <button className="w-full p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-all">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <div className="p-1.5 rounded-md bg-primary/10">
                                        <Database className="h-4 w-4" />
                                      </div>
                                      <span className="font-semibold">{table}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {tableRecords.length} records
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {stats.created > 0 && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                          +{stats.created}
                                        </Badge>
                                      )}
                                      {stats.updated > 0 && (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                          ~{stats.updated}
                                        </Badge>
                                      )}
                                      {stats.deleted > 0 && (
                                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                                          -{stats.deleted}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 rounded-lg border overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-muted/50">
                                          <th className="p-2 text-left font-medium">Op</th>
                                          <th className="p-2 text-left font-medium">ID</th>
                                          <th className="p-2 text-left font-medium">Data Preview</th>
                                          <th className="p-2 text-left font-medium">Time</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tableRecords.slice(0, 20).map((record, idx) => (
                                          <tr key={`${record.id}-${idx}`} className="border-t hover:bg-muted/30">
                                            <td className="p-2">
                                              <Badge 
                                                variant="outline" 
                                                className={cn(
                                                  'text-[10px]',
                                                  record.operation === 'create' && 'bg-green-500/10 text-green-600',
                                                  record.operation === 'update' && 'bg-blue-500/10 text-blue-600',
                                                  record.operation === 'delete' && 'bg-red-500/10 text-red-600'
                                                )}
                                              >
                                                {record.operation.charAt(0).toUpperCase()}
                                              </Badge>
                                            </td>
                                            <td className="p-2 font-mono text-muted-foreground">
                                              {String(record.id).substring(0, 12)}
                                            </td>
                                            <td className="p-2 font-mono text-muted-foreground max-w-xs truncate">
                                              {JSON.stringify(record.data).substring(0, 80)}...
                                            </td>
                                            <td className="p-2 text-muted-foreground whitespace-nowrap">
                                              {record.timestamp.toLocaleTimeString()}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {tableRecords.length > 20 && (
                                      <div className="p-2 text-center text-muted-foreground text-xs bg-muted/30">
                                        + {tableRecords.length - 20} more records
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="tables" className="mt-0">
                <CardContent className="p-0 h-[550px]">
                  <TableDataVisualizer testData={testData} />
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Summary */}
        {stats.completed > 0 && !isRunning && (
          <Card className={cn(
            'overflow-hidden',
            stats.failed === 0 ? 'bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/30' :
            'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30'
          )}>
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {stats.failed === 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-500">All Tests Passed!</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.passed} of {stats.total} tests completed successfully
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-full">
                        <XCircle className="h-8 w-8 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-red-500">
                          {stats.failed} Test{stats.failed > 1 ? 's' : ''} Failed
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stats.passed} passed, {stats.skipped} skipped out of {stats.total} tests
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {stats.duration && (
                  <Separator orientation="vertical" className="h-12 hidden sm:block" />
                )}
                {stats.duration && (
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                    <p className="text-lg font-semibold">{stats.duration}s</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backend Logs Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Backend Server Logs
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBackendLogs}
                  disabled={isLoadingLogs || backendLogs.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBackendLogs}
                  disabled={isLoadingLogs}
                >
                  {isLoadingLogs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Fetch Logs
                </Button>
                <Button
                  variant={showBackendLogs ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowBackendLogs(!showBackendLogs);
                    if (!showBackendLogs && backendLogs.length === 0) {
                      fetchBackendLogs();
                    }
                  }}
                >
                  {showBackendLogs ? 'Hide' : 'Show'} Logs
                </Button>
              </div>
            </div>
            <CardDescription>
              Real-time logs from the Render backend server (requires /api/logs endpoint)
            </CardDescription>
          </CardHeader>
          {showBackendLogs && (
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border bg-background/50 p-2">
                {backendLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isLoadingLogs ? 'Loading logs...' : 'No logs available. Click "Fetch Logs" to load.'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {backendLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-mono border-b border-border/30 pb-1">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getLogLevelColor(log.level))}>
                          {log.level.substring(0, 4).toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground/70 max-w-[150px] truncate" title={log.category}>
                          {log.category.split('.').pop()}
                        </span>
                        <span className="flex-1 break-all">{log.message}</span>
                        {log.exception && (
                          <span className="text-red-400 break-all">{log.exception.substring(0, 200)}...</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          )}
        </Card>

        {/* API Info */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>API: api.flowentra.app</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>{totalTests} Endpoints</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                <span>{categories.length} Categories</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Detailed Test Report
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <ScrollArea className="h-[60vh] w-full rounded-md border bg-muted/50 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {detailedLog || 'No test results yet. Run tests first.'}
              </pre>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(detailedLog);
                toast({
                  title: 'Copied!',
                  description: 'Full test log copied to clipboard',
                });
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Log
              </Button>
              <Button variant="outline" onClick={() => {
                const blob = new Blob([detailedLog], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `api-test-log-${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download TXT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Detail Dialog - Request/Response Viewer */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTestResult && <StatusIcon status={selectedTestResult.status} />}
              <span>{selectedTestResult?.name}</span>
              {selectedTestResult?.httpStatus && (
                <Badge variant="outline" className={cn(
                  'ml-2',
                  selectedTestResult.httpStatus >= 200 && selectedTestResult.httpStatus < 300 
                    ? 'text-green-600 border-green-500/30' 
                    : 'text-red-600 border-red-500/30'
                )}>
                  HTTP {selectedTestResult.httpStatus}
                </Badge>
              )}
              {selectedTestResult?.duration && (
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedTestResult.duration.toFixed(0)}ms
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4">
              {/* Test Info */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Test Result
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedTestResult?.status || 'pending'} /></div>
                  <div><span className="text-muted-foreground">Category:</span> {selectedTestResult?.category}</div>
                  <div><span className="text-muted-foreground">Duration:</span> {selectedTestResult?.duration?.toFixed(0)}ms</div>
                  <div><span className="text-muted-foreground">Response Size:</span> {selectedTestResult?.responseSize || 'N/A'}</div>
                </div>
                {selectedTestResult?.details && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-sm">Details:</span>
                    <p className="text-sm mt-1">{selectedTestResult.details}</p>
                  </div>
                )}
                {selectedTestResult?.error && (
                  <div className="mt-2">
                    <span className="text-red-500 text-sm font-medium">Error:</span>
                    <pre className="text-xs text-red-500 font-mono bg-red-500/10 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                      {typeof selectedTestResult.error === 'string' 
                        ? selectedTestResult.error 
                        : typeof selectedTestResult.error === 'object' && selectedTestResult.error !== null 
                          ? JSON.stringify(selectedTestResult.error, null, 2) 
                          : 'Unknown error'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Curl Command Section for batch operations */}
              {selectedTestResult?.requestData?.body?.curlCommands && (
                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-600">
                    <Terminal className="h-4 w-4" />
                    Curl Commands ({selectedTestResult.requestData.body.totalCalls} calls)
                  </h3>
                  <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-64 whitespace-pre-wrap">
{maskCurlCommand(selectedTestResult.requestData.body.curlCommands)}
                  </pre>
                </div>
              )}

              {/* API Calls Summary for batch operations */}
              {selectedTestResult?.requestData?.body?.calls && (
                <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-600">
                    <Activity className="h-4 w-4" />
                    API Calls Summary
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {selectedTestResult.requestData.body.calls.map((call: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-mono p-1 hover:bg-muted rounded">
                        <Badge variant="outline" className={cn(
                          'text-[10px] px-1.5',
                          call.method === 'GET' ? 'text-blue-600 border-blue-500/30' :
                          call.method === 'POST' ? 'text-green-600 border-green-500/30' :
                          call.method === 'DELETE' ? 'text-red-600 border-red-500/30' :
                          'text-yellow-600 border-yellow-500/30'
                        )}>
                          {call.method}
                        </Badge>
                        <span className="text-muted-foreground truncate flex-1" title={maskApiUrl(call.url)}>
                          {call.url.replace(/https?:\/\/[^\/]+/gi, '')}
                        </span>
                        <Badge variant="outline" className={cn(
                          'text-[10px]',
                          call.status >= 200 && call.status < 300 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {call.status}
                        </Badge>
                        <span className="text-muted-foreground/70">{call.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed API Call Responses for batch operations */}
              {selectedTestResult?.responseData?.body?.apiCallDetails && (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600">
                    <Database className="h-4 w-4" />
                    Detailed Responses ({selectedTestResult.responseData.body.apiCallDetails.length} calls)
                  </h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {selectedTestResult.responseData.body.apiCallDetails.slice(0, 20).map((detail: any, idx: number) => (
                        <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{detail.request.method}</Badge>
                            <code className="text-muted-foreground truncate">{detail.request.url.replace(/https?:\/\/[^\/]+/gi, '')}</code>
                            <Badge variant="outline" className={cn(
                              'text-[10px] ml-auto',
                              detail.response.status >= 200 && detail.response.status < 300 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {detail.response.status}
                            </Badge>
                          </div>
                          {detail.request.body && (
                            <pre className="text-[10px] font-mono bg-background p-1 rounded mt-1 max-h-20 overflow-auto">
                              Request: {JSON.stringify(detail.request.body, null, 2)}
                            </pre>
                          )}
                          {detail.response.body && (
                            <pre className="text-[10px] font-mono bg-background p-1 rounded mt-1 max-h-20 overflow-auto">
                              Response: {JSON.stringify(detail.response.body, null, 2).substring(0, 500)}...
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Request Section (for single API calls) */}
              {selectedTestResult?.requestData && !selectedTestResult?.requestData?.body?.curlCommands && (
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                    <ArrowRight className="h-4 w-4" />
                    Request
                  </h3>
                  <div className="space-y-3">
                    {/* Curl command */}
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                        <Terminal className="h-3 w-3" /> Curl Command:
                      </p>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all">
{`curl -X ${selectedTestResult.requestData.method} '${maskApiUrl(selectedTestResult.requestData.url)}'${
  selectedTestResult.requestData.headers?.Authorization 
    ? ` \\\n  -H 'Authorization: Bearer ****...'` 
    : ''
}${
  selectedTestResult.requestData.headers?.['Content-Type']
    ? ` \\\n  -H 'Content-Type: ${selectedTestResult.requestData.headers['Content-Type']}'`
    : ''
}${
  selectedTestResult.requestData.body 
    ? ` \\\n  -d '${JSON.stringify(selectedTestResult.requestData.body)}'`
    : ''
}`}
                      </pre>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-blue-600 border-blue-500/30">
                        {selectedTestResult.requestData.method}
                      </Badge>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                        {maskApiUrl(selectedTestResult.requestData.url)}
                      </code>
                    </div>
                    
                    {selectedTestResult.requestData.headers && Object.keys(selectedTestResult.requestData.headers).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Headers:</p>
                        <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
{JSON.stringify({
  ...selectedTestResult.requestData.headers,
  Authorization: selectedTestResult.requestData.headers.Authorization ? 'Bearer ****...' : undefined
}, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {selectedTestResult.requestData.body && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Request Body:</p>
                        <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto max-h-48">
{typeof selectedTestResult.requestData.body === 'string' 
  ? selectedTestResult.requestData.body 
  : JSON.stringify(selectedTestResult.requestData.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Response Section */}
              {selectedTestResult?.responseData && !selectedTestResult?.responseData?.body?.apiCallDetails && (
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                    <ArrowLeft className="h-4 w-4" />
                    Response
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        'font-mono',
                        selectedTestResult.responseData.status >= 200 && selectedTestResult.responseData.status < 300
                          ? 'text-green-600 border-green-500/30'
                          : 'text-red-600 border-red-500/30'
                      )}>
                        {selectedTestResult.responseData.status} {selectedTestResult.responseData.statusText}
                      </Badge>
                    </div>
                    
                    {selectedTestResult.responseData.body && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Response Body:</p>
                        <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto max-h-64">
{typeof selectedTestResult.responseData.body === 'string' 
  ? selectedTestResult.responseData.body 
  : JSON.stringify(selectedTestResult.responseData.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {!selectedTestResult?.requestData && !selectedTestResult?.responseData && (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No request/response data available for this test.</p>
                  <p className="text-sm mt-1">Run the tests again to capture detailed API data.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => {
              const data = {
                test: selectedTestResult?.name,
                status: selectedTestResult?.status,
                request: selectedTestResult?.requestData,
                response: selectedTestResult?.responseData,
              };
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              toast({ title: t('toast.request_copied'), description: t('toast.request_copied_desc') });
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Data
            </Button>
            <Button onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Modal for Interactive Upload Tests */}
      <TestFileUploadModal
        isOpen={!!pendingUpload}
        onClose={() => {
          pendingUpload?.reject();
          setPendingUpload(null);
        }}
        onFileSelected={(file) => {
          pendingUpload?.resolve(file);
          setPendingUpload(null);
        }}
        testName={pendingUpload?.testName || ''}
        acceptedTypes={pendingUpload?.acceptedTypes}
      />
    </div>
  );
}
