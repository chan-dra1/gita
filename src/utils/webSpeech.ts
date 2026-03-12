/**
 * Web Speech API TTS — Free Multilingual Text-to-Speech
 *
 * Uses the browser's built-in SpeechSynthesis API for zero-cost
 * multilingual audio playback. Supports 10+ languages natively.
 *
 * On native (iOS/Android), falls back to the existing TTS providers.
 */

import { Platform } from 'react-native';

// ─── Supported Languages ────────────────────────────────────────

export interface SpeechLanguage {
  code: string;
  label: string;
  voiceLang: string; // BCP 47 language tag for SpeechSynthesis
  flag: string;
}

export const SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: 'sanskrit', label: 'Sanskrit', voiceLang: 'hi-IN', flag: '🕉️' },
  { code: 'english', label: 'English', voiceLang: 'en-US', flag: '🇺🇸' },
  { code: 'hindi', label: 'Hindi', voiceLang: 'hi-IN', flag: '🇮🇳' },
  { code: 'spanish', label: 'Spanish', voiceLang: 'es-ES', flag: '🇪🇸' },
  { code: 'french', label: 'French', voiceLang: 'fr-FR', flag: '🇫🇷' },
  { code: 'german', label: 'German', voiceLang: 'de-DE', flag: '🇩🇪' },
  { code: 'japanese', label: 'Japanese', voiceLang: 'ja-JP', flag: '🇯🇵' },
  { code: 'chinese', label: 'Chinese', voiceLang: 'zh-CN', flag: '🇨🇳' },
  { code: 'portuguese', label: 'Portuguese', voiceLang: 'pt-BR', flag: '🇧🇷' },
  { code: 'russian', label: 'Russian', voiceLang: 'ru-RU', flag: '🇷🇺' },
  { code: 'arabic', label: 'Arabic', voiceLang: 'ar-SA', flag: '🇸🇦' },
  { code: 'telugu', label: 'Telugu', voiceLang: 'te-IN', flag: '🇮🇳' },
  { code: 'tamil', label: 'Tamil', voiceLang: 'ta-IN', flag: '🇮🇳' },
  { code: 'kannada', label: 'Kannada', voiceLang: 'kn-IN', flag: '🇮🇳' },
  { code: 'bengali', label: 'Bengali', voiceLang: 'bn-IN', flag: '🇮🇳' },
];

// ─── Web Speech API Wrapper ─────────────────────────────────────

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Check if Web Speech API is available (web platform only).
 */
export function isSpeechAvailable(): boolean {
  if (Platform.OS !== 'web') return false;
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available voices, optionally filtered by language.
 */
export function getAvailableVoices(langCode?: string): SpeechSynthesisVoice[] {
  if (!isSpeechAvailable()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (!langCode) return voices;
  return voices.filter((v) => v.lang.startsWith(langCode.split('-')[0]));
}

/**
 * Speak text using the Web Speech API.
 *
 * @param text       - Text to read aloud
 * @param langCode   - BCP 47 language code (e.g. 'en-US', 'hi-IN')
 * @param rate       - Speech rate (0.5 to 2.0, default 0.9)
 * @param pitch      - Voice pitch (0 to 2, default 1)
 * @param onStart    - Callback when speech starts
 * @param onEnd      - Callback when speech ends
 * @param onError    - Callback on error
 * @param onProgress - Callback with progress updates (word boundaries)
 */
export function speakText(options: {
  text: string;
  langCode: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onProgress?: (charIndex: number, charLength: number) => void;
}): void {
  if (!isSpeechAvailable()) {
    options.onError?.('Speech synthesis not available on this platform');
    return;
  }

  // Stop any current speech
  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(options.text);
  utterance.lang = options.langCode;
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = 1.0;

  // Try to find the best voice for the language
  const voices = window.speechSynthesis.getVoices();
  const matchingVoices = voices.filter((v) =>
    v.lang.startsWith(options.langCode.split('-')[0])
  );

  if (matchingVoices.length > 0) {
    // Prefer a non-compact, high-quality voice
    const preferred =
      matchingVoices.find((v) => v.localService === false) ||
      matchingVoices.find((v) => v.name.toLowerCase().includes('google')) ||
      matchingVoices.find((v) => v.name.toLowerCase().includes('premium')) ||
      matchingVoices[0];
    utterance.voice = preferred;
  }

  // Event handlers
  utterance.onstart = () => options.onStart?.();

  utterance.onend = () => {
    currentUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (event) => {
    currentUtterance = null;
    if (event.error !== 'interrupted') {
      options.onError?.(`Speech error: ${event.error}`);
    }
  };

  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      options.onProgress?.(event.charIndex, options.text.length);
    }
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any currently speaking text.
 */
export function stopSpeech(): void {
  if (isSpeechAvailable()) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

/**
 * Pause current speech.
 */
export function pauseSpeech(): void {
  if (isSpeechAvailable()) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech.
 */
export function resumeSpeech(): void {
  if (isSpeechAvailable()) {
    window.speechSynthesis.resume();
  }
}

/**
 * Check if currently speaking.
 */
export function isSpeaking(): boolean {
  if (!isSpeechAvailable()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Build the full text content for reading a sloka with explanation.
 * This creates a comprehensive reading experience similar to Echo.
 */
export function buildSlokaReadingText(
  sloka: {
    sanskrit: string;
    transliteration: string;
    translation_english: string;
  },
  chapter: number,
  verse: number,
  languageCode: string
): string {
  if (languageCode === 'hi-IN' || languageCode === 'sanskrit') {
    // For Hindi/Sanskrit, read the Sanskrit verse with transliteration
    return `भगवद गीता, अध्याय ${chapter}, श्लोक ${verse}. ${sloka.sanskrit}. इस श्लोक का अर्थ है. ${sloka.transliteration}. ${sloka.translation_english}`;
  }

  // For other languages, provide a full reading experience
  return `Bhagavad Gita, Chapter ${chapter}, Verse ${verse}. ${sloka.transliteration}. Translation: ${sloka.translation_english}`;
}
