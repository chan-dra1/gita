import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { getChapter, getSloka } from '../../src/utils/sloka';
import { getSlokasRead } from '../../src/utils/stats';
import { preDownloadChapterAudio, cancelPreDownload } from '../../src/utils/audio';
import { Config } from '../../src/constants/config';
import type { Chapter } from '../../src/types';
import { useLanguage } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function ChapterDetailScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams();
  const chapterId = parseInt(chapter as string, 10);
  
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [readVerses, setReadVerses] = useState<Set<number>>(new Set());
  const { language: lang } = useLanguage();
  const [audioProgress, setAudioProgress] = useState<{ done: number; total: number } | null>(null);
  const preDownloadStarted = useRef(false);

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

  useEffect(() => {
    if (!chapterData || preDownloadStarted.current) return;
    preDownloadStarted.current = true;

    const apiKey = Config.TTS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_TTS_API_KEY') return;

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
      setAudioProgress(prev => prev ? { ...prev, done: prev.total } : null);
    }).catch(() => {});

    return () => {
      cancelPreDownload(chapterId);
    };
  }, [chapterData, chapterId]);

  if (!chapterData) {
    return (
      <View style={s.root}>
        <ActivityIndicator size="large" color="#D4A44C" />
      </View>
    );
  }

  const percentComplete = Math.round((readVerses.size / chapterData.verses_count) * 100);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {audioProgress && (
             <View style={[s.audioBadge, audioProgress.done === audioProgress.total && s.audioBadgeDone]}>
                <Ionicons 
                  name={audioProgress.done === audioProgress.total ? "checkmark-circle" : "musical-note"} 
                  size={12} 
                  color={audioProgress.done === audioProgress.total ? "#4ADE80" : "#D4A44C"} 
                />
                <Text style={[s.audioBadgeText, audioProgress.done === audioProgress.total && { color: '#4ADE80' }]}>
                  {audioProgress.done === audioProgress.total ? 'Audio Ready' : `Syncing ${audioProgress.done}/${audioProgress.total}`}
                </Text>
             </View>
          )}
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(800).easing(Easing.out(Easing.exp))} style={s.infoWrapper}>
            <View style={s.infoCard}>
              <Text style={s.chapterBadge}>
                {lang === 'hi' ? `अध्याय ${chapterId}` : `CHAPTER ${chapterId}`}
              </Text>
              <Text style={s.chapterSanskrit}>{chapterData.name_sanskrit}</Text>
              <Text style={s.chapterEnglish}>{chapterData.name}</Text>
              
              <View style={s.progressRow}>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${percentComplete}%` }]} />
                </View>
                <View style={s.progressLabels}>
                  <Text style={s.progressText}>{readVerses.size} / {chapterData.verses_count} Verses</Text>
                  <Text style={s.progressPercent}>{percentComplete}%</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={s.grid}>
            {chapterData.verses.map((verse, index) => {
              const isRead = readVerses.has(verse.verse);
              const highestReadVerse = readVerses.size > 0 ? Math.max(...Array.from(readVerses)) : 0;
              const isUnlocked = verse.verse <= highestReadVerse + 3;
              
              return (
                <Animated.View
                  key={verse.verse}
                  entering={FadeInDown.delay(100 + index * 10).duration(400)}
                  style={s.gridItemContainer}
                >
                  <TouchableOpacity
                    activeOpacity={isUnlocked ? 0.7 : 1}
                    onPress={() => isUnlocked && router.push(`/sloka/${chapterId}/${verse.verse}` as any)}
                    style={s.gridItem}
                  >
                    <View style={[
                      s.gridItemContent,
                      isRead ? s.itemRead : (isUnlocked ? s.itemUnread : s.itemLocked)
                    ]}>
                      {isUnlocked ? (
                        <Text style={[s.verseNum, isRead ? s.verseNumRead : s.verseNumUnread]}>
                          {verse.verse}
                        </Text>
                      ) : (
                        <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.2)" />
                      )}
                      {isRead && (
                        <View style={s.checkIcon}>
                          <Ionicons name="checkmark" size={10} color="#0D0D0D" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: { paddingHorizontal: 24 },
  infoWrapper: { marginBottom: 32, marginTop: 8 },
  infoCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.15)',
  },
  chapterBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4A44C',
    letterSpacing: 2,
    marginBottom: 8,
  },
  chapterSanskrit: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  chapterEnglish: {
    fontSize: 15,
    color: '#777',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressRow: { width: '100%' },
  progressBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#D4A44C' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12, color: '#555', fontWeight: '600' },
  progressPercent: { fontSize: 12, color: '#D4A44C', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItemContainer: { width: (width - 48 - (3 * 12)) / 4, aspectRatio: 1 },
  gridItem: { flex: 1 },
  gridItemContent: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  itemRead: { backgroundColor: 'rgba(212, 164, 76, 0.25)', borderColor: 'rgba(212, 164, 76, 0.4)' },
  itemUnread: { backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.08)' },
  itemLocked: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.03)', borderStyle: 'dashed' },
  verseNum: { fontSize: 18, fontWeight: '800' },
  verseNumRead: { color: '#FFFFFF' },
  verseNumUnread: { color: '#777' },
  checkIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4A44C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  audioBadgeDone: { borderColor: 'rgba(74, 222, 128, 0.2)' },
  audioBadgeText: { fontSize: 10, fontWeight: '700', color: '#D4A44C', textTransform: 'uppercase' },
});
