import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface OnboardingBackgroundProps {
  image?: any; // Deprecated, kept for API compatibility
  quote?: string;
  author?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({ 
  overlayOpacity = 0.5,
  children 
}) => {
  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle breathing animation for ambient feel
    Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40], // Slow vertical float
  });

  const opacity = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.5], // Gentle pulse
  });

  return (
    <View style={styles.container}>
      {/* Base Dark Background */}
      <View style={styles.baseDark} />
      
      {/* Animated Subtle Ambient Glow */}
      <Animated.View style={[
        styles.glowWrapper,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}>
        <LinearGradient
          colors={['rgba(212, 164, 76, 0.15)', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
      
      {/* Secondary Overlay (for contrast) */}
      <View style={[styles.overlay, { backgroundColor: `rgba(13, 13, 13, ${overlayOpacity})` }]} />
      
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D', // Pure deep dark background
  },
  baseDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0D0D',
  },
  glowWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.8,
  },
  glowGradient: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
