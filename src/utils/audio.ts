import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { AudioLanguage } from '../types';
import { Config } from '../constants/config';

let currentSound: Audio.Sound | null = null;

// ─── Path Helpers ───────────────────────────────────────────────

const getLocalAudioDir = () => `${FileSystem.cacheDirectory}${Config.AUDIO_CACHE_DIR}`;

/**
 * Ensures the audio cache directory exists.
 */
async function ensureDirExists(): Promise<void> {
  if (Platform.OS === 'web') return;
  const dirInfo = await FileSystem.getInfoAsync(getLocalAudioDir());
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(getLocalAudioDir(), { intermediates: true });
  }
}

/**
 * Generates the remote and local paths for a specific verse.
 */
function getAudioPaths(chapter: number, verse: number, language: AudioLanguage) {
  const fileName = `${chapter}_${verse}.mp3`;
  const remoteUri = `${Config.AUDIO_CDN_URL}/${language}/${fileName}`;
  const localUri = `${getLocalAudioDir()}${language}_${fileName}`;
  return { remoteUri, localUri };
}

// ─── Playback ───────────────────────────────────────────────────

export async function stopAudio(): Promise<void> {
  Speech.stop();
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (e) {}
    currentSound = null;
  }
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/^(chapter|verse|sloka)\s+\d+[,.]?\s*/gi, '')
    .replace(/Chapter \d+, Verse \d+[.,]?\s*/gi, '')
    .replace(/;/g, ',')
    .replace(/(\\||॥)[^\\|॥]*(\\||॥)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function getVoiceForLanguage(language: string) {
  const voices = await Speech.getAvailableVoicesAsync();
  
  if (language === 'sanskrit' || language === 'hindi') {
    const hindiVoices = voices.filter(v => v.language.includes('hi'));
    const premium = hindiVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced);
    return premium?.identifier || hindiVoices[0]?.identifier;
  }
  
  const engVoices = voices.filter(v => v.language.startsWith('en'));
  const premium = engVoices.find(v => 
    v.quality === Speech.VoiceQuality.Enhanced && 
    (v.name.includes('Siri') || v.identifier.includes('network') || v.identifier.includes('premium'))
  );
  return premium?.identifier || (engVoices.length > 0 ? engVoices[0].identifier : undefined);
}

export async function cacheAndPlayAudio(
  chapter: number,
  verse: number,
  text: string,
  language: AudioLanguage,
  onFinish?: () => void,
  onError?: (error: string) => void
): Promise<any> {
  await stopAudio();
  
  if (Platform.OS === 'web') {
    return playTTS(text, language, onFinish, onError);
  }

  try {
    await ensureDirExists();
    const { remoteUri, localUri } = getAudioPaths(chapter, verse, language);
    
    // Check if cached
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    let finalUri = localUri;

    if (!fileInfo.exists) {
        console.log(`[Audio] Fetching ${language}_${chapter}_${verse} from cloud...`);
        try {
            const { uri } = await FileSystem.downloadAsync(remoteUri, localUri);
            finalUri = uri;
        } catch (downloadErr) {
            return playTTS(text, language, onFinish, onError);
        }
    }

    // Play from cache
    return new Promise<void>(async (resolve) => {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: finalUri });
        currentSound = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            onFinish?.();
            resolve();
          }
        });
        await sound.playAsync();
      } catch (err: any) {
        console.error(`[Audio] Playback failed:`, err);
        // Fall back to TTS on playback error too
        playTTS(text, language, onFinish, onError).then(resolve);
      }
    });

  } catch (err: any) {
    return playTTS(text, language, onFinish, onError);
  }
}

/**
 * Fallback TTS implementation
 */
async function playTTS(
    text: string, 
    language: AudioLanguage, 
    onFinish?: () => void, 
    onError?: (error: string) => void
): Promise<void> {
    const cleanStr = cleanTextForSpeech(text);
    const voiceId = await getVoiceForLanguage(language);

    return new Promise<void>((resolve) => {
        Speech.speak(cleanStr, {
            voice: voiceId,
            rate: language === 'sanskrit' ? 0.8 : 0.9,
            pitch: language === 'sanskrit' ? 0.95 : 1.0,
            onDone: () => {
                onFinish?.();
                resolve();
            },
            onError: (err) => {
                onError?.(err instanceof Error ? err.message : String(err));
                resolve();
            }
        });
    });
}

