import { API_BASE_URL } from '../config/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Set the prototype explicitly for custom errors in TS
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Enhanced fetch wrapper for HampiStays
 * Handles base URL, auth headers, safe JSON parsing, timeouts, and retries.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 1, timeoutMs = 15000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      // Retry on 5xx server errors or 429 Too Many Requests
      if (!res.ok && (res.status >= 500 || res.status === 429) && i < retries) {
        await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, i), 5000))); // Exponential backoff max 5s
        continue;
      }
      return res;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out after ' + (timeoutMs/1000) + 's', 408);
      }
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, i), 5000)));
    }
  }
  throw new Error('Unreachable');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;
  
  // 1. Construct URL with params
  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // 2. Add Auth Header
  const token = localStorage.getItem('hampi-token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  // 3. Perform Fetch
  const requestHeaders = new Headers(defaultHeaders);
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => requestHeaders.set(key, value));
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => requestHeaders.set(key, value));
    } else {
      Object.entries(headers).forEach(([key, value]) => requestHeaders.set(key, value as string));
    }
  }

  const response = await fetchWithRetry(url, { ...rest, headers: requestHeaders });

  // 4. Handle Empty or Non-JSON Responses safely
  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (err) {
      // This is exactly where "Unexpected end of JSON input" happens
      console.error('Failed to parse JSON response:', err);
      throw new ApiError('The server returned an invalid response format.', response.status);
    }
  } else {
    // If it's not JSON, we still might want to know if it's an error
    const text = await response.text();
    data = { message: text };
  }

  // 5. Handle HTTP Errors
  if (!response.ok) {
    // If the token is invalid or expired, notify the app (except for auth requests)
    if ((response.status === 401 || response.status === 403) && !url.includes('/auth/')) {
      window.dispatchEvent(new CustomEvent('hampi-unauthorized'));
    }
    
    let message = data?.error || data?.message || '';
    if (!message) {
      if (response.status === 404) {
        message = `404 Not Found: ${url}`;
      } else {
        message = 'An unexpected error occurred';
      }
    }
    
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, body?: any, options?: RequestOptions) => request<T>(url, { ...options, method: 'DELETE', ...(body && { body: JSON.stringify(body) }) }),
};

