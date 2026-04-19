import React, { useMemo } from 'react';
import { View, Text, ImageBackground, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  VERSE_SHARE_PALETTES,
  VERSE_SHARE_DESIGN_COUNT,
  pickVerseShareDesign,
  type VerseSharePalette,
} from '../constants/verseShareDesigns';
import { ShareStoreMarketingStrip } from './ShareStoreMarketing';

interface VerseCardProps {
  sanskrit: string;
  translation: string;
  chapter: number;
  verse: number;
  /** 0 … VERSE_SHARE_DESIGN_COUNT-1. If omitted, derived from chapter:verse. */
  designIndex?: number;
}

/**
 * High-resolution square card for native `captureRef` → share as PNG.
 * Theme names (e.g. “Lotus dawn”) are intentionally omitted — they stay in onboarding previews only.
 * Multiple spiritual palettes; same verse always maps to the same look via `pickVerseShareDesign`.
 */
export const VerseCard: React.FC<VerseCardProps> = ({
  sanskrit,
  translation,
  chapter,
  verse,
  designIndex: designIndexProp,
}) => {
  const idx = Math.min(
    designIndexProp ?? pickVerseShareDesign(chapter, verse),
    VERSE_SHARE_DESIGN_COUNT - 1
  );
  const palette: VerseSharePalette = VERSE_SHARE_PALETTES[idx];

  const { sanskritSize, translationSize, lineHeightSk, lineHeightTr } = useMemo(() => {
    const len = sanskrit.length;
    if (len > 140) {
      return { sanskritSize: 30, translationSize: 22, lineHeightSk: 50, lineHeightTr: 34 };
    }
    if (len > 90) {
      return { sanskritSize: 34, translationSize: 24, lineHeightSk: 56, lineHeightTr: 36 };
    }
    if (len > 55) {
      return { sanskritSize: 38, translationSize: 26, lineHeightSk: 62, lineHeightTr: 38 };
    }
    return { sanskritSize: 42, translationSize: 28, lineHeightSk: 68, lineHeightTr: 42 };
  }, [sanskrit.length]);

  return (
    <View style={s.container}>
      <ImageBackground
        source={require('../../assets/images/mandala_bg.png')}
        style={s.background}
        resizeMode="cover"
      >
        <LinearGradient colors={palette.overlay} locations={[0, 0.45, 1]} style={s.overlay} />

        {/* Thin ornamental frame */}
        <View style={[s.innerFrame, { borderColor: palette.frameColor }]} pointerEvents="none" />

        <View style={s.mainColumn} pointerEvents="none">
          <View style={s.content}>
            <Text style={[s.om, { color: palette.accent }]}>ॐ</Text>

            <View style={s.accentLabelContainer}>
              <View style={[s.accentLine, { backgroundColor: palette.accent }]} />
              <Text style={[s.accentLabel, { color: palette.accent }]}>BHAGAVAD GITA</Text>
              <View style={[s.accentLine, { backgroundColor: palette.accent }]} />
            </View>

            <View style={s.verseContainer}>
              <Text
                style={[
                  s.sanskritText,
                  {
                    color: palette.sanskritColor,
                    fontSize: sanskritSize,
                    lineHeight: lineHeightSk,
                  },
                ]}
              >
                {sanskrit}
              </Text>
            </View>

            <View style={[s.divider, { backgroundColor: palette.accent }]} />

            <View style={s.translationContainer}>
              <Text
                style={[
                  s.translationText,
                  {
                    color: palette.translationColor,
                    fontSize: translationSize,
                    lineHeight: lineHeightTr,
                  },
                ]}
              >
                {`"${translation}"`}
              </Text>
            </View>

            <View style={s.footer}>
              <Text style={[s.chapterInfo, { color: palette.accent }]}>
                CHAPTER {chapter} · VERSE {verse}
              </Text>
            </View>
          </View>

          <View style={s.bottomMarketing}>
            <ShareStoreMarketingStrip variant="icons" accent={palette.accent} interactive={false} scale={1} />
            <View style={s.signatureRow}>
              <View style={[s.signatureDot, { backgroundColor: palette.accent }]} />
              <Text style={[s.signatureLabel, { color: palette.accent }]}>THY GITA</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    width: 1080,
    height: 1080,
    backgroundColor: '#0D0D0D',
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  innerFrame: {
    position: 'absolute',
    top: 56,
    left: 56,
    right: 56,
    bottom: 56,
    borderRadius: 4,
    borderWidth: 1.5,
    opacity: 0.85,
  },
  mainColumn: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 72,
    paddingVertical: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    width: '88%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 36,
    flex: 1,
    minHeight: 0,
  },
  om: {
    fontSize: 44,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    opacity: 0.95,
  },
  accentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    gap: 14,
  },
  accentLine: {
    width: 36,
    height: 1.5,
    opacity: 0.65,
  },
  accentLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 5,
    opacity: 0.92,
  },
  verseContainer: {
    marginBottom: 28,
    maxWidth: '100%',
  },
  sanskritText: {
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  divider: {
    width: 88,
    height: 1,
    opacity: 0.45,
    marginVertical: 28,
  },
  translationContainer: {
    marginBottom: 36,
    maxWidth: '100%',
  },
  translationText: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingHorizontal: 28,
    opacity: 0.95,
  },
  footer: {
    marginTop: 8,
  },
  chapterInfo: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 3,
    opacity: 0.82,
  },
  bottomMarketing: { width: '100%', alignItems: 'center', paddingBottom: 8 },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    opacity: 0.55,
    gap: 8,
  },
  signatureLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  signatureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
