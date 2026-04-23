/**
 * Centralized structured logger.
 *
 * Every log line is a single JSON object with a timestamp, level, event name,
 * and arbitrary context. Vercel's log viewer and any downstream sink (Datadog,
 * Logtail, BetterStack) can parse these directly.
 *
 * Never log raw bodies, API keys, tokens, or full prompts. The `sanitize`
 * helper scrubs anything that looks sensitive and truncates long strings so a
 * single verbose request can't fill the log budget.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: Level = ((process.env.LOG_LEVEL as Level) || 'info') as Level;

const REDACT_KEYS = new Set([
  'password',
  'pass',
  'pwd',
  'token',
  'idtoken',
  'id_token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'x-api-key',
  'privatekey',
  'private_key',
  'secret',
  'x-goog-api-key',
]);

const MAX_STRING = 500;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated: depth]';
  if (value == null) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + '…' : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = '[redacted]';
      } else {
        out[k] = sanitize(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

function write(level: Level, event: string, context?: Record<string, unknown>) {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(context ? { ctx: sanitize(context) as Record<string, unknown> } : {}),
  };
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  // Single-line JSON so log aggregators can parse each line.
  fn(JSON.stringify(line));
}

export const logger = {
  debug: (event: string, ctx?: Record<string, unknown>) => write('debug', event, ctx),
  info: (event: string, ctx?: Record<string, unknown>) => write('info', event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => write('warn', event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => write('error', event, ctx),
};

/** Generate a short request id to correlate client ↔ server ↔ upstream. */
export function newRequestId(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}
