import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator, StatusBar, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllChapters } from '../../src/utils/sloka';
import { getSlokasRead } from '../../src/utils/stats';
import { getChapterImage } from '../../src/utils/chapterImages';
import { getChapterTitle } from '../../src/utils/chapterDisplay';
import { useLanguage } from '../../src/context/LanguageContext';
import { t } from '../../src/utils/i18n';

const chapters = getAllChapters();

interface ChapterProgress {
  chapter: number;
  readCount: number;
  totalVerses: number;
  readVerses: number[];
}

export default function LibraryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [router]);
  const [progress, setProgress] = useState<Map<number, ChapterProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    headerTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    headerEyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      marginTop: 4,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 6,
      letterSpacing: 0.3,
    },
    chapterCard: {
      marginBottom: 16,
      borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      overflow: 'hidden',
    },
    chapterImage: {
      width: '100%',
      height: 140,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 140,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    chapterBadge: {
      position: 'absolute',
      top: 12,
      left: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    chapterBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.background,
      letterSpacing: 0.5,
    },
    chapterInfoContainer: { padding: 16 },
    chapterTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    chapterSanskrit: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 4,
      fontStyle: 'italic',
    },
    chapterProgressContainer: {
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 6
    },
    chapterProgressText: {
      fontSize: 13,
    },
    chapterProgressBadge: {
      marginLeft: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    chapterProgressBadgeText: {
      fontSize: 10, 
      fontWeight: '700',
    },
    progressBarContainer: {
      marginTop: 10,
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 2,
    },
  }), [colors, isDark]);

  const loadProgress = useCallback(async () => {
    try {
      const allRead = await getSlokasRead();
      const progressMap = new Map<number, ChapterProgress>();

      // Initialize all chapters
      chapters.forEach(ch => {
        progressMap.set(ch.chapter, {
          chapter: ch.chapter,
          readCount: 0,
          totalVerses: ch.verses_count,
          readVerses: [],
        });
      });

      // Count read verses per chapter
      allRead.forEach(sloka => {
        const current = progressMap.get(sloka.chapter);
        if (current) {
          if (!current.readVerses.includes(sloka.verse)) {
            current.readVerses.push(sloka.verse);
            current.readCount = current.readVerses.length;
          }
        }
      });

      setProgress(progressMap);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Reload progress when screen comes into focus
  useEffect(() => {
    const interval = setInterval(loadProgress, 2000);
    return () => clearInterval(interval);
  }, [loadProgress]);

  const getProgressPercentage = (chapterProgress: ChapterProgress | undefined) => {
    if (!chapterProgress) return 0;
    return Math.round((chapterProgress.readCount / chapterProgress.totalVerses) * 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      {/* Header — back to Home when opened from Quick Actions (stack may be empty) */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerEyebrow}>Bhagavad Gita</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {t('library', language)}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {t('exploreChapters', language)} · 18 · 700
        </Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.chapter.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const chapterProgress = progress.get(item.chapter);
          const percentComplete = getProgressPercentage(chapterProgress);
          const hasStarted = percentComplete > 0;
          const isComplete = percentComplete === 100;

          return (
            <TouchableOpacity
              onPress={() => router.push(`/chapter/${item.chapter}` as any)}
              style={[
                styles.chapterCard,
                { borderColor: isComplete ? `${colors.primary}40` : colors.border }
              ]}
            >
              {/* Chapter Image */}
              <Image
                source={getChapterImage(item.chapter)}
                style={styles.chapterImage}
                resizeMode="cover"
              />
              
              {/* Gradient overlay on image */}
              <View style={styles.imageOverlay} />
              
              {/* Chapter number badge on image */}
              <View style={[
                styles.chapterBadge,
                { backgroundColor: isComplete ? `${colors.primary}D9` : `${colors.primary}D9` }
              ]}>
                {isComplete ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.background} />
                ) : (
                  <Text style={styles.chapterBadgeText}>
                    CH {item.chapter}
                  </Text>
                )}
              </View>

              {/* Chapter Info */}
              <View style={styles.chapterInfoContainer}>
                <Text
                  style={styles.chapterTitle}
                >
                  {getChapterTitle(item.chapter, language)}
                </Text>
                <Text
                  style={styles.chapterSanskrit}
                >
                  {item.name_sanskrit}
                </Text>
                <View style={styles.chapterProgressContainer}>
                  <Text
                    style={[
                      styles.chapterProgressText,
                      { color: hasStarted ? colors.primary : colors.textSecondary }
                    ]}
                  >
                    {t('versesReadProgress', language, {
                      read: chapterProgress?.readCount || 0,
                      total: item.verses_count,
                    })}
                  </Text>
                  {hasStarted && !isComplete && (
                    <View
                      style={[
                        styles.chapterProgressBadge,
                        { backgroundColor: `${colors.primary}1A` }
                      ]}
                    >
                      <Text style={[
                        styles.chapterProgressBadgeText,
                        { color: colors.primary }
                      ]}>
                        {percentComplete}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                {hasStarted && (
                  <View style={styles.progressBarContainer}>
                    <View
                      style={styles.progressBarBackground}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          { 
                            width: `${percentComplete}%`,
                            backgroundColor: isComplete ? '#22C55E' : colors.primary, 
                          }
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
