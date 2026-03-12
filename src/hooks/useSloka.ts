/**
 * useSloka — React hook for sloka data access.
 */

import { useCallback, useState } from 'react';
import type { Sloka } from '../types';
import { getSlokaRecommendation } from '../utils/gemini';
import { getRandomSloka, getSloka } from '../utils/sloka';

interface SlokaWithMeta extends Sloka {
    chapter: number;
    chapterName: string;
    chapterNameSanskrit?: string;
}

interface UseSlokaReturn {
    sloka: SlokaWithMeta | null;
    isLoading: boolean;
    error: string | null;
    fetchSloka: (chapter: number, verse: number) => void;
    fetchRandom: () => void;
    fetchByMood: (mood: string) => Promise<void>;
}

export function useSloka(): UseSlokaReturn {
    const [sloka, setSloka] = useState<SlokaWithMeta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSloka = useCallback((chapter: number, verse: number) => {
        const result = getSloka(chapter, verse);
        if (result) {
            setSloka({ ...result, chapter });
            setError(null);
        } else {
            setError(`Sloka ${chapter}:${verse} not found`);
        }
    }, []);

    const fetchRandom = useCallback(() => {
        const result = getRandomSloka();
        setSloka(result);
        setError(null);
    }, []);

    const fetchByMood = useCallback(async (mood: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getSlokaRecommendation(mood);
            if (result) {
                setSloka(result);
            } else {
                setError('Could not find a recommendation');
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to get recommendation';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { sloka, isLoading, error, fetchSloka, fetchRandom, fetchByMood };
}
