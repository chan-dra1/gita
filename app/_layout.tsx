import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { LanguageProvider } from '../src/context/LanguageContext';

import { Config } from '../src/constants/config';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android' && Config.REVENUECAT_API_KEY_ANDROID && !Config.REVENUECAT_API_KEY_ANDROID.startsWith('test_')) {
      try {
        Purchases.configure({ apiKey: Config.REVENUECAT_API_KEY_ANDROID });
      } catch (e) {
        console.warn('Failed to configure RevenueCat:', e);
      }
    }
    // Note: iOS key can be added in Config when ready

    // Schedule smart streak reminder (will be cancelled if they read today)
    import('../src/utils/notifications').then(({ scheduleStreakReminder }) => {
      scheduleStreakReminder();
    }).catch(() => {});
  }, []);
  return (
    <LanguageProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF7ED' },
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
          name="settings"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </LanguageProvider>
  );
}
