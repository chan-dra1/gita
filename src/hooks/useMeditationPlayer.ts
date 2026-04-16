import { useState, useCallback, useRef, useEffect } from 'react';
import { getSloka } from '../utils/sloka';
import { cacheAndPlayAudio, stopAudio } from '../utils/audio';
import { getNextUnreadVerses, addSlokaRead, getLastReadSloka } from '../utils/stats';
import { incrementGlobalSankalpa } from '../utils/karma';
import type { Sloka } from '../types';

export type ListeningMode = 'chant_only' | 'chant_meaning' | 'full';

export type MeditationState = 
  | 'idle' 
  | 'loading_batch' 
  | 'playing_sanskrit' 
  | 'playing_english' 
  | 'playing_meaning'  // Extended purport/commentary
  | 'paused' 
  | 'completed';

export interface MeditationPlayerState {
  status: MeditationState;
  queue: { chapter: number; verse: number; sloka: Sloka }[];
  currentIndex: number;
  progress: number; // 0 to 1
  error: string | null;
  repeatCount: number;
  currentRepeat: number;
  listeningMode: ListeningMode;
}

// Delay constants (ms) for peaceful transitions
const DELAY_AFTER_CHANT = 2500;    // Pause after Sanskrit chant before meaning
const DELAY_AFTER_MEANING = 3000;  // Pause after meaning before next verse/repeat
const DELAY_AFTER_PURPORT = 3500;  // Longer pause after deep study commentary

