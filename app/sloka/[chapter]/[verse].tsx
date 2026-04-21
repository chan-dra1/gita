import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
import { VerseCard } from '../../../src/components/VerseCard';
import { pickVerseShareDesign } from '../../../src/constants/verseShareDesigns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeColors } from '../../../src/context/ThemeContext';
// Dynamic import for AI to avoid web crash on top-level Anthropic-SDK load
import type { ChatMessage } from '../../../src/utils/ai';
import { getChapter, getSloka, getLocalizedTranslation } from '../../../src/utils/sloka';
import { getCommentaryForVerse, type Commentary } from '../../../src/utils/commentary';
import { t } from '../../../src/utils/i18n';
import { verseSourcesAlertTitle, verseTextProvenanceBody } from '../../../src/constants/verseTextProvenance';
import { addSlokaRead, isSlokaSaved, saveSloka, unsaveSloka, getOnboardingData, getTodaysSlokasReadCount, isSlokaRead } from '../../../src/utils/stats';
import { incrementGlobalSankalpa } from '../../../src/utils/karma';
import { getSlokaImage } from '../../../src/utils/slokaImages';
import { useLanguage } from '../../../src/context/LanguageContext';
import scholarAnswersData from '../../../src/data/scholar_answers.json';

// Safe import for DharmaBlocker
let DharmaBlocker: any = null;
try {
  DharmaBlocker = require('../../../modules/dharma-blocker').default;
} catch (e) {
  // Not available in Expo Go or web
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
  const { chapter: chapterStr, verse: verseStr, isDaily } = useLocalSearchParams<{
    chapter: string;
    verse: string;
    isDaily?: string;
  }>();
  const router = useRouter();
  const chapter = parseInt(chapterStr || '', 10);
  const verse = parseInt(verseStr || '', 10);
  const { language } = useLanguage();

  const paramsValid = Number.isFinite(chapter) && Number.isFinite(verse);
  const sloka = paramsValid ? getSloka(chapter, verse) : undefined;
  const chapterData = paramsValid ? getChapter(chapter) : undefined;
  const slokaImage = paramsValid ? getSlokaImage(chapter, verse) : undefined;

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
        english: getLocalizedTranslation(chapter, verse, sloka.translation_english, language),
        chapterName: sloka.chapterName || '',
      }
    : undefined;

  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAudioCached, setIsAudioCached] = useState(false);
  const [isExplanationCached, setIsExplanationCached] = useState(false);

  const scholarAnswersRaw: any = scholarAnswersData;
  const scholarAnswers = scholarAnswersRaw?.default || scholarAnswersRaw;

  const purport = null;
  const precomputedQuestions = sloka ? (scholarAnswers as Record<string, any[]>)[`${chapter}:${verse}`] || [] : [];

  // Track sloka view on mount and load saved status
  useEffect(() => {
    if (isNaN(chapter) || isNaN(verse)) return;
    const loadData = async () => {
      // Track that this sloka was read (only if not viewing via Daily Verse)
      if (isDaily !== 'true') {
        await addSlokaRead(chapter, verse);
        setHasBeenRead(true);
        incrementGlobalSankalpa(1).catch(() => {});
      } else {
        // If it's a daily verse, we check if it was already read to show the UI state
        const read = await isSlokaRead(chapter, verse);
        setHasBeenRead(read);
      }

      if (Platform.OS === 'android' && DharmaBlocker && isDaily !== 'true') {
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

      // Load commentary (Hindi uses chapter summaries when verse JSON is English-only)
      try {
        setCommentary(getCommentaryForVerse(chapter, verse, language));
      } catch (e) {
        console.error('[Sloka] commentary load failed', e);
        setCommentary(null);
      }
    };

    loadData();
  }, [chapter, verse, language]);

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
    if ((Platform.OS as string) === 'web') return; // Handled above

    setIsCapturing(true);
    try {
      // Dynamic require to avoid web crash
      const { captureRef } = require('react-native-view-shot');
      
      // Capture the off-screen VerseCard component
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });

      const shareUrl = `https://gita-rouge-tau.vercel.app/download`;
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share Bhagavad Gita ${chapter}.${verse}`,
        UTI: 'public.png',
      });
    } catch (error: any) {
      console.error('Error sharing sloka card', error);
      Alert.alert(t('sharingFailedTitle', language), t('sharingFailedMessage', language));
      
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

  useEffect(() => {
    if (!paramsValid) return;
    hasCachedAudio(chapter, verse, 'sanskrit').then(setIsAudioCached);
    hasCachedAudio(chapter, verse, 'english').then(setIsExplanationCached);
  }, [chapter, verse, paramsValid]);

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

  const { colors, isDark } = useTheme();

  const s = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 2,
    },

    // ── Sanskrit Card ──
    sanskritCard: {
      marginHorizontal: 20,
      marginTop: 8,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    goldBar: {
      height: 3,
      backgroundColor: colors.primary,
    },
    sanskritInner: {
      padding: 28,
      alignItems: 'center',
    },
    sanskritText: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 36,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      width: '50%',
      marginVertical: 20,
    },
    translitText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    indicatorDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    indicatorDotActive: {
      backgroundColor: colors.primary,
    },

    // ── Audio ──
    audioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    audioTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    audioSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // ── Sections ──
    section: {
      marginHorizontal: 20,
      marginTop: 20,
      padding: 20,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 14,
    },
    translationText: {
      fontSize: 17,
      color: colors.text,
      lineHeight: 28,
      fontStyle: 'italic',
    },
    bodyText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 26,
    },

    // ── Word Grid ──
    wordGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    wordCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: '45%',
      flexGrow: 1,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    wordSanskrit: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    wordMeaning: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // ── Q&A ──
    qaCard: {
      marginBottom: 12,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    qaQuestion: {
      padding: 14,
      backgroundColor: colors.border,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    qaQuestionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    qaAnswer: {
      padding: 14,
    },
    qaAnswerText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // ── Input ──
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
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
      backgroundColor: colors.primary,
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
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    navText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    navNext: {
      flex: 1.2,
      paddingVertical: 16,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    navNextText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.background,
    },
    
    // ── FAB & Modal ──
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    aiModalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      zIndex: 100,
    },
    aiModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 40 : 60,
      paddingBottom: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  }), [colors, isDark]);


  if (!paramsValid) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A44C" />
      </SafeAreaView>
    );
  }

  if (!sloka) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <Text style={{ fontSize: 18, color: '#999' }}>{t('slokaNotFound', language)}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#D4A44C', fontWeight: '600', fontSize: 16 }}>
            {t('goBack', language)}
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
      const { askScholar } = require('../../../src/utils/ai');
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {/* ─── Dark Header ─── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={s.headerLabel}>
                {t('slokaHeaderCv', language, { chapter, verse })}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(verseSourcesAlertTitle(language), verseTextProvenanceBody(language))
                }
                style={s.headerBtn}
                accessibilityLabel={t('a11yTextSources', language)}
              >
                <Ionicons name="information-circle-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleShare} 
                style={[s.headerBtn, isCapturing && { opacity: 0.5 }]}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={colors.text}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleSave} style={[s.headerBtn, isSaved && { backgroundColor: colors.border }]}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? colors.primary : colors.text}
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
                      <Text style={[s.translitText, { color: colors.text, fontStyle: 'normal' }]}>
                        "{cleanTranslation}"
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, marginTop: 12, letterSpacing: 1.5 }}>
                        {t('slokaHeaderCv', language, { chapter, verse })}
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
                    backgroundColor: audioLanguage === 'sanskrit' ? `${colors.primary}1A` : colors.card,
                    borderWidth: 1, borderColor: audioLanguage === 'sanskrit' ? `${colors.primary}40` : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: audioLanguage === 'sanskrit' ? colors.primary : colors.textSecondary }}>
                    {t('audioTabSanskrit', language)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { if (!isSpeaking) setAudioLanguage('english'); }}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    backgroundColor: audioLanguage === 'english' ? `${colors.primary}1A` : colors.card,
                    borderWidth: 1, borderColor: audioLanguage === 'english' ? `${colors.primary}40` : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: audioLanguage === 'english' ? colors.primary : colors.textSecondary }}>
                    {t('audioTabExplanation', language)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Play Button */}
              <TouchableOpacity onPress={handlePlayPause} style={s.audioRow} activeOpacity={0.7}>
                <View style={[s.playBtn, isSpeaking && { backgroundColor: colors.primary }]}>
                  {isAudioLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={isSpeaking ? 'stop' : 'play'}
                      size={20}
                      color={isSpeaking ? colors.background : colors.primary}
                      style={{ marginLeft: isSpeaking ? 0 : 2 }}
                    />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={s.audioTitle}>
                    {isSpeaking
                      ? t('audioPlaying', language)
                      : audioLanguage === 'sanskrit'
                        ? t('audioListenRecitation', language)
                        : t('audioListenExplanation', language)}
                  </Text>
                  <Text style={s.audioSub}>
                    {isSpeaking
                      ? t('audioTapToStop', language)
                      : audioLanguage === 'sanskrit'
                        ? t('audioSubSanskrit', language)
                        : t('audioSubExplanation', language)}
                  </Text>
                </View>
                {/* Audio player play button handled below */}
              </TouchableOpacity>
              {audioError && (
                <Text style={{ color: '#E53935', fontSize: 12, marginTop: 4 }}>{audioError}</Text>
              )}
            </View>

            {/* ─── Translation ─── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('sectionTranslation', language)}</Text>
              <Text style={s.translationText}>
                "{cleanTranslation}"
              </Text>
            </View>

            {/* ─── Word-by-Word Breakdown ─── */}
            {wordPairs.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>{t('sectionWordByWord', language)}</Text>
                {language === 'hi' && (
                  <Text style={[s.bodyText, { marginBottom: 10, opacity: 0.85 }]}>
                    {t('wordMeaningsBanner', language)}
                  </Text>
                )}
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
                    <Text style={s.sectionTitle}>{t('sectionSpiritualMeaning', language)}</Text>
                    <Text style={s.bodyText}>{commentary.meaning}</Text>
                  </>
                )}
                {commentary.application && (
                  <View style={{ marginTop: commentary.meaning ? 20 : 0 }}>
                    <Text style={s.sectionTitle}>{t('sectionInYourLife', language)}</Text>
                    <Text style={s.bodyText}>{commentary.application}</Text>
                  </View>
                )}
              </View>
            )}

            {/* ─── Expanded Purport (only if unique) ─── */}
            {purport && purport !== commentary?.meaning && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>{t('sectionExpandedPurport', language)}</Text>
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
              <Ionicons name="chevron-back" size={16} color={verse <= 1 ? colors.textSecondary : colors.primary} />
              <Text style={[s.navText, { color: verse <= 1 ? colors.textSecondary : colors.primary }]}>
                {t('navPrevious', language)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => goToVerse(verse + 1)}
              style={s.navNext}
            >
              <Text style={s.navNextText}>{t('navNextVerse', language)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.background} />
            </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ─── Hidden View for Image Capture (Native Only) ─── */}
          {sloka && Platform.OS !== 'web' && (
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
        <Ionicons name="chatbubbles" size={24} color={colors.background} />
      </TouchableOpacity>

      {/* Full-Screen AI Modal */}
      {isAiModalVisible && (
        <View style={s.aiModalOverlay}>
          <View style={s.aiModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chatbubbles" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '800' }}>Scholar AI</Text>
            </View>
            <TouchableOpacity onPress={() => setIsAiModalVisible(false)} style={s.headerBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
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
                <View style={{ maxWidth: '85%', borderRadius: 16, padding: 14, backgroundColor: msg.role === 'user' ? colors.primary : colors.card }}>
                  <Text style={{ fontSize: 15, lineHeight: 24, color: msg.role === 'user' ? colors.background : colors.text }}>{msg.content}</Text>
                </View>
              </View>
            ))}

            {isAiLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary }}>Scholar is reflecting...</Text>
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
                placeholderTextColor={colors.textSecondary}
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
                <Ionicons name="send" size={16} color={colors.background} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}