const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const TOKEN_STORAGE_KEY = 'jira_auth_token';

let inMemoryToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);

export function setAuthToken(token: string) {
  inMemoryToken = token;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  inMemoryToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredAuthToken(): string | null {
  return inMemoryToken ?? localStorage.getItem(TOKEN_STORAGE_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredAuthToken();
  const mergedHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };
  if (token && !(mergedHeaders as Record<string, string>).Authorization) {
    (mergedHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: mergedHeaders,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;

  // Some endpoints return 200 with an empty body.
  // Avoid JSON.parse errors for those responses.
  const contentLength = res.headers.get('content-length');
  const contentType = res.headers.get('content-type') ?? '';
  if (contentLength === '0') return undefined as T;
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!text.trim()) return undefined as T;
    return text as T;
  }

  const text = await res.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
