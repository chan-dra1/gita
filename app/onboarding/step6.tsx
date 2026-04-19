/**
 * Onboarding Step 6 — Share Feature Showcase
 * Horizontal carousel of 5 famous verses, each using one share postcard design.
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  useWindowDimensions,
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { SharePostcardMini } from '../../src/components/SharePostcardMini';
import { getSloka, getLocalizedTranslation } from '../../src/utils/sloka';

/** Five well-known ślokas — each pinned to one of the 5 share palettes (designIndex). */
const FAMOUS_VERSE_KEYS: { chapter: number; verse: number; designIndex: number; blurb: string }[] = [
  { chapter: 2, verse: 47, designIndex: 0, blurb: 'Karma yoga' },
  { chapter: 18, verse: 66, designIndex: 1, blurb: 'Surrender' },
  { chapter: 9, verse: 22, designIndex: 2, blurb: 'Bhakti' },
  { chapter: 6, verse: 5, designIndex: 3, blurb: 'Self-mastery' },
  { chapter: 2, verse: 20, designIndex: 4, blurb: 'The eternal Self' },
];

type Slide = {
  chapter: number;
  verse: number;
  designIndex: number;
  blurb: string;
  sanskrit: string;
  translation: string;
};

export default function OnboardingStep6() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const slides: Slide[] = useMemo(() => {
    return FAMOUS_VERSE_KEYS.map((row) => {
      const sl = getSloka(row.chapter, row.verse);
      const translation = sl
        ? getLocalizedTranslation(row.chapter, row.verse, sl.translation_english, language)
        : '';
      const sanskrit = sl?.sanskrit ?? '—';
      return {
        chapter: row.chapter,
        verse: row.verse,
        designIndex: row.designIndex,
        blurb: row.blurb,
        sanskrit,
        translation: translation || '—',
      };
    });
  }, [language]);

  const cardSize = Math.min(width - 56, 300);
  const slideWidth = width;

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / slideWidth);
      setCarouselIndex(Math.max(0, Math.min(i, slides.length - 1)));
    },
    [slideWidth, slides.length]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16 },
        dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
        dotActive: { width: 18, backgroundColor: colors.primary },

        carouselSection: {
          minHeight: cardSize + 56,
          marginBottom: 8,
        },
        carouselCaption: {
          textAlign: 'center',
          fontSize: 12,
          fontWeight: '700',
          color: colors.primary,
          letterSpacing: 1.2,
          marginBottom: 8,
          paddingHorizontal: 24,
        },
        slidePage: {
          width: slideWidth,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
        },
        postcardShadow: {
          borderRadius: 16,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.35 : 0.2,
          shadowRadius: 20,
          elevation: 14,
        },
        slideLabel: {
          marginTop: 10,
          fontSize: 11,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        dotsRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 12,
        },
        dotC: {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.border,
        },
        dotCActive: {
          width: 22,
          backgroundColor: colors.primary,
        },

        bottomContent: {
          paddingHorizontal: 24,
          paddingBottom: 48,
        },
        title: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 10,
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 23, marginBottom: 20 },
        bullets: { gap: 10, marginBottom: 28 },
        bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        bulletText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },

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
      }),
    [colors, isDark, cardSize, slideWidth]
  );

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={styles.slidePage}>
        <View style={styles.postcardShadow}>
          <SharePostcardMini
            size={cardSize}
            designIndex={item.designIndex}
            sanskrit={item.sanskrit}
            translation={item.translation}
            chapter={item.chapter}
            verse={item.verse}
          />
        </View>
        <Text style={styles.slideLabel}>
          Design {item.designIndex + 1} of 5 · {item.blurb}
        </Text>
      </View>
    ),
    [cardSize, styles]
  );

  return (
    <OnboardingBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.carouselCaption}>Swipe — five postcard styles · five timeless verses</Text>

          <View style={styles.carouselSection}>
            <FlatList
              style={{ minHeight: cardSize + 44 }}
              data={slides}
              keyExtractor={(item) => `${item.chapter}-${item.verse}-${item.designIndex}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              renderItem={renderSlide}
              getItemLayout={(_, index) => ({
                length: slideWidth,
                offset: slideWidth * index,
                index,
              })}
              initialNumToRender={3}
              windowSize={3}
            />
            <View style={styles.dotsRow}>
              {slides.map((_, i) => (
                <View key={i} style={[styles.dotC, i === carouselIndex && styles.dotCActive]} />
              ))}
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              entering={FadeInDown.duration(800).delay(400).easing(Easing.out(Easing.back(1.2)))}
              style={styles.bottomContent}
            >
              <Text style={styles.title}>Share the Wisdom</Text>
              <Text style={styles.subtitle}>
                Every verse can be shared as a beautiful card — we rotate elegant designs automatically. Post to
                Instagram Stories, WhatsApp, or anywhere.
              </Text>

              <View style={styles.bullets}>
                <View style={styles.bullet}>
                  <Ionicons name="image-outline" size={18} color={colors.primary} />
                  <Text style={styles.bulletText}>Five spiritual postcard styles · unique look per verse</Text>
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
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#D4A44C', '#C2983B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.background} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}
