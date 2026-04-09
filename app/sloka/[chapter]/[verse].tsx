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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDeepDive } from '../../../src/hooks/useDeepDive';
import { getChapter, getSloka, getLocalizedTranslation } from '../../../src/utils/sloka';
import { getCommentary, getGenericCommentary, type Commentary } from '../../../src/utils/commentary';
import { addSlokaRead, isSlokaSaved, saveSloka, unsaveSloka, getOnboardingData, getTodaysSlokasReadCount } from '../../../src/utils/stats';
import { getSlokaImage } from '../../../src/utils/slokaImages';
import { useLanguage } from '../../../src/context/LanguageContext';
import purportsData from '../../../src/data/purports.json';
import scholarAnswersData from '../../../src/data/scholar_answers.json';

// Safe import for DharmaBlocker
let DharmaBlocker: any = null;
try {
  DharmaBlocker = require('../../../modules/dharma-blocker').default;
} catch (e) {
  // Not available in Expo Go or web
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

  // Audio state - disabled until API keys are available
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'meaning' | 'purport' | 'scholar'>('meaning');
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

  const purport = (purportsData as Record<string, string>)[`${chapter}:${verse}`];
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

  /**
   * Clean TTS text — only the English translation, stripped of
   * semicolons, leading/trailing whitespace, and chapter/verse prefixes.
   */
  const getCleanAudioText = (translation: string): string => {
    return translation
      .replace(/^(chapter|verse|sloka)\s+\d+[,.]?\s*/gi, '') // Remove "Chapter X, Verse Y" prefixes
      .replace(/;/g, ',') // Replace semicolons with natural pauses
      .replace(/(\\||॥)[^\\|॥]*(\\||॥)/g, '') // Remove Sanskrit verse markers ||1-1||
      .replace(/\\s{2,}/g, ' ') // Collapse extra whitespace
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
    // Check if audio is already cached when component mounts
    hasCachedAudio(chapter, verse, 'sanskrit').then(setIsAudioCached);
  }, [chapter, verse]);

  const handlePlayPause = useCallback(async () => {
    if (!sloka) return;

    if (isSpeaking) {
      // Stop playback
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
      
      // Using en-IN (Indian English) instead of hi-IN. 
      // en-IN is universally installed and reads transliterated Sanskrit very cleanly.
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
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#FFF7ED',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18, color: '#999' }}>Sloka not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#E8751A', fontWeight: '600', fontSize: 16 }}>
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'android' ? 24 : 12,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1A1A' }}>
              Chapter {chapter}, Verse {verse}
            </Text>
            {hasBeenRead && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                <Text style={{ fontSize: 11, color: '#22C55E', marginLeft: 3 }}>Read</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={handleToggleSave}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isSaved ? '#FEF3E8' : '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons 
              name={isSaved ? 'bookmark' : 'bookmark-outline'} 
              size={20} 
              color={isSaved ? '#E8751A' : '#1A1A1A'} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Illustration (If Available) ── */}
          {slokaImage && (
            <View style={{ alignItems: 'center', marginTop: 8, paddingHorizontal: 20 }}>
              <View
                style={{
                  width: '100%',
                  aspectRatio: 1.2,
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: '#F5EDE0',
                  borderWidth: 1,
                  borderColor: '#F0E0CC',
                  shadowColor: '#E8751A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Image
                  source={slokaImage}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          {/* ── Sanskrit Card ── */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 8,
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: '#FFF8EE',
              borderWidth: 1,
              borderColor: '#F0E0CC',
              shadowColor: '#E8751A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <View style={{ height: 4, backgroundColor: '#F5C518' }} />
            <View style={{ padding: 28, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, color: '#F5C518', marginBottom: 16 }}>❝</Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '600',
                  color: '#1A1A1A',
                  textAlign: 'center',
                  lineHeight: 34,
                }}
              >
                {sloka.sanskrit}
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: '#F0E0CC',
                  width: '60%',
                  marginVertical: 20,
                }}
              />
              <Text style={{ fontSize: 14, fontStyle: 'italic', color: '#B0A090' }}>
                Bhagavad Gita - Chapter {chapter}, Verse {verse}
              </Text>
            </View>
          </View>

          {/* ── Audio Player ── */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              borderRadius: 20,
              backgroundColor: '#FFF',
              borderWidth: 1,
              borderColor: isSpeaking ? '#E8751A' : '#F0E0CC',
              overflow: 'hidden',
              shadowColor: isSpeaking ? '#E8751A' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isSpeaking ? 0.15 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {isSpeaking && <View style={{ height: 3, backgroundColor: '#E8751A' }} />}
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handlePlayPause}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: isAudioLoading ? '#F5F5F5' : isSpeaking ? '#E8751A' : '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAudioLoading ? (
                  <ActivityIndicator size="small" color="#E8751A" />
                ) : (
                  <Ionicons
                    name={isSpeaking ? 'stop' : 'play'}
                    size={26}
                    color={isSpeaking ? '#FFF' : '#E8751A'}
                    style={{ marginLeft: isSpeaking ? 0 : 3 }}
                  />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>
                    {isSpeaking ? 'Playing...' : 'Audio Recitation'}
                  </Text>
                  {isAudioCached && !isSpeaking && (
                    <View style={{ backgroundColor: '#EDF7EE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#2D7A3A' }}>CACHED ✓</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: '#B0A090', marginTop: 3 }}>
                  {isAudioLoading ? 'Generating audio...' : isSpeaking ? 'Tap to stop' : isAudioCached ? 'Instant playback — saved offline' : 'Sanskrit recitation'}
                </Text>
                {audioError && <Text style={{ fontSize: 11, color: '#E53935', marginTop: 4 }}>{audioError}</Text>}
              </View>
            </View>
          </View>

          {/* ── Tabs Header ── */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 24, backgroundColor: '#FFF', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#F0E0CC' }}>
            <TouchableOpacity onPress={() => setActiveTab('meaning')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === 'meaning' ? '#FFF3E8' : 'transparent', borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: activeTab === 'meaning' ? '700' : '500', color: activeTab === 'meaning' ? '#E8751A' : '#999' }}>Meaning</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('purport')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === 'purport' ? '#FFF3E8' : 'transparent', borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: activeTab === 'purport' ? '700' : '500', color: activeTab === 'purport' ? '#E8751A' : '#999' }}>Deep Purport</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('scholar')} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === 'scholar' ? '#FFF3E8' : 'transparent', borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: activeTab === 'scholar' ? '700' : '500', color: activeTab === 'scholar' ? '#E8751A' : '#999' }}>Scholar QA</Text>
            </TouchableOpacity>
          </View>

          {/* ── Tab Content ── */}
          <View style={{ marginHorizontal: 20, marginTop: 16 }}>
            {activeTab === 'meaning' && (
               <View style={{ padding: 20, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F0E0CC' }}>
                 <View style={{ borderLeftWidth: 3, borderLeftColor: '#F5C518', paddingLeft: 14, marginBottom: 16 }}>
                   <Text style={{ fontSize: 15, fontStyle: 'italic', color: '#666', lineHeight: 24 }}>
                     "{sloka.transliteration}"
                   </Text>
                 </View>
                 <Text style={{ fontSize: 16, color: '#333', lineHeight: 26, marginBottom: (commentary || sloka.word_meanings) ? 20 : 0 }}>
                   {getLocalizedTranslation(chapter, verse, sloka.translation_english, language)}
                 </Text>
                 
                 {sloka.word_meanings && language === 'en' && (
                    <View style={{ marginBottom: 20, backgroundColor: '#FFFDF9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0E0CC' }}>
                       <Text style={{ fontSize: 13, fontWeight: '700', color: '#E8751A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Word-for-Word</Text>
                       <Text style={{ fontSize: 14, color: '#444', lineHeight: 24 }}>
                          {sloka.word_meanings.replace(/—/g, ' — ')}
                       </Text>
                    </View>
                 )}
                 
                 {commentary && (
                    <View>
                      <View style={{ height: 1, backgroundColor: '#F0E0CC', width: '100%', marginBottom: 16 }} />
                      {commentary.meaning && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8751A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Spiritual Meaning</Text>
                          <Text style={{ fontSize: 15, color: '#555', lineHeight: 24 }}>{commentary.meaning}</Text>
                        </View>
                      )}
                      {commentary.application && (
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8751A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>In Your Life</Text>
                          <Text style={{ fontSize: 15, color: '#555', lineHeight: 24 }}>{commentary.application}</Text>
                        </View>
                      )}
                    </View>
                 )}
               </View>
            )}

            {activeTab === 'purport' && (
              <View style={{ padding: 20, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F0E0CC' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 }}>Expanded Purport</Text>
                {purport ? (
                  <Text style={{ fontSize: 15, color: '#444', lineHeight: 26 }}>
                    {purport}
                  </Text>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                     <Text style={{ fontSize: 40, marginBottom: 10 }}>📖</Text>
                     <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>
                       The comprehensive purport for this verse is coming soon in a future update.
                     </Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'scholar' && (
              <View style={{ minHeight: 250 }}>
                {/* Cost-Optimized Predefined Q&A */}
                {precomputedQuestions.length > 0 && messages.length === 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#E8751A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                      Frequently Asked
                    </Text>
                    {precomputedQuestions.map((q: any, i: number) => (
                      <View key={i} style={{ marginBottom: 12, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0E0CC', overflow: 'hidden' }}>
                        <View style={{ padding: 14, backgroundColor: '#FFF8EE', borderBottomWidth: 1, borderBottomColor: '#F0E0CC' }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A' }}>Q: {q.question}</Text>
                        </View>
                        <View style={{ padding: 14 }}>
                          <Text style={{ fontSize: 14, color: '#444', lineHeight: 22 }}>{q.answer}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* AI Chat Messages */}
                {messages.map((msg, i) => (
                  <View key={i} style={{ marginBottom: 12, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role === 'assistant' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, width: '85%', maxWidth: '85%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 12 }}>🙏</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#E8751A' }}>Gita Scholar</Text>
                        </View>
                        <TouchableOpacity onPress={() => handlePlayScholarMsg(msg.content, i)}>
                          <Ionicons name={playingScholarMsgId === i ? "stop-circle" : "volume-medium"} size={16} color="#E8751A" />
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={{ maxWidth: '85%', borderRadius: 18, padding: 16, ...(msg.role === 'user' ? { backgroundColor: '#E8751A', borderTopRightRadius: 4 } : { backgroundColor: '#FFF', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#F0E0CC' }) }}>
                      <Text style={{ fontSize: 14, lineHeight: 22, color: msg.role === 'user' ? '#FFF' : '#333' }}>{msg.content}</Text>
                    </View>
                  </View>
                ))}

                {/* AI Loading */}
                {isAiLoading && (
                  <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 }}>
                      <Text style={{ fontSize: 12 }}>🙏</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#E8751A' }}>Gita Scholar</Text>
                    </View>
                    <View style={{ borderRadius: 18, borderTopLeftRadius: 4, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0E0CC', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <ActivityIndicator size="small" color="#E8751A" />
                      <Text style={{ fontSize: 14, color: '#999' }}>Contemplating...</Text>
                    </View>
                  </View>
                )}

                {/* AI Error */}
                {aiError && (
                  <View style={{ marginBottom: 12, padding: 14, borderRadius: 12, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFD0D0' }}>
                    <Text style={{ fontSize: 14, color: '#CC3333' }}>{aiError}</Text>
                  </View>
                )}

                {/* Question Input */}
                <View style={{ marginTop: 'auto', marginBottom: 12, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0E0CC', flexDirection: 'row', alignItems: 'flex-end', padding: 6 }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: '#333', paddingHorizontal: 14, paddingVertical: 10, minHeight: 42, maxHeight: 100 }}
                    placeholder={messages.length === 0 ? "Or ask a unique question..." : "Ask about this verse..."}
                    placeholderTextColor="#C0B0A0"
                    multiline
                    value={questionText}
                    onChangeText={setQuestionText}
                    editable={!isAiLoading}
                  />
                  <TouchableOpacity
                    onPress={() => handleAskQuestion(questionText)}
                    disabled={isAiLoading || !questionText.trim()}
                    style={{ width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isAiLoading || !questionText.trim() ? '#E0D0C0' : '#E8751A' }}
                  >
                    <Ionicons name="send" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* Clear Chat */}
                {messages.length > 0 && (
                  <TouchableOpacity onPress={clearChat} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Ionicons name="refresh-outline" size={14} color="#999" />
                    <Text style={{ fontSize: 12, color: '#999' }}>Clear conversation</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* ── Bottom Navigation ── */}
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: 20,
              marginTop: 24,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => goToVerse(verse - 1)}
              disabled={verse <= 1}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1.5,
                borderColor: verse <= 1 ? '#E0D8D0' : '#E8751A',
                backgroundColor: '#FFF',
                opacity: verse <= 1 ? 0.5 : 1,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={verse <= 1 ? '#C0B0A0' : '#E8751A'}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: verse <= 1 ? '#C0B0A0' : '#E8751A',
                }}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => goToVerse(verse + 1)}
              style={{
                flex: 1.2,
                paddingVertical: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#E8751A',
                shadowColor: '#E8751A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
                Next Verse
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
