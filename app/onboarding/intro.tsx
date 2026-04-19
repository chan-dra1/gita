import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Easing, ZoomIn } from 'react-native-reanimated';
import { useLanguage } from '../../src/context/LanguageContext';
import { t } from '../../src/utils/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { useTheme } from '../../src/context/ThemeContext';

export default function IntroScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <OnboardingBackground>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <View style={styles.heroContent}>
            <Animated.Text
              entering={ZoomIn.duration(1200).easing(Easing.out(Easing.back(1.5))).delay(300)}
              style={styles.omSymbol}
            >
              ॐ
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(1000).delay(800)} style={styles.title}>
              {t('introAppTitle', language)}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(1000).delay(1100)} style={styles.subtitle}>
              {t('introTagline', language)}
            </Animated.Text>
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))}
          style={styles.footer}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/onboarding/step1' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient // Wrapped button content with LinearGradient
              colors={['#D4A44C', '#C2983B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>{t('introBeginJourney', language)}</Text>
              <Ionicons name="arrow-forward" size={20} color="#0D0D0D" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D', // This will be managed by OnboardingBackground
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  omSymbol: {
    fontSize: 140,
    color: '#D4A44C',
    marginBottom: 24,
    fontWeight: '300',
    includeFontPadding: false,
    textShadowColor: 'rgba(212, 164, 76, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 18,
    color: '#E0D5C5',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
