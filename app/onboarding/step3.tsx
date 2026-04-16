import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const FEATURES = [
  {
    icon: 'notifications-off' as const,
    title: 'No Distractions While Reading',
    desc: 'When you start reading, your phone stays quiet. No messages or alerts will disturb you until you finish your verses.',
  },
  {
    icon: 'time' as const,
    title: 'Set Your Study Time',
    desc: 'Pick a time each day for your Gita reading. During that time, distracting apps like social media will be paused.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Gentle Reminders',
    desc: "If you try to open a blocked app, you will see a calming verse from the Gita instead. It's a gentle nudge to stay focused.",
  },
  {
    icon: 'flame' as const,
    title: 'Keep Your Reading Streak',
    desc: 'By removing distractions, this feature helps you read every day without missing a single day.',
  },
];

export default function OnboardingStep3() {
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
    
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
    
    titleSection: { alignItems: 'center', marginBottom: 32 },
    eyebrowTitle: { fontSize: 11, color: colors.primary, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
    mainTitle: { fontSize: 36, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 44 },
    italic: { fontStyle: 'italic', color: colors.primary },
    subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginTop: 16 },

    howItWorksCard: {
      backgroundColor: `${colors.primary}1A`,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    howItWorksEyebrow: { fontSize: 10, color: colors.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
    howItWorksTitle: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },
    howItWorksDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    
    cardsContainer: { gap: 12 },
    
    listCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1, 
      borderColor: colors.border,
    },
    iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    listCardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
    listCardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

    bottomSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      paddingTop: 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    activateButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    activateText: { fontSize: 14, fontWeight: '800', color: colors.background, letterSpacing: 1 },
    activateSubtext: { fontSize: 9, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  }), [colors, isDark]);

  const handleContinue = () => {
    router.push('/onboarding/step4');
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
              <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
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
            <Text style={styles.eyebrowTitle}>STAY FOCUSED</Text>
            <Text style={styles.mainTitle}>Meet the</Text>
            <Text style={[styles.mainTitle, styles.italic]}>Dharma Blocker</Text>
            <Text style={styles.subtitle}>
              Your phone can be distracting. The Dharma Blocker helps you stay focused by pausing other apps while you read the Gita. You choose which apps to pause.
            </Text>
          </Animated.View>

          {/* How It Works */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.howItWorksCard}>
            <Text style={styles.howItWorksEyebrow}>HOW IT WORKS</Text>
            <Text style={styles.howItWorksTitle}>Simple and easy</Text>
            <Text style={styles.howItWorksDesc}>
              Pick the apps you want to pause during study time. When it is time to read, those apps will wait. After you finish your verses, everything goes back to normal. That is it!
            </Text>
          </Animated.View>

          {/* Feature Cards */}
          <View style={styles.cardsContainer}>
            {FEATURES.map((item, index) => (
              <Animated.View key={item.title} entering={FadeInRight.duration(500).delay(300 + index * 100)} style={styles.listCard}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.listCardTitle}>{item.title}</Text>
                <Text style={styles.listCardDesc}>{item.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.activateButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.activateText}>CONTINUE</Text>
          </TouchableOpacity>
          <Text style={styles.activateSubtext}>YOU CAN CONFIGURE DHARMA BLOCKER IN SETTINGS</Text>
        </Animated.View>

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
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  
  titleSection: { alignItems: 'center', marginBottom: 32 },
  eyebrowTitle: { fontSize: 11, color: '#D4A44C', fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  mainTitle: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 44 },
  italic: { fontStyle: 'italic', color: '#D4A44C' },
  subtitle: { fontSize: 14, color: '#9CA3AF', lineHeight: 22, textAlign: 'center', marginTop: 16 },

  howItWorksCard: {
    backgroundColor: 'rgba(212, 164, 76, 0.06)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.15)',
  },
  howItWorksEyebrow: { fontSize: 10, color: '#D4A44C', fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  howItWorksTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },
  howItWorksDesc: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },
  
  cardsContainer: { gap: 12 },
  
  listCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(212, 164, 76, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  listCardTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
  listCardDesc: { fontSize: 13, color: '#9CA3AF', lineHeight: 20 },

  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  activateButton: {
    backgroundColor: '#D4A44C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  activateText: { fontSize: 14, fontWeight: '800', color: '#0D0D0D', letterSpacing: 1 },
  activateSubtext: { fontSize: 9, color: '#666', fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
});
