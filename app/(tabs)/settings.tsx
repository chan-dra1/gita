import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllStats, getSlokasRead, getSavedSlokas, getOnboardingData, type OnboardingData, type SlokaReadEntry } from '../../src/utils/stats';
import { Language, getLanguage, saveLanguage, t } from '../../src/utils/i18n';

interface StatsData {
  slokasRead: number;
  dayStreak: number;
  saved: number;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [recentSlokas, setRecentSlokas] = useState<SlokaReadEntry[]>([]);
  const [savedSlokas, setSavedSlokas] = useState<SlokaReadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');

  const loadStats = useCallback(async () => {
    try {
      const [allStats, onboarding, slokasRead, saved, lang] = await Promise.all([
        getAllStats(),
        getOnboardingData(),
        getSlokasRead(),
        getSavedSlokas(),
        getLanguage(),
      ]);
      setStats(allStats);
      setOnboardingData(onboarding);
      setLanguage(lang);
      // Get 3 most recent slokas
      setRecentSlokas(slokasRead.slice(-3).reverse());
      setSavedSlokas(saved.slice(-3).reverse());
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const STATS_DISPLAY = stats ? [
    { label: t('slokasRead', language), value: stats.slokasRead.toString(), icon: 'book' as const },
    { label: t('dayStreak', language), value: stats.dayStreak.toString(), icon: 'flame' as const },
    { label: t('saved', language), value: stats.saved.toString(), icon: 'bookmark' as const },
  ] : [
    { label: t('slokasRead', language), value: '0', icon: 'book' as const },
    { label: t('dayStreak', language), value: '0', icon: 'flame' as const },
    { label: t('saved', language), value: '0', icon: 'bookmark' as const },
  ];

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    await saveLanguage(newLang);
  };

  const MENU_ITEMS = [
    { label: 'Saved Slokas', icon: 'bookmark-outline' as const, desc: 'View your bookmarked verses', onPress: () => router.push('/saved') },
    { label: 'Premium Membership', icon: 'star-outline' as const, desc: 'Unlock all features', onPress: () => router.push('/onboarding/paywall') },
    { label: 'Backup & Restore Sync', icon: 'sync-outline' as const, desc: 'Transfer progress to a new device', onPress: () => router.push('/backup') },
    { label: t('viewAllSlokas', language), icon: 'library-outline' as const, desc: 'Browse the complete collection', onPress: () => router.push('/(tabs)/library') },
    { 
      label: t('language', language), 
      icon: 'language-outline' as const, 
      desc: `Current: ${t('currentLanguage', language)}`, 
      onPress: handleLanguageToggle 
    },
  ];

  const getExperienceLevelLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      beginner: 'Seeker',
      intermediate: 'Practitioner',
      advanced: 'Devotee',
      scholar: 'Scholar',
    };
    return labels[level || ''] || 'Seeker';
  };

  const getGuidanceStyleLabel = (style: string | null) => {
    const labels: Record<string, string> = {
      practical: 'Practical Path',
      philosophical: 'Philosophical Path',
      devotional: 'Devotional Path',
      holistic: 'Holistic Path',
    };
    return labels[style || ''] || 'Spiritual Path';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E8751A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Card */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: 24,
            paddingBottom: 28,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: '#FFF3E8',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              borderWidth: 2,
              borderColor: '#F0E0CC',
            }}
          >
            <Ionicons name="person" size={32} color="#E8751A" />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#1A1A1A',
            }}
          >
            {getExperienceLevelLabel(onboardingData?.experienceLevel || null)}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#B0A090',
              marginTop: 4,
            }}
          >
            {getGuidanceStyleLabel(onboardingData?.guidanceStyle || null)}
          </Text>
        </View>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 24,
            gap: 12,
            marginBottom: 28,
          }}
        >
          {STATS_DISPLAY.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: '#FFF',
                borderRadius: 18,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#F0E0CC',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons name={stat.icon} size={22} color="#E8751A" />
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginTop: 8,
                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: '#999',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Activity Section */}
        {(recentSlokas.length > 0 || savedSlokas.length > 0) && (
          <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 }}>
              {t('recentActivity', language)}
            </Text>
            {recentSlokas.slice(0, 2).map((sloka, index) => (
              <TouchableOpacity
                key={`read-${index}`}
                onPress={() => router.push(`/sloka/${sloka.chapter}/${sloka.verse}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#F0E0CC',
                }}
              >
                <Ionicons name="book-outline" size={18} color="#E8751A" style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, color: '#1A1A1A' }}>
                  Chapter {sloka.chapter}, Verse {sloka.verse}
                </Text>
                <Text style={{ fontSize: 11, color: '#999' }}>
                  {new Date(sloka.timestamp).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
            {savedSlokas.slice(0, 1).map((sloka, index) => (
              <TouchableOpacity
                key={`saved-${index}`}
                onPress={() => router.push(`/sloka/${sloka.chapter}/${sloka.verse}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#F0E0CC',
                }}
              >
                <Ionicons name="bookmark" size={18} color="#E8751A" style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, color: '#1A1A1A' }}>
                  Saved: Chapter {sloka.chapter}, Verse {sloka.verse}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menu Items */}
        <View style={{ paddingHorizontal: 24 }}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#FFF',
                borderRadius: 18,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#F0E0CC',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name={item.icon} size={20} color="#E8751A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  {item.desc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D0C0B0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={{ fontSize: 13, color: '#C0B0A0' }}>
            App Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
