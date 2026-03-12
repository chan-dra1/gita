/**
 * useDeepDive — React hook for contextual AI scholar chat.
 *
 * Sends ONLY the current sloka + user question to Gemini.
 * Keeps conversation history capped at 5 messages for token efficiency.
 */

import { useState, useCallback, useRef } from 'react';
import { getDeepDiveResponse } from '../utils/gemini';
import type { DeepDiveMessage, DeepDiveState } from '../types';

interface SlokaContext {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  translation_english: string;
  chapterName: string;
}

interface UseDeepDiveReturn extends DeepDiveState {
  askQuestion: (question: string) => Promise<void>;
  clearChat: () => void;
  suggestedQuestions: string[];
}

// Suggested starter questions that work for any verse
const SUGGESTED_QUESTIONS = [
  'What is the deeper meaning of this verse?',
  'How can I apply this teaching in my daily life?',
  'What was the context when Krishna spoke this?',
  'Why is this verse important in the Gita?',
  'Explain this verse in simple terms',
];

const MAX_HISTORY = 5; // Cap conversation history for token savings

export function useDeepDive(slokaContext: SlokaContext | null): UseDeepDiveReturn {
  const [state, setState] = useState<DeepDiveState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  // Track current verse to auto-clear on change
  const currentVerseRef = useRef<string>('');

  const getVerseKey = (ctx: SlokaContext) => `${ctx.chapter}:${ctx.verse}`;

  // Auto-clear chat if verse changes
  if (slokaContext) {
    const key = getVerseKey(slokaContext);
    if (currentVerseRef.current !== key) {
      currentVerseRef.current = key;
      if (state.messages.length > 0) {
        setState({ messages: [], isLoading: false, error: null });
      }
    }
  }

  const askQuestion = useCallback(
    async (question: string) => {
      if (!slokaContext || !question.trim()) return;

      // Add user message
      const userMessage: DeepDiveMessage = {
        role: 'user',
        content: question.trim(),
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        // Build recent history (capped for token savings)
        const recentHistory = [...state.messages, userMessage]
          .slice(-MAX_HISTORY)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await getDeepDiveResponse(
          slokaContext,
          question.trim(),
          recentHistory
        );

        const assistantMessage: DeepDiveMessage = {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to get response';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    },
    [slokaContext, state.messages]
  );

  const clearChat = useCallback(() => {
    setState({ messages: [], isLoading: false, error: null });
  }, []);

  return {
    ...state,
    askQuestion,
    clearChat,
    suggestedQuestions: SUGGESTED_QUESTIONS,
  };
}
