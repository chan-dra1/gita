import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
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
  },
  {
    id: '5',
    title: 'Seeker',
    subtitle: '(5 Slokas/day)',
    description: 'Steady spiritual progress',
  },
  {
    id: '10',
    title: 'Scholar',
    subtitle: '(10 Slokas/day)',
    description: 'Deep immersion in wisdom',
  },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('2');

  const handleComplete = async () => {
    await saveOnboardingStep('dailyCommitment', selectedId);
    router.push('/onboarding/step5' as any);
  };

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_2.png')}
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
                      <View style={styles.optionTextContainer}>
                        <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                          {option.title} <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                        </Text>
                        <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                          {option.description}
                        </Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <Animated.View entering={FadeIn.duration(200)} style={styles.radioDot} />}
                      </View>
                    </View>
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
            style={styles.completeButton}
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
  optionsContainer: {
    gap: 16,
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
    justifyContent: 'space-between',
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
