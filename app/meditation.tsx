import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar,
  ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useMeditationPlayer } from '../src/hooks/useMeditationPlayer';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { syncWidgetData } from '../src/utils/widgets';
import { getLocalizedTranslation } from '../src/utils/sloka';
import { useLanguage } from '../src/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '../src/utils/i18n';

const { width, height } = Dimensions.get('window');

// ─── Listening Modes ─────────────────────────────────────────────
type ListeningMode = 'chant_only' | 'chant_meaning' | 'full';

export default function MeditationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language } = useLanguage();

  const LISTENING_MODES = useMemo(
    () => [
      {
        key: 'chant_only' as ListeningMode,
        icon: 'musical-notes',
        title: t('medModeChantOnly', language),
        subtitle: t('medModeChantOnlySub', language),
        color: '#E8B94A',
      },
      {
        key: 'chant_meaning' as ListeningMode,
        icon: 'book',
        title: t('medModeChantMeaning', language),
        subtitle: t('medModeChantMeaningSub', language),
        color: '#6BB5E8',
      },
      {
        key: 'full' as ListeningMode,
        icon: 'school',
        title: t('medModeDeep', language),
        subtitle: t('medModeDeepSub', language),
        color: '#A78BFA',
      },
    ],
    [language],
  );

  const SACRED_COUNTS = useMemo(
    () => [
      { value: 1, label: '1', desc: t('medSacredSingle', language) },
      { value: 3, label: '3', desc: t('medSacredTrinity', language) },
      { value: 7, label: '7', desc: t('medSacredSapta', language) },
      { value: 11, label: '11', desc: t('medSacredEkadasa', language) },
      { value: 21, label: '21', desc: t('medSacredSacred', language) },
      { value: 108, label: 'ॐ', desc: t('medSacredMala', language) },
    ],
    [language],
  );
  const player = useMeditationPlayer();
  const [targetCount, setTargetCount] = useState(5);
  const [repeatCount, setRepeatCount] = useState(1);
  const [customRepeat, setCustomRepeat] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [startFromLast, setStartFromLast] = useState(true);
  const [listeningMode, setListeningMode] = useState<ListeningMode>('chant_meaning');

  // Breathing animation value
  const breatheValue = useSharedValue(1);
  const glowOpacity = useSharedValue(0.08);

  useEffect(() => {
    if (player.status === 'playing_sanskrit' || player.status === 'playing_english' || player.status === 'playing_meaning') {
      breatheValue.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.06, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      breatheValue.value = withTiming(1, { duration: 1000 });
      glowOpacity.value = withTiming(0.08, { duration: 1000 });
    }
  }, [player.status]);

  // Deep Link Auto-Play Trigger
  useEffect(() => {
    if (params.chapter && params.verse && player.status === 'idle') {
      const ch = parseInt(params.chapter as string);
      const v = parseInt(params.verse as string);
      if (!isNaN(ch) && !isNaN(v)) {
        setListeningMode('full');
        setTargetCount(1);
        setRepeatCount(1);
        player.startSession(1, {
          specificVerse: { chapter: ch, verse: v },
          listeningMode: 'full',
          repeatCount: 1,
        });
      }
    }
  }, [params.chapter, params.verse]);

  // Sync widget when the verse changes in meditation
  useEffect(() => {
    const currentItem = player.queue[player.currentIndex];
    if (currentItem) {
      syncWidgetData({
        chapter: currentItem.chapter,
        verse: currentItem.verse,
        sanskrit: currentItem.sloka.sanskrit,
        english: getLocalizedTranslation(
          currentItem.chapter,
          currentItem.verse,
          currentItem.sloka.translation_english,
          language
        ),
      });
    }
  }, [player.currentIndex, player.queue, language]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheValue.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleStart = () => {
    player.startSession(targetCount, { 
      startFromLastRead: startFromLast, 
      repeatCount: repeatCount,
      listeningMode: listeningMode,
    });
  };

  const handleStop = async () => {
    await player.stop();
    router.back();
  };

  const handleRepeatSelect = (value: number) => {
    setRepeatCount(value);
    setShowCustomInput(false);
    setCustomRepeat('');
  };

  const handleCustomRepeat = () => {
    const num = parseInt(customRepeat);
    if (num > 0 && num <= 1000) {
      setRepeatCount(num);
    }
  };

  // ─── Render Setup UI ───
  if (player.status === 'idle') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
        <ScrollView 
          contentContainerStyle={s.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{t('meditationTitle', language)}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Icon & Title */}
          <View style={s.heroSection}>
            <View style={s.setupIconBox}>
              <Ionicons name="headset" size={36} color="#D4A44C" />
            </View>
            <Text style={s.setupTitle}>{t('meditationBeginPractice', language)}</Text>
            <Text style={s.setupDesc}>{t('meditationSetupDesc', language)}</Text>
          </View>

          {/* Listening Mode Selector */}
          <View style={s.sectionContainer}>
            <Text style={s.sectionLabel}>{t('meditationListeningSection', language)}</Text>
            <View style={s.modeGrid}>
              {LISTENING_MODES.map((mode) => {
                const isActive = listeningMode === mode.key;
                return (
                  <TouchableOpacity
                    key={mode.key}
                    onPress={() => setListeningMode(mode.key)}
                    style={[s.modeCard, isActive && { borderColor: mode.color, backgroundColor: `${mode.color}12` }]}
                    activeOpacity={0.7}
                  >
                    <View style={[s.modeIconWrap, { backgroundColor: isActive ? `${mode.color}25` : 'rgba(255,255,255,0.04)' }]}>
                      <Ionicons name={mode.icon as any} size={22} color={isActive ? mode.color : '#666'} />
                    </View>
                    <Text style={[s.modeTitle, isActive && { color: mode.color }]}>{mode.title}</Text>
                    <Text style={s.modeSubtitle}>{mode.subtitle}</Text>
                    {isActive && (
                      <View style={[s.modeCheck, { backgroundColor: mode.color }]}>
                        <Ionicons name="checkmark" size={12} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Verse Count */}
          <View style={s.sectionContainer}>
            <Text style={s.sectionLabel}>{t('meditationNumVerses', language)}</Text>
            <View style={s.sliderCard}>
              <Text style={s.sliderValue}>{targetCount}</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={targetCount}
                onValueChange={setTargetCount}
                minimumTrackTintColor="#D4A44C"
                maximumTrackTintColor="rgba(255,255,255,0.08)"
                thumbTintColor="#FFF"
              />
              <View style={s.sliderMarkers}>
                <Text style={s.sliderMarker}>1</Text>
                <Text style={s.sliderMarker}>10</Text>
                <Text style={s.sliderMarker}>20</Text>
              </View>
            </View>
          </View>

          {/* Repeat Count (Sacred) */}
          <View style={s.sectionContainer}>
            <Text style={s.sectionLabel}>{t('meditationRepeatEach', language)}</Text>
            <View style={s.repeatCard}>
              <View style={s.repeatGrid}>
                {SACRED_COUNTS.map((item) => {
                  const isActive = repeatCount === item.value && !showCustomInput;
                  return (
                    <TouchableOpacity 
                      key={item.value}
                      onPress={() => handleRepeatSelect(item.value)}
                      style={[s.sacredBtn, isActive && s.sacredBtnActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.sacredBtnLabel, isActive && s.sacredBtnLabelActive]}>{item.label}</Text>
                      <Text style={[s.sacredBtnDesc, isActive && s.sacredBtnDescActive]}>{item.desc}</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Custom */}
                <TouchableOpacity 
                  onPress={() => setShowCustomInput(true)}
                  style={[s.sacredBtn, showCustomInput && s.sacredBtnActive]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color={showCustomInput ? "#0D0D0D" : "#888"} />
                  <Text style={[s.sacredBtnDesc, showCustomInput && s.sacredBtnDescActive]}>{t('medRepeatCustom', language)}</Text>
                </TouchableOpacity>
              </View>

              {showCustomInput && (
                <View style={s.customInputRow}>
                  <TextInput
                    style={s.customInput}
                    placeholder={t('medRepeatPlaceholder', language)}
                    placeholderTextColor="#555"
                    keyboardType="number-pad"
                    value={customRepeat}
                    onChangeText={setCustomRepeat}
                    onSubmitEditing={handleCustomRepeat}
                    maxLength={4}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleCustomRepeat} style={s.customInputBtn}>
                    <Ionicons name="checkmark" size={20} color="#0D0D0D" />
                  </TouchableOpacity>
                </View>
              )}

              {repeatCount > 1 && (
                <Text style={s.repeatNote}>
                  {t('medRepeatNote', language, { count: repeatCount })}
                </Text>
              )}
            </View>
          </View>

          {/* Continue from last */}
          <TouchableOpacity 
            onPress={() => setStartFromLast(!startFromLast)}
            style={[s.toggleCard, startFromLast && s.toggleCardActive]}
            activeOpacity={0.7}
          >
            <View style={s.toggleLeft}>
              <Ionicons name="footsteps" size={20} color={startFromLast ? "#0D0D0D" : "#D4A44C"} />
              <View>
                <Text style={[s.toggleTitle, startFromLast && s.toggleTitleActive]}>{t('medContinueLastTitle', language)}</Text>
                <Text style={[s.toggleSubtitle, startFromLast && s.toggleSubtitleActive]}>{t('medContinueLastSub', language)}</Text>
              </View>
            </View>
            <View style={[s.toggleSwitch, startFromLast && s.toggleSwitchActive]}>
              <View style={[s.toggleDot, startFromLast && s.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          {/* Start Button */}
          <TouchableOpacity onPress={handleStart} style={s.startBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={['#E8B94A', '#D4A44C', '#B8912E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.startBtnGradient}
            >
              <Ionicons name="play" size={24} color="#0D0D0D" />
              <Text style={s.startBtnText}>{t('medBeginCta', language)}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render Completed UI ───
  if (player.status === 'completed') {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center' }]}>
        <View style={s.completedContent}>
          <Animated.View entering={FadeIn.duration(1000)}>
            <View style={s.completedIconWrap}>
              <Ionicons name="flower" size={64} color="#4ADE80" />
            </View>
          </Animated.View>
          <Text style={s.completedTitle}>{t('medCompleteTitle', language)}</Text>
          <Text style={s.completedDesc}>
            {t('medCompleteDesc', language, { count: targetCount })}
          </Text>
          <View style={s.completedStats}>
            <View style={s.completedStatItem}>
              <Text style={s.completedStatValue}>{targetCount}</Text>
              <Text style={s.completedStatLabel}>{t('medStatVerses', language)}</Text>
            </View>
            <View style={s.completedStatDivider} />
            <View style={s.completedStatItem}>
              <Text style={s.completedStatValue}>{repeatCount}x</Text>
              <Text style={s.completedStatLabel}>{t('medStatRepeats', language)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={s.doneBtn} activeOpacity={0.8}>
            <Text style={s.doneBtnText}>{t('medReturnHome', language)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Active Playback UI ───
  const currentItem = player.queue[player.currentIndex];
  const isPlayingSanskrit = player.status === 'playing_sanskrit';
  const isPlayingMeaning = player.status === 'playing_meaning';
  const isPlayingEnglish = player.status === 'playing_english';

  const getStatusLabel = () => {
    if (isPlayingSanskrit) return t('medStatusChanting', language);
    if (isPlayingMeaning) return t('medStatusCommentary', language);
    return t('medStatusMeaning', language);
  };

  const getStatusColor = () => {
    if (isPlayingSanskrit) return '#E8B94A';
    if (isPlayingMeaning) return '#A78BFA';
    return '#6BB5E8';
  };

  return (
    <View style={s.activeContainer}>
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1, zIndex: 10 }}>
        {/* Header Progress */}
        <View style={s.activeHeader}>
          <TouchableOpacity onPress={handleStop} style={s.stopBtn}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: `${player.progress * 100}%` as any }]} />
          </View>
          <Text style={s.progressText}>
            {player.currentIndex + 1}/{player.queue.length}
            {player.repeatCount > 1 && ` · ${player.currentRepeat}/${player.repeatCount}`}
          </Text>
        </View>

        {/* Ambient Display */}
        <View style={s.ambientDisplay}>
          <Animated.View style={[s.ambientGlow, animatedStyle, glowStyle]} />
          
          {currentItem && (
            <Animated.View style={s.verseInfoBox} entering={FadeIn.duration(600)}>
              <Text style={s.verseChapterRef}>
                {t('medChapterVerseShort', language, { chapter: currentItem.chapter, verse: currentItem.verse })}
              </Text>
              
              {isPlayingSanskrit ? (
                <>
                  <Text style={s.ambientSanskrit}>{currentItem.sloka.sanskrit}</Text>
                  <Text style={s.ambientTransl}>{currentItem.sloka.transliteration}</Text>
                </>
              ) : (
                <ScrollView 
                  style={s.meaningScroll} 
                  contentContainerStyle={s.meaningScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={s.ambientEnglish}>
                    {getLocalizedTranslation(
                      currentItem.chapter,
                      currentItem.verse,
                      currentItem.sloka.translation_english,
                      language
                    )}
                  </Text>
                </ScrollView>
              )}

              <View style={[s.statusPillWrap, { backgroundColor: `${getStatusColor()}20` }]}>
                <View style={[s.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={[s.statusPillText, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Verse label */}
        {currentItem && (
          <View style={s.verseNavLabel}>
            <Text style={s.verseNavText}>
              {t('medVerseNavLabel', language, {
                chapter: currentItem.chapter,
                verse: currentItem.verse,
                current: player.currentIndex + 1,
                total: player.queue.length,
              })}
            </Text>
          </View>
        )}

        {/* Controls — Prev | Play/Pause | Next */}
        <View style={s.controlsContainer}>
          {/* Previous verse */}
          <TouchableOpacity
            onPress={() => player.skipTo(Math.max(0, player.currentIndex - 1))}
            style={s.sideControlBtn}
            activeOpacity={0.7}
            disabled={player.currentIndex === 0}
          >
            <Ionicons
              name="play-skip-back"
              size={26}
              color={player.currentIndex === 0 ? '#333' : '#CCC'}
            />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity
            onPress={player.status === 'paused' ? player.resume : player.pause}
            style={s.mainControlBtn}
            activeOpacity={0.8}
          >
            <Ionicons
              name={player.status === 'paused' ? "play" : "pause"}
              size={32}
              color="#0D0D0D"
              style={player.status === 'paused' ? { marginLeft: 4 } : {}}
            />
          </TouchableOpacity>

          {/* Next verse */}
          <TouchableOpacity
            onPress={() => player.skipTo(Math.min(player.queue.length - 1, player.currentIndex + 1))}
            style={s.sideControlBtn}
            activeOpacity={0.7}
            disabled={player.currentIndex >= player.queue.length - 1}
          >
            <Ionicons
              name="play-skip-forward"
              size={26}
              color={player.currentIndex >= player.queue.length - 1 ? '#333' : '#CCC'}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  
  heroSection: { alignItems: 'center', paddingVertical: 20 },
  setupIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(212, 164, 76, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212, 164, 76, 0.15)' },
  setupTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8, fontFamily: 'serif' },
  setupDesc: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  
  // Section
  sectionContainer: { marginTop: 28 },
  sectionLabel: { fontSize: 11, color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  
  // Listening Mode Cards
  modeGrid: { gap: 10 },
  modeCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  modeIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 15, fontWeight: '700', color: '#CCC', flex: 1 },
  modeSubtitle: { position: 'absolute', right: 48, bottom: 16, fontSize: 11, color: '#555' },
  modeCheck: { 
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },

  // Slider
  sliderCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sliderValue: { fontSize: 42, fontWeight: '800', color: '#D4A44C', textAlign: 'center', marginBottom: 8, fontFamily: 'serif' },
  sliderMarkers: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 },
  sliderMarker: { fontSize: 11, color: '#555' },

  // Repeat
  repeatCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  repeatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sacredBtn: { 
    width: (width - 40 - 32 - 24) / 4, paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', gap: 4,
  },
  sacredBtnActive: { backgroundColor: '#D4A44C' },
  sacredBtnLabel: { fontSize: 18, fontWeight: '800', color: '#AAA' },
  sacredBtnLabelActive: { color: '#0D0D0D' },
  sacredBtnDesc: { fontSize: 9, fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  sacredBtnDescActive: { color: '#0D0D0D' },
  
  customInputRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  customInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: 'rgba(212, 164, 76, 0.3)' },
  customInputBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#D4A44C', alignItems: 'center', justifyContent: 'center' },
  
  repeatNote: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 18 },

  // Toggle
  toggleCard: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  toggleCardActive: { borderColor: 'rgba(212, 164, 76, 0.3)', backgroundColor: 'rgba(212, 164, 76, 0.08)' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: '#CCC' },
  toggleTitleActive: { color: '#D4A44C' },
  toggleSubtitle: { fontSize: 11, color: '#555', marginTop: 2 },
  toggleSubtitleActive: { color: '#8B7D3A' },
  toggleSwitch: { width: 44, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', padding: 3, justifyContent: 'center' },
  toggleSwitchActive: { backgroundColor: '#D4A44C' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#555' },
  toggleDotActive: { backgroundColor: '#0D0D0D', alignSelf: 'flex-end' },
  
  // Start
  startBtn: { marginTop: 32, borderRadius: 20, overflow: 'hidden' },
  startBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  startBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  // Completed
  completedContent: { alignItems: 'center', paddingHorizontal: 32 },
  completedIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(74, 222, 128, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.15)' },
  completedTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 12, fontFamily: 'serif' },
  completedDesc: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  completedStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 40, marginBottom: 40, gap: 32 },
  completedStatItem: { alignItems: 'center' },
  completedStatValue: { fontSize: 28, fontWeight: '800', color: '#D4A44C', fontFamily: 'serif' },
  completedStatLabel: { fontSize: 11, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  completedStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  doneBtn: { backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  doneBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  // Active Playback
  activeContainer: { flex: 1, backgroundColor: '#050508' },
  activeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  stopBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D4A44C', borderRadius: 2 },
  progressText: { color: '#666', fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], minWidth: 60, textAlign: 'right' },

  ambientDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  ambientGlow: { 
    position: 'absolute', width: width * 0.75, height: width * 0.75, borderRadius: width * 0.375, 
    backgroundColor: '#D4A44C',
    shadowColor: '#D4A44C', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 80,
  },
  
  verseInfoBox: { alignItems: 'center', zIndex: 2, maxWidth: width - 48 },
  verseChapterRef: { fontSize: 12, color: '#D4A44C', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24, opacity: 0.8 },
  ambientSanskrit: { fontSize: 22, color: '#FFF', textAlign: 'center', lineHeight: 36, marginBottom: 16, fontWeight: '600' },
  ambientTransl: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, fontStyle: 'italic', marginBottom: 24 },
  meaningScroll: { maxHeight: height * 0.4 },
  meaningScrollContent: { alignItems: 'center' },
  ambientEnglish: { fontSize: 17, color: '#D8D0C0', textAlign: 'center', lineHeight: 28, marginBottom: 24, fontWeight: '400' },
  
  statusPillWrap: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, 
    borderRadius: 20, gap: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  controlsContainer: { 
    paddingBottom: 50, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  mainControlBtn: { 
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#D4A44C', 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D4A44C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  sideControlBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  verseNavLabel: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  verseNavText: {
    fontSize: 12, color: '#666', fontWeight: '600',
    letterSpacing: 0.5, textAlign: 'center',
  },
});
