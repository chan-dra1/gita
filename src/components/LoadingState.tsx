/**
 * LoadingState — inline or full-screen spinner with optional label.
 *
 * Use this everywhere a screen, list, or card is waiting on data. Avoid
 * ad-hoc ActivityIndicator without a surrounding layout — this component
 * guarantees a consistent height and accessible label.
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  label?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingState({ label = 'Loading…', fullScreen, style }: Props) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[styles.root, fullScreen && styles.full, style]}
    >
      <ActivityIndicator color="#D4A44C" size={fullScreen ? 'large' : 'small'} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },
  full: { flex: 1, paddingVertical: 0 },
  label: { color: '#B0A090', fontSize: 13, marginTop: 6, textAlign: 'center' },
});
