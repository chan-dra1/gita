import { TTSProviderName } from '../types';

/**
 * App configuration.
 *
 * Secret keys (Gemini, Claude, Google TTS) now live ONLY on the server and
 * are accessed via `src/utils/apiClient.ts` → `/api/*`.
 *
 * The `GEMINI_API_KEY` / `TTS_API_KEY` fields below are kept as *presence
 * flags* so legacy feature gates (e.g. "show premium-audio button") keep
 * compiling. They are intentionally non-secret placeholders — do NOT put a
 * real key here again. If you are adding a new upstream, put the key in
 * Vercel env vars and add a route under `api/`.
 */
export const Config = {
    // ─── Gemini AI (server-side only) ─────────────────────────
    /** Legacy presence flag. Real key is in Vercel `GEMINI_API_KEY`. */
    GEMINI_API_KEY: '__server_managed__',
    GEMINI_MODEL: 'gemini-2.0-flash',

    // ─── TTS Provider — server-managed ────────────────────────
    TTS_PROVIDER: 'google' as TTSProviderName,
    /** Legacy presence flag. Real key is in Vercel `TTS_API_KEY`. */
    TTS_API_KEY: '__server_managed__',

    /** Non-secret: the specific voice we request. */
    ELEVENLABS_VOICE_ID: process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || '',

    // ─── Audio CDN (hosted on Firebase Storage) ──────────────
    AUDIO_CDN_URL: 'https://storage.googleapis.com/gita-app-390d7.firebasestorage.app/audio',

    // ─── Audio Cache ───────────────────────────────────────────
    AUDIO_CACHE_DIR: 'gita_audio/',

    // ─── RevenueCat ──────────────────────────────────────────
    REVENUECAT_API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '',
    /** Public SDK key from RevenueCat → Project → API keys → Apple. */
    REVENUECAT_API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '',
    ENTITLEMENT_ID: 'Gita Pro',

    // ─── Notification Defaults ────────────────────────────────
    DEFAULT_NOTIFICATION_HOUR: 6,
    DEFAULT_NOTIFICATION_MINUTE: 30,

    // ─── Store links (share card + onboarding taps) ──────────
    /** Shown on share art + used when App / Play URLs are unset. */
    STORE_WEB_LANDING_URL: 'https://gita-rouge-tau.vercel.app/download',
    APP_STORE_URL: process.env.EXPO_PUBLIC_APP_STORE_URL || '',
    PLAY_STORE_URL: process.env.EXPO_PUBLIC_PLAY_STORE_URL || '',
    /** Must match app.json → expo.android.package (Play listing URL fallback). */
    ANDROID_PACKAGE_ID: 'com.alphawolf.gita',
};
