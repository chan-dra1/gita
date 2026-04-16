import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllChapters } from '../../src/utils/sloka';
import { getSlokasRead } from '../../src/utils/stats';
import { getChapterImage } from '../../src/utils/chapterImages';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4A44C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
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
            color: '#FFFFFF',
          }}
        >
          Bhagavad Gita
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#D4A44C',
            fontWeight: '600',
            marginTop: 4,
            letterSpacing: 1,
            textTransform: 'uppercase',
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
              onPress={() => router.push(`/chapter/${item.chapter}` as any)}
              style={{
                marginBottom: 16,
                borderRadius: 24,
                backgroundColor: '#141414',
                borderWidth: 1,
                borderColor: isComplete ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Chapter Image */}
              <Image
                source={getChapterImage(item.chapter)}
                style={{
                  width: '100%',
                  height: 140,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
                resizeMode="cover"
              />
              
              {/* Gradient overlay on image */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 140,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                backgroundColor: 'rgba(0,0,0,0.3)',
              }} />
              
              {/* Chapter number badge on image */}
              <View style={{
                position: 'absolute',
                top: 12,
                left: 14,
                backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.85)' : 'rgba(212, 164, 76, 0.85)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
              }}>
                {isComplete ? (
                  <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                ) : (
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: '#FFF',
                    letterSpacing: 0.5,
                  }}>
                    CH {item.chapter}
                  </Text>
                )}
              </View>

              {/* Chapter Info */}
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    marginBottom: 2,
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#888',
                    fontWeight: '500',
                    marginBottom: 4,
                    fontStyle: 'italic',
                  }}
                >
                  {item.name_sanskrit}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: hasStarted ? '#D4A44C' : '#666',
                      fontWeight: hasStarted ? '600' : '400',
                    }}
                  >
                    {chapterProgress?.readCount || 0}/{item.verses_count} verses read
                  </Text>
                  {hasStarted && !isComplete && (
                    <View
                      style={{
                        marginLeft: 8,
                        backgroundColor: 'rgba(212, 164, 76, 0.1)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#D4A44C' }}>
                        {percentComplete}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                {hasStarted && (
                  <View style={{ marginTop: 10 }}>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: '#1A1A1A',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${percentComplete}%`,
                          backgroundColor: isComplete ? '#22C55E' : '#D4A44C',
                          borderRadius: 2,
                        }}
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
