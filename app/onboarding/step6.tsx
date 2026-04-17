/**
 * Onboarding Step 6 — Share Feature Showcase
 * Shows users how to share beautiful verse cards on social media.
 */
import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { ONBOARDING_BACKGROUND_IMAGE } from '../../src/constants/onboardingAssets';

const { width } = Dimensions.get('window');

export default function OnboardingStep6() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
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
      flexDirection: 'row', justifyContent: 'center', gap: 6,
      paddingTop: 16,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    dotActive: { width: 18, backgroundColor: colors.primary },

    cardContainer: {
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
    },

    cardPreview: {
      width: width - 64,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    cardGradient: { padding: 28, alignItems: 'center' },
    cardAccentTop: { width: 40, height: 2, backgroundColor: colors.primary, marginBottom: 16, borderRadius: 1 },
    cardOm: { fontSize: 28, color: colors.primary, marginBottom: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    cardSanskrit: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 28, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 16 },
    cardDivider: { width: 60, height: 1, backgroundColor: colors.border, marginBottom: 16 },
    cardTranslation: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, fontStyle: 'italic', marginBottom: 12 },
    cardRef: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
    cardAccentBottom: { width: 40, height: 2, backgroundColor: colors.primary, marginBottom: 16, borderRadius: 1 },
    shareIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    shareIconBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    shareIconsLabel: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },

    bottomContent: {
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 23, marginBottom: 20 },
    bullets: { gap: 10, marginBottom: 28 },
    bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bulletText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },

    // Standardized button styles
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
      color: colors.background,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  }), [colors, isDark]);

  function VerseCardPreview() {
    return (
      <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.cardPreview}>
        <LinearGradient colors={[colors.card, colors.background, colors.card]} style={styles.cardGradient}>
          <View style={styles.cardAccentTop} />
          <Text style={styles.cardOm}>ॐ</Text>
          <Text style={styles.cardSanskrit}>
            कर्मण्येवाधिकारस्ते{'\n'}मा फलेषु कदाचन
          </Text>
          <View style={styles.cardDivider} />
          <Text style={styles.cardTranslation}>
            "You have the right to work, but never to the fruit of work."
          </Text>
          <Text style={styles.cardRef}>Bhagavad Gita · Chapter 2, Verse 47</Text>
          <View style={styles.cardAccentBottom} />
          <View style={styles.shareIconsRow}>
            <View style={styles.shareIconBadge}>
              <Ionicons name="logo-instagram" size={16} color={colors.primary} />
            </View>
            <View style={styles.shareIconBadge}>
              <Ionicons name="logo-whatsapp" size={16} color={colors.primary} />
            </View>
            <View style={styles.shareIconBadge}>
              <Ionicons name="share-social" size={16} color={colors.primary} />
            </View>
            <Text style={styles.shareIconsLabel}>Share anywhere</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <OnboardingBackground imageSource={ONBOARDING_BACKGROUND_IMAGE}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

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
        <Animated.View
          entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))} // Added animation
          style={styles.bottomContent}
        >
          <Text style={styles.title}>Share the Wisdom</Text>
          <Text style={styles.subtitle}>
            Every verse can be shared as a beautiful card. Post to Instagram Stories, WhatsApp, or anywhere — 
            spread the light of the Gita with those you love.
          </Text>

          {/* Feature bullets */}
          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Beautiful verse cards, auto-generated</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="logo-instagram" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>Share directly to Instagram Stories</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.bulletText}>
                {"Share Krishna's word—each card invites others into the verse"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={{ borderRadius: 8, overflow: 'hidden' }}
            onPress={() => router.push('/onboarding/step7' as any)}
            activeOpacity={0.88} // Adjusted activeOpacity
          >
            <LinearGradient
              colors={['#D4A44C', '#C2983B']} // Adjusted gradient colors
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}