import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { saveOnboardingStep } from '../../src/utils/stats';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { ONBOARDING_BACKGROUND_IMAGE } from '../../src/constants/onboardingAssets';

const LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'I am new to the Bhagavad Gita and wish to understand its core principles from the ground up.',
    tags: ['FOUNDATIONS', 'CONCEPTS'],
  },
  {
    id: 'seeker',
    title: 'Seeker',
    description: 'I have some exposure and seek to deepen my spiritual practice and philosophical understanding.',
    tags: ['DEEP DIVE', 'APPLICATION'],
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'I am familiar with the verses and commentaries, looking for advanced linguistic and metaphysical study.',
    tags: ['SANSKRIT', 'ADVANCED'],
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    safeArea: { flex: 1 },
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
    progressContainer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    dotsRow: { flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { width: 18, backgroundColor: colors.primary },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },

    titleContainer: { marginBottom: 24 },
    eyebrow: { fontSize: 10, color: colors.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
    mainTitle: { fontSize: 28, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 36, marginBottom: 12 },
    subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

    cardsContainer: { gap: 12 },
    levelCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    levelCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: `${colors.primary}1A` },
    cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
    levelTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
    levelTitleSelected: { color: colors.primary },
    levelDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
    tagsRow: { flexDirection: 'row', gap: 8 },
    tag: { backgroundColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    tagSelected: { backgroundColor: `${colors.primary}1A` },
    tagText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
    tagTextSelected: { color: colors.primary },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textSecondary, marginLeft: 16, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
    radioOuterSelected: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

    quoteSection: { marginTop: 32, alignItems: 'center' },
    quoteText: { fontSize: 16, fontStyle: 'italic', color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 24, textAlign: 'center', marginBottom: 8 },
    quoteRef: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1 },

    footer: {
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
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
      fontSize: 18,
      fontWeight: '700',
      color: colors.background,
      letterSpacing: 0.5,
    },
  }), [colors, isDark]);

  const handleContinue = async () => {
    if (!selectedLevel) return;
    await saveOnboardingStep('experienceLevel', selectedLevel);
    router.push('/onboarding/step3');
  };

  return (
    <OnboardingBackground imageSource={ONBOARDING_BACKGROUND_IMAGE}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} translucent />
      <SafeAreaView style={styles.safeArea}>

        {/* Progress dots */}
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
            ))}
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleContainer}>
            <Text style={styles.eyebrow}>PERSONALIZE YOUR JOURNEY</Text>
            <Text style={styles.mainTitle}>What is your current depth of knowledge?</Text>
            <Text style={styles.subtitle}>
              Every seeker's path is unique. Tell us where you stand so we can tailor the wisdom of the Gita to your current understanding.
            </Text>
          </Animated.View>

          {/* Level Cards */}
          <View style={styles.cardsContainer}>
            {LEVELS.map((level, index) => {
              const isSelected = selectedLevel === level.id;
              return (
                <Animated.View key={level.id} entering={FadeInRight.duration(500).delay(200 + index * 100)}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedLevel(level.id)}
                    style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                  >
                    <View style={styles.cardContent}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.levelTitle, isSelected && styles.levelTitleSelected]}>{level.title}</Text>
                        <Text style={styles.levelDescription}>{level.description}</Text>
                        <View style={styles.tagsRow}>
                          {level.tags.map(tag => (
                            <View key={tag} style={[styles.tag, isSelected && styles.tagSelected]}>
                              <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Quote */}
          <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.quoteSection}>
            <Text style={styles.quoteText}>
              "Yoga is the journey of the self, through the self, to the self."
            </Text>
            <Text style={styles.quoteRef}>BHAGAVAD GITA 6.20</Text>
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        {selectedLevel && (
          <Animated.View
            entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))}
            style={styles.footer}
          >
            <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.88}>
              <LinearGradient
                colors={['#D4A44C', '#C2983B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12, borderRadius: 8, overflow: 'hidden' }}
              >
                <Text style={styles.buttonText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.background} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </SafeAreaView>
    </OnboardingBackground>
  );
}