import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, Easing, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.heroContent}>
          <Animated.Text 
            entering={ZoomIn.duration(1200).easing(Easing.out(Easing.back(1.5))).delay(300)}
            style={styles.omSymbol}
          >
            ॐ
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.duration(1000).delay(800)}
            style={styles.title}
          >
            Bhagavad Gita
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.duration(1000).delay(1100)}
            style={styles.subtitle}
          >
            Awaken Your Inner Wisdom
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
          <Text style={styles.buttonText}>Begin Journey</Text>
          <Ionicons name="arrow-forward" size={20} color="#0A1128" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128', // Deep Cosmic Navy
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
    color: '#F48B29', // Vibrant Saffron
    marginBottom: 24,
    fontWeight: '300',
    includeFontPadding: false,
    textShadowColor: 'rgba(244, 139, 41, 0.4)', // Glowing effect
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
  },
  subtitle: {
    fontSize: 18,
    color: '#D1D5DB', // Soft Silver
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
    backgroundColor: '#F48B29',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#0A1128',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
