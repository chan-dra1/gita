import '../global.css';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import Purchases from 'react-native-purchases';
import { LanguageProvider } from '../src/context/LanguageContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme, ThemeMode } from '../src/context/ThemeContext';
import { Appearance } from 'react-native';

import { Config } from '../src/constants/config';

// Configure notification handler so notifications show when app is in foreground
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const appState = useRef(AppState.currentState);
  const { colors, mode, setMode } = useTheme();

  useEffect(() => {
    // Create Android notification channel (required for Android 8+)
    // Without this, ALL notifications silently fail on Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4A44C',
        sound: 'default',
        description: 'Daily sloka reminders and streak notifications',
      }).catch((e) => console.warn('Failed to create notification channel:', e));
    }

    // Request notification permissions on first launch
    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync().catch(() => {});
    }

    const configurePurchases = () => {
      try {
        if (Platform.OS === 'ios') {
          const key = Config.REVENUECAT_API_KEY_IOS;
          if (key && !key.startsWith('test_')) {
            Purchases.configure({ apiKey: key });
          }
        } else if (Platform.OS === 'android') {
          const key = Config.REVENUECAT_API_KEY_ANDROID;
          if (key && !key.startsWith('test_')) {
            Purchases.configure({ apiKey: key });
          }
        }
      } catch (e) {
        console.warn('Failed to configure RevenueCat:', e);
      }
    };
    configurePurchases();

    // Schedule smart streak reminder (will be cancelled if they read today)
    import('../src/utils/notifications').then(({ scheduleStreakReminder, cancelRetentionNotifications, scheduleRetentionNotifications }) => {
      scheduleStreakReminder();
      // On app launch, cancel any pending retention notifications
      cancelRetentionNotifications();
      
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App has come to the foreground!
          cancelRetentionNotifications();
        } else if (
          appState.current === 'active' &&
          nextAppState.match(/inactive|background/)
        ) {
          // App has gone to the background!
          scheduleRetentionNotifications();
        }
        appState.current = nextAppState;
      });

      return () => {
        subscription.remove();
      };
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setMode('system'); // Re-evaluate system preference
      });
      return () => subscription.remove();
    }
  }, [mode]);

  return (
    <AuthProvider>
      <LanguageProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="sloka/[chapter]/[verse]"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step1"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step2"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step3"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step4"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step5"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step6"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step7"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step8"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/step9"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding/paywall"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </LanguageProvider>
    </AuthProvider>
  );
}
