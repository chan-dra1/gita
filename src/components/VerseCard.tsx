import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface VerseCardProps {
  sanskrit: string;
  translation: string;
  chapter: number;
  verse: number;
}

/**
 * VerseCard Component
 * This is designed specifically for high-fidelity social sharing.
 * It is meant to be rendered off-screen (or hidden) and captured as an image.
 */
export const VerseCard: React.FC<VerseCardProps> = ({ sanskrit, translation, chapter, verse }) => {
  return (
    <View style={s.container}>
      <ImageBackground
        source={require('../../assets/images/mandala_bg.png')}
        style={s.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(13,13,13,0.7)', 'rgba(13,13,13,0.92)']}
          style={s.overlay}
        />
        
        <View style={s.content}>
          {/* Header Accent */}
          <View style={s.accentLabelContainer}>
             <View style={s.accentLine} />
             <Text style={s.accentLabel}>BHAGAVAD GITA</Text>
             <View style={s.accentLine} />
          </View>

          {/* Sanskrit Verse */}
          <View style={s.verseContainer}>
            <Text style={s.sanskritText}>{sanskrit}</Text>
          </View>

          <View style={s.divider} />

          {/* English Translation */}
          <View style={s.translationContainer}>
            <Text style={s.translationText}>"{translation}"</Text>
          </View>

          {/* Attribution Footer */}
          <View style={s.footer}>
            <Text style={s.chapterInfo}>CHAPTER {chapter} · VERSE {verse}</Text>
          </View>
        </View>

        {/* Digital Signature Branding (Subtle) */}
        <View style={s.signatureContainer}>
          <View style={s.storeBadges}>
            <Ionicons name="logo-apple" size={16} color="#FFFFFF" opacity={0.7} />
            <Ionicons name="logo-google-playstore" size={16} color="#FFFFFF" opacity={0.7} />
          </View>
          <View style={s.signatureDot} />
          <Text style={s.signatureLabel}>THY GITA</Text>
          <View style={s.signatureDot} />
          <Text style={s.signatureApp}>THE GITA APP</Text>
        </View>

      </ImageBackground>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    width: 1080, // High-res Instagram Square
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
  content: {
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  accentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
    gap: 15,
  },
  accentLine: {
    width: 40,
    height: 1.5,
    backgroundColor: '#D4A44C',
    opacity: 0.5,
  },
  accentLabel: {
    color: '#D4A44C',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    opacity: 0.9,
  },
  verseContainer: {
    marginBottom: 50,
  },
  sanskritText: {
    color: '#D4A44C',
    fontSize: 42,
    lineHeight: 70,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  divider: {
    width: 100,
    height: 1,
    backgroundColor: 'rgba(212, 164, 76, 0.4)',
    marginVertical: 40,
  },
  translationContainer: {
    marginBottom: 80,
  },
  translationText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 46,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingHorizontal: 40,
    opacity: 0.9,
  },
  footer: {
    marginTop: 20,
  },
  chapterInfo: {
    color: '#D4A44C',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    opacity: 0.7,
  },
  signatureContainer: {
    position: 'absolute',
    bottom: 50,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.5,
    gap: 8,
  },
  storeBadges: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 4,
  },
  signatureLabel: {
    color: '#D4A44C',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  signatureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D4A44C',
  },
  signatureApp: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
