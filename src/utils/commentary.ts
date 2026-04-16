import commentaryData from '../data/commentary.json';
import chapterSummaries from '../data/chapterSummaries.json';
import type { Commentary } from '../types';
import type { Language } from './i18n';
import { getChapterTitle } from './chapterDisplay';

export type { Commentary };

const COMMENTARIES: Record<string, Commentary> = commentaryData.commentaries;
const SUMMARIES = chapterSummaries as Record<string, { en: string; hi: string }>;

/** Short reflective line per UI language (expand over time). */
const GENERIC_APPLICATION: Record<Language, string> = {
  en: 'Take a quiet moment with this chapter. Notice where its teaching meets your choices today—without forcing an answer.',
  hi: 'इस अध्याय के साथ कुछ क्षण चुपचाप बैठें। देखें कि इसकी शिक्षा आज आपके निर्णयों से कहाँ मिलती है—जबरदस्ती उत्तर ढूँढे बिना।',
};


/**
 * Get commentary for a specific verse
 */
export function getCommentary(chapter: number, verse: number): Commentary | null {
  const key = `${chapter}.${verse}`;
  return COMMENTARIES[key] || null;
}

export function hasCommentary(chapter: number, verse: number): boolean {
  const key = `${chapter}.${verse}`;
  return key in COMMENTARIES;
}

/**
 * Chapter-level meaning when no verse-specific commentary exists.
 * Uses open chapter summaries (en/hi) from The Gita Initiative dataset + localized chapter title.
 */
export function getGenericCommentary(chapter: number, _verse: number, lang: Language): Commentary {
  const row = SUMMARIES[String(chapter)];
  const title = getChapterTitle(chapter, lang);
  let body = '';
  if (row) {
    body = lang === 'hi' && row.hi ? row.hi : row.en;
  }
  if (!body) {
    body =
      lang === 'hi'
        ? 'इस श्लोक का विस्तृत भाष्य इस संस्करण में उपलब्ध नहीं है।'
        : 'A detailed verse commentary is not bundled for this selection.';
  }
  const meaning = body.length > 2400 ? `${body.slice(0, 2400)}…` : body;
  return {
    sankara: title,
    meaning,
    application: GENERIC_APPLICATION[lang] || GENERIC_APPLICATION.en,
  };
}

/**
 * Commentary shown on the sloka screen. `commentary.json` is English-only; when the UI is Hindi,
 * swap in chapter-level Hindi summaries + Hindi application text so headings and body match.
 */
export function getCommentaryForVerse(chapter: number, verse: number, lang: Language): Commentary {
  const key = `${chapter}.${verse}`;
  const specific = COMMENTARIES[key] ?? null;
  if (!specific) {
    return getGenericCommentary(chapter, verse, lang);
  }
  if (lang === 'hi') {
    const hi = getGenericCommentary(chapter, verse, 'hi');
    return {
      ...specific,
      meaning: hi.meaning,
      application: hi.application,
    };
  }
  return specific;
}

export function getVersesWithCommentary(): { chapter: number; verse: number; key: string }[] {
  return Object.keys(COMMENTARIES).map((key) => {
    const [chapter, verse] = key.split('.').map(Number);
    return { chapter, verse, key };
  });
}
