import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveOnboardingStep, completeOnboarding } from '../../src/utils/stats';

const COMMITMENT_OPTIONS = [
  {
    id: 'quick',
    title: 'Quick',
    subtitle: '(2 mins/day)',
    description: 'Brief moment of mindfulness',
  },
  {
    id: 'moderate',
    title: 'Moderate',
    subtitle: '(5 mins/day)',
    description: 'Balanced daily routine',
  },
  {
    id: 'deep',
    title: 'Deep',
    subtitle: '(15+ mins/day)',
    description: 'Intensive spiritual practice',
  },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('quick');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const handleComplete = async () => {
    await saveOnboardingStep('dailyCommitment', selectedId);
    await saveOnboardingStep('remindersEnabled', remindersEnabled);
    await completeOnboarding();
    
    // Navigate to paywall instead of directly to tabs
    router.replace('/onboarding/paywall');
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
          <Text style={styles.progressStepLabel}>Final Step</Text>
          <Text style={styles.progressStep}>4 OF 4</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>Commit to your daily practice</Text>
      </View>

      {/* Commitment Options */}
      <View style={styles.optionsContainer}>
        {COMMITMENT_OPTIONS.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              onPress={() => setSelectedId(option.id)}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
            >
              <View style={styles.optionRow}>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {option.title} <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reminders Toggle */}
      <View style={styles.remindersContainer}>
        <View style={styles.remindersContent}>
          <Text style={styles.remindersTitle}>Daily Reminders</Text>
          <Text style={styles.remindersDescription}>Remind me to stay on path</Text>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
          trackColor={{ false: '#E5E7EB', true: '#FDE8D4' }}
          thumbColor={remindersEnabled ? '#F48B29' : '#9CA3AF'}
          ios_backgroundColor="#E5E7EB"
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleComplete}
          style={styles.completeButton}
        >
          <Text style={styles.completeButtonText}>Complete Setup</Text>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" style={styles.sparkleIcon} />
        </TouchableOpacity>
        
        <Text style={styles.footerHint}>
          You can change these settings anytime in your profile.
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
  progressStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressStep: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F48B29',
    letterSpacing: 1,
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
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  optionCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    backgroundColor: '#FEF8F3',
    borderColor: '#F48B29',
    borderWidth: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#1A1A1A',
  },
  optionSubtitle: {
    fontWeight: 'normal',
    color: '#6B7280',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#F48B29',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F48B29',
  },
  remindersContainer: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 18,
    backgroundColor: '#FEF8F3',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE8D4',
  },
  remindersContent: {
    flex: 1,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  remindersDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
    marginTop: 'auto',
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F48B29',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 16,
  },
});
