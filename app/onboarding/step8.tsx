/**
 * Onboarding Step 8 — Saved Slokas Feature Showcase
 * Shows users how bookmarking works and how to build their personal collection.
 */
import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
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

export default function OnboardingStep8() {
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

    bookmarkHint: { gap: 8 },
    bookmarkHintCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 16,
      padding: 16, gap: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    bookmarkHintLeft: { flex: 1 },
    bookmarkHintTitle: { fontSize: 12, color: colors.primary, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    bookmarkHintText: { fontSize: 13, color: colors.text, lineHeight: 18 },
    bookmarkBtnPreview: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    bookmarkArrow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
    bookmarkArrowText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

    savedList: { gap: 8 },
    savedListTitle: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
    savedCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14,
      padding: 14, gap: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    savedCardLeft: {},
    savedChapterBadge: {
      backgroundColor: colors.border, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 1, borderColor: colors.border,
    },
    savedChapterNum: { fontSize: 11, color: colors.primary, fontWeight: '700' },
    savedCardText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

    bottomContent: {
      paddingHorizontal: 24,
      paddingBottom: 48,
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

  function SavedVerseCard({ chapter, verse, text, delay }: { chapter: number; verse: number; text: string; delay: number }) {
    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.savedCard}>
        <View style={styles.savedCardLeft}>
          <View style={styles.savedChapterBadge}>
            <Text style={styles.savedChapterNum}>{chapter}:{verse}</Text>
          </View>
        </View>
        <Text style={styles.savedCardText} numberOfLines={2}>{text}</Text>
        <Ionicons name="bookmark" size={18} color={colors.primary} />
      </Animated.View>
    );
  }

  const handleContinue = () => {
    router.push('/onboarding/step9' as any);
  };

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_1.png')}
      overlayOpacity={0.8}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

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
                <Ionicons name="bookmark" size={22} color={colors.primary} />
              </View>
            </View>
            <View style={styles.bookmarkArrow}>
              <Ionicons name="arrow-down" size={16} color={colors.primary} />
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
        <Animated.View 
          entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))} 
          style={styles.bottomContent}
        >
          <Text style={styles.title}>Your Sacred Library</Text>
          <Text style={styles.subtitle}>
            Tap the bookmark icon on any verse to save it. Build your personal collection 
            of wisdom that speaks closest to your heart.
          </Text>

          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Bookmark any verse instantly with one tap</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="library-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Access your collection from Settings → Saved</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="cloud-done-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Synced across all your devices</Text>
            </View>
          </View>

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
              <Text style={styles.buttonText}>See Your Plan</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}
