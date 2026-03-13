import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveOnboardingStep } from '../../src/utils/stats';

const OPTIONS = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'Curious to learn',
    icon: 'book-outline',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Know some verses',
    icon: 'book',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Regular practitioner',
    icon: 'flower-outline',
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Deep academic study',
    icon: 'school-outline',
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selectedId) {
      await saveOnboardingStep('experienceLevel', selectedId);
      router.push('/onboarding/step3');
    }
  };

  const handleSkip = async () => {
    await saveOnboardingStep('experienceLevel', 'beginner');
    router.push('/onboarding/step3');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6F0" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalization</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressStep}>STEP 2 OF 4</Text>
            <Text style={styles.progressLabel}>Experience Level</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '50%' }]} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>
            How familiar are you with the <Text style={styles.highlight}>Bhagavad Gita</Text>?
          </Text>
          <Text style={styles.subtitle}>
            This helps us tailor the verses and explanations to your current level of understanding.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.8}
                onPress={() => setSelectedId(option.id)}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={22} 
                    color={isSelected ? '#F48B29' : '#9CA3AF'} 
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>

                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleContinue}
          disabled={!selectedId}
          style={[styles.continueButton, selectedId ? styles.continueButtonActive : styles.continueButtonInactive]}
        >
          <Text style={[styles.continueText, selectedId ? styles.continueTextActive : styles.continueTextInactive]}>
            Continue
          </Text>
          <Ionicons name="arrow-forward" size={20} color={selectedId ? '#FFFFFF' : 'rgba(244, 139, 41, 0.5)'} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>I'm not sure yet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F48B29',
    letterSpacing: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FDE8D4',
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F48B29',
    borderRadius: 999,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  highlight: {
    color: '#F48B29',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F48B29',
    borderWidth: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: '#FEF3E8',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#1A1A1A',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#F48B29',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F48B29',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonActive: {
    backgroundColor: '#F48B29',
  },
  continueButtonInactive: {
    backgroundColor: '#FDE8D4',
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  continueTextActive: {
    color: '#FFFFFF',
  },
  continueTextInactive: {
    color: '#F48B29',
    opacity: 0.5,
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
