# Security Hardening — Gita Pro

This document maps every request in the hardening scope to the concrete files where it is implemented.

---

## 1 · Structured error handling on all API routes

**Where:** `api/_lib/errors.ts` — `AppError` enum (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `RATE_LIMITED`, `UPSTREAM_ERROR`, `INTERNAL_ERROR`).

Every route handler throws typed `AppError`s. A wrapper in `api/_lib/cors.ts` (`withHandler`) catches anything thrown and runs it through `toSafeJson`, which guarantees the response shape:

```jsonc
{
  "ok": false,
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "The scholar is temporarily unavailable. Please try again.",
    "retryable": true,
    "requestId": "mqx0zp-hq5p7b"
  }
}
```

The client mirror is `src/utils/apiClient.ts` — `ApiError` with the same code enum, so UI can branch on `err.code` without string parsing.

## 2 · Safe JSON errors — never expose stack traces

**Where:** `api/_lib/errors.ts` — `toSafeJson`.

`AppError` messages are safe user-facing strings. Anything else thrown is demoted to a generic `INTERNAL_ERROR` with the fixed message `"Something went wrong on our side. Please try again."`. The real message and stack go only to the server logger (`logger.error('api.error.unhandled', …)`). The wrapper is the only way to return an error from a route, so no stack trace can leak.

## 3 · Validate env variables at startup — crash early if missing

**Where:**
- Server: `api/_lib/env.ts` throws at module import if any of `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `TTS_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` is missing. Vercel fails the function cold-start, the client gets a clean 500, and Vercel logs show the missing-key list (names only, no values).
- Client: `src/utils/env.ts` validates required `EXPO_PUBLIC_*` at import. In `__DEV__` it throws (red-screen), in prod it logs `error` so the app can boot degraded instead of showing a white screen to a paying user.
- The root layout imports `src/utils/env` for its side effect (`app/_layout.tsx`), so validation runs before any screen mounts.

## 4 · Rate limiting on auth + API endpoints

**Where:** `api/_lib/rateLimit.ts` — dual backend.

- Default: in-memory sliding window (single-instance, no dependencies).
- Optional Upstash Redis REST backend, auto-enabled when `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN` are set. Strongly consistent across regions — use this for production.

Each route calls `enforce(...)` twice: per-UID primary + per-IP secondary.

| Route | Per-user / min | Per-IP / min |
|---|---|---|
| `/api/scholar` | 20 | 40 |
| `/api/mood-sloka` | 15 | 30 |
| `/api/tts` | 30 | 60 |

Exceeding returns `429` with a `retryable: true` response. Clients with our `apiClient` retry with exponential backoff; others see a clean error.

Auth protection: every route calls `requireUser(req)` before it does anything else. A request without a valid Firebase ID token never reaches the upstream API.

## 5 · Centralized logging with timestamps

**Where:**
- Server: `api/_lib/logger.ts`. Every log is a single-line JSON object with `ts`, `level`, `event`, and `ctx`. The `withHandler` wrapper logs `api.request` and `api.response` for every call, plus per-route events (`scholar.success`, `mood.upstream.bad_status`, etc.). Sensitive keys are redacted by a built-in keylist (`authorization`, `token`, `api_key`, `private_key`, etc.). Long strings are truncated so one verbose request cannot blow the log budget.
- Client: `src/utils/logger.ts` — the `log` object. In dev it formats pretty console output. In prod, key user actions (`log.action('paywall.purchased', {...})`) are forwarded to Firebase Analytics; errors have a Crashlytics hook stubbed for when you add `@react-native-firebase/crashlytics`. Same redact + truncate logic as the server.

`log.action` is the recommended name for user-journey events — they land in Analytics and power the growth funnel. Use `log.info/warn/error` for diagnostic events.

## 6 · Loading states, retries, fallback UI

**Where:**
- `src/components/LoadingState.tsx` — consistent inline / full-screen spinner with accessibility label.
- `src/components/FallbackView.tsx` — recoverable-error surface with a Retry button; friendly messages per `ApiError` code.
- `src/components/ErrorBoundary.tsx` — catches uncaught render errors and shows a calm "Try again" screen. In dev it also prints the stack. Wired into `app/_layout.tsx` around the whole tree.
- `src/hooks/useAsync.ts` — "load/refresh data" hook with `loading`, `error`, `retry`, and automatic abort on unmount. Pairs with `LoadingState` + `FallbackView`.
- `src/utils/apiClient.ts` — fetch wrapper that attaches the Firebase ID token, retries on network / 5xx / 429 with exponential backoff + jitter (300ms, 900ms, 2100ms), and bubbles a typed `ApiError` for anything non-retryable.

---

## What's NOT yet refactored (flagged for follow-up)

- **`src/utils/audio.ts`** still calls Google TTS directly on the client via `Config.TTS_API_KEY`. The `/api/tts` route is built and deployed-ready — you need to replace the direct Google Cloud TTS fetch in `audio.ts` with `api.post('/api/tts', { text, languageCode, voice })`. Estimated effort: 15 minutes.
- **Account deletion flow** (`/api/account/delete`) is not implemented. Required for App Store + Play Store compliance — see `docs/STORE_LAUNCH_CHECKLIST.md § 3`.
- **Web paywall bypass (C1 in `PAYWALL_AUDIT.md`)** — ship-blocking for web. Either add a Stripe Checkout flow or hide the Continue button on web and show App/Play badges only.

---

## Required env vars checklist

Before deploying, set these in the Vercel dashboard (Project → Settings → Environment Variables). A missing value causes `/api/*` to 500 on cold start.

```
GEMINI_API_KEY          <Gemini key>
CLAUDE_API_KEY          <Anthropic key>
TTS_API_KEY             <Google Cloud TTS key>
FIREBASE_PROJECT_ID     gita-app-390d7
FIREBASE_CLIENT_EMAIL   <service-account email>
FIREBASE_PRIVATE_KEY    <"-----BEGIN PRIVATE KEY-----\n…">
UPSTASH_REDIS_URL       <optional but recommended>
UPSTASH_REDIS_TOKEN     <optional but recommended>
LOG_LEVEL               info
```

And in Expo project secrets (EAS) for the mobile binary:

```
EXPO_PUBLIC_API_BASE_URL=https://gita-rouge-tau.vercel.app
EXPO_PUBLIC_FIREBASE_API_KEY=…
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=…
EXPO_PUBLIC_FIREBASE_PROJECT_ID=…
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=…
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
EXPO_PUBLIC_FIREBASE_APP_ID=…
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=…
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=…
```

`EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_TTS_API_KEY`, and any other former secret `EXPO_PUBLIC_*` are no longer needed — they were publishing your keys into the bundle. Delete them from Expo secrets and rotate them in the respective consoles (Gemini, Google Cloud TTS, Anthropic) before launch.
