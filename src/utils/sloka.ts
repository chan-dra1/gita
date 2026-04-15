/**
 * Sloka Utility — Local Data Access (Zero Database Cost)
 *
 * All 700 Bhagavad Gita slokas are stored in a local JSON file.
 * This module provides efficient lookup and search functions.
 */

import gitaData from '../data/bhagavad-gita.json';
import type { Chapter, GitaData, Sloka } from '../types';

// Handle JSON structure variance across bundlers (Native vs Web)
const gitaRaw: any = gitaData;
const data: GitaData | null = gitaRaw?.chapters ? gitaRaw : gitaRaw?.default;

// ─── Build a lookup map for O(1) access ────────────────────────

type SlokaKey = `${number}_${number}`;

const slokaMap = new Map<SlokaKey, Sloka & { chapterName: string; chapterNameSanskrit: string }>();
const chapterMap = new Map<number, Chapter>();

// Initialize maps safely
if (data && data.chapters) {
    try {
        for (const chapter of data.chapters) {
            chapterMap.set(chapter.chapter, chapter);
            for (const verse of chapter.verses) {
                const key: SlokaKey = `${chapter.chapter}_${verse.verse}`;
                slokaMap.set(key, {
                    ...verse,
                    chapterName: chapter.name,
                    chapterNameSanskrit: chapter.name_sanskrit,
                });
            }
        }
    } catch (e) {
        console.error('[Sloka] Error during data mapping:', e);
    }
} else {
    console.error('[Sloka] Bhagavad Gita data failed to load or is malformed. Struct:', typeof gitaRaw);
}

// ─── Public API ─────────────────────────────────────────────────

export function getSloka(
    chapter: number,
    verse: number
): (Sloka & { chapterName: string; chapterNameSanskrit: string }) | null {
    const key: SlokaKey = `${chapter}_${verse}`;
    return slokaMap.get(key) ?? null;
}

export function getChapter(chapterNumber: number): Chapter | null {
    return chapterMap.get(chapterNumber) ?? null;
}

export function getAllChapters(): Omit<Chapter, 'verses'>[] {
    if (!data || !data.chapters) return [];
    try {
        return data.chapters.map(({ chapter, name, name_sanskrit, verses_count }) => ({
            chapter,
            name,
            name_sanskrit,
            verses_count,
        }));
    } catch (e) {
        return [];
    }
}

export function searchSlokas(
    query: string,
    limit: number = 10
): Array<Sloka & { chapter: number; chapterName: string }> {
    if (!data || !data.chapters) return [];
    const lowerQuery = query.toLowerCase();
    const results: Array<Sloka & { chapter: number; chapterName: string }> = [];

    try {
        for (const chapter of data.chapters) {
            for (const verse of chapter.verses) {
                if (
                    verse.translation_english.toLowerCase().includes(lowerQuery) ||
                    verse.transliteration.toLowerCase().includes(lowerQuery)
                ) {
                    results.push({
                        ...verse,
                        chapter: chapter.chapter,
                        chapterName: chapter.name,
                    });
                    if (results.length >= limit) return results;
                }
            }
        }
    } catch (e) {}

    return results;
}

export function getRandomSloka(): (Sloka & { chapter: number; chapterName: string }) | null {
    if (!data || !data.chapters) return null;
    const allVerses: Array<Sloka & { chapter: number; chapterName: string }> = [];

    try {
        for (const chapter of data.chapters) {
            for (const verse of chapter.verses) {
                allVerses.push({
                    ...verse,
                    chapter: chapter.chapter,
                    chapterName: chapter.name,
                });
            }
        }
    } catch (e) {}

    if (allVerses.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * allVerses.length);
    return allVerses[randomIndex];
}

export function getTotalVerseCount(): number {
    return slokaMap.size;
}

export function getTotalChapterCount(): number {
    return data && data.chapters ? data.chapters.length : 0;
}

export function getLocalizedTranslation(chapter: number, verse: number, englishTranslation: string, languageCode: string): string {
    if (languageCode === 'en') return englishTranslation;
    
    try {
        let langPack: Record<string, string> = {};
        if (languageCode === 'hi') {
            const hiData = require('../data/languages/hi.json');
            langPack = hiData.chapters ? hiData : hiData.default || hiData;
        }
        
        const key = `${chapter}_${verse}`;
        if (langPack[key]) {
            return langPack[key];
        }
        return englishTranslation;
    } catch (e) {
        return englishTranslation;
    }
}
