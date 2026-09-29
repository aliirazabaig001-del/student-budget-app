import { API_ERROR_CODES, type ApiErrorBody, type LoginResponse } from '@skoolledger/shared';

export const API_BASE = '/api/v1';

/** Error thrown for any non-2xx API response. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = 'ApiError';
  }

  get fieldErrors(): Record<string, string[]> {
    return this.body.fieldErrors ?? {};
  }
}

type SessionListener = (event: SessionEvent) => void;
export type SessionEvent =
  | { type: 'refreshed'; response: LoginResponse }
  | { type: 'expired' }
  | { type: 'password-change-required' };

/**
 * The access token lives only in memory (never localStorage), so it cannot be
 * read by injected scripts after the page is closed. The long-lived refresh
 * token is an httpOnly cookie the browser sends only to /api/v1/auth.
 */
let accessToken: string | null = null;
let refreshInFlight: Promise<LoginResponse | null> | null = null;
const listeners = new Set<SessionListener>();

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function onSessionEvent(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: SessionEvent): void {
  listeners.forEach((listener) => listener(event));
}

const CLIENT_HEADERS = { 'X-SkoolLedger-Client': 'web' };

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = {
      statusCode: response.status,
      error: response.statusText,
      message:
        response.status === 502 || response.status === 503 || response.status === 504
          ? 'The SkoolLedger server is not responding. Please check that it is running.'
          : 'Unexpected server response.',
    };
  }
  return new ApiError(response.status, body);
}

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers
 * share one request so a burst of 401s triggers a single refresh.
 */
export function refreshSession(): Promise<LoginResponse | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: CLIENT_HEADERS,
        credentials: 'same-origin',
      });
      if (!response.ok) {
        setAccessToken(null);
        return null;
      }
      const data = (await response.json()) as LoginResponse;
      setAccessToken(data.accessToken);
      emit({ type: 'refreshed', response: data });
      return data;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const send = () => {
    const headers: Record<string, string> = { ...CLIENT_HEADERS };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let body: BodyInit | undefined;
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    return fetch(`${API_BASE}${path}${toQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
      credentials: 'same-origin',
    });
  };

  let response: Response;
  try {
    response = await send();
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, {
      statusCode: 0,
      error: 'Network Error',
      message: 'Cannot reach the SkoolLedger server. Check the network connection.',
    });
  }

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send();
    } else {
      emit({ type: 'expired' });
    }
  }

  if (!response.ok) {
    const error = await parseError(response);
    if (error.body.code === API_ERROR_CODES.PASSWORD_CHANGE_REQUIRED) {
      emit({ type: 'password-change-required' });
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function toQueryString(query: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Human-friendly message for any error thrown by a request. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
