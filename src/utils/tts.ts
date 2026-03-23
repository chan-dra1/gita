/**
 * TTS Utility — Pluggable Text-to-Speech Providers
 *
 * Supports Google Cloud TTS, ElevenLabs, and OpenAI TTS.
 * Set your preferred provider and API key in src/constants/config.ts.
 *
 * Each provider returns base64-encoded audio data that the audio
 * utility can save and play from local storage.
 */

import type { TTSProviderName } from '../types';

// ─── Provider: Google Cloud TTS ─────────────────────────────────

async function googleTTS(
    text: string,
    language: string,
    apiKey: string
): Promise<string> {
    // Map our language codes to Google's
    const langMap: Record<string, { code: string; name: string }> = {
        sanskrit: { code: 'hi-IN', name: 'hi-IN-Neural2-A' }, // Warm female Hindi/Sanskrit voice
        hindi: { code: 'hi-IN', name: 'hi-IN-Neural2-A' },
        english: { code: 'en-US', name: 'en-US-Journey-F' }, // Extremely high-quality, calm, human-like female voice
    };

    const voiceConfig = langMap[language] || langMap.english;

    const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text },
                voice: {
                    languageCode: voiceConfig.code,
                    name: voiceConfig.name,
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.82, // Calm, devotional pace
                    pitch: 0.0,         // Natural pitch for female voice
                    effectsProfileId: ['headphone-class-device'], // Warm, intimate audio
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google TTS API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.audioContent; // base64-encoded MP3
}

// ─── Provider: ElevenLabs ───────────────────────────────────────

async function elevenLabsTTS(
    text: string,
    _language: string,
    apiKey: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM' // 'Rachel' default
): Promise<string> {
    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2', // Supports Hindi/Sanskrit
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.75,
                    style: 0.3,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    // ElevenLabs returns raw audio bytes — convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// ─── Provider: OpenAI TTS ───────────────────────────────────────

async function openAITTS(
    text: string,
    _language: string,
    apiKey: string
): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'tts-1',
            voice: 'nova', // Calm, warm voice — good for spiritual content
            input: text,
            response_format: 'mp3',
            speed: 0.9,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI TTS API error: ${response.status} - ${error}`);
    }

    // OpenAI returns raw audio bytes — convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// ─── Provider Registry ──────────────────────────────────────────

type TTSFunction = (
    text: string,
    language: string,
    apiKey: string,
    voiceId?: string
) => Promise<string>;

const providers: Record<TTSProviderName, TTSFunction> = {
    google: googleTTS,
    elevenlabs: elevenLabsTTS,
    openai: openAITTS,
};

/**
 * Generate TTS audio using the configured provider.
 *
 * @param text      - The text to synthesize
 * @param language  - 'sanskrit' | 'hindi' | 'english'
 * @param provider  - The TTS provider to use
 * @param apiKey    - The API key for the provider
 * @param voiceId   - Optional ElevenLabs voice ID
 * @returns         - Base64-encoded MP3 audio data
 */
export async function generateTTSAudio(
    text: string,
    language: string,
    provider: TTSProviderName,
    apiKey: string,
    voiceId?: string
): Promise<string> {
    const ttsFunction = providers[provider];
    if (!ttsFunction) {
        throw new Error(`Unknown TTS provider: ${provider}`);
    }
    return ttsFunction(text, language, apiKey, voiceId);
}
