import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, Easing, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { getChapter, getSloka } from '../../src/utils/sloka';
import { getSlokasRead } from '../../src/utils/stats';
import { preDownloadChapterAudio, cancelPreDownload } from '../../src/utils/audio';
import { Config } from '../../src/constants/config';
import type { Chapter } from '../../src/types';
import { useLanguage } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');

// Calculate grid item size (4 columns with padding)
const itemSize = (width - 48 - (3 * 16)) / 4; 

export default function ChapterDetailScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams();
  const chapterId = parseInt(chapter as string, 10);
  
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [readVerses, setReadVerses] = useState<Set<number>>(new Set());
  const { language: lang } = useLanguage();
  const [audioProgress, setAudioProgress] = useState<{ done: number; total: number } | null>(null);
  const preDownloadStarted = useRef(false);

  // Load chapter data and read progress
  const loadData = useCallback(async () => {
    try {
      const chData = getChapter(chapterId);
      if (chData) {
        setChapterData(chData);
      }
      
      const allRead = await getSlokasRead();
      const readSet = new Set<number>();
      for (const sloka of allRead) {
        if (sloka.chapter === chapterId) {
          readSet.add(sloka.verse);
        }
      }
      setReadVerses(readSet);
      
    } catch (e) {
      console.error('Failed to load chapter details', e);
    }
  }, [chapterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background audio pre-download when chapter opens
  useEffect(() => {
    if (!chapterData || preDownloadStarted.current) return;
    preDownloadStarted.current = true;

    const apiKey = Config.TTS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_TTS_API_KEY') return; // Skip if no key

    // Build verse text array — clean translation only
    const verseTexts = chapterData.verses.map((v) => {
      const sloka = getSloka(chapterId, v.verse);
      const clean = (sloka?.translation_english || '')
        .replace(/;/g, ',')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return { verse: v.verse, text: clean };
    }).filter(v => v.text.length > 0);

    setAudioProgress({ done: 0, total: verseTexts.length });

    preDownloadChapterAudio(
      chapterId,
      verseTexts,
      'english',
      apiKey,
      (done, total) => setAudioProgress({ done, total })
    ).then(() => {
      // Completed
      setAudioProgress(prev => prev ? { ...prev, done: prev.total } : null);
    }).catch(() => {/* silent */});

    return () => {
      cancelPreDownload(chapterId);
    };
  }, [chapterData, chapterId]);

  if (!chapterData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#E8751A' }}>Loading Chapter...</Text>
      </View>
    );
  }

  const percentComplete = Math.round((readVerses.size / chapterData.verses_count) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A1128' }}>
      <StatusBar barStyle="light-content" />
      
      <OnboardingBackground 
        image={require('../../assets/images/onboarding_2.png')}
        overlayOpacity={0.6}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header section with back button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* Audio pre-download progress badge */}
            {audioProgress && audioProgress.done < audioProgress.total && (
              <BlurView intensity={20} style={styles.audioBadge}>
                <Ionicons name="musical-note" size={12} color="#F48B29" />
                <Text style={styles.audioBadgeText}>
                  Audio {audioProgress.done}/{audioProgress.total}
                </Text>
              </BlurView>
            )}
            {audioProgress && audioProgress.done === audioProgress.total && audioProgress.total > 0 && (
              <BlurView intensity={20} style={[styles.audioBadge, styles.audioBadgeDone]}>
                <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
                <Text style={[styles.audioBadgeText, { color: '#4ADE80' }]}>Audio Ready</Text>
              </BlurView>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Animated Chapter Info - Glassmorphic Card */}
              <Animated.View 
                entering={FadeInDown.duration(800).easing(Easing.out(Easing.exp))}
                style={styles.infoWrapper}
              >
                <BlurView intensity={30} style={styles.infoContainer}>
                  <Text style={styles.chapterNumberBadge}>
                    {lang === 'hi' ? `अध्याय ${chapterId}` : `Chapter ${chapterId}`}
                  </Text>
                  <Text style={styles.chapterSanskritName}>
                    {chapterData.name_sanskrit}
                  </Text>
                  <Text style={styles.chapterEnglishName}>
                    {chapterData.name}
                  </Text>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <Animated.View 
                        style={[styles.progressBarFill, { width: `${percentComplete}%` }]} 
                      />
                    </View>
                    <View style={styles.progressStats}>
                      <Text style={styles.progressText}>
                        {readVerses.size} / {chapterData.verses_count} {lang === 'hi' ? 'श्लोक' : 'Verses'}
                      </Text>
                      <Text style={styles.progressPercent}>{percentComplete}%</Text>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Animated Grid Container */}
              <View style={styles.gridContainer}>
                {chapterData.verses.map((verse, index) => {
                  const isRead = readVerses.has(verse.verse);
                  return (
                    <Animated.View
                      key={verse.verse}
                      entering={FadeInDown.delay(100 + index * 10).duration(400)}
                      style={styles.gridItemWrapper}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push(`/sloka/${chapterId}/${verse.verse}` as any)}
                        style={styles.gridItemPressable}
                      >
                        <BlurView 
                          intensity={isRead ? 40 : 20} 
                          style={[
                            styles.gridItem,
                            isRead ? styles.gridItemRead : styles.gridItemUnread
                          ]}
                        >
                          <Text style={[
                              styles.verseNumberText, 
                              isRead ? styles.verseNumberTextRead : styles.verseNumberTextUnread
                            ]}>
                            {verse.verse}
                          </Text>
                          {isRead && (
                            <View style={styles.checkIcon}>
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </BlurView>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
              
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </OnboardingBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  infoWrapper: {
    marginBottom: 40,
    marginTop: 10,
  },
  infoContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  chapterNumberBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F48B29',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  chapterSanskritName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  chapterEnglishName: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F48B29',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    color: '#F48B29',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  gridItemWrapper: {
    width: (width - 48 - (3 * 12)) / 4,
    height: (width - 48 - (3 * 12)) / 4,
  },
  gridItemPressable: {
    flex: 1,
  },
  gridItem: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridItemRead: {
    backgroundColor: 'rgba(244, 139, 41, 0.4)',
    borderColor: 'rgba(244, 139, 41, 0.5)',
  },
  gridItemUnread: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  verseNumberText: {
    fontSize: 22,
    fontWeight: '800',
  },
  verseNumberTextRead: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
  },
  verseNumberTextUnread: {
    color: 'rgba(255,255,255,0.8)',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F48B29',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowRadius: 2,
    shadowOpacity: 0.2,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  audioBadgeDone: {
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  audioBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F48B29',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
