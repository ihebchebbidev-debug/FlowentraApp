/**
 * Centralized form submission helper.
 * Uses formSubmissionsApi (backend) when available, falls back to localStorage.
 * All form blocks should import submitFormData from here instead of calling saveSubmission directly.
 */
import { formSubmissionsApi } from '../services/apiSupportServices';
import { saveSubmission, fireWebhook, FormSubmission } from './formSubmissions';

export interface SubmitFormOptions {
  siteId: string;
  siteSlug?: string;        // needed for public API submission
  formComponentId: string;
  formLabel: string;
  pageTitle: string;
  data: Record<string, any>;
  source?: string;
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
  webhookHeaders?: Record<string, string>;
  collectSubmissions?: boolean;
}

export interface SubmitFormResult {
  success: boolean;
  persisted: boolean;
  webhookStatus?: 'pending' | 'success' | 'failed';
  webhookResponse?: string;
  error?: string;
}

/**
 * Submit form data — fires webhook (if configured) and persists the submission.
 * Tries backend API first; falls back to localStorage on failure.
 */
export async function submitFormData(opts: SubmitFormOptions): Promise<SubmitFormResult> {
  const {
    siteId,
    siteSlug,
    formComponentId,
    formLabel,
    pageTitle,
    data,
    source = 'website',
    webhookUrl,
    webhookMethod = 'POST',
    webhookHeaders,
    collectSubmissions = true,
  } = opts;

  let webhookStatus: FormSubmission['webhookStatus'] = undefined;
  let webhookResponse: string | undefined;

  // 1) Fire webhook if configured
  if (webhookUrl) {
    try {
      const result = await fireWebhook(webhookUrl, data, webhookMethod, webhookHeaders);
      webhookStatus = result.success ? 'success' : 'failed';
      webhookResponse = result.body;
    } catch (err: any) {
      webhookStatus = 'failed';
      webhookResponse = err.message || 'Network error';
    }
  }

  // 2) Persist submission
  let persisted = !collectSubmissions; // if we aren't collecting, "persisted" is trivially satisfied
  if (collectSubmissions) {
    // Try backend API first
    let backendSaved = false;

    if (siteSlug) {
      // Public submission (no auth needed)
      try {
        const res = await formSubmissionsApi.submitPublic(siteSlug, {
          formComponentId,
          formLabel,
          pageTitle,
          data,
          source,
        });
        backendSaved = res.success;
      } catch {
        backendSaved = false;
      }
    }

    if (backendSaved) {
      persisted = true;
    } else {
      // Fallback to localStorage if backend unavailable or no slug
      try {
        saveSubmission({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          siteId,
          formId: formComponentId,
          formLabel,
          pageTitle,
          data,
          submittedAt: new Date().toISOString(),
          webhookStatus,
          webhookResponse,
          source,
        });
        persisted = true;
      } catch (err) {
        console.warn('[FormSubmission] localStorage fallback failed:', err);
        persisted = false;
      }
    }
  }

  // success requires: webhook didn't fail AND (we persisted OR a webhook succeeded)
  const webhookOk = webhookStatus === 'success';
  const success = webhookStatus !== 'failed' && (persisted || webhookOk);

  return {
    success,
    persisted,
    webhookStatus,
    webhookResponse,
    error: success ? undefined : (webhookStatus === 'failed' ? 'Webhook delivery failed' : 'Failed to save submission'),
  };
}
