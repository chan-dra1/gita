import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn, Layout, Easing } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const OPTIONS = [
  {
    id: 'practical',
    title: 'Practical',
    description: 'Daily life application and mindfulness',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop',
  },
  {
    id: 'philosophical',
    title: 'Philosophical',
    description: 'Deep spiritual meaning and wisdom',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=200&fit=crop',
  },
  {
    id: 'devotional',
    title: 'Devotional',
    description: 'Chanting, Bhakti, and sacred rituals',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=200&fit=crop',
  },
  {
    id: 'holistic',
    title: 'Holistic',
    description: 'A balanced mix of all traditions',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop',
    default: true,
  },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('holistic');

  const handleContinue = async () => {
    if (selectedId) {
      await saveOnboardingStep('guidanceStyle', selectedId);
      router.push('/onboarding/step4');
    }
  };

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_4.png')}
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
              <Text style={styles.progressStep}>STEP 3 OF 4</Text>
              <Text style={styles.progressLabel}>Preference</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View layout={Layout.springify().damping(15)} style={styles.progressBarFill} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>What style of guidance do you prefer?</Text>
            <Text style={styles.subtitle}>
              Choose the path that resonates most with your spiritual journey.
            </Text>
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
                    <View style={styles.optionContent}>
                      <View style={styles.optionHeader}>
                        <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                          {option.title}
                        </Text>
                        {isSelected ? (
                          <Animated.View entering={FadeIn.duration(200)} style={styles.checkmark}>
                            <Ionicons name="checkmark-circle" size={24} color="#F48B29" />
                          </Animated.View>
                        ) : (
                          <View style={styles.checkmarkPlaceholder} />
                        )}
                      </View>
                      <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                        {option.description}
                      </Text>
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
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#0A1128" />
          </TouchableOpacity>
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
    width: '75%',
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
  subtitle: {
    fontSize: 15,
    color: '#D1D5DB',
    marginTop: 10,
    lineHeight: 22,
    textAlign: 'center',
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
    borderRadius: 16,
    backgroundColor: 'rgba(22, 32, 58, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: '#F48B29',
    backgroundColor: 'rgba(26, 39, 71, 0.8)',
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  optionImage: {
    width: '100%',
    height: 100,
  },
  optionContent: {
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#E5E7EB',
  },
  optionTitleSelected: {
    color: '#F48B29',
  },
  optionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  optionDescriptionSelected: {
    color: '#D1D5DB',
  },
  checkmark: {
    marginLeft: 8,
  },
  checkmarkPlaceholder: {
    width: 24,
    height: 24,
    marginLeft: 8,
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
    backgroundColor: '#F48B29',
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1128',
  },
});
