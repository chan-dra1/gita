import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, ImageBackground, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingBackgroundProps {
  image: any;
  quote?: string;
  author?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({ 
  image, 
  quote, 
  author, 
  overlayOpacity = 0.5,
  children 
}) => {
  const driftAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous screensaver drift effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 20000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10], // Subtle lateral drift
  });

  const scale = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.1, 1.15], // Subtle zoom
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.backgroundWrapper,
        {
          transform: [{ translateX }, { scale }],
        }
      ]}>
        <ImageBackground source={image} style={styles.image} resizeMode="cover" />
      </Animated.View>
      
      <View style={[styles.overlay, { backgroundColor: `rgba(10, 17, 40, ${overlayOpacity})` }]} />
      
      {/* Quote rendering removed as per user request for visual cleanup */}
      
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  backgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    width: width * 1.2,
    height: height * 1.2,
    left: -width * 0.1,
    top: -height * 0.1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  quoteContainer: {
    position: 'absolute',
    top: '15%',
    left: 20,
    right: 20,
    alignItems: 'center',
    padding: 20,
  },
  quoteText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'serif',
    lineHeight: 26,
    textShadowColor: 'black',
    textShadowRadius: 10,
  },
  authorText: {
    color: 'rgba(244, 139, 41, 0.8)',
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
