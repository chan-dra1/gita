/**
 * Onboarding Step 7 — Meditation Mode Showcase
 * Shows users the listening modes and the sacred repeat counts.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';

const { width } = Dimensions.get('window');

const MODES = [
  { icon: 'musical-notes', title: 'Chant Only', desc: 'Sanskrit verse chanting', color: '#E8B94A' },
  { icon: 'book', title: 'Chant + Meaning', desc: 'Verse + translation', color: '#6BB5E8', active: true },
  { icon: 'school', title: 'Deep Study', desc: 'Chant + full commentary', color: '#A78BFA' },
];

const SACRED = ['1', '3', '7', '11', '21', 'ॐ'];

export default function OnboardingStep7() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState(1);

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_1.png')}
      overlayOpacity={0.8}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <View key={i} style={[styles.dot, i === 6 && styles.dotActive]} />
          ))}
        </View>

        {/* Preview cards area */}
        <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.previewArea}>
          {/* Mode selector preview */}
          <View style={styles.modePreview}>
            {MODES.map((m, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedMode(i)}
                style={[styles.modeCard, selectedMode === i && { borderColor: m.color, backgroundColor: `${m.color}12` }]}
              >
                <View style={[styles.modeIcon, { backgroundColor: selectedMode === i ? `${m.color}25` : 'rgba(255,255,255,0.04)' }]}>
                  <Ionicons name={m.icon as any} size={20} color={selectedMode === i ? m.color : '#555'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeTitle, selectedMode === i && { color: m.color }]}>{m.title}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </View>
                {selectedMode === i && (
                  <View style={[styles.modeTick, { backgroundColor: m.color }]}>
                    <Ionicons name="checkmark" size={12} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Sacred counts */}
          <View style={styles.sacredRow}>
            <Text style={styles.sacredLabel}>Sacred Repeat Counts</Text>
            <View style={styles.sacredGrid}>
              {SACRED.map((s, i) => (
                <View key={i} style={[styles.sacredBtn, i === 5 && styles.sacredBtnActive]}>
                  <Text style={[styles.sacredNum, i === 5 && styles.sacredNumActive]}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Bottom content */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.bottomContent}>
          <Text style={styles.title}>Meditation Mode</Text>
          <Text style={styles.subtitle}>
            Listen to sacred chanting while you meditate. Choose how deep you want to go — 
            from pure Sanskrit chant to full spiritual commentary.
          </Text>

          <View style={styles.bullets}>
            <View style={styles.bullet}>
              <Ionicons name="headset-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Put on headphones for the best experience</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="repeat-outline" size={18} color="#D4A44C" />
              <Text style={styles.bulletText}>Repeat up to 108 times — the sacred Mala count</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push('/onboarding/step8' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D4A44C', '#B8912E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18, backgroundColor: '#D4A44C' },

  previewArea: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 16 },

  modePreview: { gap: 8 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', gap: 12,
  },
  modeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 14, fontWeight: '700', color: '#AAA' },
  modeDesc: { fontSize: 11, color: '#555', marginTop: 2 },
  modeTick: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  sacredRow: { },
  sacredLabel: { fontSize: 11, color: '#D4A44C', fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  sacredGrid: { flexDirection: 'row', gap: 8 },
  sacredBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sacredBtnActive: { backgroundColor: '#D4A44C', borderColor: '#D4A44C' },
  sacredNum: { fontSize: 16, fontWeight: '800', color: '#666', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sacredNumActive: { color: '#0D0D0D' },

  bottomContent: { paddingHorizontal: 28, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 23, marginBottom: 20 },
  bullets: { gap: 10, marginBottom: 28 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 20 },

  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '800' },
});
