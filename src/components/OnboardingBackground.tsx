import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Same stack as `app/auth.tsx`: mandala texture + dark gradient (signup / sanctuary look). */
const MANDALA = require('../../assets/images/mandala_bg.png');

interface OnboardingBackgroundProps {
  /** Optional extra dimming (0–1) on top of the auth-matched gradient. */
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({
  overlayOpacity: overlayOpacityProp,
  children,
}) => {
  const extraVeil =
    overlayOpacityProp !== undefined && overlayOpacityProp > 0 ? (
      <View style={[styles.extraVeil, { opacity: overlayOpacityProp }]} />
    ) : null;

  return (
    <ImageBackground source={MANDALA} style={styles.background} resizeMode="cover">
      <LinearGradient
        colors={['rgba(13,13,13,0.6)', 'rgba(13,13,13,0.9)', '#0D0D0D']}
        style={styles.gradientOverlay}
      />
      {extraVeil}
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  extraVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});
