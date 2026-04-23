import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocalizedTranslation } from '../../src/utils/sloka';
import { getOrCreateDailySloka } from '../../src/utils/dailyVerse';
import { getOnboardingData, isOnboardingComplete, type OnboardingData, getStreakData, getProfileName, getLastReadSloka } from '../../src/utils/stats';
import { type StreakData } from '../../src/types';
import { t } from '../../src/utils/i18n';
import { useLanguage } from '../../src/context/LanguageContext';
import { syncWidgetData } from '../../src/utils/widgets';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

// Pre-define highly aesthetic Krishna images for random display.
const KRISHNA_IMAGES = [
  require('../../assets/images/home/krishna_1.webp'),
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
  // Newly generated cute images
  require('../../assets/images/home/cute_home_1.png'),
  require('../../assets/images/home/cute_home_2.png'),
  require('../../assets/images/home/cute_home_3.png'),
  require('../../assets/images/home/cute_home_4.png'),
  require('../../assets/images/home/cute_home_5.png'),
  require('../../assets/images/home/cute_home_6.png'),
  require('../../assets/images/home/cute_home_7.png'),
  require('../../assets/images/home/cute_home_8.png'),
  require('../../assets/images/home/cute_home_9.png'),
  require('../../assets/images/home/cute_home_10.png'),
  // Consolidated vibes
  require('../../assets/images/home/home_teach_1.png'),
  require('../../assets/images/home/home_bhakti_1.png'),
  require('../../assets/images/home/home_sunrise_1.png'),
  require('../../assets/images/home/home_dharma_1.png'),
];

