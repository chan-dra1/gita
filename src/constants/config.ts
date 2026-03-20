import { TTSProviderName } from '../types';

/**
 * App configuration.
 *
 * ⚠️  Replace API keys with your own before building.
 *     For production, use expo-constants or env variables.
 */
export const Config = {
    // ─── Gemini AI ─────────────────────────────────────────────
    GEMINI_API_KEY: 'AIzaSyC1fmHGmhXFIeK1wMP_eP-P8xGFjKq7bOA',
    GEMINI_MODEL: 'gemini-2.0-flash', // fast + cheap

    // ─── TTS Provider ─────────────────────────────────────────
    TTS_PROVIDER: 'google' as TTSProviderName,
    TTS_API_KEY: 'YOUR_TTS_API_KEY',

    // ElevenLabs-specific (only if TTS_PROVIDER === 'elevenlabs')
    ELEVENLABS_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // 'Rachel' - default

    // ─── Audio Cache ───────────────────────────────────────────
    AUDIO_CACHE_DIR: 'gita_audio/',

    // ─── Notification Defaults ────────────────────────────────
    DEFAULT_NOTIFICATION_HOUR: 6,
    DEFAULT_NOTIFICATION_MINUTE: 30,
} as const;
