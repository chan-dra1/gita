/**
 * useAudio — React hook for TTS audio playback with caching.
 */

import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';
import type { AudioLanguage, AudioState } from '../types';
import { cacheAndPlayAudio, hasCachedAudio, stopAudio } from '../utils/audio';

interface UseAudioReturn extends AudioState {
    play: (
        chapter: number,
        verse: number,
        text: string,
        language: AudioLanguage
    ) => Promise<void>;
    stop: () => Promise<void>;
    isCached: (
        chapter: number,
        verse: number,
        language: AudioLanguage
    ) => boolean;
}

export function useAudio(): UseAudioReturn {
    const [state, setState] = useState<AudioState>({
        isPlaying: false,
        isLoading: false,
        duration: 0,
        position: 0,
        error: null,
    });

    const soundRef = useRef<Audio.Sound | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Track playback progress
    const startProgressTracking = useCallback((sound: Audio.Sound) => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(async () => {
            try {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    setState((prev) => ({
                        ...prev,
                        duration: status.durationMillis || 0,
                        position: status.positionMillis || 0,
                    }));
                }
            } catch {
                // Sound may have been unloaded
            }
        }, 500);
    }, []);

    const stopProgressTracking = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const play = useCallback(
        async (
            chapter: number,
            verse: number,
            text: string,
            language: AudioLanguage
        ) => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const sound = await cacheAndPlayAudio(
                    chapter,
                    verse,
                    text,
                    language,
                    () => {
                        // On finish
                        setState((prev) => ({
                            ...prev,
                            isPlaying: false,
                            position: 0,
                        }));
                        stopProgressTracking();
                    },
                    (error) => {
                        setState((prev) => ({ ...prev, error, isPlaying: false }));
                        stopProgressTracking();
                    }
                );

                soundRef.current = sound;
                setState((prev) => ({
                    ...prev,
                    isPlaying: true,
                    isLoading: false,
                }));
                startProgressTracking(sound);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Playback failed';
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: message,
                }));
            }
        },
        [startProgressTracking, stopProgressTracking]
    );

    const stop = useCallback(async () => {
        await stopAudio();
        soundRef.current = null;
        stopProgressTracking();
        setState({
            isPlaying: false,
            isLoading: false,
            duration: 0,
            position: 0,
            error: null,
        });
    }, [stopProgressTracking]);

    const checkCached = useCallback(
        (chapter: number, verse: number, language: AudioLanguage): boolean => {
            return hasCachedAudio(chapter, verse, language);
        },
        []
    );

    return {
        ...state,
        play,
        stop,
        isCached: checkCached,
    };
}
