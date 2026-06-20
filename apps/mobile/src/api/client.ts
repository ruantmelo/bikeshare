export type ApiErrorBody = {
  message?: string;
  error?: string;
};

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

export function setApiToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_URL environment variable.');
  }

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    const message = (data as ApiErrorBody | null)?.message ?? (data as ApiErrorBody | null)?.error ?? 'Não foi possível concluir a solicitação.';
    throw new Error(message);
  }

  return data as T;
}