export async function playDynamicAudio(
  text: string,
  language: AudioLanguage,
  onFinish?: () => void,
  onError?: (error: string) => void
): Promise<any> {
    return playTTS(text, language, onFinish, onError);
}

// ─── Cache Management ──────────────────────────────────────────────────────

const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB Limit

/**
 * Gets the total size of the audio cache.
 */
export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(getLocalAudioDir());
    if (!dirInfo.exists) return 0;
    
    const files = await FileSystem.readDirectoryAsync(getLocalAudioDir());
    let totalSize = 0;
    for (const file of files) {
      try {
        const info = await FileSystem.getInfoAsync(`${getLocalAudioDir()}${file}`);
        if (info.exists) {
          totalSize += (info as any).size || 0;
        }
      } catch {}
    }
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Automatically cleans up the oldest files if the cache exceeds MAX_CACHE_SIZE.
 * Also prioritizes keeping the 'current' chapter.
 */
export async function smartCacheCleanup(currentChapter: number): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const size = await getCacheSize();
    if (size < MAX_CACHE_SIZE) return;

    console.log(`[Audio] Cache size (${formatCacheSize(size)}) exceeds limit. Cleaning up...`);
    
    const files = await FileSystem.readDirectoryAsync(getLocalAudioDir());
    const fileStats = [];

    for (const file of files) {
      try {
        const path = `${getLocalAudioDir()}${file}`;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          fileStats.push({
            name: file,
            path,
            size: (info as any).size || 0,
            mtime: (info as any).modificationTime || 0,
            isCurrentChapter: file.includes(`${currentChapter}_`)
          });
        }
      } catch {}
    }

    // Sort: Non-current chapters first, then by oldest modification time
    fileStats.sort((a, b) => {
      if (a.isCurrentChapter !== b.isCurrentChapter) {
        return a.isCurrentChapter ? 1 : -1;
      }
      return a.mtime - b.mtime;
    });

    let currentSize = size;
    for (const file of fileStats) {
      if (currentSize <= MAX_CACHE_SIZE * 0.7) break; // Clear down to 70% of limit
      
      try {
        await FileSystem.deleteAsync(file.path, { idempotent: true });
        currentSize -= file.size;
      } catch (e) {
        console.warn(`[Audio] Failed to delete ${file.name}:`, e);
      }
    }
    
    console.log(`[Audio] Cleanup complete. New size: ${formatCacheSize(currentSize)}`);
  } catch (err) {
    console.error('[Audio] Smart cleanup failed:', err);
  }
}

export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? "<1 MB" : `${mb.toFixed(1)} MB`;
}

export async function clearAudioCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(getLocalAudioDir(), { idempotent: true });
    await ensureDirExists();
  } catch (e) {
    console.error('Failed to clear audio cache:', e);
  }
}

/**
 * Downloads a list of verses for offline use.
 */
export async function preDownloadChapterAudio(
  chapter: number,
  verseNumbers: number[],
  languages: AudioLanguage[],
  onProgress?: (index: number, total: number, fileName: string) => void
): Promise<void> {
  if (Platform.OS === 'web') return;
  
  await ensureDirExists();
  const totalSteps = verseNumbers.length * languages.length;
  let currentStep = 0;
  
  for (const verse of verseNumbers) {
    for (const lang of languages) {
      const { remoteUri, localUri } = getAudioPaths(chapter, verse, lang);
      const fileName = `${lang}_${chapter}_${verse}.mp3`;
      
      try {
        const info = await FileSystem.getInfoAsync(localUri);
        if (!info.exists) {
          await FileSystem.downloadAsync(remoteUri, localUri);
        }
      } catch (e) {
        console.warn(`[Audio] Pre-download failed for ${fileName}:`, e);
      }
      
      currentStep++;
      onProgress?.(currentStep, totalSteps, fileName);
    }
  }
}

export function cancelPreDownload(chapter: number): void {
  // Simple implementation doesn't support cancellation yet
}

/**
 * Checks if audio for a specific verse + language is already cached locally.
 */
export async function hasCachedAudio(
  chapter: number,
  verse: number,
  language: AudioLanguage
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { localUri } = getAudioPaths(chapter, verse, language);
    const info = await FileSystem.getInfoAsync(localUri);
    return info.exists;
  } catch {
    return false;
  }
}

