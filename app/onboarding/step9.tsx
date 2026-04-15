/**
 * Onboarding Step 9 — Widgets Showcase
 * Shows users how to add Home and Lock Screen Widgets.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';

const { width } = Dimensions.get('window');

// Mock Widget preview component
function WidgetPreview() {
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.widgetPreviewArea}>
      {/* Home Screen Widget Mock */}
      <View style={styles.homeWidget}>
        <LinearGradient
          colors={['#1A1A1A', '#0D0D0D']}
          style={styles.homeWidgetGradient}
        >
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetHeaderSubtitle}>Daily Sloka</Text>
            <Ionicons name="leaf" size={14} color="#D4A44C" />
          </View>
          <Text style={styles.widgetSanskrit}>सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज</Text>
          <Text style={styles.widgetVerseRef}>Gita 18:66</Text>
        </LinearGradient>
      </View>

      {/* Lock Screen Widget Mock */}
      <View style={styles.lockWidgetArea}>
         <View style={styles.lockWidget}>
           <Ionicons name="book" size={18} color="#FFF" />
           <Text style={styles.lockWidgetText}>Streak: 12</Text>
         </View>
      </View>
    </Animated.View>
  );
}

export default function OnboardingStep9() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/paywall' as any);
  };

  return (
    <OnboardingBackground overlayOpacity={0.75}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Progress dots (Step 9 of 9 basically, so all filled or 9 dots) */}
        <View style={styles.progressContainer}>
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <View key={i} style={[styles.dot, i === 8 && styles.dotActive]} />
          ))}
        </View>

        {/* Card Preview */}
        <View style={styles.previewContainer}>
          <WidgetPreview />
        </View>

        {/* Bottom content */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.bottomContent}>
          <Text style={styles.title}>Wisdom at a Glance</Text>
          <Text style={styles.subtitle}>
            Keep Krishna's teachings close. Add beautiful widgets to your Home and Lock screens for daily inspiration without even opening the app.
          </Text>

          {/* Feature bullets */}
          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="grid-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Home Screen daily verse widgets</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="lock-closed-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Lock Screen sadhana streak counters</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="color-palette-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Multiple sizes and elegant dark themes</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D4A44C', '#B8912E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>Begin Journey</Text>
              <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  progressContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    paddingTop: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18, backgroundColor: '#D4A44C' },

  previewContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },

  widgetPreviewArea: {
    alignItems: 'center',
    gap: 24,
  },
  homeWidget: {
    width: width * 0.75,
    height: 140,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212,164,76,0.3)',
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  homeWidgetGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  widgetHeaderSubtitle: {
    fontSize: 12,
    color: '#D4A44C',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  widgetSanskrit: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    lineHeight: 28,
  },
  widgetVerseRef: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    marginTop: 8,
  },
  lockWidgetArea: {
    alignItems: 'center',
    gap: 12,
  },
  lockWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lockWidgetText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  bottomContent: {
    paddingHorizontal: 28, paddingBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 23, marginBottom: 20 },
  bullets: { gap: 10, marginBottom: 28 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 20 },

  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '800' },
});
