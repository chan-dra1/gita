import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { t, type Language } from '../../src/utils/i18n';

export default function OnboardingStep1() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { language: storedLanguage, setLanguage, isLoading } = useLanguage();
  const [previewLang, setPreviewLang] = useState<Language>('en');

  useEffect(() => {
    if (!isLoading) {
      setPreviewLang(storedLanguage);
    }
  }, [isLoading, storedLanguage]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        },
        dotsRow: { flexDirection: 'row', gap: 6 },
        dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
        dotActive: { width: 18, backgroundColor: colors.primary },
        titleContainer: { marginTop: 32, marginBottom: 24 },
        mainTitle: {
          fontSize: 32,
          fontWeight: '800',
          color: colors.primary,
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          lineHeight: 40,
          marginBottom: 12,
        },
        subtitle: { fontSize: 15, color: colors.text, lineHeight: 24 },
        optionsContainer: { gap: 16 },
        scrollView: { flex: 1 },
        scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
        optionCard: {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
        },
        optionCardSelected: {
          borderWidth: 2,
          borderColor: colors.primary,
          backgroundColor: isDark ? `${colors.primary}12` : `${colors.primary}0F`,
        },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
        cardEyebrow: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
        iconCircle: {
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardTitle: {
          fontSize: 24,
          fontWeight: '800',
          color: colors.text,
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          marginBottom: 12,
        },
        cardDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
        cardAction: { flexDirection: 'row', alignItems: 'center' },
        actionText: { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
        quoteContainer: { marginTop: 24, alignItems: 'center', paddingHorizontal: 8 },
        quoteText: {
          fontSize: 16,
          fontStyle: 'italic',
          color: colors.textSecondary,
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          lineHeight: 24,
          textAlign: 'center',
        },
        footer: {
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
        continueBtn: { borderRadius: 16, overflow: 'hidden' },
        continueGradient: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          gap: 8,
        },
        continueText: { color: colors.background, fontSize: 16, fontWeight: '800' },
      }),
    [colors, isDark],
  );

  const handleContinue = async () => {
    await setLanguage(previewLang);
    router.push('/onboarding/step2' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} translucent />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>{t('langLandingTitle', previewLang)}</Text>
            <Text style={styles.subtitle}>{t('langLandingSubtitle', previewLang)}</Text>
          </Animated.View>

          <View style={styles.optionsContainer}>
            <Animated.View entering={FadeInRight.duration(500).delay(200)}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPreviewLang('en')}
                style={[styles.optionCard, previewLang === 'en' && styles.optionCardSelected]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEyebrow}>{t('langCardEyebrowEn', previewLang)}</Text>
                  <View style={styles.iconCircle}>
                    <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
                  </View>
                </View>
                <Text style={styles.cardTitle}>{t('langCardEnTitle', previewLang)}</Text>
                <Text style={styles.cardDescription}>{t('langCardEnDesc', previewLang)}</Text>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>{t('langCardTapHint', previewLang)}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInRight.duration(500).delay(300)}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPreviewLang('hi')}
                style={[styles.optionCard, previewLang === 'hi' && styles.optionCardSelected]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEyebrow}>{t('langCardEyebrowHi', previewLang)}</Text>
                  <View style={styles.iconCircle}>
                    <Ionicons name="book-outline" size={18} color={colors.textSecondary} />
                  </View>
                </View>
                <Text style={styles.cardTitle}>{t('langCardHiTitle', previewLang)}</Text>
                <Text style={styles.cardDescription}>{t('langCardHiDesc', previewLang)}</Text>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>{t('langCardTapHint', previewLang)}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>{t('langLandingQuote', previewLang)}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.88}>
            <LinearGradient
              colors={['#D4A44C', '#B8912E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>{t('langLandingContinue', previewLang)}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
