/**
 * Shared selector for the useEmployees() query result.
 *
 * The HR employees endpoint may return either:
 *   - an Array<EmployeeRow>, or
 *   - a paginated envelope { data: EmployeeRow[], ... }
 *
 * Both EmployeeList and HRDashboard MUST go through this helper so the
 * headcount/KPIs in the dashboard always agree with the rows shown in
 * the list. Diverging here is the root cause of "Total employees: 0
 * while the list shows 1" bugs.
 */
export function selectEmployeeRows(source: unknown): any[] {
  if (Array.isArray(source)) return source;
  if (source && typeof source === 'object') {
    const data = (source as { data?: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}
