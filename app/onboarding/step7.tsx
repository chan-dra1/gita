/**
 * Onboarding Step 7 — Meditation Mode Showcase
 * Shows users the listening modes and the sacred repeat counts.
 */
import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';

const MODES = [
  { icon: 'musical-notes', title: 'Chant Only', desc: 'Sanskrit verse chanting', color: '#E8B94A' },
  { icon: 'book', title: 'Chant + Meaning', desc: 'Verse + translation', color: '#6BB5E8' },
  { icon: 'school', title: 'Deep Study', desc: 'Chant + full commentary', color: '#A78BFA' },
];

const SACRED = ['1', '3', '7', '11', '21', 'ॐ'];

/** Showcase only: fixed selection (same UX as non-tappable Sacred Repeat row). */
const LOCKED_MODE_INDEX = 2;

export default function OnboardingStep7() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { width: 18, backgroundColor: colors.primary },

    previewArea: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 16 },

    modePreview: { gap: 8 },
    modeCard: {
      flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
      backgroundColor: colors.card, borderWidth: 1,
      borderColor: colors.border, gap: 12,
    },
    modeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    modeTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    modeDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    modeTick: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    sacredRow: { },
    sacredLabel: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
    sacredGrid: { flexDirection: 'row', gap: 8 },
    sacredBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 10,
      backgroundColor: colors.card, alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    sacredBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sacredNum: { fontSize: 16, fontWeight: '800', color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    sacredNumActive: { color: colors.background },

    bottomContent: { 
      paddingHorizontal: 24, 
      paddingBottom: 48 
    },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 23, marginBottom: 20 },
    bullets: { gap: 10, marginBottom: 28 },
    bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bulletText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },

    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    buttonText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  }), [colors, isDark]);

  return (
    <OnboardingBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <View key={i} style={[styles.dot, i === 6 && styles.dotActive]} />
          ))}
        </View>

        {/* Preview cards area */}
        <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.previewArea}>
          {/* Mode selector preview */}
          <View style={styles.modePreview}>
            {MODES.map((m, i) => {
              const selected = i === LOCKED_MODE_INDEX;
              return (
                <View
                  key={i}
                  style={[styles.modeCard, selected && { borderColor: MODES[i].color, backgroundColor: `${MODES[i].color}12` }]}
                >
                  <View style={[styles.modeIcon, { backgroundColor: selected ? `${MODES[i].color}25` : colors.card }]}>
                    <Ionicons name={m.icon as any} size={20} color={selected ? MODES[i].color : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeTitle, selected && { color: MODES[i].color }]}>{m.title}</Text>
                    <Text style={styles.modeDesc}>{m.desc}</Text>
                  </View>
                  {selected ? (
                    <View style={[styles.modeTick, { backgroundColor: MODES[i].color }]}>
                      <Ionicons name="checkmark" size={12} color={colors.background} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Sacred counts */}
          <View style={styles.sacredRow}>
            <Text style={styles.sacredLabel}>Sacred Repeat Counts</Text>
            <View style={styles.sacredGrid}>
              {SACRED.map((s, i) => (
                <View key={i} style={[styles.sacredBtn, i === 5 && styles.sacredBtnActive]}>
                  <Text style={[styles.sacredNum, i === 5 && styles.sacredNumActive]}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Bottom content */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))} 
          style={styles.bottomContent}
        >
          <Text style={styles.title}>Meditation Mode</Text>
          <Text style={styles.subtitle}>
            Listen to sacred chanting while you meditate. Choose how deep you want to go — 
            from pure Sanskrit chant to full spiritual commentary.
          </Text>

          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="headset-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Put on headphones for the best experience</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="repeat-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Repeat up to 108 times — the sacred Mala count</Text>
            </View>
          </View>

          <TouchableOpacity
            style={{ borderRadius: 8, overflow: 'hidden' }}
            onPress={() => router.push('/onboarding/step8' as any)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#D4A44C', '#C2983B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}
