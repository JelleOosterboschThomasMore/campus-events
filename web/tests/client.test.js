import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from '../src/api/client.js';

const jsonResponse = (status, body) => ({ status, ok: status < 400, json: async () => body });

describe('api client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prefixes /api and returns the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, [{ id: 1 }]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await request('/events');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/events');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('throws an ApiError with the server message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Event with id 9 not found' } })));

    await expect(request('/events/9')).rejects.toMatchObject({ status: 404, message: 'Event with id 9 not found' });
    await expect(request('/events/9')).rejects.toBeInstanceOf(ApiError);
  });

  it('returns null for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204, ok: true }));

    expect(await request('/events/1', { method: 'DELETE' })).toBeNull();
  });
});
