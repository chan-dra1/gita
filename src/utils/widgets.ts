import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export interface WidgetData {
  chapter: number;
  verse: number;
  sanskrit: string;
  english: string;
}

type GitaWidgetsNative = {
  setWidgetData(chapter: number, verse: number, sanskrit: string, english: string): Promise<void>;
  updateWidget(chapter: number, verse: number, sanskrit: string, english: string): Promise<void>;
};

let native: GitaWidgetsNative | null = null;
if (Platform.OS !== 'web') {
  try {
    native = requireNativeModule<GitaWidgetsNative>('GitaWidgets');
  } catch {
    native = null;
  }
}

/**
 * Syncs the latest verse data with the native Home Screen widgets.
 */
export async function syncWidgetData(data: WidgetData): Promise<void> {
  try {
    if (!native) {
      console.warn('GitaWidgets native module not found. Widget sync skipped.');
      return;
    }
    if (Platform.OS === 'android') {
      await native.updateWidget(data.chapter, data.verse, data.sanskrit, data.english);
    } else if (Platform.OS === 'ios') {
      await native.setWidgetData(data.chapter, data.verse, data.sanskrit, data.english);
    }
  } catch (error) {
    console.error('Failed to sync widget data:', error);
  }
}
