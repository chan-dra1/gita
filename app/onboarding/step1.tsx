import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveOnboardingStep } from '../../src/utils/stats';

const OPTIONS = [
  {
    id: 'inner_peace',
    title: 'Seeking inner peace',
    description: 'Find tranquility in the midst of chaos',
  },
  {
    id: 'overcoming_anxiety',
    title: 'Overcoming daily anxiety',
    description: 'Practical wisdom for modern stress',
  },
  {
    id: 'life_purpose',
    title: 'Finding life purpose',
    description: 'Understand your dharma and path',
  },
  {
    id: 'spiritual_practice',
    title: 'Deepening spiritual practice',
    description: 'Connect with the divine through study',
  },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selectedId) {
      await saveOnboardingStep('motivation', selectedId);
      router.push('/onboarding/step2');
    }
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

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressStep}>STEP 1 OF 4</Text>
          <Text style={styles.progressLabel}>Getting Started</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>What brings you to the Gita today?</Text>
        <Text style={styles.subtitle}>Select the path that resonates most with your soul's current journey.</Text>
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
        
        <Text style={styles.footerHint}>
          You can update your preferences later in settings
        </Text>
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
    paddingHorizontal: 24,
    marginTop: 24,
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
    width: '25%',
    borderRadius: 999,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 24,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    flex: 1,
    gap: 16,
  },
  optionCard: {
    padding: 20,
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
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 16,
  },
});
