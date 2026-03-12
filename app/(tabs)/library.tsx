import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllChapters } from '../../src/utils/sloka';
import { getReadSlokasByChapter, getSlokasRead } from '../../src/utils/stats';

const chapters = getAllChapters();

interface ChapterProgress {
  chapter: number;
  readCount: number;
  totalVerses: number;
  readVerses: number[];
}

export default function LibraryScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Map<number, ChapterProgress>>(new Map());
  const [loading, setLoading] = useState(true);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E8751A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#1A1A1A',
          }}
        >
          Bhagavad Gita
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#999',
            marginTop: 4,
          }}
        >
          18 Chapters · 700 Slokas
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
              onPress={() => router.push(`/sloka/${item.chapter}/1` as any)}
              style={{
                marginBottom: 12,
                borderRadius: 20,
                backgroundColor: '#FFF',
                borderWidth: 1,
                borderColor: isComplete ? '#22C55E' : '#F0E0CC',
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Chapter Number */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: isComplete ? '#F0FDF4' : '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  borderWidth: 2,
                  borderColor: isComplete ? '#22C55E' : 'transparent',
                }}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={24} color="#22C55E" />
                ) : (
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#E8751A',
                    }}
                  >
                    {item.chapter}
                  </Text>
                )}
              </View>

              {/* Chapter Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1A1A1A',
                  }}
                >
                  {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: hasStarted ? '#E8751A' : '#999',
                    }}
                  >
                    {chapterProgress?.readCount || 0}/{item.verses_count} verses read
                  </Text>
                  {hasStarted && !isComplete && (
                    <View
                      style={{
                        marginLeft: 8,
                        backgroundColor: '#FEF3E8',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#E8751A' }}>
                        {percentComplete}%
                      </Text>
                    </View>
                  )}
                  {isComplete && (
                    <View
                      style={{
                        marginLeft: 8,
                        backgroundColor: '#F0FDF4',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#22C55E' }}>
                        Complete
                      </Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                {hasStarted && (
                  <View style={{ marginTop: 8 }}>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: '#F0E0CC',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${percentComplete}%`,
                          backgroundColor: isComplete ? '#22C55E' : '#E8751A',
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>

              <Ionicons name="chevron-forward" size={20} color="#D0C0B0" />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
