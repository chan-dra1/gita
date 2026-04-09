import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn, Layout, Easing } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const COMMITMENT_OPTIONS = [
  {
    id: '2',
    title: 'Beginner',
    subtitle: '(2 Slokas/day)',
    description: 'A gentle daily introduction',
    icon: 'leaf-outline' as const,
  },
  {
    id: '5',
    title: 'Seeker',
    subtitle: '(5 Slokas/day)',
    description: 'Steady spiritual progress',
    icon: 'flame-outline' as const,
  },
  {
    id: '10',
    title: 'Scholar',
    subtitle: '(10 Slokas/day)',
    description: 'Deep immersion in wisdom',
    icon: 'book-outline' as const,
  },
  {
    id: 'custom',
    title: 'Custom',
    subtitle: '',
    description: 'Set your own daily goal',
    icon: 'options-outline' as const,
  },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('2');
  const [customValue, setCustomValue] = useState<number>(3);

  const handleComplete = async () => {
    const value = selectedId === 'custom' ? customValue.toString() : selectedId;
    await saveOnboardingStep('dailyCommitment', value);
    router.push('/onboarding/step5' as any);
  };

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_5.png')}
      overlayOpacity={0.7}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D1D5DB" />
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
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressStepLabel}>Almost There</Text>
              <Text style={styles.progressStep}>4 OF 5</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View layout={Layout.springify().damping(15)} style={styles.progressBarFill} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Commit to your daily practice</Text>
            <Text style={styles.subtitleText}>Choose how many slokas you'd like to read each day</Text>
          </Animated.View>

          {/* Commitment Options */}
          <View style={styles.optionsContainer}>
            {COMMITMENT_OPTIONS.map((option, index) => {
              const isSelected = selectedId === option.id;
              return (
                <Animated.View
                  key={option.id}
                  entering={FadeInRight.duration(500).delay(300 + index * 100).easing(Easing.out(Easing.cubic))}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedId(option.id)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  >
                    <View style={styles.optionRow}>
                      <View style={[styles.optionIconContainer, isSelected && styles.optionIconContainerSelected]}>
                        <Ionicons name={option.icon} size={20} color={isSelected ? '#F48B29' : '#9CA3AF'} />
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                          {option.title} {option.subtitle ? <Text style={styles.optionSubtitle}>{option.subtitle}</Text> : null}
                        </Text>
                        <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                          {option.description}
                        </Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <Animated.View entering={FadeIn.duration(200)} style={styles.radioDot} />}
                      </View>
                    </View>
                    
                    {/* Custom Input - shows when custom is selected */}
                    {option.id === 'custom' && isSelected && (
                      <Animated.View entering={FadeIn.duration(300)} style={styles.customInputContainer}>
                        <View style={styles.customInputRow}>
                          <TouchableOpacity 
                            onPress={() => setCustomValue(prev => Math.max(1, prev - 1))}
                            style={styles.dialButtonMinus}
                          >
                            <Ionicons name="remove" size={24} color="#D1D5DB" />
                          </TouchableOpacity>
                          
                          <View style={styles.dialNumberContainer}>
                            <Text style={styles.dialNumber}>{customValue}</Text>
                            <Text style={styles.dialLabel}>Slokas / day</Text>
                          </View>
                          
                          <TouchableOpacity 
                            onPress={() => setCustomValue(prev => Math.min(700, prev + 1))}
                            style={styles.dialButtonPlus}
                          >
                            <Ionicons name="add" size={24} color="#0D0D0D" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.customInputHint}>Use the controls to set your exact target</Text>
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

        </ScrollView>

        {/* Footer */}
        <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleComplete}
            style={[
              styles.completeButton,
              selectedId === 'custom' && customValue < 1 && styles.completeButtonDisabled,
            ]}
            disabled={selectedId === 'custom' && customValue < 1}
          >
            <Text style={styles.completeButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#0A1128" style={styles.sparkleIcon} />
          </TouchableOpacity>
          
          <Text style={styles.footerHint}>
            You can change these settings anytime in your profile.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
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
    color: '#E5E7EB',
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
  progressStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  progressStep: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F48B29',
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F48B29',
    width: '80%',
    borderRadius: 999,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
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
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 32, 58, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(26, 39, 71, 0.8)',
    borderColor: '#F48B29',
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionIconContainerSelected: {
    backgroundColor: 'rgba(244, 139, 41, 0.15)',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#F48B29',
  },
  optionSubtitle: {
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  optionDescriptionSelected: {
    color: '#D1D5DB',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
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
  /* Custom Input */
  customInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dialButtonMinus: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialButtonPlus: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F48B29',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  dialNumberContainer: {
    alignItems: 'center',
  },
  dialNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F48B29',
    fontVariant: ['tabular-nums'],
  },
  dialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  customInputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  /* Footer */
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F48B29',
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1128',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 16,
  },
});
