import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveOnboardingStep } from '../../src/utils/stats';

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
          <Text style={styles.progressStep}>STEP 3 OF 4</Text>
          <Text style={styles.progressLabel}>Preference</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>What style of guidance do you prefer?</Text>
        <Text style={styles.subtitle}>
          Choose the path that resonates most with your spiritual journey.
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
              <Image 
                source={{ uri: option.image }} 
                style={styles.optionImage}
                resizeMode="cover"
              />
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {option.title}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#F48B29" />
                    </View>
                  )}
                </View>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
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
          style={styles.continueButton}
        >
          <Text style={styles.continueText}>Continue</Text>
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
    borderRadius: 999,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
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
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 10,
    lineHeight: 22,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    flex: 1,
    gap: 12,
  },
  optionCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: '#F48B29',
    borderWidth: 2,
  },
  optionImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    color: '#1F2937',
  },
  optionTitleSelected: {
    color: '#1A1A1A',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkmark: {
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
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
