import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SPIRAL_MS = 220000;
const BREATHE_MS = 36000;

interface OnboardingBackgroundProps {
  imageSource: ImageSourcePropType;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({
  imageSource,
  overlayOpacity: overlayOpacityProp,
  children,
}) => {
  const { isDark } = useTheme();

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.07, { duration: BREATHE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: SPIRAL_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const veil =
    overlayOpacityProp !== undefined
      ? overlayOpacityProp
      : isDark
        ? 0.22
        : 0.12;

  const containerBg = isDark ? '#050a16' : '#060d1c';

  const gradientColors = isDark
    ? ['rgba(6, 14, 32, 0.55)', 'rgba(6, 14, 32, 0.2)', 'rgba(6, 14, 32, 0.45)']
    : [
        'rgba(255, 255, 255, 0.14)',
        'rgba(255, 255, 255, 0.04)',
        'rgba(253, 250, 245, 0.2)',
      ];

  const veilColor = isDark ? `rgba(5, 10, 22, ${veil})` : `rgba(255, 253, 248, ${veil})`;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <Animated.Image source={imageSource} style={[styles.backgroundImage, animatedStyle]} />

      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={styles.gradientOverlay} />

      <View style={[styles.veil, { backgroundColor: veilColor }]} />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: width * 1.65,
    height: height * 1.65,
    resizeMode: 'cover',
    left: -width * 0.325,
    top: -height * 0.325,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
});
