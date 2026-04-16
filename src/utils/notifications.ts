import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import gitaData from '../data/bhagavad-gita.json';
import { getSlokasRead } from './stats';
import type { GitaData } from '../types';

export async function scheduleSmartNotifications(baseTime: Date | string, slokasPerDayStr: string) {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const time = typeof baseTime === 'string' ? new Date(baseTime) : baseTime;
  const slokasPerDay = parseInt(slokasPerDayStr) || 2;
  const maxNotifications = 60; // iOS limit is 64 per app
  const daysToSchedule = Math.floor(maxNotifications / slokasPerDay);

  // Flatten all slokas into a single array
  const allSlokas: any[] = [];
  (gitaData as GitaData).chapters.forEach(c => {
    c.verses.forEach(v => {
      allSlokas.push({ ...v, chapter: c.chapter, chapterName: c.name });
    });
  });

  const readSlokas = await getSlokasRead();
  let nextSlokaIndex = 0;
  
  if (readSlokas.length > 0) {
    const lastRead = readSlokas.reduce((prev, current) => {
      if (current.chapter > prev.chapter) return current;
      if (current.chapter === prev.chapter && current.verse > prev.verse) return current;
      return prev;
    });
    
    const idx = allSlokas.findIndex((s: any) => s.chapter === lastRead.chapter && s.verse === lastRead.verse);
    if (idx !== -1 && idx < allSlokas.length - 1) {
      nextSlokaIndex = idx + 1;
    }
  }

  const now = new Date();
  let scheduledCount = 0;

  for (let day = 0; day < daysToSchedule; day++) {
    for (let i = 0; i < slokasPerDay; i++) {
        if (nextSlokaIndex >= allSlokas.length) break;
        
        const sloka = allSlokas[nextSlokaIndex];
        const deliveryDate = new Date(now);
        
        // Set the base time (hour/minute from user selection)
        deliveryDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
        
        // Determine whether the base time today has already passed
        const timeHasPassedToday = deliveryDate.getTime() <= now.getTime();
        const startOffset = timeHasPassedToday ? 1 : 0;
        
        deliveryDate.setDate(now.getDate() + day + startOffset);
        
        // Spread notifications across the day if multiple per day
        deliveryDate.setHours(deliveryDate.getHours() + (i * 3));
        
        const cleanTranslation = sloka.translation.replace(/Chapter \d+, Verse \d+[.,]?\s*/i, '').trim();
        const fullBody = `${sloka.sanskrit}\n\n${cleanTranslation}`;

        try {
          await Notifications.scheduleNotificationAsync({
              content: {
                  title: `🪷 Chapter ${sloka.chapter}, Verse ${sloka.verse}`,
                  body: fullBody,
                  data: { chapter: sloka.chapter, verse: sloka.verse },
                  sound: true,
                  ...(Platform.OS === 'android' && { channelId: 'default' }),
              },
              trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: deliveryDate,
                  channelId: Platform.OS === 'android' ? 'default' : undefined,
              },
          });
          scheduledCount++;
        } catch (e) {
          console.warn("Could not schedule notification for", deliveryDate.toISOString(), e);
        }
        
        nextSlokaIndex++;
    }
  }

  console.log(`✅ Scheduled ${scheduledCount} smart notifications starting from ${time.toLocaleTimeString()}`);
}

export async function scheduleStreakReminder() {
  if (Platform.OS === 'web') return;
  
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Schedule a smart reminder for 7 PM today if they haven't opened yet to save their streak
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(19, 0, 0, 0);

  // If it's already past 7 PM, schedule for tomorrow
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  try {
    // Cancel existing streak reminder if any
    try {
      await Notifications.cancelScheduledNotificationAsync('streak_reminder');
    } catch (_) {
      // May not exist — that's fine
    }
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'streak_reminder',
      content: {
        title: '🔥 Preserve Your Spiritual Streak',
        body: "Take 5 minutes to read your daily verses. Don't break your Sadhana chain today.",
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: Platform.OS === 'android' ? 'default' : undefined,
      },
    });

    console.log(`🔔 Streak reminder scheduled for ${trigger.toLocaleTimeString()}`);
  } catch (e) {
    console.warn("Could not schedule streak reminder", e);
  }
}

export async function cancelStreakReminder() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync('streak_reminder');
  } catch (e) {
    // Ignore if not scheduled
  }
}

const RETENTION_MESSAGES = [
  "Lord Krishna's wisdom awaits you.",
  "Take a moment of peace today. Keep your spiritual connection strong.",
  "Your Daily Sadhana is incomplete. Take a deep breath and read a verse.",
  "Reconnect with your inner self through the Bhagavad Gita.",
  "Even a few minutes with the Gita can change your entire day."
];

export async function scheduleRetentionNotifications() {
  if (Platform.OS === 'web') return;
  
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel any existing retention notifications first
  await cancelRetentionNotifications();

  // Schedule for +2 days, +5 days, and +7 days
  const delaysInDays = [2, 5, 7];
  
  for (const days of delaysInDays) {
    const trigger = new Date();
    trigger.setDate(trigger.getDate() + days);
    // Prefer morning time for retention 9:00 AM
    trigger.setHours(9, 0, 0, 0);

    const randomMsg = RETENTION_MESSAGES[Math.floor(Math.random() * RETENTION_MESSAGES.length)];

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `retention_reminder_${days}`,
        content: {
          title: '🪷 Time for Spiritual Growth',
          body: randomMsg,
          sound: true,
          ...(Platform.OS === 'android' && { channelId: 'default' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        },
      });
    } catch (e) {
      console.warn("Could not schedule retention reminder", e);
    }
  }
}

export async function cancelRetentionNotifications() {
  if (Platform.OS === 'web') return;
  const delaysInDays = [2, 5, 7];
  for (const days of delaysInDays) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`retention_reminder_${days}`);
    } catch (e) {
      // Ignore
    }
  }
}
