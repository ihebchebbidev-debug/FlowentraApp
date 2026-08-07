/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate concurrent GET requests to the same endpoint.
 * If a request for URL X is already in-flight and another call for URL X
 * comes in, the second caller shares the same Promise instead of firing
 * a duplicate network request.
 * 
 * This is transparent to callers — same API, same return type.
 * Only GET (read) requests are deduplicated; mutations always execute.
 */

const inflightRequests = new Map<string, Promise<Response>>();

/**
 * Wraps a fetch call with deduplication for GET requests.
 * Non-GET requests pass through unchanged.
 */
export function dedupFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  
  // Only dedup GET requests — mutations must always execute
  if (method !== 'GET') {
    return fetch(input, init);
  }

  const key = typeof input === 'string' ? input : input.toString();

  // If an identical request is already in-flight, return a clone
  const existing = inflightRequests.get(key);
  if (existing) {
    return existing.then(res => res.clone());
  }

  // Fire the request and store the promise.
  // We store the response and always return clones so the stored
  // response body is never consumed — each caller gets their own stream.
  const promise = fetch(input, init).then(response => {
    // Keep the entry around briefly so concurrent callers can still clone
    setTimeout(() => inflightRequests.delete(key), 100);
    return response;
  }).catch(error => {
    inflightRequests.delete(key);
    throw error;
  });

  inflightRequests.set(key, promise);

  // Return a clone for the first caller too, keeping the stored response pristine
  return promise.then(res => res.clone());
}

/**
 * Clear all in-flight tracking (useful for logout/cleanup).
 */
export function clearInflightRequests(): void {
  inflightRequests.clear();
}
