/**
 * Sloka Utility — Local Data Access (Zero Database Cost)
 *
 * All 700 Bhagavad Gita slokas are stored in a local JSON file.
 * This module provides efficient lookup and search functions.
 */

import gitaData from '../data/bhagavad-gita.json';
import type { Chapter, GitaData, Sloka } from '../types';

const data = gitaData as GitaData;

// ─── Build a lookup map for O(1) access ────────────────────────

type SlokaKey = `${number}_${number}`;

const slokaMap = new Map<SlokaKey, Sloka & { chapterName: string; chapterNameSanskrit: string }>();
const chapterMap = new Map<number, Chapter>();

// Initialize maps on first import
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

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get a specific sloka by chapter and verse number.
 * Returns null if the sloka is not found.
 */
export function getSloka(
    chapter: number,
    verse: number
): (Sloka & { chapterName: string; chapterNameSanskrit: string }) | null {
    const key: SlokaKey = `${chapter}_${verse}`;
    return slokaMap.get(key) ?? null;
}

/**
 * Get all verses for a specific chapter.
 * Returns null if the chapter is not found.
 */
export function getChapter(chapterNumber: number): Chapter | null {
    return chapterMap.get(chapterNumber) ?? null;
}

/**
 * Get a list of all chapters (without verses, for navigation).
 */
export function getAllChapters(): Omit<Chapter, 'verses'>[] {
    return data.chapters.map(({ chapter, name, name_sanskrit, verses_count }) => ({
        chapter,
        name,
        name_sanskrit,
        verses_count,
    }));
}

/**
 * Search slokas by keyword in the English translation.
 * Returns matching slokas with their chapter & verse info.
 */
export function searchSlokas(
    query: string,
    limit: number = 10
): Array<Sloka & { chapter: number; chapterName: string }> {
    const lowerQuery = query.toLowerCase();
    const results: Array<Sloka & { chapter: number; chapterName: string }> = [];

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

    return results;
}

/**
 * Get a random sloka (for daily notifications / discovery).
 */
export function getRandomSloka(): Sloka & { chapter: number; chapterName: string } {
    const allVerses: Array<Sloka & { chapter: number; chapterName: string }> = [];

    for (const chapter of data.chapters) {
        for (const verse of chapter.verses) {
            allVerses.push({
                ...verse,
                chapter: chapter.chapter,
                chapterName: chapter.name,
            });
        }
    }

    const randomIndex = Math.floor(Math.random() * allVerses.length);
    return allVerses[randomIndex];
}

/**
 * Get total number of slokas available in the dataset.
 */
export function getTotalVerseCount(): number {
    return slokaMap.size;
}

/**
 * Get total number of chapters.
 */
export function getTotalChapterCount(): number {
    return data.chapters.length;
}

/**
 * Get localized translation from bundled packs.
 * Falls back to English if the translation does not exist.
 */
export function getLocalizedTranslation(chapter: number, verse: number, englishTranslation: string, languageCode: string): string {
    if (languageCode === 'en') return englishTranslation;
    
    try {
        let langPack: Record<string, string> = {};
        if (languageCode === 'hi') {
            langPack = require('../data/languages/hi.json');
        }
        
        const key = `${chapter}_${verse}`;
        if (langPack[key]) {
            return langPack[key];
        }
        
        // Fallback note + English
        return `[Translation in ${languageCode} pending] \n\n${englishTranslation}`;
    } catch (e) {
        return englishTranslation;
    }
}
