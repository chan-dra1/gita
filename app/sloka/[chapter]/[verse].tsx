import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { hasCachedAudio, cacheAndPlayAudio, stopAudio } from '../../../src/utils/audio';
import { Config } from '../../../src/constants/config';
import type { AudioLanguage } from '../../../src/types';
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
  Share,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Card margins: 20 each side = 40. Inner padding: 28 each side = 56. 
const CARD_INNER_WIDTH = SCREEN_WIDTH - 40 - 56;
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { VerseCard } from '../../../src/components/VerseCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { askScholar, type ChatMessage } from '../../../src/utils/ai';
import { getChapter, getSloka, getLocalizedTranslation } from '../../../src/utils/sloka';
import { getCommentary, getGenericCommentary, type Commentary } from '../../../src/utils/commentary';
import { addSlokaRead, isSlokaSaved, saveSloka, unsaveSloka, getOnboardingData, getTodaysSlokasReadCount } from '../../../src/utils/stats';
import { incrementGlobalSankalpa } from '../../../src/utils/karma';
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
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>('sanskrit');
  const [audioError, setAudioError] = useState<string | null>(null);

  // UI state
  const [questionText, setQuestionText] = useState('');
  const [playingScholarMsgId, setPlayingScholarMsgId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Stats/Save state
  const [isSaved, setIsSaved] = useState(false);
  const [hasBeenRead, setHasBeenRead] = useState(false);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeCardTab, setActiveCardTab] = useState(0);
  const cardRef = useRef<View>(null);

  const slokaContext = sloka
    ? {
        chapter,
        verse,
        sanskrit: sloka.sanskrit,
        transliteration: sloka.transliteration,
        english: sloka.translation_english,
        chapterName: sloka.chapterName || '',
      }
    : undefined;

  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
      incrementGlobalSankalpa(1).catch(() => {});

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

  const handleShare = async () => {
    if (!sloka) return;
    
    // For Web, provide text share
    if (Platform.OS === 'web') {
      try {
        const shareUrl = `https://gita-rouge-tau.vercel.app/download`;
        const message = `${sloka.sanskrit}\n\n"${cleanTranslation}"\n\n— Read Chapter ${chapter}, Verse ${verse} on the Gita App: ${shareUrl}`;
        await Share.share({
          message,
          url: shareUrl,
          title: `Bhagavad Gita ${chapter}.${verse}`,
        });
      } catch (error: any) {
        console.warn('Error sharing sloka', error.message);
      }
      return;
    }

    // For Native, generate beautiful Verse Card
    setIsCapturing(true);
    try {
      // Capture the off-screen VerseCard component
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });

      const shareUrl = `https://gita-rouge-tau.vercel.app/download`;
      // Note: Some apps handle both image + text well, others prefer just image.
      // We share the image as the primary payload.
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share Bhagavad Gita ${chapter}.${verse}`,
        UTI: 'public.png',
      });
    } catch (error: any) {
      console.error('Error sharing sloka card', error);
      Alert.alert('Sharing Failed', 'Could not generate the verse card. Falling back to text share.');
      
      // Fallback to text
      const shareUrl = `https://gita-rouge-tau.vercel.app/download`;
      const message = `${sloka.sanskrit}\n\n"${cleanTranslation}"\n\n— Read on the Gita App: ${shareUrl}`;
      await Share.share({ message });
    } finally {
      setIsCapturing(false);
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
  const [isExplanationCached, setIsExplanationCached] = useState(false);

  useEffect(() => {
    hasCachedAudio(chapter, verse, 'sanskrit').then(setIsAudioCached);
    hasCachedAudio(chapter, verse, 'english').then(setIsExplanationCached);
  }, [chapter, verse]);

  // Check if premium TTS (Google Cloud) is available
  const hasTTSKey = Config.TTS_API_KEY && Config.TTS_API_KEY !== 'YOUR_TTS_API_KEY' && Config.TTS_API_KEY.length > 5;

  const handlePlayPause = useCallback(async () => {
    if (!sloka) return;

    if (isSpeaking) {
      // Stop any playing audio
      Speech.stop();
      await stopAudio();
      setIsSpeaking(false);
      return;
    }

    setIsAudioLoading(true);
    setAudioError(null);

    // Choose text based on audio language
    const textForAudio = audioLanguage === 'sanskrit' 
      ? getCleanAudioText(sloka.sanskrit)
      : getCleanAudioText(sloka.translation_english);

    try {
      if (hasTTSKey) {
        // Use Google Cloud TTS — calm meditation voice
        const sound = await cacheAndPlayAudio(
          chapter,
          verse,
          textForAudio,
          audioLanguage,
          () => {
            setIsSpeaking(false);
            setIsAudioLoading(false);
          },
          (error) => {
            setIsSpeaking(false);
            setIsAudioLoading(false);
            setAudioError(error);
          }
        );
        setIsSpeaking(true);
        setIsAudioLoading(false);
        // Update cached status
        if (audioLanguage === 'sanskrit') setIsAudioCached(true);
        else setIsExplanationCached(true);
      } else {
        // Fallback to device TTS (expo-speech) — improved settings
        setIsSpeaking(true);
        setIsAudioLoading(false);

        const speechLang = audioLanguage === 'sanskrit' ? 'hi-IN' : 'en-US';
        const speechRate = audioLanguage === 'sanskrit' ? 0.55 : 0.8;
        const speechPitch = audioLanguage === 'sanskrit' ? 0.85 : 1.0;

        Speech.speak(textForAudio, {
          language: speechLang,
          pitch: speechPitch,
          rate: speechRate,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: () => {
            setIsSpeaking(false);
            setAudioError("Unable to play audio. Please ensure 'Speech Services by Google' is installed on your device.");
          }
        });
      }
    } catch (e) {
      setIsSpeaking(false);
      setIsAudioLoading(false);
      // If premium TTS fails, fall back to device speech
      if (hasTTSKey) {
        try {
          setIsSpeaking(true);
          Speech.speak(textForAudio, {
            language: audioLanguage === 'sanskrit' ? 'hi-IN' : 'en-US',
            pitch: audioLanguage === 'sanskrit' ? 0.85 : 1.0,
            rate: audioLanguage === 'sanskrit' ? 0.55 : 0.8,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false)
          });
        } catch (_) {
          setAudioError("Speech engine unavailable on this device.");
        }
      } else {
        setAudioError("Speech engine unavailable on this device.");
      }
    }
  }, [sloka, chapter, verse, isSpeaking, audioLanguage, hasTTSKey]);

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

  const handleAskScholar = async () => {
    if (!questionText.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: questionText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setQuestionText('');
    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await askScholar([...messages, userMsg], slokaContext);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e: any) {
      setAiError(
        e.message === 'MISSING_API_KEY'
          ? 'Please add your Claude API Key in Settings to use the Scholar.'
          : e.message || 'Failed to contact Scholar.'
      );
    } finally {
      setIsAiLoading(false);
    }
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={handleShare} 
                style={[s.headerBtn, isCapturing && { opacity: 0.5 }]}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#D4A44C" />
                ) : (
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color="#FFF"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleSave} style={[s.headerBtn, isSaved && { backgroundColor: 'rgba(212, 164, 76, 0.2)' }]}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? '#D4A44C' : '#FFF'}
                />
              </TouchableOpacity>
            </View>
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
                
                <View style={{ width: CARD_INNER_WIDTH }}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => {
                      const offset = e.nativeEvent.contentOffset.x;
                      setActiveCardTab(Math.round(offset / CARD_INNER_WIDTH));
                    }}
                    scrollEventThrottle={16}
                  >
                    {/* Page 0: Transliteration */}
                    <View style={{ width: CARD_INNER_WIDTH, alignItems: 'center' }}>
                      <Text style={s.translitText}>"{sloka.transliteration}"</Text>
                    </View>
                    
                    {/* Page 1: English Translation */}
                    <View style={{ width: CARD_INNER_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[s.translitText, { color: '#E0D5C5', fontStyle: 'normal' }]}>
                        "{cleanTranslation}"
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#D4A44C', marginTop: 12, letterSpacing: 1.5 }}>
                        CHAPTER {chapter} · VERSE {verse}
                      </Text>
                    </View>
                  </ScrollView>

                  {/* Swipe Indicators */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    <View style={[s.indicatorDot, activeCardTab === 0 && s.indicatorDotActive]} />
                    <View style={[s.indicatorDot, activeCardTab === 1 && s.indicatorDotActive]} />
                  </View>
                </View>

              </View>
            </View>

            {/* ─── Audio Player ─── */}
            <View style={{ marginHorizontal: 20, marginTop: 16 }}>
              {/* Language Tabs */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <TouchableOpacity 
                  onPress={() => { if (!isSpeaking) setAudioLanguage('sanskrit'); }}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    backgroundColor: audioLanguage === 'sanskrit' ? 'rgba(212, 164, 76, 0.2)' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1, borderColor: audioLanguage === 'sanskrit' ? 'rgba(212, 164, 76, 0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: audioLanguage === 'sanskrit' ? '#D4A44C' : '#777' }}>
                    🙏 Sanskrit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { if (!isSpeaking) setAudioLanguage('english'); }}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    backgroundColor: audioLanguage === 'english' ? 'rgba(212, 164, 76, 0.2)' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1, borderColor: audioLanguage === 'english' ? 'rgba(212, 164, 76, 0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: audioLanguage === 'english' ? '#D4A44C' : '#777' }}>
                    📖 Explanation
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Play Button */}
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
                  <Text style={s.audioTitle}>
                    {isSpeaking ? 'Playing...' : audioLanguage === 'sanskrit' ? 'Listen to Recitation' : 'Listen to Explanation'}
                  </Text>
                  <Text style={s.audioSub}>
                    {isSpeaking ? 'Tap to stop' : audioLanguage === 'sanskrit' ? 'Sanskrit verse chanting' : 'English translation audio'}
                  </Text>
                </View>
                {((audioLanguage === 'sanskrit' && isAudioCached) || (audioLanguage === 'english' && isExplanationCached)) && !isSpeaking && (
                  <View style={s.cachedBadge}>
                    <Text style={s.cachedText}>OFFLINE ✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              {audioError && (
                <Text style={{ color: '#E53935', fontSize: 12, marginTop: 4 }}>{audioError}</Text>
              )}
            </View>

            {/* ─── Translation ─── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>{language === 'hi' ? 'अनुवाद (HINDI)' : 'TRANSLATION'}</Text>
              <Text style={s.translationText}>
                "{cleanTranslation}"
              </Text>
            </View>

            {/* ─── Word-by-Word Breakdown ─── */}
            {wordPairs.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>WORD BY WORD BREAKDOWN</Text>
                <View style={s.wordGrid}>
                  {wordPairs.map((pair, ix) => (
                    <View key={ix} style={s.wordCard}>
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

            {/* ─── Expanded Purport (only if unique) ─── */}
            {purport && purport !== commentary?.meaning && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>EXPANDED PURPORT</Text>
                <Text style={s.bodyText}>{purport}</Text>
              </View>
            )}



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

          {/* ─── Hidden View for Image Capture ─── */}
          {sloka && (
            <View 
              collapsable={false}
              ref={cardRef} 
              style={{ position: 'absolute', top: -10000, left: -10000, opacity: 0 }}
            >
              <VerseCard 
                sanskrit={sloka.sanskrit}
                translation={cleanTranslation}
                chapter={chapter}
                verse={verse}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Floating Action Button (FAB) for AI */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setIsAiModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={24} color="#0D0D0D" />
      </TouchableOpacity>

      {/* Full-Screen AI Modal */}
      {isAiModalVisible && (
        <View style={s.aiModalOverlay}>
          <View style={s.aiModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chatbubbles" size={20} color="#D4A44C" />
              <Text style={{ color: '#D4A44C', fontSize: 16, fontWeight: '800' }}>Scholar AI</Text>
            </View>
            <TouchableOpacity onPress={() => setIsAiModalVisible(false)} style={s.headerBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {/* Predefined Questions */}
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

            {/* Chat Messages */}
            {messages.map((msg, i) => (
              <View key={i} style={{ marginBottom: 16, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <View style={{ maxWidth: '85%', borderRadius: 16, padding: 14, backgroundColor: msg.role === 'user' ? '#D4A44C' : '#1A1A1A' }}>
                  <Text style={{ fontSize: 15, lineHeight: 24, color: msg.role === 'user' ? '#0D0D0D' : '#E0D5C5' }}>{msg.content}</Text>
                </View>
              </View>
            ))}

            {isAiLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#D4A44C" />
                <Text style={{ color: '#777' }}>Scholar is reflecting...</Text>
              </View>
            )}
            
            {aiError && (
              <Text style={{ color: '#E53935', fontSize: 14, backgroundColor: 'rgba(229,57,53,0.1)', padding: 10, borderRadius: 8 }}>
                {aiError}
              </Text>
            )}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
            <View style={[s.inputRow, { margin: 20 }]}>
              <TextInput
                style={s.input}
                placeholder="Ask Claude..."
                placeholderTextColor="#555"
                multiline
                value={questionText}
                onChangeText={setQuestionText}
                editable={!isAiLoading}
              />
              <TouchableOpacity
                onPress={handleAskScholar}
                disabled={isAiLoading || !questionText.trim()}
                style={[s.sendBtn, (isAiLoading || !questionText.trim()) && { opacity: 0.4 }]}
              >
                <Ionicons name="send" size={16} color="#0D0D0D" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
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
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicatorDotActive: {
    backgroundColor: '#D4A44C',
  },

  // ── Audio ──
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  wordSanskrit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4A44C',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  wordMeaning: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
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
  
  // ── FAB & Modal ──
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4A44C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  aiModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0D0D',
    zIndex: 100,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
});
