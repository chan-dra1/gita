import { TTSProviderName } from '../types';

/**
 * App configuration.
 *
 * ⚠️  Replace API keys with your own before building.
 *     For production, use expo-constants or env variables.
 */
export const Config = {
    // ─── Gemini AI ─────────────────────────────────────────────
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    GEMINI_MODEL: 'gemini-2.0-flash', // fast + cheap

    // ─── TTS Provider ─────────────────────────────────────────
    TTS_PROVIDER: 'google' as TTSProviderName,
    TTS_API_KEY: process.env.EXPO_PUBLIC_TTS_API_KEY || '',

    // ElevenLabs-specific (only if TTS_PROVIDER === 'elevenlabs')
    ELEVENLABS_VOICE_ID: process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || '',

    // ─── Audio CDN (hosted on Firebase Storage) ──────────────
    AUDIO_CDN_URL: 'https://storage.googleapis.com/gita-app-390d7.firebasestorage.app/audio',

    // ─── Audio Cache ───────────────────────────────────────────
    AUDIO_CACHE_DIR: 'gita_audio/',

    // ─── RevenueCat ──────────────────────────────────────────
    REVENUECAT_API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '',
    ENTITLEMENT_ID: 'Gita Pro',

    // ─── Notification Defaults ────────────────────────────────
    DEFAULT_NOTIFICATION_HOUR: 6,
    DEFAULT_NOTIFICATION_MINUTE: 30,

    // ─── Store links (share card + onboarding taps) ──────────
    /** Shown on share art + used when App / Play URLs are unset. */
    STORE_WEB_LANDING_URL: 'https://gita-rouge-tau.vercel.app/download',
    APP_STORE_URL: process.env.EXPO_PUBLIC_APP_STORE_URL || '',
    PLAY_STORE_URL: process.env.EXPO_PUBLIC_PLAY_STORE_URL || '',
};
