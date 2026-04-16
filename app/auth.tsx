import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ImageBackground, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, signInWithCredential } from 'firebase/auth';
import { auth } from '../src/utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pullCloudDataToLocal, pushLocalDataToCloud } from '../src/utils/cloudSync';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(mode === 'login'); // default to Sign Up unless mode=login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Production-ready Google Auth configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '957696257946-uag2g20gi77kc514ua5n15re0j7u8jp4.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          await pullCloudDataToLocal(result.user.uid);
          await finishOnboardingAndProceed();
        })
        .catch((e) => {
          console.error(e);
          setError(e.message);
        })
        .finally(() => setLoading(false));
    }
  }, [response]);

  const finishOnboardingAndProceed = async () => {
    await AsyncStorage.setItem('@gita_onboarding_completed', 'true');
    router.replace('/(tabs)' as any);
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await pullCloudDataToLocal(cred.user.uid);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Optionally store the name inside Firebase profile
        await updateProfile(cred.user, { displayName: name });
        await pushLocalDataToCloud(cred.user.uid);
      }
      
      await finishOnboardingAndProceed();
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message;
      if (e.code === 'auth/email-already-in-use') errMsg = 'An account already exists for this email. Try logging in.';
      if (e.code === 'auth/wrong-password') errMsg = 'Incorrect password.';
      if (e.code === 'auth/user-not-found') errMsg = 'No account found for this email.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await pullCloudDataToLocal(result.user.uid);
        await finishOnboardingAndProceed();
      } else {
        // Use production-ready universal auth session for mobile
        await promptAsync();
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterAuth = () => {
    Alert.alert(
      'Feature in Development',
      'Twitter/X authentication requires developer portal approval and will be activated soon. Please use Google or Email to continue your journey today.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ImageBackground 
      source={require('../assets/images/mandala_bg.png')} 
      style={s.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(13,13,13,0.6)', 'rgba(13,13,13,0.9)', '#0D0D0D']}
        style={s.gradientOverlay}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex1}
      >
        <ScrollView 
          contentContainerStyle={s.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header row with back button */}
          <TouchableOpacity 
            style={s.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
          >
            <Ionicons name="arrow-back" size={24} color="#D4A44C" />
          </TouchableOpacity>

          {/* Titles */}
          <View style={s.titleContainer}>
            <Text style={s.mainTitle}>
              {isLogin ? "Resume Your Sacred" : "Begin Your Sacred"}{'\n'}Journey
            </Text>
            <Text style={s.subTitle}>
              {isLogin ? "WELCOME BACK TO THE SANCTUARY" : "ENTER THE SANCTUARY OF WISDOM"}
            </Text>
          </View>

          {/* Form Card */}
          <View style={s.formCard}>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <View style={s.inputWrapper}>
                <Text style={s.inputLabel}>NAME</Text>
                <View style={s.inputBox}>
                  <TextInput
                    style={s.inputText}
                    placeholder="Arjuna"
                    placeholderTextColor="#555"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>EMAIL</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.inputText}
                  placeholder="seeker@gita.pro"
                  placeholderTextColor="#555"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>PASSWORD</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.inputText}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity 
              onPress={handleAuth}
              disabled={loading}
              style={s.primaryButton}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={s.primaryButtonText}>
                  {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR CONTINUE WITH</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social Auth Buttons */}
            <View style={s.socialRow}>
              <TouchableOpacity 
                onPress={handleGoogleAuth}
                disabled={loading}
                style={s.socialButton}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-google" size={16} color="#888" style={{ marginRight: 8 }} />
                <Text style={s.socialText}>GOOGLE</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleTwitterAuth}
                disabled={loading}
                style={s.socialButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#888" style={{ marginRight: 6 }} />
                <Text style={s.socialText}>TWITTER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle Login/Signup */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={s.footerLink} onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}>
                {isLogin ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 60 : 50,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  mainTitle: {
    fontSize: 34,
    color: '#D4A44C',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 11,
    color: 'rgba(212, 164, 76, 0.6)',
    letterSpacing: 2.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: 'rgba(229,57,53,0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.3)',
    marginBottom: 20,
  },
  errorText: {
    color: '#E53935',
    textAlign: 'center',
    fontSize: 13,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4A44C',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: '#0F0F0F',
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputText: {
    color: '#FFF',
    fontSize: 16,
    height: '100%',
  },
  primaryButton: {
    backgroundColor: '#D4A44C',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dividerText: {
    color: 'rgba(212, 164, 76, 0.4)',
    paddingHorizontal: 16,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
    height: 50,
    borderRadius: 4,
  },
  socialText: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  footerLink: {
    color: '#D4A44C',
    fontWeight: '700',
  },
});
