/**
 * Calendar-day stable "verse of the day" for Home + widgets.
 * Persists chapter/verse until the local calendar date changes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sloka } from '../types';
import { getChapter, getRandomSloka, getSloka } from './sloka';

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

/**
 * Returns the same verse for the current local calendar day; rolls a new one when the date changes.
 */
export async function getOrCreateDailySloka(): Promise<SlokaWithChapter | null> {
  const today = getLocalCalendarDateKey();
  const stored = await readStored();
  if (stored && stored.date === today) {
    const built = buildSlokaWithChapter(stored.chapter, stored.verse);
    if (built) return built;
  }

  const fresh = getRandomSloka();
  if (!fresh) return null;
  await writeStored(today, fresh.chapter, fresh.verse);
  return fresh;
}
