import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Sloka } from '../types';
import { getChapter, getRandomSloka, getSloka } from './sloka';

// Optional import for native widgets
let GitaWidgets: any = null;
try {
  if (Platform.OS !== 'web') {
    GitaWidgets = require('gita-widgets').GitaWidgets;
  }
} catch (e) {
  console.warn('GitaWidgets module not found, widgets will not update natively.');
}

const STORAGE_KEY = '@gita_daily_sloka_v1';

export type SlokaWithChapter = Sloka & { chapter: number; chapterName: string };

type StoredDaily = { date: string; chapter: number; verse: number };

export function getLocalCalendarDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function readStored(): Promise<StoredDaily | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDaily>;
    if (
      typeof parsed.date === 'string' &&
      typeof parsed.chapter === 'number' &&
      typeof parsed.verse === 'number'
    ) {
      return { date: parsed.date, chapter: parsed.chapter, verse: parsed.verse };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function writeStored(date: string, chapter: number, verse: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date, chapter, verse }));
}

function buildSlokaWithChapter(chapter: number, verse: number): SlokaWithChapter | null {
  const row = getSloka(chapter, verse);
  if (!row) return null;
  const ch = getChapter(chapter);
  return {
    ...row,
    chapter,
    chapterName: ch?.name ?? `Chapter ${chapter}`,
  };
}

function updateNativeWidget(verseInfo: SlokaWithChapter) {
  if (GitaWidgets) {
    try {
      GitaWidgets.updateWidget(
        verseInfo.chapter, 
        verseInfo.verse, 
        verseInfo.sanskrit, 
        verseInfo.translation_english
      );
    } catch (e) {
      console.warn('Failed to update native widget', e);
    }
  }
}

/**
 * Returns the same verse for the current local calendar day; rolls a new one when the date changes.
 */
export async function getOrCreateDailySloka(): Promise<SlokaWithChapter | null> {
  const today = getLocalCalendarDateKey();
  const stored = await readStored();
  if (stored && stored.date === today) {
    const built = buildSlokaWithChapter(stored.chapter, stored.verse);
    if (built) {
      updateNativeWidget(built);
      return built;
    }
  }

  const fresh = getRandomSloka();
  if (!fresh) return null;
  await writeStored(today, fresh.chapter, fresh.verse);
  
  const builtFresh = { ...fresh, chapterName: getChapter(fresh.chapter)?.name ?? `Chapter ${fresh.chapter}` };
  updateNativeWidget(builtFresh);
  return builtFresh;
}
