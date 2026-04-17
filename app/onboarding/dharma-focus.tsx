/**
 * Onboarding — Dharma Mode & focus tools
 * Shown after widgets step, before paywall: Screen Time (iOS) vs Usage Access (Android).
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { ONBOARDING_BACKGROUND_IMAGE } from '../../src/constants/onboardingAssets';

export default function OnboardingDharmaFocus() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        body: { flex: 1, paddingHorizontal: 28, paddingTop: 8 },
        iconWrap: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: `${colors.primary}18`,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border,
        },
        title: {
          fontSize: 26,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 12,
          textAlign: 'center',
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        lead: {
          fontSize: 15,
          color: colors.textSecondary,
          lineHeight: 23,
          textAlign: 'center',
          marginBottom: 22,
        },
        bullets: { gap: 12, marginBottom: 28 },
        bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
        bulletText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 21 },
        emergency: {
          padding: 16,
          borderRadius: 16,
          backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)',
          marginBottom: 28,
        },
        emergencyTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 6 },
        emergencyBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
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
      }),
    [colors, isDark],
  );

  const iosCopy =
    'On iPhone, Dharma Mode uses Apple’s Screen Time (Family Controls). You choose which apps or categories to shield — the app never blocks arbitrary programs in the background without your choice.';
  const androidCopy =
    'On Android, Dharma Mode uses Usage Access, a light overlay when a blocked app opens, and a foreground service so the guard stays reliable. You can revoke permissions in Settings anytime.';

  const handleContinue = () => {
    router.push('/onboarding/paywall' as any);
  };

  return (
    <OnboardingBackground imageSource={ONBOARDING_BACKGROUND_IMAGE}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInUp.duration(500)} style={styles.body}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Focus & Dharma Mode</Text>
          <Text style={styles.lead}>{Platform.OS === 'ios' ? iosCopy : androidCopy}</Text>

          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="hand-left-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>
                You can turn shields off in the app whenever you need a break — no hidden lock-in.
              </Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>
                {Platform.OS === 'ios'
                  ? 'For deeper changes, use Settings → Screen Time. That is Apple’s home for limits and allowed apps.'
                  : 'For a full reset, open system Settings → Apps → Gita and adjust Usage Access or overlay permission.'}
              </Text>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emergency}>
            <Text style={styles.emergencyTitle}>Emergency</Text>
            <Text style={styles.emergencyBody}>
              If you feel stuck, disable Dharma Mode from Settings → Dharma Mode (this app) or system Screen Time / Usage
              settings. Your reading progress stays in the app.
            </Text>
          </Animated.View>

          <TouchableOpacity 
            style={{ borderRadius: 8, overflow: 'hidden' }}
            onPress={handleContinue} 
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
