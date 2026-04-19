import React, { useMemo } from 'react';
import { View, Text, ImageBackground, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VERSE_SHARE_PALETTES } from '../constants/verseShareDesigns';
import { ShareStoreMarketingStrip } from './ShareStoreMarketing';

type Props = {
  /** Square size in layout pixels (e.g. width - padding). */
  size: number;
  designIndex: number;
  sanskrit: string;
  translation: string;
  chapter: number;
  verse: number;
  /** Tappable store badges (onboarding). Off for static screenshots. */
  storeInteractive?: boolean;
};

/**
 * On-device preview of a share postcard (matches full `VerseCard` palettes at smaller size).
 */
export function SharePostcardMini({
  size,
  designIndex,
  sanskrit,
  translation,
  chapter,
  verse,
  storeInteractive = true,
}: Props) {
  const palette = VERSE_SHARE_PALETTES[Math.min(designIndex, VERSE_SHARE_PALETTES.length - 1)];
  const u = size / 280;
  const fs = {
    om: Math.round(22 * u),
    label: Math.round(10 * u),
    sk: Math.max(11, Math.round(14 * u)),
    tr: Math.max(10, Math.round(11 * u)),
    ref: Math.round(8 * u),
  };

  const skLines = useMemo(() => {
    const len = sanskrit.length;
    if (len > 100) return { size: fs.sk - 2, lh: Math.round(18 * u) };
    if (len > 55) return { size: fs.sk - 1, lh: Math.round(20 * u) };
    return { size: fs.sk, lh: Math.round(22 * u) };
  }, [sanskrit.length, fs.sk, u]);

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: 14 * u }]}>
      <ImageBackground
        source={require('../../assets/images/mandala_bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient colors={palette.overlay} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.frame,
            { borderColor: palette.frameColor, borderRadius: 10 * u, top: 8 * u, left: 8 * u, right: 8 * u, bottom: 8 * u },
          ]}
        />
        <View style={[styles.inner, { padding: 12 * u }]}>
          <View style={styles.body}>
            <Text style={[styles.om, { color: palette.accent, fontSize: fs.om }]}>ॐ</Text>
            <View style={styles.accentRow}>
              <View style={[styles.line, { backgroundColor: palette.accent, width: 20 * u }]} />
              <Text style={[styles.bh, { color: palette.accent, fontSize: fs.label }]}>BHAGAVAD GITA</Text>
              <View style={[styles.line, { backgroundColor: palette.accent, width: 20 * u }]} />
            </View>
            <Text
              style={[
                styles.sk,
                {
                  color: palette.sanskritColor,
                  fontSize: skLines.size,
                  lineHeight: skLines.lh,
                },
              ]}
              numberOfLines={6}
            >
              {sanskrit}
            </Text>
            <View style={[styles.div, { backgroundColor: palette.accent, marginVertical: 8 * u }]} />
            <Text
              style={[styles.tr, { color: palette.translationColor, fontSize: fs.tr, lineHeight: Math.round(16 * u) }]}
              numberOfLines={5}
            >
              {`"${translation}"`}
            </Text>
            <Text style={[styles.ref, { color: palette.accent, fontSize: fs.ref }]}>
              CHAPTER {chapter} · VERSE {verse}
            </Text>
          </View>
          <ShareStoreMarketingStrip
            variant="mini"
            accent={palette.accent}
            interactive={storeInteractive}
            scale={u}
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#0D0D0D' },
  bg: { flex: 1, justifyContent: 'center' },
  frame: {
    position: 'absolute',
    borderWidth: 1.5,
    opacity: 0.85,
  },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' },
  om: {
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  accentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  line: { height: 1, opacity: 0.65 },
  bh: { fontWeight: '800', letterSpacing: 2 },
  sk: {
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  div: { width: 40, height: 1, opacity: 0.45 },
  tr: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  ref: { fontWeight: '800', letterSpacing: 1, marginTop: 6, textAlign: 'center' },
});
