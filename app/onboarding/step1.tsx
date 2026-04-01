import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn, Layout, Easing } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';

const { width } = Dimensions.get('window');

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
    <OnboardingBackground
      image={require('../../assets/images/onboarding_2.png')}
      quote="Setting your intention is the first step toward transcendence."
      author="THE GITA"
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
              <Text style={styles.progressStep}>STEP 1 OF 4</Text>
              <Text style={styles.progressLabel}>Getting Started</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View layout={Layout.springify().damping(15)} style={styles.progressBarFill} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>What brings you to the Gita today?</Text>
            <Text style={styles.subtitle}>Select the path that resonates most with your soul's current journey.</Text>
          </Animated.View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {OPTIONS.map((option, index) => {
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
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                        {option.description}
                      </Text>
                    </View>

                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected ? <Animated.View entering={FadeIn.duration(200)} style={styles.radioInner} /> : null}
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
            onPress={handleContinue}
            disabled={!selectedId}
            style={[styles.continueButton, selectedId ? styles.continueButtonActive : styles.continueButtonInactive]}
          >
            <Text style={[styles.continueText, selectedId ? styles.continueTextActive : styles.continueTextInactive]}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={20} color={selectedId ? '#0A1128' : 'rgba(244, 139, 41, 0.4)'} />
          </TouchableOpacity>
          
          <Text style={styles.footerHint}>
            You can update your preferences later in settings
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
  progressStep: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F48B29',
    letterSpacing: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
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
    width: '25%',
    borderRadius: 999,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginTop: 12,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
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
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#F48B29',
  },
  optionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  optionDescriptionSelected: {
    color: '#D1D5DB',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
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
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonInactive: {
    backgroundColor: '#1E293B',
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  continueTextActive: {
    color: '#0A1128',
  },
  continueTextInactive: {
    color: '#F48B29',
    opacity: 0.4,
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 16,
  },
});
