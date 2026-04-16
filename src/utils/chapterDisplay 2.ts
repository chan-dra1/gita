import chapterTitles from '../data/chapterTitles.json';
import type { Language } from './i18n';

const titles = chapterTitles as Record<string, Record<string, string>>;

/**
 * Localized chapter yoga title (e.g. "Sankhya Yoga" / "सांख्ययोग").
 * Falls back to English, then to empty string.
 */
export function getChapterTitle(chapter: number, lang: Language): string {
  const key = String(chapter);
  const langBlock = titles[lang] || titles.en;
  return langBlock[key] || titles.en[key] || '';
}
