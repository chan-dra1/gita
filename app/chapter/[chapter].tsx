import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, Easing } from 'react-native-reanimated';
import { getChapter, getSloka } from '../../src/utils/sloka';
import { getSlokasRead } from '../../src/utils/stats';
import { preDownloadChapterAudio, cancelPreDownload } from '../../src/utils/audio';
import { Config } from '../../src/constants/config';
import type { Chapter } from '../../src/types';
import { t, getLanguage, Language } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

// Calculate grid item size (4 columns with padding)
const itemSize = (width - 48 - (3 * 16)) / 4; 

export default function ChapterDetailScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams();
  const chapterId = parseInt(chapter as string, 10);
  
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [readVerses, setReadVerses] = useState<Set<number>>(new Set());
  const [lang, setLang] = useState<Language>('en');
  const [audioProgress, setAudioProgress] = useState<{ done: number; total: number } | null>(null);
  const preDownloadStarted = useRef(false);

  // Load chapter data and read progress
  const loadData = useCallback(async () => {
    try {
      const currentLang = await getLanguage();
      setLang(currentLang);
      
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header section with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Audio pre-download progress badge */}
        {audioProgress && audioProgress.done < audioProgress.total && (
          <View style={styles.audioBadge}>
            <Ionicons name="musical-note" size={12} color="#E8751A" />
            <Text style={styles.audioBadgeText}>
              Audio {audioProgress.done}/{audioProgress.total}
            </Text>
          </View>
        )}
        {audioProgress && audioProgress.done === audioProgress.total && audioProgress.total > 0 && (
          <View style={[styles.audioBadge, styles.audioBadgeDone]}>
            <Ionicons name="checkmark-circle" size={12} color="#2D7A3A" />
            <Text style={[styles.audioBadgeText, { color: '#2D7A3A' }]}>Audio Ready</Text>
          </View>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Chapter Info */}
        <Animated.View 
          entering={FadeInDown.duration(600).easing(Easing.out(Easing.exp))}
          style={styles.infoContainer}
        >
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
            <Text style={styles.progressText}>
              {readVerses.size} / {chapterData.verses_count} {lang === 'hi' ? 'श्लोक' : 'Verses'} ({percentComplete}%)
            </Text>
          </View>
        </Animated.View>

        {/* Animated Grid Container */}
        <View style={styles.gridContainer}>
          {chapterData.verses.map((verse, index) => {
            const isRead = readVerses.has(verse.verse);
            // Staggered entrance animation for grid items
            return (
              <Animated.View
                key={verse.verse}
                entering={FadeIn.delay(index * 20).duration(400)}
                style={styles.gridItemWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/sloka/${chapterId}/${verse.verse}` as any)}
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
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        
        {/* Bottom spacer for scrollability */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#E8751A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  chapterNumberBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8751A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  chapterSanskritName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  chapterEnglishName: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#FFF0E5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8751A',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  gridItemWrapper: {
    width: itemSize,
    height: itemSize,
  },
  gridItem: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gridItemRead: {
    backgroundColor: '#E8751A',
  },
  gridItemUnread: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E5D8',
  },
  verseNumberText: {
    fontSize: 20,
    fontWeight: '700',
  },
  verseNumberTextRead: {
    color: '#FFF',
  },
  verseNumberTextUnread: {
    color: '#4A4A4A',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  audioBadgeDone: {
    backgroundColor: '#EDF7EE',
  },
  audioBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E8751A',
  },
});
