import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { saveOnboardingStep } from '../../src/utils/stats';

export default function OnboardingStep1() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { width: 18, backgroundColor: colors.primary },
    titleContainer: { marginTop: 32, marginBottom: 32 },
    mainTitle: { fontSize: 32, fontWeight: '800', color: colors.primary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 40, marginBottom: 12 },
    subtitle: { fontSize: 15, color: colors.text, lineHeight: 24 },
    optionsContainer: { gap: 16 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
    optionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardEyebrow: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 24, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },
    cardDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
    cardAction: { flexDirection: 'row', alignItems: 'center' },
    actionText: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
    quoteContainer: { marginTop: 32, alignItems: 'center' },
    quoteText: { fontSize: 16, fontStyle: 'italic', color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 24, textAlign: 'center' },
  }), [colors, isDark]);

  const handleSelectLanguage = async (lang: string) => {
    router.push('/onboarding/step2');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} translucent />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
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
          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Choose Your Sacred Language</Text>
            <Text style={styles.subtitle}>
              Select the medium through which you wish to experience the eternal wisdom of the Bhagavad Gita.
            </Text>
          </Animated.View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* English Card */}
            <Animated.View entering={FadeInRight.duration(500).delay(200)}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectLanguage('en')}
                style={styles.optionCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEyebrow}>SCRIPTURE & INTERFACE</Text>
                  <View style={styles.iconCircle}>
                    <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
                  </View>
                </View>
                <Text style={styles.cardTitle}>English</Text>
                <Text style={styles.cardDescription}>
                  A contemporary scholarly translation optimized for global reach and clarity in everyday modern life.
                </Text>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>SELECT EXPERIENCE</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Hindi Card */}
            <Animated.View entering={FadeInRight.duration(500).delay(300)}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectLanguage('hi')}
                style={styles.optionCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEyebrow}>शास्त्र एवं इंटरफ़ेस</Text>
                  <View style={styles.iconCircle}>
                    <Ionicons name="book-outline" size={18} color={colors.textSecondary} />
                  </View>
                </View>
                <Text style={styles.cardTitle}>हिन्दी</Text>
                <Text style={styles.cardDescription}>
                  मूल भावों के साथ सरोबार, पवित्र हिंदी अनुवाद जो सीधे हृदय की गहराइयों तक पहुँचता है।
                </Text>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>चयन करें</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Quote */}
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              "Truth is one, though the sages speak of it in many tongues."
            </Text>
          </View>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  safeArea: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18, backgroundColor: '#D4A44C' },
  titleContainer: { marginTop: 32, marginBottom: 32 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#D4A44C', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 40, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#E0D5C5', lineHeight: 24 },
  optionsContainer: { gap: 16 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  optionCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardEyebrow: { fontSize: 11, color: '#D4A44C', fontWeight: '700', letterSpacing: 1 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },
  cardDescription: { fontSize: 14, color: '#9CA3AF', lineHeight: 22, marginBottom: 20 },
  cardAction: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 11, color: '#D4A44C', fontWeight: '700', letterSpacing: 1 },
  quoteContainer: { marginTop: 32, alignItems: 'center' },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#666', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 24, textAlign: 'center' },
});
