// ─── Sloka Data Types ───────────────────────────────────────────

export interface Sloka {
    verse: number;
    sanskrit: string;
    transliteration: string;
    translation_english: string;
}

export interface Chapter {
    chapter: number;
    name: string;
    name_sanskrit: string;
    verses_count: number;
    verses: Sloka[];
}

export interface GitaData {
    chapters: Chapter[];
}

// ─── AI Recommendation ─────────────────────────────────────────

export interface SlokaRecommendation {
    chapter: number;
    verse: number;
}

// ─── TTS Provider ───────────────────────────────────────────────

export type TTSProviderName = 'google' | 'elevenlabs' | 'openai';

export interface TTSConfig {
    provider: TTSProviderName;
    apiKey: string;
    voiceId?: string; // ElevenLabs voice ID
    languageCode?: string; // e.g. 'en-US', 'hi-IN', 'sa-IN'
}

export interface TTSProvider {
    name: TTSProviderName;
    generateAudio(text: string, language: string, apiKey: string, voiceId?: string): Promise<string>;
    // Returns base64-encoded audio data
}

// ─── Audio ──────────────────────────────────────────────────────

export type AudioLanguage = 'sanskrit' | 'english' | 'hindi';

export interface AudioState {
    isPlaying: boolean;
    isLoading: boolean;
    duration: number;
    position: number;
    error: string | null;
}

// ─── Notifications ──────────────────────────────────────────────

export interface NotificationSettings {
    enabled: boolean;
    hour: number;
    minute: number;
}

// ─── Deep Dive AI ───────────────────────────────────────────────

export interface DeepDiveMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface DeepDiveState {
    messages: DeepDiveMessage[];
    isLoading: boolean;
    error: string | null;
}

// ─── Commentary ─────────────────────────────────────────────────

export interface Commentary {
    sankara: string;
    meaning: string;
    application: string;
}

// ─── Stats ────────────────────────────────────────────────────────

export interface SlokaReadEntry {
    chapter: number;
    verse: number;
    timestamp: number;
}

export interface StreakData {
    currentStreak: number;
    lastOpenedDate: string | null;
    longestStreak: number;
}

export interface OnboardingData {
    motivation: string | null;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'scholar' | null;
    guidanceStyle: 'practical' | 'philosophical' | 'devotional' | 'holistic' | null;
    dailyCommitment: 'quick' | 'moderate' | 'deep' | null;
    remindersEnabled: boolean;
    reminderTime?: string | null;
    completedAt: number | null;
}
