import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, Easing } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
export default function OnboardingStep4() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, /* Removed backgroundColor */ },
    safeArea: { flex: 1 },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressContainer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    dotsRow: { flexDirection: 'row', gap: 6 },
    topDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    topDotActive: { width: 18, backgroundColor: colors.primary },
    skipText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    
    titleSection: { alignItems: 'center', marginBottom: 32 },
    eyebrowTitle: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
    mainTitle: { fontSize: 36, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 44, textAlign: 'center' },
    subtitle: { fontSize: 15, color: colors.text, lineHeight: 22, textAlign: 'center', marginTop: 16 },
    
    selectorWrapperOuter: {
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      marginBottom: 24,
    },
    selectorWrapperInner: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 32,
      paddingHorizontal: 40,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
    selectorLabel: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 24,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberLarge: {
      fontSize: 72,
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      fontWeight: '800',
    },
    selectorSubtext: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '700',
      letterSpacing: 1,
    },

    infoCardsContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    infoCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoCardEyebrow: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 8,
    },
    infoCardValue: {
      fontSize: 15,
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },

    // Standardized footer and button styles
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.background,
      letterSpacing: 0.5,
    },
    activateSubtext: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 24 }, // Kept for the subtext

    footerNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 16,
    },
    paginationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dotActive: { width: 44, height: 2, backgroundColor: colors.primary, borderRadius: 1 },
    dot: { width: 16, height: 2, backgroundColor: colors.border, borderRadius: 1 },
    nextButton: {
      width: 44,
      height: 44,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [colors, isDark]);

  return (
    <OnboardingBackground>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} translucent />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
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
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.numberLarge}>{slokaCount}</Text>
                <TouchableOpacity onPress={handleIncrement} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectorSubtext}>MEDITATIVE COUNT</Text>
            </View>
          </Animated.View>

          {/* Info Cards */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.infoCardsContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="time" size={16} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.infoCardEyebrow}>TIME REQUIRED</Text>
              <Text style={styles.infoCardValue}>{getEstimatedTime()}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.infoCardEyebrow}>SPIRITUAL DEPTH</Text>
              <Text style={styles.infoCardValue}>{getSpiritualDepth()}</Text>
            </View>
          </Animated.View>

        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))}
          style={styles.footer}
        >
          <TouchableOpacity 
            style={styles.button}
            onPress={handleContinue}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#D4A44C', '#C2983B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12, borderRadius: 8, overflow: 'hidden' }}
            >
              <Text style={styles.buttonText}>CONFIRM MY RESOLVE</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.activateSubtext}>YOU CAN ADJUST THIS LATER IN SETTINGS</Text>
        </Animated.View>

      </SafeAreaView>
    </OnboardingBackground>
  );
}