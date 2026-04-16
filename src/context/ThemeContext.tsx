import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName, useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
}

export const darkColors: ThemeColors = {
  background: '#0D0D0D',
  card: '#141414',
  text: '#FFFFFF',
  textSecondary: '#E0D5C5',
  primary: '#D4A44C',
  border: 'rgba(255,255,255,0.08)',
};

export const lightColors: ThemeColors = {
  background: '#FDFCF8', // Warm parchment white
  card: '#FFFFFF',
  text: '#2C1810', // Deep earthy brown for better readability than pure black
  textSecondary: '#6B5E4C', // Muted clay brown
  primary: '#B5872A', // Rich temple gold
  border: 'rgba(181, 135, 42, 0.15)', // Subtle gold-tinted border
};

interface ThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'system',
  setMode: () => {},
  isDark: true,
  colors: darkColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const deviceTheme = useDeviceColorScheme();

  useEffect(() => {
    AsyncStorage.getItem('gita_theme').then((saved) => {
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setModeState(saved as ThemeMode);
      }
    });
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('gita_theme', newMode);
  };

  const isDark = mode === 'dark' || (mode === 'system' && deviceTheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
