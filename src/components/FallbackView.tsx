/**
 * FallbackView — a recoverable-error surface with a retry button.
 *
 * Pair with `useAsync` or any `ApiError`. Takes a friendly message from the
 * error (our `ApiError` messages are already user-safe) and exposes a retry
 * callback. Mirrors the visual language of `LoadingState` so swapping between
 * them feels seamless.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ApiError } from '../utils/apiClient';

interface Props {
  error: unknown;
  onRetry?: () => void;
  /** Custom title; defaults to a generic, non-alarming phrase. */
  title?: string;
  style?: ViewStyle;
  compact?: boolean;
}

function friendlyMessage(err: unknown): { title: string; message: string; canRetry: boolean } {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return { title: 'Please sign in', message: err.message, canRetry: false };
      case 'RATE_LIMITED':
        return { title: 'Slow down a moment', message: err.message, canRetry: true };
      case 'NETWORK':
      case 'TIMEOUT':
        return {
          title: 'Connection issue',
          message: 'Check your internet and try again.',
          canRetry: true,
        };
      case 'UPSTREAM_ERROR':
      case 'INTERNAL_ERROR':
        return { title: 'Temporary hiccup', message: err.message, canRetry: true };
      default:
        return { title: "We couldn't load this", message: err.message, canRetry: err.retryable };
    }
  }
  return {
    title: "We couldn't load this",
    message: 'Something went wrong. Please try again.',
    canRetry: true,
  };
}

export function FallbackView({ error, onRetry, title, style, compact }: Props) {
  const f = friendlyMessage(error);
  return (
    <View style={[styles.root, compact && styles.compact, style]}>
      <Text style={styles.title}>{title ?? f.title}</Text>
      <Text style={styles.body}>{f.message}</Text>
      {onRetry && f.canRetry ? (
        <TouchableOpacity style={styles.btn} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  compact: { padding: 12 },
  title: { color: '#D4A44C', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  body: { color: '#B0A090', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 300 },
  btn: {
    marginTop: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4A44C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: { color: '#D4A44C', fontSize: 13, fontWeight: '600' },
});
