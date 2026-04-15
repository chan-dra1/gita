import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';

export default function OnboardingStep4() {
  const router = useRouter();
  const [slokaCount, setSlokaCount] = useState(5);

  const handleIncrement = () => {
    if (slokaCount < 20) setSlokaCount(s => s + 1);
  };

  const handleDecrement = () => {
    if (slokaCount > 1) setSlokaCount(s => s - 1);
  };

  const handleContinue = async () => {
    await saveOnboardingStep('dailyCommitment', slokaCount);
    router.push('/onboarding/step5');
  };

  const getEstimatedTime = () => `~${slokaCount * 3} Mins`;
  const getSpiritualDepth = () => {
    if (slokaCount <= 3) return 'Gentle';
    if (slokaCount <= 7) return 'Focused';
    if (slokaCount <= 12) return 'Immersive';
    return 'Scholarly';
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
              <View key={i} style={[styles.topDot, i === 3 && styles.topDotActive]} />
            ))}
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleSection}>
            <Text style={styles.eyebrowTitle}>SANKALPA ESTABLISHMENT</Text>
            <Text style={styles.mainTitle}>Establish Your Daily Resolve</Text>
            <Text style={styles.subtitle}>
              Select the number of sacred verses you commit to contemplating every sunrise.
            </Text>
          </Animated.View>

          {/* Number Selector */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.selectorWrapperOuter}>
            <View style={styles.selectorWrapperInner}>
              <Text style={styles.selectorLabel}>DAILY SLOKAS</Text>
              <View style={styles.controlsRow}>
                <TouchableOpacity onPress={handleDecrement} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons name="remove" size={20} color="#D4A44C" />
                </TouchableOpacity>
                <Text style={styles.numberLarge}>{slokaCount}</Text>
                <TouchableOpacity onPress={handleIncrement} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color="#D4A44C" />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectorSubtext}>MEDITATIVE COUNT</Text>
            </View>
          </Animated.View>

          {/* Info Cards */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.infoCardsContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="time" size={16} color="#D4A44C" style={{ marginBottom: 8 }} />
              <Text style={styles.infoCardEyebrow}>TIME REQUIRED</Text>
              <Text style={styles.infoCardValue}>{getEstimatedTime()}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="sparkles" size={16} color="#D4A44C" style={{ marginBottom: 8 }} />
              <Text style={styles.infoCardEyebrow}>SPIRITUAL DEPTH</Text>
              <Text style={styles.infoCardValue}>{getSpiritualDepth()}</Text>
            </View>
          </Animated.View>

        </ScrollView>

        <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.activateButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.activateText}>CONFIRM MY RESOLVE</Text>
          </TouchableOpacity>
          <Text style={styles.activateSubtext}>YOU CAN ADJUST THIS LATER IN SETTINGS</Text>
        </Animated.View>

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
  topDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  topDotActive: { width: 18, backgroundColor: '#D4A44C' },
  skipText: { fontSize: 14, color: '#666', fontWeight: '500' },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  
  titleSection: { alignItems: 'center', marginBottom: 32 },
  eyebrowTitle: { fontSize: 11, color: '#D4A44C', fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  mainTitle: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 44, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#E0D5C5', lineHeight: 22, textAlign: 'center', marginTop: 16 },
  
  selectorWrapperOuter: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 24,
  },
  selectorWrapperInner: {
    backgroundColor: '#141414',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.1)',
    width: '100%',
  },
  selectorLabel: {
    fontSize: 10,
    color: '#D4A44C',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberLarge: {
    fontSize: 72,
    color: '#D4A44C',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '800',
  },
  selectorSubtext: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 1,
  },

  infoCardsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoCardEyebrow: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoCardValue: {
    fontSize: 15,
    color: '#D4A44C',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  bottomSection: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 0 : 24 },
  activateButton: {
    backgroundColor: '#D4A44C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  activateText: { fontSize: 13, fontWeight: '800', color: '#0D0D0D', letterSpacing: 1 },
  activateSubtext: { fontSize: 10, color: '#666', fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 24 },
  
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  paginationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotActive: { width: 44, height: 2, backgroundColor: '#D4A44C', borderRadius: 1 },
  dot: { width: 16, height: 2, backgroundColor: '#333', borderRadius: 1 },
  nextButton: {
    width: 44,
    height: 44,
    backgroundColor: '#D4A44C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
