// Supabase client for edge function calls
// This project uses Lovable Cloud for edge functions

// Base URL for functions. Prefer an explicit functions base for flexibility.
export const functionsBase = import.meta.env.VITE_FUNCTIONS_BASE || import.meta.env.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Helper to call edge functions
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: unknown
): Promise<T> {
  if (!functionsBase) {
    throw new Error("Functions base URL is not configured. Set VITE_FUNCTIONS_BASE or VITE_SUPABASE_URL in your environment.");
  }

  const url = `${functionsBase.replace(/\/$/, '')}/functions/v1/${functionName}`;
  let response: Response;
  try {
    response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(supabaseKey && { Authorization: `Bearer ${supabaseKey}` }),
    },
    body: JSON.stringify(body),
  });
  } catch (err: any) {
    // Network/DNS errors surface here (e.g. ERR_NAME_NOT_RESOLVED)
    throw new Error(`Failed to reach functions host (${url}): ${err.message || err}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}
