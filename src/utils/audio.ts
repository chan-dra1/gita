/**
 * Audio Utility — Local Caching + Playback
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Config } from '../constants/config';
import type { AudioLanguage } from '../types';
import { generateTTSAudio } from './tts';

const AUDIO_CACHE_DIR = `${(FileSystem as any).documentDirectory}${Config.AUDIO_CACHE_DIR}`;

/**
 * Ensure the cache directory exists.
 */
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, { intermediates: true });
  }
}

/**
 * Build a deterministic file path for a sloka's audio.
 */
export function getCachedAudioPath(
  chapter: number,
  verse: number,
  language: AudioLanguage
): string {
  return `${AUDIO_CACHE_DIR}${chapter}_${verse}_${language}.mp3`;
}

/**
 * Check if audio for a specific sloka + language is already cached.
 */
export async function hasCachedAudio(
  chapter: number,
  verse: number,
  language: AudioLanguage
): Promise<boolean> {
  const path = getCachedAudioPath(chapter, verse, language);
  const fileInfo = await FileSystem.getInfoAsync(path);
  return fileInfo.exists;
}

/**
 * Save base64-encoded audio data to local storage.
 */
async function saveAudioToCache(
  chapter: number,
  verse: number,
  language: AudioLanguage,
  base64Audio: string
): Promise<string> {
  await ensureDirExists();
  const path = getCachedAudioPath(chapter, verse, language);
  await FileSystem.writeAsStringAsync(path, base64Audio, {
    encoding: (FileSystem as any).EncodingType.Base64,
  });
  return path;
}

// ─── Playback ───────────────────────────────────────────────────

let currentSound: Audio.Sound | null = null;

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

export async function playAudioFromUri(
  uri: string,
  onFinish?: () => void,
  onError?: (error: string) => void
): Promise<Audio.Sound> {
  await stopAudio();

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
          if (currentSound === sound) currentSound = null;
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

export async function cacheAndPlayAudio(
  chapter: number,
  verse: number,
  text: string,
  language: AudioLanguage,
  onFinish?: () => void,
  onError?: (error: string) => void
): Promise<Audio.Sound> {
  const path = getCachedAudioPath(chapter, verse, language);
  const fileInfo = await FileSystem.getInfoAsync(path);

  if (fileInfo.exists) {
    return playAudioFromUri(path, onFinish, onError);
  }

  try {
    const base64Audio = await generateTTSAudio(
      text,
      language,
      Config.TTS_PROVIDER,
      Config.TTS_API_KEY,
      Config.TTS_PROVIDER === 'elevenlabs' ? Config.ELEVENLABS_VOICE_ID : undefined
    );

    const savedPath = await saveAudioToCache(chapter, verse, language, base64Audio);
    return playAudioFromUri(savedPath, onFinish, onError);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS generation failed';
    onError?.(message);
    throw error;
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
    if (!dirInfo.exists) return 0;
    // Note: getInfoAsync on directory doesn't return total size of contents in standard expo-file-system
    // This is a limitation, but we can return 0 or implement a recursive size check if needed.
    return 0;
  } catch {
    return 0;
  }
}

export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function clearAudioCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(AUDIO_CACHE_DIR, { idempotent: true });
    }
  } catch {
    console.warn('Could not clear audio cache');
  }
}
