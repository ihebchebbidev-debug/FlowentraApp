/**
 * API Test Runner
 * Main test execution engine - imports modular tests from tests/ folder
 */

import { TestResult, TestDefinition } from '../types/testTypes';
import { testDataIds } from '../utils/testUtils';
import { allTests, getTestCategories } from '../tests';

// Re-export types for backward compatibility
export type { TestResult, TestDefinition };
export { allTests, getTestCategories };

// Get total test count
export const getTotalTestCount = (): number => allTests.length;

// Generate test log (alias for generateTestReportLog for backward compatibility)
export const generateTestLog = (results: TestResult[], startTime: number, endTime: number): string => {
  return generateTestReportLog(results, endTime - startTime);
};

// Generate report log
export const generateTestReportLog = (results: TestResult[], duration: number): string => {
  const timestamp = new Date().toISOString();
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  let log = `╔══════════════════════════════════════════════════════════════════╗
║                   API INTEGRATION TEST REPORT                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Timestamp: ${timestamp.padEnd(46)}║
║  Duration: ${(duration / 1000).toFixed(2)}s${' '.repeat(52 - (duration / 1000).toFixed(2).length)}║
║  API Base URL: https://api.flowentra.app${' '.repeat(25)}║
╠══════════════════════════════════════════════════════════════════╣
║  SUMMARY${' '.repeat(55)}║
║  ${'─'.repeat(59)}    ║
║  Total Tests: ${results.length}    │ ✓ Passed: ${passed}   │ ✗ Failed: ${failed}    │ ⊘ Skipped: ${skipped}  ║
╚══════════════════════════════════════════════════════════════════╝

`;

  const categories = getTestCategories();
  
  categories.forEach(category => {
    const categoryTests = results.filter(r => r.category === category);
    const catPassed = categoryTests.filter(r => r.status === 'passed').length;
    const catFailed = categoryTests.filter(r => r.status === 'failed').length;
    const catSkipped = categoryTests.filter(r => r.status === 'skipped').length;

    log += `┌─────────────────────────────────────────────────────────────────┐
│ ${category.padEnd(63)}│
│ Tests: ${categoryTests.length} │ ✓ ${catPassed} │ ✗ ${catFailed} │ ⊘ ${catSkipped}${' '.repeat(40)}│
└─────────────────────────────────────────────────────────────────┘
`;

    categoryTests.forEach(result => {
      const status = result.status === 'passed' ? '✓ [PASSED ]' :
                     result.status === 'failed' ? '✗ [FAILED ]' : '⊘ [SKIPPED]';
      const httpStatus = result.httpStatus ? `HTTP ${result.httpStatus}` : '';
      const duration = result.duration ? `${Math.round(result.duration)}ms` : '';
      
      log += `  ${status} ${result.name}
`;
      if (httpStatus || duration) {
        log += `     ${httpStatus.padEnd(10)} ${duration}
`;
      }
      if (result.details) {
        log += `     Details: ${result.details}
`;
      }
      if (result.error) {
        const errorStr = typeof result.error === 'string' 
          ? result.error 
          : typeof result.error === 'object' && result.error !== null 
            ? JSON.stringify(result.error) 
            : 'Unknown error';
        log += `     ERROR: ${errorStr}
`;
      }
      log += `
`;
    });
  });

  const failedTests = results.filter(r => r.status === 'failed');
  if (failedTests.length > 0) {
    log += `
╔══════════════════════════════════════════════════════════════════╗
║                      FAILED TESTS SUMMARY                          ║
╠══════════════════════════════════════════════════════════════════╣
`;
    failedTests.forEach(test => {
      // Handle error that might be an object or string
      const errorStr = typeof test.error === 'string' 
        ? test.error 
        : typeof test.error === 'object' && test.error !== null 
          ? JSON.stringify(test.error) 
          : 'Unknown error';
      const truncatedError = errorStr.substring(0, 60);
      log += `║ ✗ ${test.category} > ${test.name}
║   Error: ${truncatedError}${errorStr.length > 60 ? '...' : ''}
║
`;
    });
    log += `╚══════════════════════════════════════════════════════════════════╝
`;
  }

  log += `
═══════════════════════════════════════════════════════════════════
                         END OF REPORT
═══════════════════════════════════════════════════════════════════
`;

  return log;
};

