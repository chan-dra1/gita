import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppStoreUrl, getPlayStoreUrl, getStoreShareLinkLine } from '../constants/storeUrls';

type Variant = 'verse' | 'mini' | 'icons';

type Props = {
  variant: Variant;
  /** Accent from palette — border / subtle tint. */
  accent: string;
  /** Onboarding preview: open store URLs. Share PNG capture: must be false. */
  interactive?: boolean;
  /** Scale for mini (1 = default mini sizing). */
  scale?: number;
  style?: ViewStyle;
};

/**
 * App Store / Play “badge” strip for share art and onboarding previews.
 * Taps only work when `interactive` is true (not inside `captureRef` bitmaps).
 */
export function ShareStoreMarketingStrip({
  variant,
  accent,
  interactive = false,
  scale = 1,
  style,
}: Props) {
  const isMini = variant === 'mini';
  const isIcons = variant === 'icons';
  const u = scale;

  const appUrl = getAppStoreUrl();
  const playUrl = getPlayStoreUrl();
  const linkLine = getStoreShareLinkLine();

  if (isIcons) {
    const iconSize = Math.round(22 * u);
    const hit = Math.round(34 * u);
    const gap = Math.round(10 * u);

    const Icon = ({
      name,
      url,
      label,
    }: {
      name: React.ComponentProps<typeof Ionicons>['name'];
      url: string;
      label: string;
    }) => {
      if (interactive) {
        return (
          <TouchableOpacity
            style={[styles.iconHit, { width: hit, height: hit, borderColor: `${accent}44` }]}
            onPress={() => void Linking.openURL(url)}
            activeOpacity={0.75}
            accessibilityRole="link"
            accessibilityLabel={label}
          >
            <Ionicons name={name} size={iconSize} color="#FFFFFF" />
          </TouchableOpacity>
        );
      }

      return (
        <View style={[styles.iconHit, { width: hit, height: hit, borderColor: `${accent}44` }]}>
          <Ionicons name={name} size={iconSize} color="#FFFFFF" />
        </View>
      );
    };

    return (
      <View style={[styles.iconsWrap, style]}>
        <Icon name="logo-apple" url={appUrl} label="App Store" />
        <View style={{ width: gap }} />
        <Icon name="logo-google-playstore" url={playUrl} label="Google Play" />
        <Text
          style={[
            styles.hintMini,
            { color: accent, fontSize: Math.round(10 * u), marginLeft: Math.round(12 * u), opacity: 0.9 },
          ]}
          numberOfLines={1}
        >
          {linkLine}
        </Text>
      </View>
    );
  }

  const iconSize = isMini ? Math.round(18 * u) : 28;
  const padH = isMini ? 10 * u : 16;
  const padV = isMini ? 8 * u : 12;
  const gap = isMini ? 8 * u : 14;
  const smallFs = isMini ? Math.round(8 * u) : 13;
  const bigFs = isMini ? Math.round(11 * u) : 20;
  const hintFs = isMini ? Math.round(7 * u) : 12;
  const rowGap = isMini ? 6 * u : 12;

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  const Pill = ({
    icon,
    line1,
    line2,
    url,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    line1: string;
    line2: string;
    url: string;
  }) => {
    const inner = (
      <>
        <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
        <View style={styles.pillTextCol}>
          <Text style={[styles.pillSmall, { fontSize: smallFs }]}>{line1}</Text>
          <Text style={[styles.pillBig, { fontSize: bigFs }]}>{line2}</Text>
        </View>
      </>
    );

    const shellStyle: ViewStyle[] = [
      styles.pill,
      {
        paddingHorizontal: padH,
        paddingVertical: padV,
        borderColor: `${accent}55`,
        gap,
      },
    ];

    if (interactive) {
      return (
        <TouchableOpacity
          style={shellStyle}
          onPress={() => open(url)}
          activeOpacity={0.75}
          accessibilityRole="link"
          accessibilityLabel={`${line1} ${line2}`}
        >
          {inner}
        </TouchableOpacity>
      );
    }

    return <View style={shellStyle}>{inner}</View>;
  };

  return (
    <View style={[styles.wrap, { marginTop: isMini ? 6 * u : 28 }, style]}>
      <View style={[styles.row, { gap: rowGap }]}>
        <Pill icon="logo-apple" line1="Download on the" line2="App Store" url={appUrl} />
        <Pill icon="logo-google-playstore" line1="GET IT ON" line2="Google Play" url={playUrl} />
      </View>
      {!isMini && (
        <Text style={[styles.hint, { color: `${accent}CC`, fontSize: hintFs, marginTop: 12 }]}>
          {linkLine}
        </Text>
      )}
      {isMini && (
        <Text
          style={[styles.hintMini, { color: accent, fontSize: hintFs, marginTop: 4 * u, opacity: 0.85 }]}
          numberOfLines={1}
        >
          Get the app · {linkLine}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
  iconsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconHit: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillTextCol: {
    flex: 1,
    minWidth: 0,
  },
  pillSmall: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pillBig: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  hint: {
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.4,
    opacity: 0.9,
  },
  hintMini: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
