// src/utils/i18n.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@gita_language';

export type Language = 'en' | 'hi';

export const saveLanguage = async (language: Language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export const getLanguage = async (): Promise<Language> => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return (lang as Language) || 'en';
  } catch (error) {
    return 'en';
  }
};

const translations = {
  en: {
    home: 'Home',
    library: 'Library',
    daily: 'Daily',
    settings: 'Settings',
    dailyDharma: 'Daily Dharma',
    continueReading: 'Continue Reading',
    verseOfTheDay: 'Verse of the Day',
    quickActions: 'Quick Actions',
    readingHistory: 'Reading History',
    viewAllSlokas: 'View All Slokas',
    language: 'Language',
    currentLanguage: 'English',
    experienceLevel: 'Experience Level',
    spiritualPath: 'Spiritual Path',
    slokasRead: 'Slokas Read',
    dayStreak: 'Day Streak',
    saved: 'Saved',
    recentActivity: 'Recent Activity',
    todaysJourney: "Today's Journey",
    innerPeace: "Inner Peace",
    exploreChapters: "Explore chapters",
    listen: "Listen",
    audioSlokas: "Audio slokas",
    dharmaMode: "Dharma Mode",
    protectYourFocus: "Protect Your Focus",
    dharmaModeDescription: "Block distractions and stay committed to your daily spiritual journey.",
    chapterVerse: "Chapter {chapter}, Verse {verse}",
  },
  hi: {
    home: 'होम',
    library: 'संग्रह',
    daily: 'दैनिक',
    settings: 'सेटिंग्स',
    dailyDharma: 'दैनिक धर्म',
    continueReading: 'पढ़ना जारी रखें',
    verseOfTheDay: 'आज का श्लोक',
    quickActions: 'त्वरित क्रियाएं',
    readingHistory: 'पढ़ने का इतिहास',
    viewAllSlokas: 'सभी श्लोक देखें',
    language: 'भाषा',
    currentLanguage: 'हिन्दी',
    experienceLevel: 'अनुभव स्तर',
    spiritualPath: 'आध्यात्मिक मार्ग',
    slokasRead: 'पढ़े गए श्लोक',
    dayStreak: 'निरंतरता (दिन)',
    saved: 'सहेजे गए',
    recentActivity: 'हाल की गतिविधि',
    todaysJourney: "आज की यात्रा",
    innerPeace: "आंतरिक शांति",
    exploreChapters: "अध्याय खोजें",
    listen: "सुनें",
    audioSlokas: "ऑडियो श्लोक",
    dharmaMode: "धर्म मोड",
    protectYourFocus: "अपना ध्यान केंद्रित रखें",
    dharmaModeDescription: "ध्यान भंग करने वाली चीज़ों को रोकें और अपनी आध्यात्मिक यात्रा के प्रति प्रतिबद्ध रहें।",
    chapterVerse: "अध्याय {chapter}, श्लोक {verse}",
  }
};

export const t = (key: keyof typeof translations.en, lang: Language = 'en', params?: Record<string, string | number>): string => {
  let str = translations[lang][key] || translations.en[key];
  if (params) {
    Object.keys(params).forEach(pk => {
      str = str.replace(`{${pk}}`, String(params[pk]));
    });
  }
  return str;
};
