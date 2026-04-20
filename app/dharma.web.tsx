import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAppStoreUrl, getPlayStoreUrl } from '../src/constants/storeUrls';

/**
 * Web has no Screen Time / Family Controls. Show a clear funnel to the native apps.
 */
export default function DharmaWebPlaceholder() {
  const router = useRouter();
  const playUrl = getPlayStoreUrl();
  const appStoreUrl = getAppStoreUrl();

  return (
    <ImageBackground
      source={require('../assets/images/mandala_bg.png')}
      style={s.bg}
      resizeMode="cover"
    >
      <LinearGradient colors={['rgba(8,8,12,0.9)', 'rgba(13,13,13,0.97)', '#0D0D0D']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.back} accessibilityRole="button">
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Dharma Mode</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          <View style={s.card}>
            <View style={s.iconRing}>
              <Ionicons name="shield-checkmark" size={32} color="#D4A44C" />
            </View>
            <Text style={s.om}>ॐ</Text>
            <Text style={s.headline}>Focus tools live on your phone</Text>
            <Text style={s.body}>
              Dharma Mode uses Screen Time on iPhone and usage controls on Android. The browser cannot access those APIs — get
              the app to shield distractions while you read.
            </Text>

            <TouchableOpacity style={s.btnSecondary} onPress={() => void Linking.openURL(playUrl)} accessibilityRole="link">
              <Ionicons name="logo-google-playstore" size={22} color="#D4A44C" />
              <Text style={s.btnTextSecondary}>Google Play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnPrimary} onPress={() => void Linking.openURL(appStoreUrl)} accessibilityRole="link">
              <Ionicons name="logo-apple" size={22} color="#1A1208" />
              <Text style={s.btnTextPrimary}>App Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#070708' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 12 : 8,
    paddingBottom: 8,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#F5EDE0', letterSpacing: 0.4 },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  card: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(18, 18, 22, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
    alignItems: 'stretch',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
      } as const,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
        elevation: 10,
      },
    }),
  },
  iconRing: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 164, 76, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  om: {
    alignSelf: 'center',
    fontSize: 28,
    color: 'rgba(212, 164, 76, 0.88)',
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5EDE0',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(245, 237, 224, 0.68)',
    textAlign: 'center',
    marginBottom: 28,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.3)',
    marginBottom: 12,
  },
  btnTextSecondary: { color: '#E8C98A', fontSize: 16, fontWeight: '700' },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#D4A44C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnTextPrimary: { color: '#1A1208', fontSize: 16, fontWeight: '800' },
});
