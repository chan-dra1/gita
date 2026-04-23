/**
 * Root Error Boundary.
 *
 * Catches any uncaught render error anywhere below it, reports to our logger
 * (which in prod forwards to Crashlytics / Analytics), and shows a calm
 * retry screen instead of a white void.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { log } from '../utils/logger';
import { env } from '../utils/env';

interface Props {
  children: React.ReactNode;
  /** Optional custom render for the fallback. */
  fallback?: (opts: { error: Error; reset: () => void }) => React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error('react.unhandled_render_error', {
      message: error.message,
      // In prod, the stack goes to Crashlytics via logger; we never show it.
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went astray 🙏</Text>
        <Text style={styles.body}>
          The app hit an unexpected problem and has paused. Your data is safe.
        </Text>
        {!env.IS_PROD ? (
          <ScrollView style={styles.devBox}>
            <Text style={styles.devTitle}>Dev-only details</Text>
            <Text style={styles.devText}>{error.message}</Text>
            {error.stack ? <Text style={styles.devText}>{error.stack}</Text> : null}
          </ScrollView>
        ) : null}
        <TouchableOpacity style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#D4A44C', fontSize: 22, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  body: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24, maxWidth: 340 },
  btn: {
    backgroundColor: '#D4A44C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  btnText: { color: '#0D0D0D', fontSize: 15, fontWeight: '600' },
  devBox: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  devTitle: { color: '#B0A090', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  devText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'monospace' as any },
});
