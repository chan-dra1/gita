/**
 * Rate limiter — dual backend.
 *
 *  1. In-memory sliding window. Good for a single Vercel region and low QPS,
 *     but resets on every cold start and does not share state across lambdas.
 *     Fine for closing brute-force windows on a single auth attempt but
 *     imperfect for scale.
 *
 *  2. Upstash Redis REST (optional, auto-enabled when UPSTASH_REDIS_URL and
 *     UPSTASH_REDIS_TOKEN are set). Strongly consistent across lambdas and
 *     regions. This is what we run in production.
 *
 * Call shape:
 *     const res = await limit({ key: `scholar:${uid}`, limit: 20, windowSec: 60 });
 *     if (!res.ok) throw new AppError('RATE_LIMITED', res.message, { retryable: true });
 */

import { getEnv } from './env';
import { AppError } from './errors';
import { logger } from './logger';

export interface LimitInput {
  /** Stable identity for the bucket. e.g. `scholar:${uid}` or `auth:${ip}`. */
  key: string;
  /** Requests allowed per window. */
  limit: number;
  /** Window size in seconds. */
  windowSec: number;
}

export interface LimitResult {
  ok: boolean;
  remaining: number;
  resetSec: number;
  message?: string;
}

// ── In-memory backend ─────────────────────────────────────────────────────
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(input: LimitInput): LimitResult {
  const now = Date.now();
  const existing = memory.get(input.key);
  if (!existing || existing.resetAt <= now) {
    memory.set(input.key, { count: 1, resetAt: now + input.windowSec * 1000 });
    return { ok: true, remaining: input.limit - 1, resetSec: input.windowSec };
  }
  existing.count += 1;
  const remaining = Math.max(0, input.limit - existing.count);
  const resetSec = Math.max(0, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > input.limit) {
    return {
      ok: false,
      remaining: 0,
      resetSec,
      message: `Too many requests. Try again in ${resetSec}s.`,
    };
  }
  return { ok: true, remaining, resetSec };
}

// ── Upstash Redis backend ────────────────────────────────────────────────
async function upstashLimit(input: LimitInput): Promise<LimitResult> {
  const env = getEnv();
  if (!env.UPSTASH_REDIS_URL || !env.UPSTASH_REDIS_TOKEN) {
    return memoryLimit(input); // graceful fallback
  }

  // INCR + EXPIRE NX pipeline in a single call.
  const body = [
    ['INCR', input.key],
    ['EXPIRE', input.key, String(input.windowSec), 'NX'],
    ['PTTL', input.key],
  ];

  let resp: Response;
  try {
    resp = await fetch(`${env.UPSTASH_REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logger.warn('ratelimit.upstash.fetch_failed', { key: input.key });
    return memoryLimit(input); // fail open to not take down the app
  }

  if (!resp.ok) {
    logger.warn('ratelimit.upstash.bad_status', { key: input.key, status: resp.status });
    return memoryLimit(input);
  }

  const parsed = (await resp.json().catch(() => null)) as
    | Array<{ result?: number | string }>
    | null;
  if (!parsed || parsed.length < 3) return memoryLimit(input);

  const count = Number(parsed[0]?.result ?? 0);
  const pttl = Number(parsed[2]?.result ?? input.windowSec * 1000);
  const resetSec = Math.max(0, Math.ceil(pttl / 1000));
  const remaining = Math.max(0, input.limit - count);

  if (count > input.limit) {
    return {
      ok: false,
      remaining: 0,
      resetSec,
      message: `Too many requests. Try again in ${resetSec}s.`,
    };
  }
  return { ok: true, remaining, resetSec };
}

// ── Public API ───────────────────────────────────────────────────────────

export async function limit(input: LimitInput): Promise<LimitResult> {
  return upstashLimit(input);
}

/** Throw AppError('RATE_LIMITED') if the caller has exceeded their budget. */
export async function enforce(input: LimitInput): Promise<LimitResult> {
  const r = await limit(input);
  if (!r.ok) {
    throw new AppError('RATE_LIMITED', r.message || 'Too many requests', {
      details: { resetSec: r.resetSec },
      retryable: true,
    });
  }
  return r;
}

/** Extract a best-guess client IP from headers for IP-scoped buckets. */
export function clientIp(headers: Record<string, string | string[] | undefined>): string {
  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0]!.trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0]!.split(',')[0]!.trim();
  const real = headers['x-real-ip'];
  if (typeof real === 'string') return real;
  return 'unknown';
}
