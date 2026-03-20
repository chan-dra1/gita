import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SlokaReadEntry, StreakData, OnboardingData } from '../types';

// Storage Keys
const STORAGE_KEYS = {
  SLOKAS_READ: '@gita_slokas_read',
  SAVED_SLOKAS: '@gita_saved_slokas',
  STREAK_DATA: '@gita_streak_data',
  ONBOARDING_DATA: '@gita_onboarding_data',
  LAST_OPENED: '@gita_last_opened',
  PROFILE_NAME: '@gita_profile_name',
} as const;

// Re-export types
export type { SlokaReadEntry, StreakData, OnboardingData };

// Slokas Read Functions
export async function getSlokasRead(): Promise<SlokaReadEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SLOKAS_READ);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addSlokaRead(chapter: number, verse: number): Promise<void> {
  try {
    const existing = await getSlokasRead();
    const key = `${chapter}:${verse}`;
    const alreadyRead = existing.some(e => e.chapter === chapter && e.verse === verse);

    if (!alreadyRead) {
      const newEntry: SlokaReadEntry = {
        chapter,
        verse,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SLOKAS_READ,
        JSON.stringify([...existing, newEntry])
      );
    }

    // Update streak when user reads a sloka
    await updateStreak();
  } catch {
    // Silent fail
  }
}

export async function isSlokaRead(chapter: number, verse: number): Promise<boolean> {
  const slokas = await getSlokasRead();
  return slokas.some(s => s.chapter === chapter && s.verse === verse);
}

export async function getUniqueSlokasReadCount(): Promise<number> {
  const slokas = await getSlokasRead();
  const unique = new Set(slokas.map(s => `${s.chapter}:${s.verse}`));
  return unique.size;
}

export async function getReadSlokasByChapter(chapter: number): Promise<number[]> {
  const slokas = await getSlokasRead();
  return slokas
    .filter(s => s.chapter === chapter)
    .map(s => s.verse);
}

// Saved Slokas Functions
export async function getSavedSlokas(): Promise<SlokaReadEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_SLOKAS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveSloka(chapter: number, verse: number): Promise<void> {
  try {
    const existing = await getSavedSlokas();
    const alreadySaved = existing.some(e => e.chapter === chapter && e.verse === verse);

    if (!alreadySaved) {
      const newEntry: SlokaReadEntry = {
        chapter,
        verse,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_SLOKAS,
        JSON.stringify([...existing, newEntry])
      );
    }
  } catch {
    // Silent fail
  }
}

export async function unsaveSloka(chapter: number, verse: number): Promise<void> {
  try {
    const existing = await getSavedSlokas();
    const filtered = existing.filter(e => !(e.chapter === chapter && e.verse === verse));
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_SLOKAS, JSON.stringify(filtered));
  } catch {
    // Silent fail
  }
}

export async function isSlokaSaved(chapter: number, verse: number): Promise<boolean> {
  const saved = await getSavedSlokas();
  return saved.some(s => s.chapter === chapter && s.verse === verse);
}

export async function getSavedCount(): Promise<number> {
  const saved = await getSavedSlokas();
  return saved.length;
}

// Streak Functions
export async function getStreakData(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Fall through to default
  }
  return {
    currentStreak: 0,
    lastOpenedDate: null,
    longestStreak: 0,
  };
}

export async function updateStreak(): Promise<StreakData> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = await getStreakData();

    if (current.lastOpenedDate === today) {
      return current;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (current.lastOpenedDate === yesterdayStr) {
      newStreak = current.currentStreak + 1;
    }

    const newData: StreakData = {
      currentStreak: newStreak,
      lastOpenedDate: today,
      longestStreak: Math.max(current.longestStreak, newStreak),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(newData));
    return newData;
  } catch {
    return {
      currentStreak: 0,
      lastOpenedDate: null,
      longestStreak: 0,
    };
  }
}

export async function getCurrentStreak(): Promise<number> {
  const data = await getStreakData();
  return data.currentStreak;
}

// Onboarding Data Functions
export async function getOnboardingData(): Promise<OnboardingData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Fall through to default
  }
  return {
    motivation: null,
    experienceLevel: null,
    guidanceStyle: null,
    dailyCommitment: null,
    remindersEnabled: true,
    reminderTime: null,
    completedAt: null,
  };
}

export async function saveOnboardingStep(step: keyof OnboardingData, value: any): Promise<void> {
  try {
    const current = await getOnboardingData();
    const updated = { ...current, [step]: value };
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(updated));
  } catch {
    // Silent fail
  }
}

export async function completeOnboarding(): Promise<void> {
  await saveOnboardingStep('completedAt', Date.now());
}

export async function isOnboardingComplete(): Promise<boolean> {
  const data = await getOnboardingData();
  return data.completedAt !== null;
}

// Profile Name Functions
export async function getProfileName(): Promise<string> {
  try {
    const name = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_NAME);
    return name || 'Scholar';
  } catch {
    return 'Scholar';
  }
}

export async function saveProfileName(name: string): Promise<void> {
  try {
    if (!name.trim()) return;
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_NAME, name.trim());
  } catch {
    // Silent fail
  }
}

// Get All Stats for Profile
export async function getAllStats(): Promise<{
  slokasRead: number;
  dayStreak: number;
  saved: number;
}> {
  const [slokasRead, streakData, savedCount] = await Promise.all([
    getUniqueSlokasReadCount(),
    getStreakData(),
    getSavedCount(),
  ]);

  return {
    slokasRead,
    dayStreak: streakData.currentStreak,
    saved: savedCount,
  };
}
