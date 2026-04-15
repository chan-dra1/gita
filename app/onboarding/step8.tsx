/**
 * Onboarding Step 8 — Saved Slokas Feature Showcase
 * Shows users how bookmarking works and how to build their personal collection.
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

const SAMPLE_SAVED = [
  { chapter: 2, verse: 47, text: 'You have the right to work, but never to the fruit of work.' },
  { chapter: 4, verse: 7, text: 'Whenever there is a decline in righteousness, I manifest Myself.' },
  { chapter: 9, verse: 22, text: 'For those who worship Me with devotion, I carry what they lack.' },
];

function SavedVerseCard({ chapter, verse, text, delay }: { chapter: number; verse: number; text: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.savedCard}>
      <View style={styles.savedCardLeft}>
        <View style={styles.savedChapterBadge}>
          <Text style={styles.savedChapterNum}>{chapter}:{verse}</Text>
        </View>
      </View>
      <Text style={styles.savedCardText} numberOfLines={2}>{text}</Text>
      <Ionicons name="bookmark" size={18} color="#D4A44C" />
    </Animated.View>
  );
}

export default function OnboardingStep8() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/step9' as any);
  };

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_1.png')}
      overlayOpacity={0.8}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <View key={i} style={[styles.dot, i === 7 && styles.dotActive]} />
          ))}
        </View>

        {/* Preview area */}
        <View style={styles.previewArea}>
          {/* Header showing bookmark icon action */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.bookmarkHint}>
            <View style={styles.bookmarkHintCard}>
              <View style={styles.bookmarkHintLeft}>
                <Text style={styles.bookmarkHintTitle}>Bhagavad Gita 2:47</Text>
                <Text style={styles.bookmarkHintText} numberOfLines={2}>
                  You have the right to work, but never to the fruit of work...
                </Text>
              </View>
              <View style={styles.bookmarkBtnPreview}>
                <Ionicons name="bookmark" size={22} color="#D4A44C" />
              </View>
            </View>
            <View style={styles.bookmarkArrow}>
              <Ionicons name="arrow-down" size={16} color="#D4A44C" />
              <Text style={styles.bookmarkArrowText}>Tap to save any verse</Text>
            </View>
          </Animated.View>

          {/* Sample saved collection */}
          <View style={styles.savedList}>
            <Text style={styles.savedListTitle}>Your Personal Collection</Text>
            {SAMPLE_SAVED.map((s, i) => (
              <SavedVerseCard key={i} {...s} delay={300 + i * 150} />
            ))}
          </View>
        </View>

        {/* Bottom content */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.bottomContent}>
          <Text style={styles.title}>Your Sacred Library</Text>
          <Text style={styles.subtitle}>
            Tap the bookmark icon on any verse to save it. Build your personal collection 
            of wisdom that speaks closest to your heart.
          </Text>

          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="bookmark-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Bookmark any verse instantly with one tap</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="library-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Access your collection from Settings → Saved</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="cloud-done-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Synced across all your devices</Text>
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
              <Text style={styles.continueBtnText}>See Your Plan</Text>
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
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18, backgroundColor: '#D4A44C' },

  previewArea: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 16 },

  bookmarkHint: { gap: 8 },
  bookmarkHintCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.9)', borderRadius: 16,
    padding: 16, gap: 12,
    borderWidth: 1, borderColor: 'rgba(212,164,76,0.3)',
  },
  bookmarkHintLeft: { flex: 1 },
  bookmarkHintTitle: { fontSize: 12, color: '#D4A44C', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  bookmarkHintText: { fontSize: 13, color: '#CCC', lineHeight: 18 },
  bookmarkBtnPreview: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(212,164,76,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,164,76,0.3)',
  },
  bookmarkArrow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  bookmarkArrowText: { fontSize: 12, color: '#D4A44C', fontWeight: '600' },

  savedList: { gap: 8 },
  savedListTitle: { fontSize: 11, color: '#D4A44C', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  savedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  savedCardLeft: {},
  savedChapterBadge: {
    backgroundColor: 'rgba(212,164,76,0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(212,164,76,0.3)',
  },
  savedChapterNum: { fontSize: 11, color: '#D4A44C', fontWeight: '700' },
  savedCardText: { flex: 1, fontSize: 12, color: '#AAA', lineHeight: 18 },

  bottomContent: { paddingHorizontal: 28, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 23, marginBottom: 20 },
  bullets: { gap: 10, marginBottom: 28 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 20 },

  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '800' },
});
