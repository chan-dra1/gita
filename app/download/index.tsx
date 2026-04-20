import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAppStoreUrl, getPlayStoreUrl } from '../../src/constants/storeUrls';

export default function DownloadRedirect() {
  const playUrl = useMemo(() => getPlayStoreUrl(), []);
  const appStoreUrl = useMemo(() => getAppStoreUrl(), []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

      if (/android/i.test(userAgent)) {
        setTimeout(() => {
          window.location.href = playUrl;
        }, 1500);
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        setTimeout(() => {
          window.location.href = appStoreUrl;
        }, 1500);
      }
    }
  }, [playUrl, appStoreUrl]);

  const openStore = (url: string) => {
    if (Platform.OS === 'web') {
      window.location.href = url;
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/mandala_bg.png')}
      style={s.background}
      resizeMode="cover"
    >
      <LinearGradient colors={['rgba(8,8,12,0.88)', 'rgba(13,13,13,0.96)', '#0D0D0D']} locations={[0, 0.45, 1]} style={s.overlay} />

      <View style={s.container}>
        <View style={s.hero}>
          <Text style={s.om}>ॐ</Text>
          <Text style={s.title}>Daily Bhagavad Gita</Text>
          <View style={s.titleRule} />
          <Text style={s.subtitle}>Verse, translation & daily practice</Text>
        </View>

        <View style={s.card}>
          <View style={s.detectRow}>
            <ActivityIndicator size="small" color="#D4A44C" />
            <Text style={s.redirectText}>Detecting your device…</Text>
          </View>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.manualLabel}>GET THE APP</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.buttonSecondary} onPress={() => openStore(playUrl)} activeOpacity={0.85}>
            <Ionicons name="logo-google-playstore" size={22} color="#D4A44C" />
            <Text style={s.buttonTextSecondary}>Google Play</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.buttonPrimary} onPress={() => openStore(appStoreUrl)} activeOpacity={0.9}>
            <Ionicons name="logo-apple" size={22} color="#1A1208" />
            <Text style={s.buttonTextPrimary}>App Store</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Finish what you started. Find your purpose.</Text>
      </View>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#070708',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
    maxWidth: 420,
  },
  om: {
    fontSize: 36,
    color: 'rgba(212, 164, 76, 0.85)',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  title: {
    fontSize: 34,
    color: '#F5EDE0',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  titleRule: {
    width: 56,
    height: 2,
    backgroundColor: 'rgba(212, 164, 76, 0.5)',
    borderRadius: 1,
    marginTop: 14,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(245, 237, 224, 0.55)',
    letterSpacing: 2.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(18, 18, 22, 0.72)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.18)',
    alignItems: 'stretch',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
      } as const,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 12,
      },
    }),
  },
  detectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  redirectText: {
    color: 'rgba(245, 237, 224, 0.75)',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 26,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 24,
  },
  manualLabel: {
    fontSize: 10,
    color: 'rgba(212, 164, 76, 0.75)',
    fontWeight: '800',
    letterSpacing: 3,
  },
  buttonSecondary: {
    width: '100%',
    height: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.28)',
    marginBottom: 12,
  },
  buttonTextSecondary: {
    color: '#E8C98A',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPrimary: {
    width: '100%',
    height: 54,
    backgroundColor: '#D4A44C',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  buttonTextPrimary: {
    color: '#1A1208',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    marginTop: 40,
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
});
