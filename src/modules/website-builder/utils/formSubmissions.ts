/**
 * Form Submissions Storage — localStorage-based for now, ready for backend migration.
 */

export interface FormSubmission {
  id: string;
  siteId: string;
  formId: string;          // component ID of the form
  formLabel: string;       // label of the form component
  pageTitle: string;       // page where the form lives
  data: Record<string, any>;
  submittedAt: string;
  webhookStatus?: 'pending' | 'success' | 'failed';
  webhookResponse?: string;
  source?: string;         // e.g. "website", "preview"
}

const STORAGE_KEY = 'website_builder_form_submissions';

export function loadSubmissions(siteId?: string): FormSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: FormSubmission[] = raw ? JSON.parse(raw) : [];
    return siteId ? all.filter(s => s.siteId === siteId) : all;
  } catch {
    return [];
  }
}

export function saveSubmission(submission: FormSubmission): void {
  const all = loadSubmissions();
  all.unshift(submission);
  // Keep only last 500 submissions
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 500)));
}

export function deleteSubmission(id: string): void {
  const all = loadSubmissions();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(s => s.id !== id)));
}

export function clearSubmissions(siteId: string, formId?: string): void {
  const all = loadSubmissions();
  const filtered = all.filter(s => {
    if (s.siteId !== siteId) return true;
    if (formId && s.formId !== formId) return true;
    return false;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function exportSubmissionsCSV(submissions: FormSubmission[]): string {
  if (!submissions.length) return '';
  
  // Collect all unique field keys
  const fieldKeys = new Set<string>();
  submissions.forEach(s => Object.keys(s.data).forEach(k => fieldKeys.add(k)));
  const fields = Array.from(fieldKeys);
  
  const headers = ['Date', 'Page', 'Form', ...fields, 'Webhook Status'];
  const rows = submissions.map(s => [
    new Date(s.submittedAt).toLocaleString(),
    s.pageTitle,
    s.formLabel,
    ...fields.map(f => String(s.data[f] ?? '')),
    s.webhookStatus || 'N/A',
  ]);
  
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

/**
 * Fire a webhook with the form data.
 */
export async function fireWebhook(
  url: string,
  data: Record<string, any>,
  method: 'POST' | 'GET' = 'POST',
  headers?: Record<string, string>,
): Promise<{ success: boolean; status: number; body: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    });
    const body = await res.text();
    return { success: res.ok, status: res.status, body };
  } catch (err: any) {
    return { success: false, status: 0, body: err.message || 'Network error' };
  }
}
