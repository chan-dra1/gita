import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

import { Config } from '../src/constants/config';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: Config.REVENUECAT_API_KEY_ANDROID });
    }
    // Note: iOS key can be added in Config when ready
  }, []);
  return (
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
  );
}
