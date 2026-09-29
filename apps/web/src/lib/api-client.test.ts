import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, onSessionEvent, setAccessToken } from './api-client';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    setAccessToken(null);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('sends the access token and client header', async () => {
    setAccessToken('token-1');
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));

    await apiRequest('/users', { query: { page: 2, search: '' } });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/v1/users?page=2');
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-1');
    expect(headers['X-SkoolLedger-Client']).toBe('web');
  });

  it('refreshes once on 401 and retries the request with the new token', async () => {
    setAccessToken('expired');
    fetchMock
      .mockResolvedValueOnce(json(401, { statusCode: 401, error: 'Unauthorized', message: 'x' }))
      .mockResolvedValueOnce(json(200, { accessToken: 'fresh', expiresIn: 900, user: {} }))
      .mockResolvedValueOnce(json(200, { items: [] }));

    const result = await apiRequest<{ items: unknown[] }>('/users');

    expect(result).toEqual({ items: [] });
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/v1/auth/refresh');
    const retryHeaders = fetchMock.mock.calls[2]![1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer fresh');
  });

  it('signals session expiry when the refresh fails', async () => {
    const events: string[] = [];
    const unsubscribe = onSessionEvent((e) => events.push(e.type));
    fetchMock
      .mockResolvedValueOnce(json(401, { statusCode: 401, error: 'Unauthorized', message: 'x' }))
      .mockResolvedValueOnce(json(401, { statusCode: 401, error: 'Unauthorized', message: 'x' }));

    await expect(apiRequest('/users')).rejects.toBeInstanceOf(ApiError);
    expect(events).toContain('expired');
    unsubscribe();
  });

  it('exposes field errors from validation failures', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Some fields are invalid.',
        fieldErrors: { email: ['Enter a valid email address'] },
      }),
    );

    const error = await apiRequest('/users', { method: 'POST', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors).toEqual({ email: ['Enter a valid email address'] });
  });

  it('reports network failures in plain language', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(apiRequest('/users')).rejects.toThrow(/Cannot reach the SkoolLedger server/);
  });
});
