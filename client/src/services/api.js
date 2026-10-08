/**
 * Central API client.
 * - Base URL: VITE_API_URL (split deployments) or same-origin "/api" (dev proxy &
 *   production where Express serves the built app). No secrets live here — the
 *   session is an httpOnly cookie the browser manages automatically.
 */
const BASE = ((import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')) + '/api';

export class ApiError extends Error {
  constructor(message, status, errors, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || {};
    this.data = data;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      /* non-JSON response */
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status}).`, res.status, data?.errors, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body: body ?? {} }),
  del: (path) => request(path, { method: 'DELETE' }),
};
