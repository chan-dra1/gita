import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';

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
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedLevel) return;
    await saveOnboardingStep('experienceLevel', selectedLevel);
    router.push('/onboarding/step3');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" translucent />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#D4A44C" />
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
          <Animated.View entering={FadeInDown.duration(400)} style={styles.ctaContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleContinue}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>CONTINUE</Text>
              <Ionicons name="chevron-forward" size={18} color="#0D0D0D" />
            </TouchableOpacity>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  safeArea: { flex: 1 },
  backButton: { padding: 8 },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18, backgroundColor: '#D4A44C' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },

  titleContainer: { marginBottom: 24 },
  eyebrow: { fontSize: 10, color: '#D4A44C', fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 36, marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },

  cardsContainer: { gap: 12 },
  levelCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  levelCardSelected: { borderColor: '#D4A44C', borderWidth: 2, backgroundColor: 'rgba(212, 164, 76, 0.06)' },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  levelTitle: { fontSize: 18, fontWeight: '700', color: '#D4A44C', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
  levelTitleSelected: { color: '#D4A44C' },
  levelDescription: { fontSize: 13, color: '#9CA3AF', lineHeight: 20, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagSelected: { backgroundColor: 'rgba(212, 164, 76, 0.15)' },
  tagText: { fontSize: 10, fontWeight: '700', color: '#666', letterSpacing: 0.5 },
  tagTextSelected: { color: '#D4A44C' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#333', marginLeft: 16, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#D4A44C' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4A44C' },

  quoteSection: { marginTop: 32, alignItems: 'center' },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#666', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 24, textAlign: 'center', marginBottom: 8 },
  quoteRef: { fontSize: 10, color: '#444', fontWeight: '700', letterSpacing: 1 },

  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  ctaButton: { backgroundColor: '#D4A44C', borderRadius: 8, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 14, fontWeight: '800', color: '#0D0D0D', letterSpacing: 1 },
});
