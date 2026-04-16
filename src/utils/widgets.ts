import { NativeModules, Platform } from 'react-native';

const { GitaWidgetModule } = NativeModules;

export interface WidgetData {
  chapter: number;
  verse: number;
  sanskrit: string;
  english: string;
}

/**
 * Syncs the latest verse data with the native Home Screen widgets.
 */
export async function syncWidgetData(data: WidgetData): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      // Logic for Android Widget update
      if (GitaWidgetModule?.updateWidget) {
        await GitaWidgetModule.updateWidget(data);
      } else {
        console.warn('GitaWidgetModule for Android not found. Widget sync skipped.');
      }
    } else if (Platform.OS === 'ios') {
      // Logic for iOS App Group update
      if (GitaWidgetModule?.setWidgetData) {
        await GitaWidgetModule.setWidgetData(data);
      } else {
        console.warn('GitaWidgetModule for iOS not found. Widget sync skipped.');
      }
    }
  } catch (error) {
    console.error('Failed to sync widget data:', error);
  }
}
