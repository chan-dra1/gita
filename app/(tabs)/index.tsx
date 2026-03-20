import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRandomSloka } from '../../src/utils/sloka';
import { getOnboardingData, isOnboardingComplete, type OnboardingData } from '../../src/utils/stats';
import { Language, getLanguage, t } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

// Pre-define highly aesthetic Krishna images for random display.
const KRISHNA_IMAGES = [
  require('../../assets/images/home/krishna_1.webp'),
  require('../../assets/images/home/krishna_2.webp'),
  require('../../assets/images/home/krishna_3.webp'),
  require('../../assets/images/home/krishna_4.webp'),
  require('../../assets/images/home/krishna_5.webp'),
  require('../../assets/images/home/krishna_6.webp'),
  require('../../assets/images/home/krishna_7.webp'),
  require('../../assets/images/home/krishna_8.webp'),
  require('../../assets/images/home/krishna_9.webp'),
  require('../../assets/images/home/krishna_10.webp'),
  require('../../assets/images/home/krishna_11.webp'),
  require('../../assets/images/home/krishna_12.webp'),
  require('../../assets/images/home/krishna_13.webp'),
  require('../../assets/images/home/krishna_14.webp'),
  require('../../assets/images/home/krishna_15.webp'),
  require('../../assets/images/home/krishna_16.webp'),
  require('../../assets/images/home/krishna_17.webp'),
  require('../../assets/images/home/krishna_18.webp'),
  require('../../assets/images/home/krishna_19.webp'),
  require('../../assets/images/home/krishna_20.webp'),
];

export default function HomeScreen() {
  const router = useRouter();
  const [dailySloka, setDailySloka] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [randomKrishnaImage, setRandomKrishnaImage] = useState<any>(KRISHNA_IMAGES[0]);
  const [language, setLanguage] = useState<Language>('en');

  const loadData = async () => {
    try {
      const [todaySloka, data, lang] = await Promise.all([
        getRandomSloka(),
        getOnboardingData(),
        getLanguage(),
      ]);
      setDailySloka(todaySloka);
      setOnboardingData(data);
      setLanguage(lang);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    async function checkOnboarding() {
      const complete = await isOnboardingComplete();
      if (!complete) {
        router.replace('/onboarding/intro' as any);
      } else {
        loadData();
      }
    }
    checkOnboarding();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Pick a new random image every time the screen becomes active
      const randomIndex = Math.floor(Math.random() * KRISHNA_IMAGES.length);
      setRandomKrishnaImage(KRISHNA_IMAGES[randomIndex]);
      loadData(); // Refresh data when screen is focused
    }, [])
  );

  if (isChecking) {
    return <View style={{ flex: 1, backgroundColor: '#FAF8F5' }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Strip */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8751A', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('todaysJourney', language)}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginTop: 2 }}>
              {t('innerPeace', language)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Premium Hero Image */}
        <View style={{ alignItems: 'center', marginTop: 8, paddingHorizontal: 20 }}>
          <View
            style={{
              width: '100%',
              aspectRatio: 1.1,
              borderRadius: 32,
              overflow: 'hidden',
              backgroundColor: '#F5EDE0',
              shadowColor: '#E8751A',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 30,
              elevation: 10,
            }}
          >
            <Image
              source={randomKrishnaImage}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {/* Clean image without overlay */}
          </View>
        </View>

        {/* Action Grid */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16, paddingHorizontal: 4 }}>
            {t('quickActions', language)}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Library Action */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library' as any)}
              style={{
                flex: 1,
                backgroundColor: '#FFF',
                paddingVertical: 20,
                paddingHorizontal: 16,
                borderRadius: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.04,
                shadowRadius: 16,
                elevation: 4,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(232, 117, 26, 0.05)',
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="book" size={24} color="#E8751A" />
              </View>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '600' }}>
                {t('library', language)}
              </Text>
              <Text style={{ color: '#9A9A9A', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                {t('exploreChapters', language)}
              </Text>
            </TouchableOpacity>

            {/* Listen Action */}
            <TouchableOpacity
              onPress={() => {
                if (dailySloka) {
                  router.push(`/sloka/${dailySloka.chapter}/${dailySloka.verse}` as any);
                }
              }}
              style={{
                flex: 1,
                backgroundColor: '#FFF',
                paddingVertical: 20,
                paddingHorizontal: 16,
                borderRadius: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.04,
                shadowRadius: 16,
                elevation: 4,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(232, 117, 26, 0.05)',
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F5ED', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="headset" size={24} color="#4A7C59" />
              </View>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '600' }}>
                {t('listen', language)}
              </Text>
              <Text style={{ color: '#9A9A9A', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                {t('audioSlokas', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dharma Mode Banner (New Feature Highlight) */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/dharma' as any)}
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 24,
              padding: 24,
              flexDirection: 'row',
              alignItems: 'center',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Subtle background decoration */}
            <View style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="shield-checkmark" size={18} color="#F5C518" />
                <Text style={{ color: '#F5C518', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('dharmaMode', language)}
                </Text>
              </View>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                {t('protectYourFocus', language)}
              </Text>
              <Text style={{ color: '#A0A0A0', fontSize: 13, lineHeight: 18 }}>
                {t('dharmaModeDescription', language)}
              </Text>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Verse Preview */}
        {dailySloka && (
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <View style={styles.slokaCardHeader}>
              <View style={styles.slokaBadge}>
                <Ionicons name="sparkles" size={14} color="#FFF" />
                <Text style={styles.slokaBadgeText}>{t('verseOfTheDay', language)}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push(`/sloka/${dailySloka.chapter}/${dailySloka.verse}` as any)
              }
              style={{
                borderRadius: 24,
                backgroundColor: '#FFF',
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.03,
                shadowRadius: 16,
                elevation: 3,
                borderLeftWidth: 4,
                borderLeftColor: '#E8751A',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: '#333',
                  lineHeight: 26,
                  fontStyle: 'italic',
                }}
              >
                "{dailySloka.translation_english}"
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 13, color: '#888', fontWeight: '500' }}>
                  {t('chapterVerse', language, { chapter: dailySloka.chapter, verse: dailySloka.verse })}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#E8751A" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slokaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  slokaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8751A',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  slokaBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
