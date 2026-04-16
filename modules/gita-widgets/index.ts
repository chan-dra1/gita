import { requireNativeModule } from 'expo-modules-core';

interface GitaWidgetsInterface {
  setWidgetData(chapter: number, verse: number, sanskrit: string, english: string): Promise<void>;
  updateWidget(chapter: number, verse: number, sanskrit: string, english: string): Promise<void>;
}

// Export the native module securely
export const GitaWidgets = requireNativeModule<GitaWidgetsInterface>('GitaWidgets');

