/**
 * useNotifications — React hook for scheduling daily sloka reminders.
 * 
 * ⚠️ Notifications are only supported on native (iOS/Android).
 *    On web, notifications are silently disabled.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Config } from '../constants/config';
import type { NotificationSettings } from '../types';

const STORAGE_KEY = '@gita_notification_settings';
const NOTIFICATION_ID = 'daily-sloka-reminder';

// Only import and configure Notifications on native
let Notifications: typeof import('expo-notifications') | null = null;

if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
}

interface UseNotificationsReturn {
    settings: NotificationSettings;
    isPermissionGranted: boolean;
    updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
    requestPermission: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: false,
        hour: Config.DEFAULT_NOTIFICATION_HOUR,
        minute: Config.DEFAULT_NOTIFICATION_MINUTE,
    });
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);

    // Load saved settings on mount
    useEffect(() => {
        loadSettings();
        checkPermission();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (err) {
            console.warn('Failed to load notification settings:', err);
        }
    };

    const checkPermission = async () => {
        if (!Notifications) {
            setIsPermissionGranted(false);
            return;
        }
        const permResult = await Notifications.getPermissionsAsync();
        setIsPermissionGranted(!!(permResult as any).granted);
    };

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!Notifications) return false;
        const permResult2 = await Notifications.requestPermissionsAsync();
        const granted = !!(permResult2 as any).granted;
        setIsPermissionGranted(granted);
        return granted;
    }, []);

    const scheduleDaily = useCallback(
        async (hour: number, minute: number) => {
            if (!Notifications) return;
            // Cancel existing
            await Notifications.cancelAllScheduledNotificationsAsync();

            // Schedule new daily notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🙏 Daily Sloka Reminder',
                    body: "Take a moment to read today's Bhagavad Gita verse and find inner peace.",
                    data: { type: 'daily-sloka' },
                    sound: true,
                    ...(Platform.OS === 'android' && { channelId: 'default' }),
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute,
                    channelId: Platform.OS === 'android' ? 'default' : undefined,
                },
                identifier: NOTIFICATION_ID,
            });

            console.log(`🔔 Daily notification set for ${hour}:${String(minute).padStart(2, '0')}`);
        },
        []
    );

    const updateSettings = useCallback(
        async (updates: Partial<NotificationSettings>) => {
            const newSettings = { ...settings, ...updates };
            setSettings(newSettings);

            // Persist
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

            // Schedule or cancel (only on native)
            if (!Notifications) return;

            if (newSettings.enabled) {
                const hasPermission = isPermissionGranted || (await requestPermission());
                if (hasPermission) {
                    await scheduleDaily(newSettings.hour, newSettings.minute);
                }
            } else {
                await Notifications.cancelAllScheduledNotificationsAsync();
            }
        },
        [settings, isPermissionGranted, requestPermission, scheduleDaily]
    );

    return {
        settings,
        isPermissionGranted,
        updateSettings,
        requestPermission,
    };
}
