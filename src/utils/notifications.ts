import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import gitaData from '../data/bhagavad-gita.json';
import { getSlokasRead } from './stats';
import type { GitaData } from '../types';

export async function scheduleSmartNotifications(baseTime: Date | string, slokasPerDayStr: string) {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

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

  for (let day = 0; day < daysToSchedule; day++) {
    for (let i = 0; i < slokasPerDay; i++) {
        if (nextSlokaIndex >= allSlokas.length) break;
        
        const sloka = allSlokas[nextSlokaIndex];
        const deliveryDate = new Date(time);
        
        // Schedule for 'day' days from now
        // Determine whether the base time today has already passed
        // If it has passed, day 0 should actually start tomorrow
        const timeHasPassedToday = (time.getHours() < now.getHours()) || (time.getHours() === now.getHours() && time.getMinutes() <= now.getMinutes());
        const startOffset = timeHasPassedToday ? 1 : 0;
        
        deliveryDate.setDate(now.getDate() + day + startOffset);
        
        // Spread notifications vertically across the day if multiple
        // e.g. 2 hours apart
        deliveryDate.setHours(deliveryDate.getHours() + (i * 3));
        
        const cleanTranslation = sloka.translation.replace(/Chapter \d+, Verse \d+[.,]?\s*/i, '').trim();
        // Limit body length just in case it's huge
        const truncatedBody = cleanTranslation.length > 150 ? cleanTranslation.substring(0, 147) + '...' : cleanTranslation;

        try {
          await Notifications.scheduleNotificationAsync({
              content: {
                  title: `Chapter ${sloka.chapter}, Verse ${sloka.verse}`,
                  body: truncatedBody,
                  data: { chapter: sloka.chapter, verse: sloka.verse },
                  sound: true
              },
              trigger: {
                  date: deliveryDate,
              } as any, // use as any to satisfy type constraint on TS
          });
        } catch (e) {
          console.warn("Could not schedule notification", e);
        }
        
        nextSlokaIndex++;
    }
  }
}
