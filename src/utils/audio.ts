/**
 * Audio Utility — Local Caching + Playback (The Cost-Saver)
 *
 * Strategy:
 * 1. Build a deterministic file path: gita_audio/{chapter}_{verse}_{lang}.mp3
 * 2. Check if the file already exists on-device (expo-file-system)
 * 3. If YES → play from local storage (zero API cost)
 * 4. If NO  → call TTS API → save to device → play
 *
 * Uses expo-file-system (v19 class-based API) for storage
 * and expo-av for playback.
 */

import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import { Config } from '../constants/config';
import type { AudioLanguage } from '../types';
import { generateTTSAudio } from './tts';

// ─── Path Helpers ───────────────────────────────────────────────

/**
 * Get the cache directory for audio files.
 * Creates it if it doesn't exist.
 */
function getAudioCacheDir(): Directory {
    const dir = new Directory(Paths.document, Config.AUDIO_CACHE_DIR);
    if (!dir.exists) {
        dir.create();
    }
    return dir;
}

/**
 * Build a deterministic file reference for a sloka's audio.
 * Example: .../gita_audio/2_47_sanskrit.mp3
 */
export function getCachedAudioFile(
    chapter: number,
    verse: number,
    language: AudioLanguage
): File {
    const dir = getAudioCacheDir();
    return new File(dir, `${chapter}_${verse}_${language}.mp3`);
}

/**
 * Get the file path string for external use.
 */
export function getCachedAudioPath(
    chapter: number,
    verse: number,
    language: AudioLanguage
): string {
    return getCachedAudioFile(chapter, verse, language).uri;
}

// ─── Cache Check ────────────────────────────────────────────────

/**
 * Check if audio for a specific sloka + language is already cached.
 */
export function hasCachedAudio(
    chapter: number,
    verse: number,
    language: AudioLanguage
): boolean {
    const file = getCachedAudioFile(chapter, verse, language);
    return file.exists;
}

// ─── Save Audio ─────────────────────────────────────────────────

/**
 * Save base64-encoded audio data to local storage.
 */
function saveAudioToCache(
    chapter: number,
    verse: number,
    language: AudioLanguage,
    base64Audio: string
): File {
    const file = getCachedAudioFile(chapter, verse, language);

    // Decode base64 to Uint8Array and write
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    file.write(bytes);

    console.log(`✅ Audio cached: ${chapter}:${verse} [${language}]`);
    return file;
}

// ─── Playback ───────────────────────────────────────────────────

// Keep a reference to the current sound so we can stop/unload it
let currentSound: Audio.Sound | null = null;

/**
 * Stop and unload any currently playing audio.
 */
export async function stopAudio(): Promise<void> {
    if (currentSound) {
        try {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
        } catch (e) {
            // Sound may already be unloaded
        }
        currentSound = null;
    }
}

/**
 * Play audio from a local file URI.
 * Automatically unloads the sound when playback finishes.
 *
 * @param uri        - Local file URI
 * @param onFinish   - Callback when playback completes
 * @param onError    - Callback on playback error
 * @returns          - The Sound object for external control
 */
export async function playAudioFromUri(
    uri: string,
    onFinish?: () => void,
    onError?: (error: string) => void
): Promise<Audio.Sound> {
    // Stop any existing playback
    await stopAudio();

    // Set audio mode for background-friendly playback
    await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
    });

    try {
        const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                    currentSound = null;
                    onFinish?.();
                }
            }
        );

        currentSound = sound;
        return sound;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Playback failed';
        onError?.(message);
        throw error;
    }
}

// ─── Main Entry Point: Cache-First Audio ────────────────────────

/**
 * The core cost-saving function:
 *
 * 1. Check if the audio is already cached on-device
 * 2. If YES → play from FS (free!)
 * 3. If NO  → call TTS API → save to device → play
 *
 * @param chapter   - Gita chapter number
 * @param verse     - Verse number
 * @param text      - The text to synthesize (Sanskrit / transliteration / translation)
 * @param language  - 'sanskrit' | 'english' | 'hindi'
 * @param onFinish  - Callback when playback completes
 * @param onError   - Callback on error
 * @returns         - The Sound object
 */
export async function cacheAndPlayAudio(
    chapter: number,
    verse: number,
    text: string,
    language: AudioLanguage,
    onFinish?: () => void,
    onError?: (error: string) => void
): Promise<Audio.Sound> {
    const cachedFile = getCachedAudioFile(chapter, verse, language);

    // ① Check cache first
    if (cachedFile.exists) {
        console.log(`🎵 Playing cached audio: ${chapter}:${verse} [${language}]`);
        return playAudioFromUri(cachedFile.uri, onFinish, onError);
    }

    // ② Not cached — generate via TTS API
    console.log(`🔊 Generating TTS audio: ${chapter}:${verse} [${language}]`);

    try {
        const base64Audio = await generateTTSAudio(
            text,
            language,
            Config.TTS_PROVIDER,
            Config.TTS_API_KEY,
            Config.TTS_PROVIDER === 'elevenlabs' ? Config.ELEVENLABS_VOICE_ID : undefined
        );

        // ③ Save to local storage
        const savedFile = saveAudioToCache(chapter, verse, language, base64Audio);

        // ④ Play from local storage
        return playAudioFromUri(savedFile.uri, onFinish, onError);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'TTS generation failed';
        console.error(`❌ TTS error: ${message}`);
        onError?.(message);
        throw error;
    }
}

// ─── Cache Management ───────────────────────────────────────────

/**
 * Get the total size of the audio cache in bytes.
 */
export function getCacheSize(): number {
    try {
        const dir = new Directory(Paths.document, Config.AUDIO_CACHE_DIR);
        if (!dir.exists) return 0;

        const items = dir.list();
        let totalSize = 0;

        for (const item of items) {
            if (item instanceof File) {
                totalSize += item.size ?? 0;
            }
        }

        return totalSize;
    } catch {
        return 0;
    }
}

/**
 * Format bytes to a human-readable string.
 */
export function formatCacheSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Clear all cached audio files.
 */
export function clearAudioCache(): void {
    try {
        const dir = new Directory(Paths.document, Config.AUDIO_CACHE_DIR);
        if (dir.exists) {
            dir.delete();
            console.log('🗑️ Audio cache cleared');
        }
    } catch {
        console.warn('Could not clear audio cache');
    }
}