type OnboardingGate = 'unknown' | 'needs_intro' | 'ready';

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [onboardingGate, setOnboardingGate] = useState<OnboardingGate>('unknown');
  const [dailySloka, setDailySloka] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [randomKrishnaImage, setRandomKrishnaImage] = useState<any>(KRISHNA_IMAGES[0]);
  const [profileName, setProfileName] = useState('Scholar');
  const [lastRead, setLastRead] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [todaySloka, data, fetchedStreakData, pName, last] = await Promise.all([
        getOrCreateDailySloka(),
        getOnboardingData(),
        getStreakData(),
        getProfileName(),
        getLastReadSloka(),
      ]);
      setDailySloka(todaySloka);
      setOnboardingData(data);
      setStreakData(fetchedStreakData);
      setProfileName(pName);
      setLastRead(last);

      // Sync data to widgets for production product finish
      if (todaySloka) {
        syncWidgetData({
          chapter: todaySloka.chapter,
          verse: todaySloka.verse,
          sanskrit: todaySloka.sanskrit,
          english: getLocalizedTranslation(
            todaySloka.chapter,
            todaySloka.verse,
            todaySloka.translation_english,
            language
          ),
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsChecking(false);
    }
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const complete = await isOnboardingComplete();
        if (cancelled) return;
        if (!complete) {
          setOnboardingGate('needs_intro');
          setIsChecking(false);
          return;
        }
        setOnboardingGate('ready');
        await loadData();
      } catch (e) {
        console.error('[Home] onboarding gate failed', e);
        if (!cancelled) {
          setOnboardingGate('ready');
          await loadData();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      // Pick a new random image every time the screen becomes active
      const randomIndex = Math.floor(Math.random() * KRISHNA_IMAGES.length);
      setRandomKrishnaImage(KRISHNA_IMAGES[randomIndex]);
      if (onboardingGate === 'ready') {
        loadData();
      }
    }, [loadData, onboardingGate])
  );

  if (onboardingGate === 'needs_intro') {
    return <Redirect href="/onboarding/intro" />;
  }

  if (isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Strip */}
        <View style={s.header}>
          <View>
            <Text style={[s.headerSubtitle, { color: colors.primary }]}>
              {t('todaysJourney', language)}
            </Text>
            <Text style={[s.headerTitle, { color: colors.text }]}>
              {t('innerPeace', language)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={[s.profileHeaderBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
          >
            <View style={[s.avatarMin, { backgroundColor: colors.primary }]}>
              <Text style={[s.avatarMinText, { color: colors.background }]}>{profileName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[s.profileNameText, { color: colors.text }]}>{profileName}</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Hero Image */}
        <View style={s.heroContainer}>
          <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(212, 164, 76, 0.2)' : 'rgba(181, 135, 42, 0.2)' }]}>
            <Image
              source={randomKrishnaImage}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View style={[s.heroOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            
          </View>
        </View>



        {/* Action List */}
        <View style={s.actionSection}>
          <Text style={[s.sectionTitle, { color: colors.primary }]}>
            {t('quickActions', language)}
          </Text>
          
          <View style={{ flexDirection: 'column', gap: 12 }}>
            {/* Continue Reading Action */}
            {lastRead && (
              <TouchableOpacity
                onPress={() => router.push(`/sloka/${lastRead.chapter}/${lastRead.verse}` as any)}
                style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.actionIconBox, { backgroundColor: `${colors.primary}25` }]}>
                  <Ionicons name="play" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.actionTitle, { color: colors.text }]}>{t('homeContinueReading', language)}</Text>
                  <Text style={[s.actionSub, { color: colors.textSecondary }]}>
                    {t('homeResumeReading', language, { chapter: lastRead.chapter, verse: lastRead.verse })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? "#333" : "#CCC"} />
              </TouchableOpacity>
            )}

            {/* Library Action */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library' as any)}
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[s.actionIconBox, { backgroundColor: `${colors.primary}25` }]}>
                <Ionicons name="book" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.actionTitle, { color: colors.text }]}>
                  {t('library', language)}
                </Text>
                <Text style={[s.actionSub, { color: colors.textSecondary }]}>
                  {t('exploreChapters', language)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#333" : "#CCC"} />
            </TouchableOpacity>

            {/* Listen Action */}
            <TouchableOpacity
              onPress={() => {
                if (dailySloka) {
                  router.push(`/sloka/${dailySloka.chapter}/${dailySloka.verse}?isDaily=true` as any);
                }
              }}
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[s.actionIconBox, { backgroundColor: 'rgba(74, 124, 89, 0.15)' }]}>
                <Ionicons name="headset" size={22} color="#4ADE80" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.actionTitle, { color: colors.text }]}>
                  {t('listen', language)}
                </Text>
                <Text style={[s.actionSub, { color: colors.textSecondary }]}>
                  {t('audioSlokas', language)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#333" : "#CCC"} />
            </TouchableOpacity>

            {/* Scholar AI Action */}
            <TouchableOpacity
              onPress={() => router.push('/scholar' as any)}
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[s.actionIconBox, { backgroundColor: 'rgba(232, 117, 26, 0.15)' }]}>
                <Ionicons name="chatbubbles" size={22} color="#E8751A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.actionTitle, { color: colors.text }]}>
                  {t('askScholar', language)}
                </Text>
                <Text style={[s.actionSub, { color: colors.textSecondary }]}>
                  {t('homeAskScholarSub', language)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? "#333" : "#CCC"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meditation Mode Banner (New Feature Highlight) */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/meditation' as any)}
            style={[s.dharmaBanner, { borderColor: 'rgba(74, 124, 89, 0.3)', backgroundColor: isDark ? '#0A120D' : '#F0F9F4' }]}
          >
            <View style={[s.dharmaDecor, { backgroundColor: 'rgba(74, 124, 89, 0.05)' }]} />
            
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="headset" size={18} color="#4ADE80" />
                <Text style={[s.dharmaLabel, { color: '#4ADE80' }]}>
                  {t('homeHandsFree', language)}
                </Text>
              </View>
              <Text style={[s.dharmaTitle, { color: colors.text }]}>
                {t('homeMeditationBannerTitle', language)}
              </Text>
              <Text style={[s.dharmaSub, { color: colors.textSecondary }]}>
                {t('homeMeditationBannerSub', language)}
              </Text>
            </View>
            <View style={[s.dharmaArrow, { borderColor: 'rgba(74, 124, 89, 0.2)', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Ionicons name="chevron-forward" size={20} color="#4ADE80" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Dharma Mode Banner */}
        <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/dharma' as any)}
            style={[s.dharmaBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[s.dharmaDecor, { backgroundColor: `${colors.primary}10` }]} />
            
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                <Text style={[s.dharmaLabel, { color: colors.primary }]}>
                  {t('dharmaMode', language)}
                </Text>
              </View>
              <Text style={[s.dharmaTitle, { color: colors.text }]}>
                {t('protectYourFocus', language)}
              </Text>
              <Text style={[s.dharmaSub, { color: colors.textSecondary }]}>
                {t('dharmaModeDescription', language)}
              </Text>
            </View>
            <View style={[s.dharmaArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Verse Preview (Redesigned) */}
        {dailySloka && (
          <View style={{ marginTop: 32, paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
              <Ionicons name="sunny" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', marginLeft: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {t('verseOfTheDay', language)}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => router.push(`/sloka/${dailySloka.chapter}/${dailySloka.verse}?isDaily=true` as any)}
              style={[s.dailyCard, { backgroundColor: colors.card, shadowColor: colors.primary }]}
              activeOpacity={0.9}
            >
              {/* Glass/Glow Effect Background */}
              <View style={[s.dailyCardGlow, { backgroundColor: `${colors.primary}25` }]} />
              <View style={[s.dailyCardInner, { borderColor: `${colors.primary}30`, backgroundColor: isDark ? 'rgba(18, 18, 18, 0.6)' : 'rgba(255, 255, 255, 0.8)' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text style={[s.dailyCardRef, { color: colors.textSecondary }]}>
                    {t('chapterVerse', language, { chapter: dailySloka.chapter, verse: dailySloka.verse })}
                  </Text>
                  <View style={[s.dailyCardPlayBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="play" size={12} color={colors.background} />
                  </View>
                </View>

                <Text style={[s.dailyCardText, { color: colors.text }]} numberOfLines={4}>
                  "{getLocalizedTranslation(dailySloka.chapter, dailySloka.verse, dailySloka.translation_english, language)}"
                </Text>

                <View style={s.dailyCardFooter}>
                  <Text style={[s.dailyCardAction, { color: colors.primary }]}>{t('homeReadFullVerse', language)}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4A44C',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  profileHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  avatarMin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4A44C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMinText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  profileNameText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  heroCard: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  actionSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4A44C',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },

  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSub: {
    color: '#777777',
    fontSize: 13,
  },
  dharmaBanner: {
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.15)',
  },
  dharmaDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 164, 76, 0.05)',
  },
  dharmaLabel: {
    color: '#D4A44C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dharmaTitle: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dharmaSub: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  dharmaArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dailyCard: {
    borderRadius: 24,
    backgroundColor: '#121212',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  dailyCardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(212, 164, 76, 0.15)',
    opacity: 0.8,
  },
  dailyCardInner: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
    borderRadius: 24,
    backgroundColor: 'rgba(18, 18, 18, 0.6)', // Glass effect over glow
  },
  dailyCardRef: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A0A0',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dailyCardPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4A44C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCardText: {
    fontSize: 18,
    color: '#F4ECE1',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  dailyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyCardAction: {
    color: '#D4A44C',
    fontSize: 13,
    fontWeight: '700',
  },
});
