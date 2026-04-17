import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../../src/context/ThemeContext';
import { getChapterTitle } from '../../src/utils/chapterDisplay';

const { width } = Dimensions.get('window');

export default function ChapterDetailScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams();
  const chapterId = parseInt(chapter as string, 10);
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
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
          backgroundColor: colors.card,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },
        scrollContent: { paddingHorizontal: 24 },
        infoWrapper: { marginBottom: 32, marginTop: 8 },
        infoCard: {
          alignItems: 'center',
          padding: 24,
          borderRadius: 28,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chapterBadge: {
          fontSize: 11,
          fontWeight: '800',
          color: colors.primary,
          letterSpacing: 2,
          marginBottom: 8,
        },
        chapterSanskrit: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 4,
          textAlign: 'center',
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        chapterEnglish: {
          fontSize: 15,
          color: colors.textSecondary,
          fontWeight: '600',
          marginBottom: 20,
          textAlign: 'center',
        },
        progressRow: { width: '100%' },
        progressBg: {
          width: '100%',
          height: 6,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(44,24,16,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 10,
        },
        progressFill: { height: '100%', backgroundColor: colors.primary },
        progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
        progressText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
        progressPercent: { fontSize: 12, color: colors.primary, fontWeight: '700' },
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        gridItemContainer: { width: (width - 48 - 3 * 12) / 4, aspectRatio: 1 },
        gridItem: { flex: 1 },
        gridItemContent: {
          flex: 1,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
        },
        itemRead: {
          backgroundColor: isDark ? 'rgba(212, 164, 76, 0.25)' : 'rgba(181, 135, 42, 0.18)',
          borderColor: isDark ? 'rgba(212, 164, 76, 0.4)' : 'rgba(181, 135, 42, 0.35)',
        },
        itemUnread: { backgroundColor: colors.card, borderColor: colors.border },
        itemLocked: {
          backgroundColor: 'transparent',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(44,24,16,0.12)',
          borderStyle: 'dashed',
        },
        verseNum: { fontSize: 18, fontWeight: '800' },
        verseNumRead: { color: colors.text },
        verseNumUnread: { color: colors.textSecondary },
        checkIcon: {
          position: 'absolute',
          bottom: 6,
          right: 6,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, isDark]
  );

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

  const [downloading, setDownloading] = useState(false);

  const startDownload = async () => {
    if (!chapterData || downloading) return;
    setDownloading(true);
    
    // Default to Sanskrit and user's current language (or English)
    const languages: AudioLanguage[] = ['sanskrit', 'english'];
    if (lang === 'hi') languages.push('hindi');

    const verseNumbers = chapterData.verses.map(v => v.verse);
    setAudioProgress({ done: 0, total: verseNumbers.length * languages.length });

    try {
      await preDownloadChapterAudio(
        chapterId,
        verseNumbers,
        languages,
        (done, total) => setAudioProgress({ done, total })
      );
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      // Keep showing progress for a moment then clear
      setTimeout(() => {
        setDownloading(false);
        setAudioProgress(null);
      }, 2000);
    }
  };

  useEffect(() => {
    // Check if everything is already cached
    if (chapterData) {
      // Optional: Check local cache status
    }
  }, [chapterData]);

  if (!chapterData) {
    return (
      <View style={styles.root}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const percentComplete = Math.round((readVerses.size / chapterData.verses_count) * 100);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          
          {!downloading ? (
            <TouchableOpacity onPress={startDownload} style={styles.backBtn}>
              <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(800).easing(Easing.out(Easing.exp))} style={styles.infoWrapper}>
            <View style={styles.infoCard}>
              <Text style={styles.chapterBadge}>
                {lang === 'hi' ? `अध्याय ${chapterId}` : `CHAPTER ${chapterId}`}
              </Text>
              <Text style={styles.chapterSanskrit}>{chapterData.name_sanskrit}</Text>
              <Text style={styles.chapterEnglish}>{getChapterTitle(chapterId, lang)}</Text>
              
              <View style={styles.progressRow}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${percentComplete}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>{readVerses.size} / {chapterData.verses_count} Verses</Text>
                  <Text style={styles.progressPercent}>{percentComplete}%</Text>
                </View>
              </View>

              {audioProgress && (
                <View style={[styles.progressRow, { marginTop: 20 }]}>
                  <Text style={[styles.chapterBadge, { color: colors.textSecondary }]}>
                    OFFLINE AUDIO {audioProgress.done === audioProgress.total ? 'READY' : 'DOWNLOADING...'}
                  </Text>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { 
                      width: `${(audioProgress.done / audioProgress.total) * 100}%`,
                      backgroundColor: audioProgress.done === audioProgress.total ? '#4ADE80' : colors.primary 
                    }]} />
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          <View style={styles.grid}>
            {chapterData.verses.map((verse, index) => {
              const isRead = readVerses.has(verse.verse);
              const highestReadVerse = readVerses.size > 0 ? Math.max(...Array.from(readVerses)) : 0;
              const isUnlocked = verse.verse <= highestReadVerse + 3;
              
              return (
                <Animated.View
                  key={verse.verse}
                  entering={FadeInDown.delay(100 + index * 10).duration(400)}
                  style={styles.gridItemContainer}
                >
                  <TouchableOpacity
                    activeOpacity={isUnlocked ? 0.7 : 1}
                    onPress={() => isUnlocked && router.push(`/sloka/${chapterId}/${verse.verse}` as any)}
                    style={styles.gridItem}
                  >
                    <View style={[
                      styles.gridItemContent,
                      isRead ? styles.itemRead : (isUnlocked ? styles.itemUnread : styles.itemLocked)
                    ]}>
                      {isUnlocked ? (
                        <Text style={[styles.verseNum, isRead ? styles.verseNumRead : styles.verseNumUnread]}>
                          {verse.verse}
                        </Text>
                      ) : (
                        <Ionicons
                          name="lock-closed"
                          size={16}
                          color={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(107,94,76,0.45)'}
                        />
                      )}
                      {isRead && (
                        <View style={styles.checkIcon}>
                          <Ionicons name="checkmark" size={10} color={isDark ? '#0D0D0D' : colors.text} />
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
