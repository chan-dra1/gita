/**
 * Mood-based Sloka recommendation + Deep Dive AI Scholar.
 *
 * Previously hit Gemini directly from the device with an exposed key. Now
 * proxies through our server:
 *   - Mood  → POST /api/mood-sloka  → { chapter, verse }
 *   - Deep dive → POST /api/scholar with rich system prompt
 *
 * The curated fallback map is preserved so that — on any network failure,
 * rate limit, or server error — users still get a sensible verse instead of
 * a dead end.
 */

import { api, ApiError } from './apiClient';
import { log } from './logger';
import type { Sloka, SlokaRecommendation } from '../types';
import { getSloka } from './sloka';

const MOOD_FALLBACKS: Record<string, SlokaRecommendation[]> = {
    anxious: [{ chapter: 2, verse: 14 }, { chapter: 2, verse: 38 }, { chapter: 18, verse: 58 }, { chapter: 12, verse: 15 }, { chapter: 2, verse: 56 }],
    stressed: [{ chapter: 6, verse: 35 }, { chapter: 2, verse: 47 }, { chapter: 12, verse: 13 }, { chapter: 5, verse: 20 }, { chapter: 18, verse: 73 }],
    lost: [{ chapter: 2, verse: 7 }, { chapter: 18, verse: 66 }, { chapter: 4, verse: 11 }, { chapter: 9, verse: 22 }, { chapter: 18, verse: 61 }],
    angry: [{ chapter: 2, verse: 62 }, { chapter: 2, verse: 63 }, { chapter: 16, verse: 21 }, { chapter: 3, verse: 37 }, { chapter: 5, verse: 26 }],
    sad: [{ chapter: 2, verse: 13 }, { chapter: 2, verse: 22 }, { chapter: 2, verse: 27 }, { chapter: 12, verse: 17 }, { chapter: 18, verse: 54 }],
    confused: [{ chapter: 4, verse: 18 }, { chapter: 18, verse: 73 }, { chapter: 11, verse: 33 }, { chapter: 3, verse: 30 }, { chapter: 2, verse: 41 }],
    fearful: [{ chapter: 18, verse: 66 }, { chapter: 11, verse: 50 }, { chapter: 9, verse: 31 }, { chapter: 2, verse: 40 }, { chapter: 12, verse: 15 }],
    grateful: [{ chapter: 9, verse: 27 }, { chapter: 11, verse: 43 }, { chapter: 10, verse: 9 }, { chapter: 12, verse: 14 }, { chapter: 9, verse: 34 }],
    peaceful: [{ chapter: 12, verse: 13 }, { chapter: 5, verse: 29 }, { chapter: 6, verse: 27 }, { chapter: 2, verse: 71 }, { chapter: 18, verse: 53 }],
    motivated: [{ chapter: 3, verse: 19 }, { chapter: 2, verse: 48 }, { chapter: 18, verse: 46 }, { chapter: 3, verse: 8 }],
    focused: [{ chapter: 6, verse: 5 }, { chapter: 6, verse: 19 }, { chapter: 12, verse: 8 }, { chapter: 8, verse: 14 }, { chapter: 18, verse: 57 }],
    curious: [{ chapter: 4, verse: 34 }, { chapter: 7, verse: 3 }, { chapter: 10, verse: 8 }, { chapter: 9, verse: 1 }, { chapter: 13, verse: 2 }],
    overwhelmed: [{ chapter: 2, verse: 47 }, { chapter: 3, verse: 27 }, { chapter: 18, verse: 66 }, { chapter: 11, verse: 32 }, { chapter: 12, verse: 6 }],
    hopeless: [{ chapter: 4, verse: 8 }, { chapter: 9, verse: 30 }, { chapter: 18, verse: 78 }, { chapter: 2, verse: 3 }, { chapter: 9, verse: 32 }],
    lonely: [{ chapter: 9, verse: 29 }, { chapter: 15, verse: 15 }, { chapter: 10, verse: 20 }, { chapter: 13, verse: 16 }, { chapter: 6, verse: 30 }],
    default: [{ chapter: 2, verse: 47 }, { chapter: 2, verse: 14 }, { chapter: 18, verse: 66 }],
};

export async function getSlokaRecommendation(
    userMood: string
): Promise<(Sloka & { chapter: number; chapterName: string; chapterNameSanskrit: string }) | null> {
    let recommendation: SlokaRecommendation;

    try {
        const res = await api.post<{ ok: boolean; chapter: number; verse: number }>(
            '/api/mood-sloka',
            { mood: userMood }
        );
        recommendation = { chapter: res.chapter, verse: res.verse };
        log.action('mood_sloka.recommended', recommendation);
    } catch (error) {
        if (error instanceof ApiError) {
            log.warn('mood_sloka.api_failed', { code: error.code });
        } else {
            log.warn('mood_sloka.unknown_failure');
        }
        recommendation = getFallbackRecommendation(userMood);
    }

    const sloka = getSloka(recommendation.chapter, recommendation.verse);
    if (!sloka) {
        log.warn('mood_sloka.missing_in_local', recommendation);
        const defaultRecs = MOOD_FALLBACKS.default;
        const defaultRec = defaultRecs[Math.floor(Math.random() * defaultRecs.length)];
        const defaultSloka = getSloka(defaultRec.chapter, defaultRec.verse);
        return defaultSloka ? { ...defaultSloka, chapter: defaultRec.chapter } : null;
    }
    return { ...sloka, chapter: recommendation.chapter };
}

function getFallbackRecommendation(userMood: string): SlokaRecommendation {
    const mood = userMood.toLowerCase();
    for (const [keyword, recs] of Object.entries(MOOD_FALLBACKS)) {
        if (mood.includes(keyword)) return recs[Math.floor(Math.random() * recs.length)];
    }
    const defaults = MOOD_FALLBACKS.default;
    return defaults[Math.floor(Math.random() * defaults.length)];
}

// ─── Deep Dive AI Scholar ─────────────────────────────────────────

interface SlokaContext {
    chapter: number;
    verse: number;
    sanskrit: string;
    transliteration: string;
    translation_english: string;
    chapterName: string;
}

const DEEP_DIVE_SYSTEM_NOTE =
    'Answer in 2–4 paragraphs. Only discuss the Bhagavad Gita; politely refuse off-topic questions.';

export async function getDeepDiveResponse(
    sloka: SlokaContext,
    question: string,
    history: { role: string; content: string }[] = []
): Promise<string> {
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    for (const m of history.slice(-6)) {
        messages.push({
            role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
            content: m.content,
        });
    }
    // Current question becomes the final user turn
    messages.push({ role: 'user', content: `${DEEP_DIVE_SYSTEM_NOTE}\n\n${question}` });

    try {
        const res = await api.post<{ ok: boolean; reply: string }>('/api/scholar', {
            messages,
            contextSloka: {
                chapter: sloka.chapter,
                verse: sloka.verse,
                sanskrit: sloka.sanskrit,
                english: sloka.translation_english,
            },
        });
        log.action('deep_dive.answered', {
            chapter: sloka.chapter,
            verse: sloka.verse,
            len: res.reply.length,
        });
        return res.reply;
    } catch (err) {
        log.error('deep_dive.failed', {
            code: err instanceof ApiError ? err.code : 'UNKNOWN',
        });
        return getOfflineDeepDiveResponse();
    }
}

function getOfflineDeepDiveResponse(): string {
    return `🙏 **The Scholar is resting.**\n\nThere was a problem connecting just now. Please check your internet and try again in a moment.`;
}