// Test runner class
export class ApiTestRunner {
  private results: Map<string, TestResult> = new Map();
  private onUpdate?: (results: TestResult[]) => void;

  constructor(onUpdate?: (results: TestResult[]) => void) {
    this.onUpdate = onUpdate;
  }

  reset() {
    this.results.clear();
    Object.keys(testDataIds).forEach(key => delete testDataIds[key]);
    this.notifyUpdate();
  }

  private notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate(Array.from(this.results.values()));
    }
  }

  private updateResult(id: string, update: Partial<TestResult>) {
    const current = this.results.get(id);
    if (current) {
      this.results.set(id, { ...current, ...update });
      this.notifyUpdate();
    }
  }

  async runAllTests(autoCleanup: boolean = true): Promise<TestResult[]> {
    // Store auto-cleanup preference for tests to access
    (window as any).__testAutoCleanup = autoCleanup;
    
    // Clear test data
    Object.keys(testDataIds).forEach(key => delete testDataIds[key]);
    
    // Initialize all tests as pending
    for (const test of allTests) {
      this.results.set(test.id, {
        id: test.id,
        name: test.name,
        category: test.category,
        status: 'pending',
      });
    }
    this.notifyUpdate();

    const testMap = new Map(allTests.map((t) => [t.id, t]));
    const completedTests = new Set<string>();

    const runTest = async (testDef: TestDefinition): Promise<void> => {
      if (completedTests.has(testDef.id)) return;

      if (testDef.dependsOn) {
        for (const depId of testDef.dependsOn) {
          const dep = testMap.get(depId);
          if (dep && !completedTests.has(depId)) {
            await runTest(dep);
          }
          const depResult = this.results.get(depId);
          if (depResult?.status === 'failed') {
            this.updateResult(testDef.id, {
              status: 'skipped',
              details: `Skipped: dependency "${depId}" failed`,
            });
            completedTests.add(testDef.id);
            return;
          }
        }
      }

      this.updateResult(testDef.id, { status: 'running' });
      const startTime = performance.now();

      try {
        const result = await testDef.test();
        const duration = performance.now() - startTime;

        this.updateResult(testDef.id, {
          status: result.success ? 'passed' : 'failed',
          duration,
          details: result.details,
          error: result.error,
          httpStatus: result.httpStatus,
          responseSize: result.responseSize,
          requestData: result.requestData,
          responseData: result.responseData,
          timestamp: new Date(),
        });
      } catch (error) {
        const duration = performance.now() - startTime;
        this.updateResult(testDef.id, {
          status: 'failed',
          duration,
          error: `Exception: ${String(error)}`,
          timestamp: new Date(),
        });
      }

      completedTests.add(testDef.id);
    };

    for (const test of allTests) {
      await runTest(test);
    }

    return Array.from(this.results.values());
  }

  async runTestsByCategory(category: string): Promise<TestResult[]> {
    const categoryTests = allTests.filter((t) => t.category === category);
    
    for (const test of categoryTests) {
      this.results.set(test.id, {
        id: test.id,
        name: test.name,
        category: test.category,
        status: 'pending',
      });
    }
    this.notifyUpdate();

    for (const test of categoryTests) {
      this.updateResult(test.id, { status: 'running' });
      const startTime = performance.now();

      try {
        const result = await test.test();
        const duration = performance.now() - startTime;

        this.updateResult(test.id, {
          status: result.success ? 'passed' : 'failed',
          duration,
          details: result.details,
          error: result.error,
          httpStatus: result.httpStatus,
          responseSize: result.responseSize,
          requestData: result.requestData,
          responseData: result.responseData,
          timestamp: new Date(),
        });
      } catch (error) {
        const duration = performance.now() - startTime;
        this.updateResult(test.id, {
          status: 'failed',
          duration,
          error: `Exception: ${String(error)}`,
          timestamp: new Date(),
        });
      }
    }

    return Array.from(this.results.values());
  }

  getResults(): TestResult[] {
    return Array.from(this.results.values());
  }
}
