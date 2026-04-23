/**
 * Client env validation.
 *
 * Expo bundles anything prefixed EXPO_PUBLIC_ into the JS bundle at build time.
 * We cannot hide those values — so our contract is:
 *   - SERVER secrets (Gemini, Claude, TTS, Firebase admin) must NEVER be in
 *     EXPO_PUBLIC_*. They live in Vercel env vars only.
 *   - EXPO_PUBLIC_ is reserved for *public* config: Firebase web config
 *     (already public by design), RevenueCat public SDK keys, and the API
 *     origin.
 *
 * At module import we check that every key this client actually needs is
 * populated. In dev we throw — which bubbles up as a red-screen error and
 * makes misconfiguration impossible to miss. In production we log a
 * structured error so the app boots in a degraded state rather than
 * showing a white screen to a paying user.
 */

import { Platform } from 'react-native';

export interface ClientEnv {
  API_BASE_URL: string;

  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;

  REVENUECAT_API_KEY_IOS: string;
  REVENUECAT_API_KEY_ANDROID: string;

  APP_STORE_URL: string;
  PLAY_STORE_URL: string;

  IS_PROD: boolean;
}

const REQUIRED_FOR_ALL: (keyof ClientEnv)[] = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_APP_ID',
  'API_BASE_URL',
];

const REQUIRED_FOR_NATIVE: (keyof ClientEnv)[] = [
  'REVENUECAT_API_KEY_IOS',
  'REVENUECAT_API_KEY_ANDROID',
];

function pick(raw: string | undefined, fallback = ''): string {
  return (raw ?? '').trim() || fallback;
}

function build(): ClientEnv {
  const env: ClientEnv = {
    // Default: same origin in prod web; mobile must set this explicitly.
    API_BASE_URL: pick(
      process.env.EXPO_PUBLIC_API_BASE_URL,
      Platform.OS === 'web' ? '' : 'https://gita-rouge-tau.vercel.app'
    ),
    FIREBASE_API_KEY: pick(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    FIREBASE_AUTH_DOMAIN: pick(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    FIREBASE_PROJECT_ID: pick(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    FIREBASE_STORAGE_BUCKET: pick(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    FIREBASE_MESSAGING_SENDER_ID: pick(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    FIREBASE_APP_ID: pick(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
    REVENUECAT_API_KEY_IOS: pick(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS),
    REVENUECAT_API_KEY_ANDROID: pick(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID),
    APP_STORE_URL: pick(process.env.EXPO_PUBLIC_APP_STORE_URL),
    PLAY_STORE_URL: pick(process.env.EXPO_PUBLIC_PLAY_STORE_URL),
    IS_PROD: process.env.NODE_ENV === 'production' || !__DEV__,
  };

  const missing: string[] = [];
  for (const k of REQUIRED_FOR_ALL) if (!env[k]) missing.push(k);
  if (Platform.OS !== 'web') {
    for (const k of REQUIRED_FOR_NATIVE) if (!env[k]) missing.push(k);
  }

  if (missing.length > 0) {
    const msg = `[env] Missing required EXPO_PUBLIC_* values: ${missing.join(', ')}`;
    if (__DEV__) {
      // Dev: crash loudly so misconfig is impossible to miss.
      throw new Error(msg);
    }
    // Prod: log and continue in degraded mode. Features that need these
    // values will individually surface friendly error UIs.
    // eslint-disable-next-line no-console
    console.error(msg);
  }

  return env;
}

export const env: ClientEnv = build();
