import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// PLACEHOLDERS: Replace these with your actual App Store / Play Store URLs
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.yourname.gita';
const APP_STORE_URL = 'https://apps.apple.com/app/id123456789';

export default function DownloadRedirect() {
  useEffect(() => {
    // Only perform auto-redirect on Web
    if (Platform.OS === 'web') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

      // Smart Redirect Detection
      if (/android/i.test(userAgent)) {
        setTimeout(() => {
          window.location.href = PLAY_STORE_URL;
        }, 1500);
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        setTimeout(() => {
          window.location.href = APP_STORE_URL;
        }, 1500);
      }
    }
  }, []);

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
      <LinearGradient
        colors={['rgba(13,13,13,0.8)', '#0D0D0D']}
        style={s.overlay}
      />
      
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>The Gita App</Text>
          <Text style={s.subtitle}>YOUR SACRED JOURNEY AWAITS</Text>
        </View>

        <View style={s.card}>
          <ActivityIndicator size="large" color="#D4A44C" style={{ marginBottom: 20 }} />
          <Text style={s.redirectText}>Detecting your device...</Text>
          
          <View style={s.divider} />
          
          <Text style={s.manualLabel}>OR DOWNLOAD MANUALLY</Text>
          
          <TouchableOpacity 
            style={s.button} 
            onPress={() => openStore(PLAY_STORE_URL)}
          >
            <Ionicons name="logo-google-playstore" size={24} color="#D4A44C" />
            <Text style={s.buttonText}>Google Play Store</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.button, { marginTop: 12 }]} 
            onPress={() => openStore(APP_STORE_URL)}
          >
            <Ionicons name="logo-apple" size={24} color="#D4A44C" />
            <Text style={s.buttonText}>Apple App Store</Text>
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
    backgroundColor: '#0D0D0D',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    color: '#D4A44C',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(212, 164, 76, 0.6)',
    letterSpacing: 4,
    fontWeight: '700',
    marginTop: 8,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  redirectText: {
    color: '#E0D5C5',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 32,
  },
  manualLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
  },
  buttonText: {
    color: '#D4A44C',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 13,
    fontStyle: 'italic',
  }
});
