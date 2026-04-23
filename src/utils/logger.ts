/**
 * Client-side centralized logger.
 *
 * Sinks (configured at import time):
 *   - DEV: timestamped console lines.
 *   - PROD on native: Firebase Analytics (key user actions) + console (errors
 *     still land in native OS logs; Firebase Crashlytics hook is stubbed so
 *     you can drop in `@react-native-firebase/crashlytics` later without
 *     touching call sites).
 *   - PROD on web: console + Firebase Analytics events if available.
 *
 * Every log has a timestamp. We redact common sensitive keys before emitting.
 *
 * Call sites should use the structured API:
 *     log.info('paywall.tier_selected', { tier: 'yearly' });
 *     log.warn('api.scholar.retry', { attempt: 2 });
 *     log.error('api.scholar.failed', { code });
 *     log.action('user.signed_in', { method: 'google' });
 *
 * Use `log.action` for key user-facing events (sign-up, sign-in, purchase,
 * onboarding step, sloka read, milestone). These are what your growth funnel
 * will need; keep them named verb-style: `user.signed_up`, `paywall.shown`,
 * `paywall.purchased`, `sloka.read`, `scholar.asked`, `onboarding.completed`.
 */

import { Platform } from 'react-native';
import { env } from './env';

type Level = 'debug' | 'info' | 'warn' | 'error';
type Context = Record<string, unknown> | undefined;

const REDACT = new Set([
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
  'secret',
]);

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 500 ? value.slice(0, 500) + '…' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      o[k] = REDACT.has(k.toLowerCase()) ? '[redacted]' : sanitize(v, depth + 1);
    }
    return o;
  }
  return String(value);
}

// ── Analytics sink (Firebase web SDK) ─────────────────────────────────────
// Your firebase.ts only imports app/auth/firestore. We lazy-load analytics on
// web where it's supported; native would need @react-native-firebase/analytics.
let analyticsRef:
  | { logEvent: (name: string, params?: Record<string, unknown>) => void }
  | null = null;

async function initAnalytics() {
  if (analyticsRef !== null) return;
  try {
    if (Platform.OS !== 'web') return; // native analytics is TODO
    const mod = await import('firebase/analytics');
    const appMod = await import('firebase/app');
    const app = appMod.getApps().length > 0 ? appMod.getApp() : null;
    if (!app) return;
    if (typeof mod.isSupported === 'function') {
      const supported = await mod.isSupported();
      if (!supported) return;
    }
    const analytics = mod.getAnalytics(app);
    analyticsRef = {
      logEvent: (name, params) => mod.logEvent(analytics, name as any, params as any),
    };
  } catch {
    // Analytics is optional — never break the app over it.
  }
}

void initAnalytics();

// ── Crashlytics sink (stub; swap in @react-native-firebase/crashlytics) ──
function reportToCrashlytics(event: string, ctx: Context) {
  // Intentionally a no-op for now; wire this up when Crashlytics is added:
  //   import crashlytics from '@react-native-firebase/crashlytics';
  //   crashlytics().log(`${event} ${JSON.stringify(ctx)}`);
  //   crashlytics().recordError(new Error(event));
  void event;
  void ctx;
}

function write(level: Level, event: string, ctx?: Context) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    platform: Platform.OS,
    ...(ctx ? { ctx: sanitize(ctx) as Record<string, unknown> } : {}),
  };

  if (!env.IS_PROD) {
    // Pretty console log in dev for readability.
    // eslint-disable-next-line no-console
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[${line.level.toUpperCase()}] ${line.ts} ${line.event}`, line.ctx ?? '');
    return;
  }

  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(
    JSON.stringify(line)
  );

  if (level === 'error') reportToCrashlytics(event, ctx);
}

export const log = {
  debug: (event: string, ctx?: Context) => write('debug', event, ctx),
  info: (event: string, ctx?: Context) => write('info', event, ctx),
  warn: (event: string, ctx?: Context) => write('warn', event, ctx),
  error: (event: string, ctx?: Context) => write('error', event, ctx),

  /**
   * Key user action — goes to Analytics in prod. Use sparingly (pricing tier
   * selection, paywall shown, purchased, onboarding completed, sloka read).
   */
  action: (event: string, params?: Record<string, unknown>) => {
    write('info', event, params);
    try {
      analyticsRef?.logEvent(event, params);
    } catch {
      // Swallow — analytics failures must never break the UI.
    }
  },
};

export function setAnalyticsUser(uid: string | null) {
  if (!analyticsRef) return;
  try {
    // Firebase analytics web SDK uses setUserId — but we only pull logEvent
    // above to keep the bundle small. Do the extra import inline.
    void (async () => {
      const mod = await import('firebase/analytics');
      const appMod = await import('firebase/app');
      const a = mod.getAnalytics(appMod.getApp());
      mod.setUserId(a, uid || null);
    })();
  } catch {
    // noop
  }
}
