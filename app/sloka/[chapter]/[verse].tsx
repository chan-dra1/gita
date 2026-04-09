import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { hasCachedAudio } from '../../../src/utils/audio';
import { Config } from '../../../src/constants/config';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDeepDive } from '../../../src/hooks/useDeepDive';
import { getChapter, getSloka, getLocalizedTranslation } from '../../../src/utils/sloka';
import { getCommentary, getGenericCommentary, type Commentary } from '../../../src/utils/commentary';
import { addSlokaRead, isSlokaSaved, saveSloka, unsaveSloka, getOnboardingData, getTodaysSlokasReadCount } from '../../../src/utils/stats';
import { getSlokaImage } from '../../../src/utils/slokaImages';
import { useLanguage } from '../../../src/context/LanguageContext';
import purportsData from '../../../src/data/purports.json';
import purportsHiData from '../../../src/data/purports_hi.json';
import scholarAnswersData from '../../../src/data/scholar_answers.json';

// Safe import for DharmaBlocker
let DharmaBlocker: any = null;
try {
  DharmaBlocker = require('../../../modules/dharma-blocker').default;
} catch (e) {
  // Not available in Expo Go or web
}

// Helper: strip author attribution from purport text
function stripAttribution(text: string): string {
  return text
    .replace(/^(English|Hindi)\s+Commentary\s+By\s+Swami\s+\w+\.?\s*/i, '')
    .replace(/Swami Sivananda/gi, '')
    .replace(/Swami Ramsukhdas/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Helper: parse word meanings into pairs
function parseWordMeanings(wm: string): { word: string; meaning: string }[] {
  if (!wm) return [];
  // Common patterns: "karmaṇi—in prescribed duties; eva—certainly; adhikāraḥ—right"
  // or "karmaṇi — in prescribed duties; eva — certainly"
  const entries = wm.split(/[;]/);
  return entries.map(entry => {
    const parts = entry.split(/[—–-]/);
    if (parts.length >= 2) {
      return {
        word: parts[0].trim(),
        meaning: parts.slice(1).join('—').trim(),
      };
    }
    return { word: entry.trim(), meaning: '' };
  }).filter(e => e.word.length > 0);
}

export default function SlokaScreen() {
  const { chapter: chapterStr, verse: verseStr } = useLocalSearchParams<{
    chapter: string;
    verse: string;
  }>();
  const router = useRouter();
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);
  const { language } = useLanguage();
  const sloka = getSloka(chapter, verse);
  const chapterData = getChapter(chapter);
  const slokaImage = getSlokaImage(chapter, verse);

  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // UI state
  const [questionText, setQuestionText] = useState('');
  const [playingScholarMsgId, setPlayingScholarMsgId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Stats/Save state
  const [isSaved, setIsSaved] = useState(false);
  const [hasBeenRead, setHasBeenRead] = useState(false);
  const [commentary, setCommentary] = useState<Commentary | null>(null);

  const slokaContext = sloka
    ? {
        chapter,
        verse,
        sanskrit: sloka.sanskrit,
        transliteration: sloka.transliteration,
        translation_english: sloka.translation_english,
        chapterName: sloka.chapterName || '',
      }
    : null;

  const {
    messages,
    isLoading: isAiLoading,
    error: aiError,
    askQuestion,
    clearChat,
  } = useDeepDive(slokaContext);

  const purportDb = language === 'hi' ? purportsHiData : purportsData;
  let rawPurport = (purportDb as Record<string, string>)[`${chapter}:${verse}`];
  const purport = rawPurport ? stripAttribution(rawPurport) : null;
  const precomputedQuestions = (scholarAnswersData as Record<string, any[]>)[`${chapter}:${verse}`] || [];

  // Track sloka view on mount and load saved status
  useEffect(() => {
    const loadData = async () => {
      // Track that this sloka was read
      await addSlokaRead(chapter, verse);
      setHasBeenRead(true);

      if (Platform.OS === 'android' && DharmaBlocker) {
        // Check if daily commitment is fulfilled to auto-unblock apps
        const onboarding = await getOnboardingData();
        if (onboarding && onboarding.dailyCommitment) {
          const countOrAll = parseInt(onboarding.dailyCommitment);
          if (!isNaN(countOrAll)) {
            const todaysCount = await getTodaysSlokasReadCount();
            if (todaysCount >= countOrAll) {
              // Target met, turn off Dharma Blocker automatically
              DharmaBlocker.stopBlocking();
            }
          }
        }
      }

      // Check if saved
      const saved = await isSlokaSaved(chapter, verse);
      setIsSaved(saved);

      // Load commentary
      let comm = getCommentary(chapter, verse);
      if (!comm) {
        comm = getGenericCommentary(chapter, verse);
      }
      setCommentary(comm);
    };

    loadData();
  }, [chapter, verse]);

  const handleToggleSave = async () => {
    if (isSaved) {
      await unsaveSloka(chapter, verse);
      setIsSaved(false);
    } else {
      await saveSloka(chapter, verse);
      setIsSaved(true);
    }
  };

  const getCleanAudioText = (translation: string): string => {
    return translation
      .replace(/^(chapter|verse|sloka)\s+\d+[,.]?\s*/gi, '')
      .replace(/;/g, ',')
      .replace(/(\\||॥)[^\\|॥]*(\\||॥)/g, '')
      .replace(/\\s{2,}/g, ' ')
      .trim();
  };

  const handlePlayScholarMsg = async (text: string, msgId: number) => {
    if (playingScholarMsgId === msgId) {
      Speech.stop();
      setPlayingScholarMsgId(null);
      return;
    }
    
    Speech.stop();
    setPlayingScholarMsgId(msgId);
    
    try {
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setPlayingScholarMsgId(null),
        onStopped: () => setPlayingScholarMsgId(null),
        onError: () => setPlayingScholarMsgId(null)
      });
    } catch (e) {
      setPlayingScholarMsgId(null);
    }
  };

  const [isAudioCached, setIsAudioCached] = useState(false);

  useEffect(() => {
    hasCachedAudio(chapter, verse, 'sanskrit').then(setIsAudioCached);
  }, [chapter, verse]);

  const handlePlayPause = useCallback(async () => {
    if (!sloka) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsAudioLoading(true);
    setAudioError(null);
    const cleanText = getCleanAudioText(sloka.sanskrit);

    try {
      setIsAudioLoading(false);
      setIsSpeaking(true);
      
      Speech.speak(cleanText, {
        language: 'en-IN',
        pitch: 0.9,
        rate: 0.6,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          setAudioError("Unable to play audio. Please ensure 'Speech Services by Google' is installed.");
        }
      });
    } catch (e) {
      setIsSpeaking(false);
      setIsAudioLoading(false);
      setAudioError("Speech engine unavailable on this device.");
    }
  }, [sloka, chapter, verse, isSpeaking]);

  if (!sloka) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <Text style={{ fontSize: 18, color: '#999' }}>Sloka not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#D4A44C', fontWeight: '600', fontSize: 16 }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const goToVerse = (v: number) => {
    if (chapterData && v >= 1 && v <= chapterData.verses_count) {
      router.replace(`/sloka/${chapter}/${v}` as any);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!question.trim()) return;
    setQuestionText('');
    await askQuestion(question);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const wordPairs = sloka.word_meanings ? parseWordMeanings(sloka.word_meanings) : [];
  const translation = getLocalizedTranslation(chapter, verse, sloka.translation_english, language);
  // Strip "Swami Sivananda did not comment" from translations
  const cleanTranslation = translation.replace(/Swami Sivananda did not comment on this sloka/gi, 'Translation not available for this verse.').trim();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {/* ─── Dark Header ─── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={s.headerLabel}>CHAPTER {chapter} · VERSE {verse}</Text>
            </View>
            <TouchableOpacity onPress={handleToggleSave} style={[s.headerBtn, isSaved && { backgroundColor: 'rgba(212, 164, 76, 0.2)' }]}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? '#D4A44C' : '#FFF'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* ─── Sanskrit Verse Card ─── */}
            <View style={s.sanskritCard}>
              <View style={s.goldBar} />
              <View style={s.sanskritInner}>
                <Text style={s.sanskritText}>{sloka.sanskrit}</Text>
                <View style={s.divider} />
                <Text style={s.translitText}>"{sloka.transliteration}"</Text>
              </View>
            </View>

            {/* ─── Audio Player ─── */}
            <TouchableOpacity onPress={handlePlayPause} style={s.audioRow} activeOpacity={0.7}>
              <View style={[s.playBtn, isSpeaking && { backgroundColor: '#D4A44C' }]}>
                {isAudioLoading ? (
                  <ActivityIndicator size="small" color="#D4A44C" />
                ) : (
                  <Ionicons
                    name={isSpeaking ? 'stop' : 'play'}
                    size={20}
                    color={isSpeaking ? '#0D0D0D' : '#D4A44C'}
                    style={{ marginLeft: isSpeaking ? 0 : 2 }}
                  />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.audioTitle}>{isSpeaking ? 'Playing...' : 'Listen to Recitation'}</Text>
                <Text style={s.audioSub}>
                  {isSpeaking ? 'Tap to stop' : 'Sanskrit verse audio'}
                </Text>
              </View>
              {isAudioCached && !isSpeaking && (
                <View style={s.cachedBadge}>
                  <Text style={s.cachedText}>OFFLINE ✓</Text>
                </View>
              )}
            </TouchableOpacity>
            {audioError && (
              <Text style={{ color: '#E53935', fontSize: 12, marginHorizontal: 20, marginTop: 4 }}>{audioError}</Text>
            )}

            {/* ─── Translation ─── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>TRANSLATION</Text>
              <Text style={s.translationText}>
                "{cleanTranslation}"
              </Text>
            </View>

            {/* ─── Word-by-Word Breakdown ─── */}
            {wordPairs.length > 0 && language === 'en' && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>WORD BY WORD BREAKDOWN</Text>
                <View style={s.wordGrid}>
                  {wordPairs.map((pair, ix) => (
                    <View key={ix} style={s.wordRow}>
                      <Text style={s.wordSanskrit}>{pair.word}</Text>
                      <Text style={s.wordMeaning}>{pair.meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── Spiritual Meaning & In Your Life ─── */}
            {commentary && (
              <View style={s.section}>
                {commentary.meaning && (
                  <>
                    <Text style={s.sectionTitle}>SPIRITUAL MEANING</Text>
                    <Text style={s.bodyText}>{commentary.meaning}</Text>
                  </>
                )}
                {commentary.application && (
                  <View style={{ marginTop: commentary.meaning ? 20 : 0 }}>
                    <Text style={s.sectionTitle}>IN YOUR LIFE</Text>
                    <Text style={s.bodyText}>{commentary.application}</Text>
                  </View>
                )}
              </View>
            )}

            {/* ─── Expanded Purport ─── */}
            {purport && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>EXPANDED PURPORT</Text>
                <Text style={s.bodyText}>{purport}</Text>
              </View>
            )}

            {/* ─── Scholar Q&A ─── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>ASK ABOUT THIS VERSE</Text>

              {/* Predefined Q&A */}
              {precomputedQuestions.length > 0 && messages.length === 0 && (
                <View style={{ marginBottom: 16 }}>
                  {precomputedQuestions.map((q: any, i: number) => (
                    <View key={i} style={s.qaCard}>
                      <View style={s.qaQuestion}>
                        <Text style={s.qaQuestionText}>Q: {q.question}</Text>
                      </View>
                      <View style={s.qaAnswer}>
                        <Text style={s.qaAnswerText}>{q.answer}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* AI Chat Messages */}
              {messages.map((msg, i) => (
                <View key={i} style={{ marginBottom: 12, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, width: '85%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12 }}>🙏</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#D4A44C' }}>Gita Scholar</Text>
                      </View>
                      <TouchableOpacity onPress={() => handlePlayScholarMsg(msg.content, i)}>
                        <Ionicons name={playingScholarMsgId === i ? "stop-circle" : "volume-medium"} size={16} color="#D4A44C" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={{
                    maxWidth: '85%',
                    borderRadius: 18,
                    padding: 16,
                    ...(msg.role === 'user'
                      ? { backgroundColor: '#D4A44C', borderTopRightRadius: 4 }
                      : { backgroundColor: '#1A1A1A', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#2A2A2A' }
                    )
                  }}>
                    <Text style={{ fontSize: 14, lineHeight: 22, color: msg.role === 'user' ? '#0D0D0D' : '#E0D5C5' }}>
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}

              {/* AI Loading */}
              {isAiLoading && (
                <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 }}>
                    <Text style={{ fontSize: 12 }}>🙏</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#D4A44C' }}>Gita Scholar</Text>
                  </View>
                  <View style={{ borderRadius: 18, borderTopLeftRadius: 4, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="small" color="#D4A44C" />
                    <Text style={{ fontSize: 14, color: '#777' }}>Contemplating...</Text>
                  </View>
                </View>
              )}

              {/* AI Error */}
              {aiError && (
                <View style={{ marginBottom: 12, padding: 14, borderRadius: 12, backgroundColor: 'rgba(229,57,53,0.1)', borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' }}>
                  <Text style={{ fontSize: 14, color: '#E53935' }}>{aiError}</Text>
                </View>
              )}

              {/* Question Input */}
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  placeholder="Ask a question about this verse..."
                  placeholderTextColor="#555"
                  multiline
                  value={questionText}
                  onChangeText={setQuestionText}
                  editable={!isAiLoading}
                />
                <TouchableOpacity
                  onPress={() => handleAskQuestion(questionText)}
                  disabled={isAiLoading || !questionText.trim()}
                  style={[s.sendBtn, (isAiLoading || !questionText.trim()) && { opacity: 0.4 }]}
                >
                  <Ionicons name="send" size={16} color="#0D0D0D" />
                </TouchableOpacity>
              </View>

              {/* Clear Chat */}
              {messages.length > 0 && (
                <TouchableOpacity onPress={clearChat} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Ionicons name="refresh-outline" size={14} color="#555" />
                  <Text style={{ fontSize: 12, color: '#555' }}>Clear conversation</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ─── Bottom Navigation ─── */}
            <View style={s.navRow}>
              <TouchableOpacity
                onPress={() => goToVerse(verse - 1)}
                disabled={verse <= 1}
                style={[s.navBtn, s.navPrev, verse <= 1 && { opacity: 0.3 }]}
              >
                <Ionicons name="chevron-back" size={16} color={verse <= 1 ? '#555' : '#D4A44C'} />
                <Text style={[s.navText, { color: verse <= 1 ? '#555' : '#D4A44C' }]}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => goToVerse(verse + 1)}
                style={s.navNext}
              >
                <Text style={s.navNextText}>Next Verse</Text>
                <Ionicons name="chevron-forward" size={16} color="#0D0D0D" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 8,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4A44C',
    letterSpacing: 2,
  },

  // ── Sanskrit Card ──
  sanskritCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.15)',
  },
  goldBar: {
    height: 3,
    backgroundColor: '#D4A44C',
  },
  sanskritInner: {
    padding: 28,
    alignItems: 'center',
  },
  sanskritText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 164, 76, 0.25)',
    width: '50%',
    marginVertical: 20,
  },
  translitText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(212, 164, 76, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Audio ──
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 164, 76, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  audioSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  cachedBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  cachedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: 0.5,
  },

  // ── Sections ──
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4A44C',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  translationText: {
    fontSize: 17,
    color: '#E0D5C5',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  bodyText: {
    fontSize: 15,
    color: '#B8AFA3',
    lineHeight: 26,
  },

  // ── Word Grid ──
  wordGrid: {
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  wordRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  wordSanskrit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4A44C',
    width: '40%',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  wordMeaning: {
    fontSize: 14,
    color: '#B8AFA3',
    width: '60%',
    lineHeight: 20,
  },

  // ── Q&A ──
  qaCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  qaQuestion: {
    padding: 14,
    backgroundColor: 'rgba(212, 164, 76, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  qaQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A44C',
  },
  qaAnswer: {
    padding: 14,
  },
  qaAnswerText: {
    fontSize: 14,
    color: '#B8AFA3',
    lineHeight: 22,
  },

  // ── Input ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#E0D5C5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A44C',
  },

  // ── Navigation ──
  navRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 28,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navPrev: {
    borderWidth: 1.5,
    borderColor: 'rgba(212, 164, 76, 0.3)',
    backgroundColor: 'rgba(212, 164, 76, 0.05)',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navNext: {
    flex: 1.2,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D4A44C',
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  navNextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
});
