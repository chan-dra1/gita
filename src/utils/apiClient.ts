/**
 * Typed fetch client for our Vercel `/api/*` routes.
 *
 * Features:
 *   - Attaches the Firebase ID token (so requireUser on the server works).
 *   - Exponential-backoff retry on network errors / 5xx / 429 — bounded so
 *     a paying user never waits more than a few seconds.
 *   - Structured ApiError with a `code` matching the server's ErrorCode enum
 *     so UI can branch (`RATE_LIMITED` → countdown, `UNAUTHORIZED` → reauth).
 *   - Logs every retry and final outcome through the centralized logger.
 *
 * Usage:
 *     const { reply } = await api.post<{ reply: string }>('/api/scholar', {
 *       messages: [...],
 *     });
 */

import { env } from './env';
import { log } from './logger';
import { auth } from './firebase';

export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly requestId?: string;
  constructor(
    code: ApiErrorCode,
    message: string,
    opts: { status?: number; retryable?: boolean; requestId?: string } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = opts.status ?? 0;
    this.retryable = opts.retryable ?? false;
    this.requestId = opts.requestId;
  }
}

interface PostOptions {
  /** Max total attempts, including the first. Default 3. */
  maxAttempts?: number;
  /** Milliseconds for the fetch timeout. Default 20000. */
  timeoutMs?: number;
  /** Abort signal from the caller (e.g. screen unmount). */
  signal?: AbortSignal;
}

async function bearer(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(/* forceRefresh */ false);
  } catch {
    return null;
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new ApiError('NETWORK', 'Request aborted'));
    });
  });
}

async function doFetch(
  path: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  externalSignal?.addEventListener('abort', () => ctrl.abort());
  try {
    const url = env.API_BASE_URL ? `${env.API_BASE_URL}${path}` : path;
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseError(resp: Response): Promise<ApiError> {
  let data: any = null;
  try {
    data = await resp.json();
  } catch {
    // non-JSON upstream; fall through
  }
  const code = (data?.error?.code as ApiErrorCode) || mapStatusToCode(resp.status);
  const message =
    (data?.error?.message as string) ||
    friendlyFromStatus(resp.status);
  const retryable = Boolean(data?.error?.retryable) || resp.status >= 500 || resp.status === 429;
  return new ApiError(code, message, {
    status: resp.status,
    retryable,
    requestId: (resp.headers.get('x-request-id') ?? data?.error?.requestId) || undefined,
  });
}

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 405:
      return 'METHOD_NOT_ALLOWED';
    case 429:
      return 'RATE_LIMITED';
    case 502:
    case 503:
    case 504:
      return 'UPSTREAM_ERROR';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  }
}

function friendlyFromStatus(status: number): string {
  if (status === 401) return 'Please sign in again.';
  if (status === 429) return 'You are going too fast. Please try again in a moment.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Request failed.';
}

async function postWithRetry<T>(
  path: string,
  body: unknown,
  opts: PostOptions
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 20000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const token = await bearer();
      const resp = await doFetch(
        path,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        },
        timeoutMs,
        opts.signal
      );
      if (!resp.ok) {
        const err = await parseError(resp);
        if (!err.retryable || attempt === maxAttempts) throw err;
        log.warn('api.retry', { path, attempt, code: err.code, status: err.status });
      } else {
        const data = (await resp.json()) as T;
        if (attempt > 1) log.info('api.recovered', { path, attempt });
        return data;
      }
    } catch (e) {
      if (e instanceof ApiError && !e.retryable) throw e;
      lastErr = e;
      if (attempt === maxAttempts) break;
      log.warn('api.retry', { path, attempt, reason: (e as Error)?.message });
    }

    // Exponential backoff with jitter: 300ms, 900ms, 2100ms …
    const delay = 300 * (3 ** (attempt - 1)) + Math.floor(Math.random() * 200);
    await sleep(delay, opts.signal);
  }

  if (lastErr instanceof ApiError) throw lastErr;
  if (lastErr instanceof Error && lastErr.name === 'AbortError') {
    throw new ApiError('TIMEOUT', 'Request timed out. Please try again.');
  }
  throw new ApiError('NETWORK', 'Network unavailable. Please check your connection.');
}

export const api = {
  post: postWithRetry,
  async get<T>(path: string, opts: PostOptions = {}): Promise<T> {
    const resp = await doFetch(
      path,
      {
        method: 'GET',
        headers: {
          ...(await buildAuthHeader()),
        },
      },
      opts.timeoutMs ?? 10000,
      opts.signal
    );
    if (!resp.ok) throw await parseError(resp);
    return (await resp.json()) as T;
  },
};

async function buildAuthHeader(): Promise<Record<string, string>> {
  const token = await bearer();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
