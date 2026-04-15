/**
 * Onboarding Step 6 — Share Feature Showcase
 * Shows users how to share beautiful verse cards on social media.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';

const { width } = Dimensions.get('window');

// Mock verse card preview component
function VerseCardPreview() {
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.cardPreview}>
      <LinearGradient
        colors={['#1A1200', '#2A1F00', '#1A1200']}
        style={styles.cardGradient}
      >
        {/* Top accent */}
        <View style={styles.cardAccentTop} />

        {/* OM Symbol */}
        <Text style={styles.cardOm}>ॐ</Text>

        {/* Sanskrit */}
        <Text style={styles.cardSanskrit}>
          कर्मण्येवाधिकारस्ते{'\n'}मा फलेषु कदाचन
        </Text>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Translation */}
        <Text style={styles.cardTranslation}>
          "You have the right to work, but never to the fruit of work."
        </Text>

        {/* Chapter ref */}
        <Text style={styles.cardRef}>Bhagavad Gita · Chapter 2, Verse 47</Text>

        {/* Bottom accent */}
        <View style={styles.cardAccentBottom} />

        {/* Share icons row */}
        <View style={styles.shareIconsRow}>
          <View style={styles.shareIconBadge}>
            <Ionicons name="logo-instagram" size={16} color="#E1306C" />
          </View>
          <View style={styles.shareIconBadge}>
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          </View>
          <View style={styles.shareIconBadge}>
            <Ionicons name="share-social" size={16} color="#D4A44C" />
          </View>
          <Text style={styles.shareIconsLabel}>Share anywhere</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function OnboardingStep6() {
  const router = useRouter();

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_1.png')}
      overlayOpacity={0.75}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
          ))}
        </View>

        {/* Card Preview */}
        <View style={styles.cardContainer}>
          <VerseCardPreview />
        </View>

        {/* Bottom content */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.bottomContent}>
          <Text style={styles.title}>Share the Wisdom</Text>
          <Text style={styles.subtitle}>
            Every verse can be shared as a beautiful card. Post to Instagram Stories, WhatsApp, or anywhere — 
            spread the light of the Gita with those you love.
          </Text>

          {/* Feature bullets */}
          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="image-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Beautiful verse cards, auto-generated</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="logo-instagram" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Share directly to Instagram Stories</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>
                {"Share Krishna's word—each card invites others into the verse"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push('/onboarding/step7' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D4A44C', '#B8912E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  progressContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    paddingTop: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18, backgroundColor: '#D4A44C' },

  cardContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },

  cardPreview: {
    width: width - 64,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  cardGradient: { padding: 28, alignItems: 'center' },
  cardAccentTop: { width: 40, height: 2, backgroundColor: '#D4A44C', marginBottom: 16, borderRadius: 1 },
  cardOm: { fontSize: 28, color: '#D4A44C', marginBottom: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  cardSanskrit: { fontSize: 16, color: '#FFF', textAlign: 'center', lineHeight: 28, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 16 },
  cardDivider: { width: 60, height: 1, backgroundColor: 'rgba(212,164,76,0.4)', marginBottom: 16 },
  cardTranslation: { fontSize: 13, color: '#D8D0C0', textAlign: 'center', lineHeight: 20, fontStyle: 'italic', marginBottom: 12 },
  cardRef: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  cardAccentBottom: { width: 40, height: 2, backgroundColor: '#D4A44C', marginBottom: 16, borderRadius: 1 },
  shareIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareIconBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  shareIconsLabel: { fontSize: 11, color: '#888', marginLeft: 4 },

  bottomContent: {
    paddingHorizontal: 28, paddingBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 23, marginBottom: 20 },
  bullets: { gap: 10, marginBottom: 28 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 20 },

  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '800' },
});