export function useMeditationPlayer() {
  const [state, setState] = useState<MeditationPlayerState>({
    status: 'idle',
    queue: [],
    currentIndex: 0,
    progress: 0,
    error: null,
    repeatCount: 1,
    currentRepeat: 1,
    listeningMode: 'chant_meaning',
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    return () => {
      isUnmounted.current = true;
      stopAudio();
    };
  }, []);

  const updateState = (updates: Partial<MeditationPlayerState>) => {
    if (isUnmounted.current) return;
    setState(prev => ({ ...prev, ...updates }));
  };

  /**
   * Loads the extended purport text for a verse.
   */
  const getPurportText = (chapter: number, verse: number): string => {
    try {
      const purports = require('../data/purports.json');
      const key = `${chapter}:${verse}`;
      return purports[key] || '';
    } catch {
      return '';
    }
  };

  /**
   * Initializes the player with a specific count and starts playing.
   */
  const startSession = useCallback(async (
    count: number, 
    options?: { startFromLastRead?: boolean; repeatCount?: number; listeningMode?: ListeningMode }
  ) => {
    try {
      const repeatVal = options?.repeatCount || 1;
      const mode = options?.listeningMode || 'chant_meaning';
      
      updateState({ 
        status: 'loading_batch', 
        error: null, 
        progress: 0, 
        currentIndex: 0,
        repeatCount: repeatVal,
        currentRepeat: 1,
        listeningMode: mode,
      });
      await stopAudio();
      
      let versesToPlay: {chapter: number; verse: number}[] = [];

      if (options?.startFromLastRead) {
        const lastRead = await getLastReadSloka();
        if (lastRead) {
          const { getAllChapters } = require('../utils/sloka');
          const chapters = getAllChapters() as any[];
          let found = false;
          for (const chap of chapters) {
            for (let v = 1; v <= chap.verses_count; v++) {
              if (found || (chap.chapter === lastRead.chapter && v === lastRead.verse)) {
                found = true;
                versesToPlay.push({ chapter: chap.chapter, verse: v });
                if (versesToPlay.length >= count) break;
              }
            }
            if (versesToPlay.length >= count) break;
          }
        }
      }

      // Fallback if not starting from last read or last read not found
      if (versesToPlay.length === 0) {
        versesToPlay = await getNextUnreadVerses(count);
      }

      if (versesToPlay.length === 0) {
        updateState({ status: 'completed', error: 'No verses found to play.' });
        return;
      }

      // Pre-fetch sloka text data for all queue items
      const queue = versesToPlay.map((v: {chapter: number; verse: number}) => ({
        chapter: v.chapter,
        verse: v.verse,
        sloka: getSloka(v.chapter, v.verse)!
      })).filter((q: any) => q.sloka !== null);

      if (queue.length === 0) {
        updateState({ status: 'completed', error: 'Failed to load verse data.' });
        return;
      }

      updateState({ 
        queue, 
        currentIndex: 0, 
      });

      // Start sequential playback
      playNextStage(0, 'playing_sanskrit', queue, 1, repeatVal, mode);

    } catch (e: any) {
      updateState({ status: 'idle', error: e.message || 'Failed to start session' });
    }
  }, []);

  /**
   * Determines total stages based on listening mode
   */
  const getStagesPerVerse = (mode: ListeningMode): number => {
    switch (mode) {
      case 'chant_only': return 1;
      case 'chant_meaning': return 2;
      case 'full': return 3;
    }
  };

  /**
   * Gets the next stage after the current one, respecting listening mode.
   */
  const getNextStage = (
    currentStage: 'playing_sanskrit' | 'playing_english' | 'playing_meaning',
    mode: ListeningMode
  ): 'playing_sanskrit' | 'playing_english' | 'playing_meaning' | 'done' => {
    switch (currentStage) {
      case 'playing_sanskrit':
        if (mode === 'chant_only') return 'done';
        return 'playing_english';
      case 'playing_english':
        if (mode === 'full') return 'playing_meaning';
        return 'done';
      case 'playing_meaning':
        return 'done';
    }
  };

  const playNextStage = useCallback(async (
    index: number, 
    stage: 'playing_sanskrit' | 'playing_english' | 'playing_meaning', 
    queueList: MeditationPlayerState['queue'],
    repeatIter: number,
    totalRepeat: number,
    mode: ListeningMode
  ) => {
    if (isUnmounted.current) return;
    
    // Check if we hit the end
    if (index >= queueList.length) {
      updateState({ status: 'completed', progress: 1 });
      return;
    }

    const currentItem = queueList[index];
    const stagesPerVerse = getStagesPerVerse(mode);
    
    // Calculate progress
    const stageIndex = stage === 'playing_sanskrit' ? 0 : stage === 'playing_english' ? 1 : 2;
    const totalStages = queueList.length * stagesPerVerse;
    const currentStageCount = (index * stagesPerVerse) + Math.min(stageIndex, stagesPerVerse - 1);
    
    updateState({ 
      status: stage, 
      currentIndex: index,
      progress: currentStageCount / totalStages,
      currentRepeat: repeatIter,
      listeningMode: mode,
    });

    // Clean audio text
    const cleanSanskrit = currentItem.sloka.sanskrit.replace(/\|\|\d+-\d+\|\|/g, '').replace(/\|\|\d+\|\|/g, '').trim();
    const cleanEnglish = currentItem.sloka.translation_english.replace(/Chapter \d+, Verse \d+[.,]?\s*/gi, '').trim();

    const onStageFinished = (delay: number) => {
      setTimeout(() => {
        if (stateRef.current.status === 'paused' || isUnmounted.current) return;
        
        const nextStage = getNextStage(stage, mode);
        
        if (nextStage === 'done') {
          // Mark as read
          addSlokaRead(currentItem.chapter, currentItem.verse).catch(() => {});
          incrementGlobalSankalpa(1).catch(() => {});
          
          // Check repeat
          if (repeatIter < totalRepeat) {
            playNextStage(index, 'playing_sanskrit', queueList, repeatIter + 1, totalRepeat, mode);
          } else {
            playNextStage(index + 1, 'playing_sanskrit', queueList, 1, totalRepeat, mode);
          }
        } else {
          playNextStage(index, nextStage, queueList, repeatIter, totalRepeat, mode);
        }
      }, delay);
    };

    const onError = (err: any) => {
      console.error(`${stage} playback failed:`, err);
      onStageFinished(1000);
    };

    try {
      if (stage === 'playing_sanskrit') {
        await cacheAndPlayAudio(
          currentItem.chapter, currentItem.verse,
          cleanSanskrit, 'sanskrit',
          () => onStageFinished(DELAY_AFTER_CHANT),
          onError
        );
      } else if (stage === 'playing_english') {
        await cacheAndPlayAudio(
          currentItem.chapter, currentItem.verse,
          cleanEnglish, 'english',
          () => onStageFinished(mode === 'full' ? DELAY_AFTER_MEANING : DELAY_AFTER_MEANING),
          onError
        );
      } else if (stage === 'playing_meaning') {
        // Extended purport
        const purportText = getPurportText(currentItem.chapter, currentItem.verse);
        if (purportText) {
          await cacheAndPlayAudio(
            currentItem.chapter, currentItem.verse,
            purportText, 'english', // purport is in English for now
            () => onStageFinished(DELAY_AFTER_PURPORT),
            onError
          );
        } else {
          // No purport available, skip to next
          onStageFinished(1000);
        }
      }
    } catch (e: any) {
      console.error('Audio cache error:', e);
      updateState({ error: e.message || 'Audio playback error' });
    }
  }, []);

  const pause = useCallback(async () => {
    await stopAudio();
    updateState({ status: 'paused' });
  }, []);

  const resume = useCallback(() => {
    if (state.status === 'paused' && state.queue.length > 0) {
      playNextStage(
        state.currentIndex, 'playing_sanskrit', state.queue, 
        state.currentRepeat, state.repeatCount, state.listeningMode
      );
    }
  }, [state.status, state.currentIndex, state.queue, state.currentRepeat, state.repeatCount, state.listeningMode, playNextStage]);

  const stop = useCallback(async () => {
    await stopAudio();
    updateState({ status: 'idle', queue: [], currentIndex: 0, progress: 0 });
  }, []);

  return {
    ...state,
    startSession,
    pause,
    resume,
    stop
  };
}
