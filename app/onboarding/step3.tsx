import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const FEATURES = [
  {
    icon: 'notifications-off' as const,
    title: 'Focus Mode During Study',
    desc: 'When you open a verse, Dharma Blocker silences notifications and blocks distracting apps so you can read, reflect, and absorb without interruption.',
  },
  {
    icon: 'time' as const,
    title: 'Daily Sacred Hours',
    desc: 'Set a fixed window each day (e.g. 6–7 AM) where your phone becomes a dedicated Gita reader. Social media, games, and news are paused until your session ends.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Gentle Redirection',
    desc: "If you try to open a blocked app, instead of a harsh lock screen you'll see a calming verse from the Gita \u2014 turning temptation into a moment of wisdom.",
  },
  {
    icon: 'flame' as const,
    title: 'Protects Your Streak',
    desc: 'By removing digital distractions during study time, Dharma Blocker helps you stay consistent and maintain your daily reading streak.',
  },
];

export default function OnboardingStep3() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/step4');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" translucent />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D4A44C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Onboarding</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleSection}>
            <Text style={styles.eyebrowTitle}>THE DIGITAL SANCTUARY</Text>
            <Text style={styles.mainTitle}>Meet the</Text>
            <Text style={[styles.mainTitle, styles.italic]}>Dharma Blocker</Text>
            <Text style={styles.subtitle}>
              Your phone is the biggest obstacle to consistent spiritual practice. The Dharma Blocker transforms your device from a distraction machine into a dedicated tool for Gita study.
            </Text>
          </Animated.View>

          {/* How It Works */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.howItWorksCard}>
            <Text style={styles.howItWorksEyebrow}>HOW IT WORKS</Text>
            <Text style={styles.howItWorksTitle}>Your phone, your rules</Text>
            <Text style={styles.howItWorksDesc}>
              Choose which apps to block during your reading time. When it's time to study, Dharma Blocker activates automatically — no willpower needed. You read your committed verses in peace, and then your apps come back.
            </Text>
          </Animated.View>

          {/* Feature Cards */}
          <View style={styles.cardsContainer}>
            {FEATURES.map((item, index) => (
              <Animated.View key={item.title} entering={FadeInRight.duration(500).delay(300 + index * 100)} style={styles.listCard}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={16} color="#D4A44C" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#D4A44C', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
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
