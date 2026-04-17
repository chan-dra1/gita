import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Switch, Platform, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import Purchases from 'react-native-purchases'; 
import { Config } from '../../src/constants/config';

// Safe import: DateTimePicker crashes on web
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  // Not available on web
}

// Safe import: DharmaBlocker native module is only available in dev builds
let DharmaBlocker: any = null;
try {
  DharmaBlocker = require('../../modules/dharma-blocker').default;
} catch (e) {
  // Not available in Expo Go or web
}

// Fallback stub if module loaded but is null/undefined
if (!DharmaBlocker) {
  DharmaBlocker = {
    requestPermissions: async () => { console.warn("DharmaBlocker not available"); return false; },
    hasUsagePermission: () => false,
    startBlocking: (_apps: string[]) => console.warn("DharmaBlocker not available"),
    stopBlocking: () => console.warn("DharmaBlocker not available"),
    getInstalledApps: async () => { console.warn("DharmaBlocker not available"); return []; },
    getAuthorizationStatus: async () => 'unsupported' as const,
    hasFamilySelection: () => false,
    presentFamilyActivityPicker: async () => null,
    setFamilySelectionBase64: async () => null,
    clearFamilySelection: async () => null,
  };
}
import { 
  getAllStats, 
  getSlokasRead, 
  getSavedSlokas, 
  getOnboardingData, 
  saveOnboardingStep, 
  getProfileName, 
  saveProfileName, 
  getBlockedApps,
  saveBlockedApps,
  type OnboardingData, 
  type SlokaReadEntry 
} from '../../src/utils/stats';
import { subscribeToGlobalSankalpa } from '../../src/utils/karma';
import { t, type Language } from '../../src/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme, ThemeMode, ThemeColors } from '../../src/context/ThemeContext';
import { pushLocalDataToCloud, pullCloudDataToLocal } from '../../src/utils/cloudSync';
import { scheduleSmartNotifications } from '../../src/utils/notifications';
import { AppSelectorModal } from '../../src/components/AppSelectorModal';

interface StatsData {
  slokasRead: number;
  dayStreak: number;
  saved: number;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [recentSlokas, setRecentSlokas] = useState<SlokaReadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { mode, setMode, colors, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 24, 
      paddingTop: 12, 
      paddingBottom: 20,
    },
    headerSubtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSecondary },
    headerTitle: { fontSize: 28, fontWeight: '800', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: colors.text },
    profileButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
    avatarText: { fontSize: 18, fontWeight: '800', color: colors.background },
    
    scrollContent: { paddingBottom: 60 },
    
    statsCard: { 
      flexDirection: 'row', 
      marginHorizontal: 20, 
      marginTop: 16, 
      borderRadius: 20, 
      paddingVertical: 20,
      alignItems: 'center',
      borderWidth: 1,
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 10, 
      elevation: 3,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    statDivider: { width: 1, height: '60%', backgroundColor: colors.border },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 26, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSecondary },

    section: { marginTop: 24, marginHorizontal: 20 },
    sectionHeader: { fontSize: 12, fontWeight: '700', marginLeft: 8, marginBottom: 8, letterSpacing: 1, color: colors.textSecondary },
    sectionBody: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    
    row: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 14, 
      paddingRight: 16, 
      paddingLeft: 16, 
      borderBottomWidth: StyleSheet.hairlineWidth, 
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    rowLast: { borderBottomWidth: 0 },
    iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    rowContent: { flex: 1, justifyContent: 'center' },
    rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    rowDesc: { fontSize: 12, marginTop: 2, color: colors.textSecondary },
    rightContent: { flexDirection: 'row', alignItems: 'center' },
    rowValue: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
    
    footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
    footerText: { fontSize: 12, marginBottom: 4, fontWeight: '500', letterSpacing: 0.5, color: colors.textSecondary },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { borderRadius: 24, padding: 24, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, color: colors.text },
    inputWrapper: { width: '100%', marginBottom: 24 },
    textInput: { width: '100%', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
    modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    modalButtonPrimary: { backgroundColor: colors.primary, borderWidth: 0 },
    modalButtonText: { fontSize: 16, fontWeight: '700', color: colors.text },
    modalButtonPrimaryText: { fontSize: 16, fontWeight: '800', color: colors.background },

    langOption: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.background,
    },
    langOptionSelected: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    langOptionText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    langOptionTextSelected: {
      fontWeight: '700',
      color: colors.primary,
    },

    modalContentLarge: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, width: '100%', height: '85%', position: 'absolute', bottom: 0, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitleLarge: { fontSize: 24, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: colors.text },
    modalClose: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border },
    modalScroll: { flex: 1 },
    modalSectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 8, color: colors.text },
    modalText: { fontSize: 15, lineHeight: 24, color: colors.textSecondary },

    accountHero: {
      padding: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    accountHeroTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    accountAvatarLg: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountAvatarLgText: { fontSize: 24, fontWeight: '800', color: colors.background },
    accountMeta: { flex: 1, minWidth: 0 },
    accountDisplayName: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    accountEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 5 },
    accountChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    accountChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(212,164,76,0.12)' : 'rgba(181,135,42,0.12)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(212,164,76,0.25)' : 'rgba(181,135,42,0.22)',
    },
    accountChipText: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.4 },
    accountUidText: { fontSize: 12, color: colors.textSecondary, marginTop: 14, letterSpacing: 0.2 },
    signInCard: {
      padding: 22,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    signInTitle: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
    signInSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 21 },
    signInCta: {
      marginTop: 18,
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
    },
    signInCtaText: { fontSize: 16, fontWeight: '800', color: colors.background, letterSpacing: 0.3 },
  }), [colors, isDark]);

  // New Features
  const [profileName, setProfileName] = useState('Seeker');
  const [showNameModal, setShowNameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Toggle States
  const [dharmaMode, setDharmaMode] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [iosFamilySelection, setIosFamilySelection] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Audio Cache States
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [prefLanguages, setPrefLanguages] = useState<string[]>(['sanskrit', 'english']);
  const [autoCleanup, setAutoCleanup] = useState(true);

  // Global Community
  const [globalSankalpa, setGlobalSankalpa] = useState(0);
  const pulseValue = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: withTiming(pulseValue.value > 1.05 ? 0.8 : 1),
  }));

  const triggerPulse = useCallback(() => {
    pulseValue.value = withSequence(
      withTiming(1.15, { duration: 200, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
      withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 1, 0.5, 1) })
    );
  }, []);

  const { user, loading: authLoading, logout } = useAuth();
  const [accountBusy, setAccountBusy] = useState(false);

  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [allStats, onboarding, slokasRead, saved, pName] = await Promise.all([
        getAllStats(),
        getOnboardingData(),
        getSlokasRead(),
        getSavedSlokas(),
        getProfileName(),
      ]);
      setStats(allStats);
      setOnboardingData(onboarding);
      setProfileName(pName);
      setEditNameValue(pName);
      
      // Load toggles from onboarding data if available
      if (onboarding?.dharmaMode !== undefined) setDharmaMode(onboarding.dharmaMode);
      if (onboarding?.remindersEnabled !== undefined) setRemindersEnabled(onboarding.remindersEnabled);
      if (onboarding?.reminderTime) setReminderTime(new Date(onboarding.reminderTime));
      
      const blocked = await getBlockedApps();
      setBlockedApps(blocked);

      if (Platform.OS === 'ios' && DharmaBlocker?.hasFamilySelection) {
        try {
          setIosFamilySelection(DharmaBlocker.hasFamilySelection());
        } catch {
          setIosFamilySelection(false);
        }
      } else {
        setIosFamilySelection(false);
      }

      // Check RevenueCat status
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isSelfManagedPremium = new Date() < new Date('2026-05-10');
        setIsPremium(!!customerInfo.entitlements.active[Config.ENTITLEMENT_ID] || isSelfManagedPremium);
      } catch (e) {
        // Fallback to promo logic if SDK fails or offline
        const isSelfManagedPremium = new Date() < new Date('2026-05-10');
        setIsPremium(isSelfManagedPremium);
      }

      // Load Audio Library Settings
      const { getCacheSize, formatCacheSize } = require('../../src/utils/audio');
      const size = await getCacheSize();
      setCacheSize(formatCacheSize(size));

      const storedLangs = await AsyncStorage.getItem('gita_audio_langs');
      if (storedLangs) setPrefLanguages(JSON.parse(storedLangs));

      const storedCleanup = await AsyncStorage.getItem('gita_audio_auto_cleanup');
      if (storedCleanup !== null) setAutoCleanup(storedCleanup === 'true');

      setRecentSlokas(slokasRead.slice(-3).reverse());
    } catch (error) {
      console.warn('Failed to load stats or settings:', error);
      // Set some defaults to prevent crash
      setStats({ slokasRead: 0, dayStreak: 0, saved: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    // Subscribe to Global Sankalpa
    const unsubscribe = subscribeToGlobalSankalpa((count) => {
      if (globalSankalpa > 0 && count > globalSankalpa) {
        triggerPulse();
      }
      setGlobalSankalpa(count);
    });

    return () => unsubscribe();
  }, [loadStats, globalSankalpa]);

  const handleThemeToggle = async () => {
    const modes: ThemeMode[] = ['dark', 'light', 'system'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    await setMode(modes[nextIndex]);
  };

  const handleLanguageToggle = async () => {
    setShowLanguageModal(true);
  };

  const selectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleSaveName = async () => {
    if (editNameValue.trim()) {
      await saveProfileName(editNameValue.trim());
      setProfileName(editNameValue.trim());
    }
    setShowNameModal(false);
  };


  const handleDharmaModeToggle = async (value: boolean) => {
    if (value && Platform.OS === 'android' && blockedApps.length === 0) {
      setShowAppSelector(true);
      return;
    }

    setDharmaMode(value);
    await saveOnboardingStep('dharmaMode', value);
    if (value) {
      if (Platform.OS === 'android') {
        try {
          // First check if permissions are already granted
          let hasPermission = false;
          try {
            hasPermission = DharmaBlocker.hasUsagePermission();
          } catch (_) {}

          if (!hasPermission) {
            // Guide user through permission flow
            Alert.alert(
              "Permission Required",
              "Dharma Mode needs 'Usage Access' permission to detect which apps you're using.\n\nYou'll be taken to Android Settings — find 'Gita' in the list and enable access.\n\nAfter granting, come back and toggle Dharma Mode again.",
              [
                { text: "Cancel", style: "cancel", onPress: () => {
                  setDharmaMode(false);
                  saveOnboardingStep('dharmaMode', false);
                }},
                { text: "Open Settings", onPress: async () => {
                  try {
                    await DharmaBlocker.requestPermissions();
                  } catch (e) {
                    console.warn("Permission request error:", e);
                  }
                  // Reset toggle — user needs to come back and re-enable
                  setDharmaMode(false);
                  await saveOnboardingStep('dharmaMode', false);
                }}
              ]
            );
            return;
          }

          // Permission is granted — start blocking
          DharmaBlocker.startBlocking(blockedApps);
          Alert.alert("🛡️ Dharma Mode Active", `${blockedApps.length} apps are now restricted. Complete your daily reading to unlock them.`);
        } catch (e) {
          console.warn("DharmaBlocker error:", e);
          Alert.alert("Dharma Mode", "Could not start app blocking. Please ensure permissions are granted in Settings.");
          setDharmaMode(false);
          await saveOnboardingStep('dharmaMode', false);
        }
      } else if (Platform.OS === 'ios' && DharmaBlocker) {
        try {
          let auth = await DharmaBlocker.getAuthorizationStatus();
          if (auth !== 'approved') {
            const ok = await DharmaBlocker.requestPermissions();
            if (!ok) {
              Alert.alert(
                "Screen Time",
                "Family Controls access was not approved. You can try again or open Settings → Screen Time.",
                [{ text: "OK", style: "cancel" }],
              );
              setDharmaMode(false);
              await saveOnboardingStep('dharmaMode', false);
              return;
            }
            auth = await DharmaBlocker.getAuthorizationStatus();
          }
          if (auth !== 'approved') {
            setDharmaMode(false);
            await saveOnboardingStep('dharmaMode', false);
            return;
          }
          if (!DharmaBlocker.hasFamilySelection()) {
            const b64 = await DharmaBlocker.presentFamilyActivityPicker();
            if (!b64) {
              setDharmaMode(false);
              await saveOnboardingStep('dharmaMode', false);
              return;
            }
            await DharmaBlocker.setFamilySelectionBase64(b64);
            setIosFamilySelection(DharmaBlocker.hasFamilySelection());
          }
          DharmaBlocker.startBlocking([]);
          setIosFamilySelection(DharmaBlocker.hasFamilySelection());
          Alert.alert(
            "Dharma Mode",
            "Screen Time shields are on. Turn this toggle off anytime to clear shields. You can also adjust limits in Settings → Screen Time.",
          );
        } catch (e) {
          console.warn("DharmaBlocker iOS error:", e);
          Alert.alert("Dharma Mode", "Could not enable Screen Time shields.");
          setDharmaMode(false);
          await saveOnboardingStep('dharmaMode', false);
        }
      }
    } else {
      if (Platform.OS !== 'web' && DharmaBlocker) {
        try { DharmaBlocker.stopBlocking(); } catch (e) {}
      }
    }
  };

  const handleAppSelection = async (apps: string[]) => {
    setBlockedApps(apps);
    await saveBlockedApps(apps);
    
    // If we just selected apps and dharma mode was off but triggered, turn it on
    if (!dharmaMode && apps.length > 0) {
      handleDharmaModeToggle(true);
    } else if (dharmaMode && apps.length > 0) {
      // Update running service if already on
      if (Platform.OS !== 'web' && DharmaBlocker) {
        try { DharmaBlocker.startBlocking(apps); } catch(e) {}
      }
    } else if (apps.length === 0) {
      setDharmaMode(false);
      await saveOnboardingStep('dharmaMode', false);
      if (Platform.OS !== 'web' && DharmaBlocker) {
        try { DharmaBlocker.stopBlocking(); } catch(e) {}
      }
    }
  };

  const handleRemindersToggle = async (value: boolean) => {
    setRemindersEnabled(value);
    await saveOnboardingStep('remindersEnabled', value);
    if (value) {
      // Don't auto-show picker here to avoid annoyance
      await scheduleNotification(reminderTime);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const onTimeChange = async (event: any, selectedDate?: Date) => {
    // ALWAYS hide on change for Android to prevent loop
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    // If dismissed/cancelled
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }

    if (selectedDate) {
      setReminderTime(selectedDate);
      await saveOnboardingStep('reminderTime', selectedDate.toISOString());
      if (remindersEnabled) {
        await scheduleNotification(selectedDate);
      }
    }
  };

  const handlePushCloud = useCallback(async () => {
    if (!user) return;
    setAccountBusy(true);
    try {
      await pushLocalDataToCloud(user.uid);
      Alert.alert(t('syncSuccessTitle', language), t('syncSuccessMsg', language));
    } catch {
      Alert.alert('Error', t('syncFailedMsg', language));
    } finally {
      setAccountBusy(false);
    }
  }, [user, language]);

  const handlePullCloud = useCallback(async () => {
    if (!user) return;
    setAccountBusy(true);
    try {
      await pullCloudDataToLocal(user.uid);
      await loadStats();
      Alert.alert(t('syncSuccessTitle', language), t('pullSuccessMsg', language));
    } catch {
      Alert.alert('Error', t('pullFailedMsg', language));
    } finally {
      setAccountBusy(false);
    }
  }, [user, language, loadStats]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('signOutConfirmTitle', language),
      t('signOutConfirmMessage', language),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('signOutAction', language),
          style: 'destructive',
          onPress: async () => {
            setAccountBusy(true);
            try {
              if (user) await pushLocalDataToCloud(user.uid);
              await logout();
              router.replace('/(tabs)' as any);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Sign out failed';
              Alert.alert('Error', msg);
            } finally {
              setAccountBusy(false);
            }
          },
        },
      ]
    );
  }, [user, language, logout, router]);

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.getCustomerInfo();
      const active = !!customerInfo.entitlements.active[Config.ENTITLEMENT_ID];
      setIsPremium(active || new Date() < new Date('2026-05-10'));
      Alert.alert(
        active ? t('restoreAlertRestoredTitle', language) : t('restoreAlertStatusTitle', language),
        active ? t('restoreAlertSuccess', language) : t('restoreAlertNone', language)
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async (time: Date) => {
    if (Platform.OS === 'web') return;
    try {
      const onboarding = await getOnboardingData();
      const slokasStr = onboarding?.dailyCommitment || '2';
      await scheduleSmartNotifications(time, slokasStr);
    } catch (e) {
      console.warn("Failed to schedule smart notifications in settings", e);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
  );

  const SettingRow = ({ icon, label, desc, value, onPress, rightContent, isLast, iconColor = '#E8751A', danger }: any) => (
    <TouchableOpacity 
      style={[styles.row, isLast && styles.rowLast]} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <View style={styles.rightContent}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {rightContent}
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{marginLeft: 8}} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Settings Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>BHAGAVAD GITA</Text>
          <Text style={styles.headerTitle}>{t('settings', language)}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            setEditNameValue(profileName);
            setShowNameModal(true);
          }}
          style={styles.profileButton}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{profileName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{profileName}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.slokasRead || 0}</Text>
            <Text style={styles.statLabel}>{t('statsVersesRead', language)}</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statBox} 
            onPress={() => router.push('/streak' as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.dayStreak || 0}</Text>
            <Text style={styles.statLabel}>{t('statsDayStreak', language)}</Text>
            <View style={{ position: 'absolute', top: -10, right: 10 }}>
              <Ionicons name="flash" size={12} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.saved || 0}</Text>
            <Text style={styles.statLabel}>{t('statsSavedSlokas', language)}</Text>
          </View>
        </View>

        {/* ACCOUNT & SYNC — Firebase session, cloud backup, subscriptions */}
        <View style={styles.section}>
          <SectionHeader title={t('accountSync', language)} />
          <View style={styles.sectionBody}>
            {!authLoading && !user && (
              <View style={styles.signInCard}>
                <Text style={styles.signInTitle}>{t('accountBackupTitle', language)}</Text>
                <Text style={styles.signInSubtitle}>{t('accountBackupSubtitle', language)}</Text>
                <TouchableOpacity
                  style={styles.signInCta}
                  onPress={() => router.push('/auth?mode=login' as any)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.signInCtaText}>{t('accountCtaSignIn', language)}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!authLoading && user && (
              <View style={styles.accountHero}>
                <View style={styles.accountHeroTop}>
                  <View style={styles.accountAvatarLg}>
                    <Text style={styles.accountAvatarLgText}>
                      {(user.displayName || profileName || user.email || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountMeta}>
                    <Text style={styles.accountDisplayName} numberOfLines={1}>
                      {user.displayName || profileName}
                    </Text>
                    {!!user.email && (
                      <Text style={styles.accountEmail} numberOfLines={1}>
                        {user.email}
                      </Text>
                    )}
                    <View style={styles.accountChipsRow}>
                      {user.emailVerified ? (
                        <View style={styles.accountChip}>
                          <Text style={styles.accountChipText}>{t('emailVerified', language)}</Text>
                        </View>
                      ) : (
                        <View style={styles.accountChip}>
                          <Text style={styles.accountChipText}>{t('emailNotVerified', language)}</Text>
                        </View>
                      )}
                      {user.providerData?.some((p) => p.providerId === 'google.com') && (
                        <View style={styles.accountChip}>
                          <Text style={styles.accountChipText}>{t('authProviderGoogle', language)}</Text>
                        </View>
                      )}
                      {user.providerData?.some((p) => p.providerId === 'password') && (
                        <View style={styles.accountChip}>
                          <Text style={styles.accountChipText}>{t('authProviderEmailPassword', language)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.accountUidText}>
                  {t('accountUserId', language)} · {user.uid.slice(0, 8)}…{user.uid.slice(-4)}
                </Text>
                {!!user.metadata?.creationTime && (
                  <Text style={[styles.accountUidText, { marginTop: 4 }]}>
                    {t('accountMemberSince', language)} ·{' '}
                    {new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </View>
            )}

            {!!user && (
              <>
                <SettingRow
                  icon="cloud-upload-outline"
                  label={t('cloudSyncNow', language)}
                  desc={accountBusy ? '…' : t('cloudSyncNowDesc', language)}
                  iconColor={colors.primary}
                  onPress={accountBusy ? undefined : handlePushCloud}
                />
                <SettingRow
                  icon="cloud-download-outline"
                  label={t('cloudPullLatest', language)}
                  desc={accountBusy ? '…' : t('cloudPullLatestDesc', language)}
                  iconColor="#3B82F6"
                  onPress={accountBusy ? undefined : handlePullCloud}
                />
              </>
            )}

            <SettingRow 
              icon="star" 
              label={t('gitaPremium', language)} 
              desc={isPremium ? t('premiumStatusActive', language) : t('premiumStatusInactive', language)}
              iconColor="#F59E0B"
              value={isPremium ? t('premiumBadge', language) : ""}
              onPress={() => router.push('/onboarding/paywall')} 
            />
            <SettingRow 
              icon="refresh" 
              label={t('restorePurchases', language)} 
              desc={t('restorePurchasesSubtitle', language)}
              iconColor="#8B5CF6"
              onPress={handleRestorePurchases} 
              isLast={!user}
            />
            {!!user && (
              <SettingRow
                icon="log-out-outline"
                label={t('signOutAction', language)}
                desc={t('signOutSubtitle', language)}
                iconColor="#EF4444"
                onPress={accountBusy ? undefined : handleSignOut}
                danger
                isLast
              />
            )}
          </View>
        </View>

        {/* AI & COMMUNITY */}
        <View style={styles.section}>
          <SectionHeader title={t('communityAndAi', language)} />
          <View style={[styles.sectionBody, { backgroundColor: isDark ? 'rgba(212, 164, 76, 0.04)' : '#FFFBF2', borderColor: isDark ? 'rgba(212, 164, 76, 0.15)' : 'rgba(181, 135, 42, 0.15)' }]}>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.5 }}>COLLECTIVE DEVOTION</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 }}>
                Join the global flow of wisdom. Every verse read by the community is woven into this sacred total.
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Animated.Text style={[pulseStyle, { fontSize: 32, fontWeight: '800', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }]}>
                    {globalSankalpa.toLocaleString()}
                  </Animated.Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginTop: 4, letterSpacing: 0.5 }}>VERSES CONTRIBUTED WORLDWIDE</Text>
                </View>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="planet-outline" size={26} color={colors.primary} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* STUDY GROUP */}
        <View style={styles.section}>
          <SectionHeader title={t('studyPractice', language)} />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="flame" 
              label={t('sadhanaStreakTitle', language)} 
              desc={t('sadhanaStreakSubtitle', language)}
              iconColor="#D4A44C"
              onPress={() => router.push('/streak' as any)} 
            />
            <SettingRow 
              icon="bookmark" 
              label={t('savedSlokas', language)} 
              iconColor="#EC4899"
              onPress={() => router.push('/saved')} 
            />
            <SettingRow 
              icon="chatbubble-ellipses" 
              label={t('askScholar', language)} 
              desc={t('askScholarSubtitle', language)}
              iconColor="#8B5CF6"
              onPress={() => router.push('/scholar' as any)} 
            />

            <SettingRow 
              icon="language" 
              label={t('language', language)} 
              value={t('currentLanguage', language)}
              iconColor="#06B6D4"
              onPress={handleLanguageToggle} 
            />
            <SettingRow 
              icon="color-palette" 
              label={t('appTheme', language)} 
              value={
                mode === 'light'
                  ? t('themeLight', language)
                  : mode === 'dark'
                    ? t('themeDark', language)
                    : t('themeSystem', language)
              }
              iconColor="#8B5CF6"
              onPress={handleThemeToggle} 
            />
            <SettingRow 
              icon="information-circle" 
              label={t('howGitaWorks', language)} 
              desc={t('howGitaWorksSubtitle', language)}
              iconColor="#6B7280"
              onPress={() => setShowHowItWorks(true)} 
              isLast 
            />
          </View>
        </View>

        {/* WELLBEING & HABITS */}
        <View style={styles.section}>
          <SectionHeader title={t('habitsWellbeing', language)} />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="shield-checkmark" 
              label={t('dharmaMode', language)} 
              desc={
                Platform.OS === 'ios'
                  ? iosFamilySelection
                    ? t('dharmaScreenTimeSaved', language)
                    : t('dharmaModeDesc', language)
                  : blockedApps.length > 0
                    ? t('dharmaAppsBlocked', language, { count: blockedApps.length })
                    : t('dharmaModeDesc', language)
              }
              iconColor="#DC2626"
              rightContent={
                <Switch 
                  value={dharmaMode} 
                  onValueChange={handleDharmaModeToggle} 
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={dharmaMode ? (isDark ? colors.background : colors.card) : (isDark ? '#F9FAFB' : '#D1D5DB')} 
                  ios_backgroundColor={colors.border}
                />
              }
              onPress={() =>
                Platform.OS === 'android' ? setShowAppSelector(true) : router.push('/dharma' as any)
              }
            />
            <SettingRow 
              icon="notifications" 
              label={t('dailyReminder', language)} 
              desc={
                remindersEnabled
                  ? t('reminderActiveSummary', language, {
                      time: reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    })
                  : t('reminderOffSummary', language)
              }
              iconColor="#0891B2"
              rightContent={
                <Switch 
                  value={remindersEnabled} 
                  onValueChange={handleRemindersToggle} 
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={remindersEnabled ? (isDark ? colors.background : colors.card) : (isDark ? '#F9FAFB' : '#D1D5DB')} 
                  ios_backgroundColor={colors.border}
                />
              }
            />
            
            {/* Set Time Row - Separate to avoid automatic popups */}
            {remindersEnabled && (
              <SettingRow 
                icon="time" 
                label={t('setReminderTime', language)} 
                value={reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                iconColor="#F97316"
                onPress={() => setShowTimePicker(true)}
                isLast
              />
            )}
            
            {/* Hidden Picker - Only shows when triggered */}
            {showTimePicker && (() => {
              if (Platform.OS === 'web') {
                 return (
                    <View style={{ marginVertical: 10, alignSelf: 'center', backgroundColor: colors.card, padding: 10, borderRadius: 10, elevation: 2, borderColor: colors.border, borderWidth: 1 }}>
                       {/* @ts-ignore - Web specific input element */}
                       <input
                          type="time"
                          value={`${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`}
                          onChange={(e: any) => {
                             if (e.target && e.target.value) {
                                const [h, m] = e.target.value.split(':');
                                const newDate = new Date();
                                newDate.setHours(parseInt(h, 10), parseInt(m, 10));
                                onTimeChange({ type: 'set' }, newDate);
                             }
                           }}
                          onBlur={() => setShowTimePicker(false)}
                          color={colors.primary}
                          style={{
                             padding: '8px 12px',
                             fontSize: '16px',
                             borderRadius: '8px',
                             border: `1px solid ${colors.border}`,
                             backgroundColor: colors.background,
                             color: colors.text,
                             fontWeight: 'bold',
                             outline: 'none',
                             cursor: 'pointer'
                          }}
                       />
                       <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => setShowTimePicker(false)}>
                          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t('timePickerDone', language)}</Text>
                       </TouchableOpacity>
                    </View>
                 );
              } else if (DateTimePicker) {
                 return (
                   <DateTimePicker
                     value={reminderTime}
                     mode="time"
                     display="spinner"
                     onChange={onTimeChange}
                   />
                 );
              }
              return null;
            })()}
          </View>
        </View>

        {/* STORAGE & OFFLINE LIBRARY */}
        <View style={styles.section}>
          <SectionHeader title={t('storageAndOffline', language) || 'Storage & Offline Library'} />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="stats-chart" 
              label={t('cacheSize', language) || 'Local Cache Size'}
              value={cacheSize}
              iconColor="#10B981"
            />
            
            <SettingRow 
              icon="language" 
              label={t('downloadLanguages', language) || 'Preferred Download Languages'}
              desc={prefLanguages.map(l => l.toUpperCase()).join(', ')}
              iconColor="#3B82F6"
              onPress={() => {
                const available = [
                  { id: 'sanskrit', label: 'Sanskrit' },
                  { id: 'english', label: 'English' },
                  { id: 'hindi', label: 'Hindi' }
                ];
                Alert.alert(
                  "Download Languages",
                  "Which languages should be downloaded for offline use?",
                  available.map(lang => ({
                    text: `${prefLanguages.includes(lang.id) ? '✓ ' : ''}${lang.label}`,
                    onPress: async () => {
                      let next;
                      if (prefLanguages.includes(lang.id)) {
                        if (prefLanguages.length === 1) return;
                        next = prefLanguages.filter(l => l !== lang.id);
                      } else {
                        next = [...prefLanguages, lang.id];
                      }
                      setPrefLanguages(next);
                      await AsyncStorage.setItem('gita_audio_langs', JSON.stringify(next));
                    }
                  }))
                );
              }}
            />

            <SettingRow 
              icon="refresh" 
              label={t('autoStorageCleanup', language) || 'Self-Managing Storage'}
              desc={t('autoStorageCleanupDesc', language) || 'Automatically deletes old chapters when cache gets large.'}
              iconColor="#F97316"
              rightContent={
                <Switch 
                  value={autoCleanup} 
                  onValueChange={async (val) => {
                    setAutoCleanup(val);
                    await AsyncStorage.setItem('gita_audio_auto_cleanup', String(val));
                  }} 
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={autoCleanup ? (isDark ? colors.background : colors.card) : (isDark ? '#F9FAFB' : '#D1D5DB')} 
                />
              }
            />

            <SettingRow 
              icon="trash-outline" 
              label={t('clearAudioCache', language) || 'Clear All Offline Audio'}
              desc={t('clearAudioCacheDesc', language) || 'Frees up space by deleting all downloaded verses.'}
              iconColor="#EF4444"
              onPress={() => {
                Alert.alert(
                  t('clearCacheConfirmTitle', language) || "Clear Cache?",
                  t('clearCacheConfirmMsg', language) || "This will delete all offline audio files. You'll need internet to play them again.",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: async () => {
                      const { clearAudioCache } = require('../../src/utils/audio');
                      await clearAudioCache();
                      setCacheSize('0 MB');
                    }}
                  ]
                );
              }}
              isLast
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { textAlign: 'center', paddingHorizontal: 16 }]}>
            {t('attributionDataset', language)}
          </Text>
          <Text style={styles.footerText}>{t('footerVersionLine', language, { version: '1.0.0' })}</Text>
          <Text style={styles.footerText}>{t('footerTagline', language)}</Text>
        </View>

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profileName', language)}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={editNameValue}
                onChangeText={setEditNameValue}
                placeholder={t('enterYourName', language)}
                placeholderTextColor={colors.textSecondary}
                autoFocus
                maxLength={20}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowNameModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>{t('btnCancel', language)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryText}>{t('btnSave', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* How it Works Modal */}
      <Modal visible={showHowItWorks} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleLarge}>{t('howGitaWorks', language)}</Text>
              <TouchableOpacity onPress={() => setShowHowItWorks(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.modalSectionTitle}>📖 Reading Verses</Text>
              <Text style={styles.modalText}>
                Open the Library tab to see all 18 chapters of the Bhagavad Gita. Tap any chapter to see its verses. Each verse shows the original Sanskrit, transliteration, English translation, and an extended commentary to help you understand the deeper meaning.
              </Text>
              
              <Text style={styles.modalSectionTitle}>💾 Saving Your Favorites</Text>
              <Text style={styles.modalText}>
                When you find a verse that speaks to your heart, tap the bookmark icon (🔖) at the top of the verse page. It will be saved to your personal collection. You can view all saved verses anytime from Settings → Saved Slokas.
              </Text>
              
              <Text style={styles.modalSectionTitle}>📤 Sharing Wisdom</Text>
              <Text style={styles.modalText}>
                Share any verse with friends and family by tapping the share button on the verse page. The verse will be shared as a beautiful card that can be posted on social media or sent via any messaging app.
              </Text>

              <Text style={styles.modalSectionTitle}>🔔 Daily Reminders</Text>
              <Text style={styles.modalText}>
                Set a daily reminder to read your committed verses. Go to Settings → Daily Reminder, toggle it on, and pick your preferred time. You will receive a gentle notification each day at that time reminding you to read the Gita.
              </Text>

              <Text style={styles.modalSectionTitle}>🎵 Meditation Mode</Text>
              <Text style={styles.modalText}>
                Listen to sacred Sanskrit chanting while you meditate. Choose from three modes: "Chant Only" (just the Sanskrit), "Chant + Meaning" (verse followed by translation), or "Deep Study" (chant with full commentary). You can also set the number of repetitions — from 1 to the sacred count of 108.
              </Text>

              <Text style={styles.modalSectionTitle}>🧘 Ask the Scholar</Text>
              <Text style={styles.modalText}>
                Have a question about life, dharma, or spirituality? Open "Ask the Scholar" from Settings and type your question. Our AI-powered scholar will provide wisdom based on the teachings of the Gita. It is like having a personal spiritual guide in your pocket.
              </Text>

              <Text style={styles.modalSectionTitle}>🛡️ Dharma Blocker</Text>
              <Text style={styles.modalText}>
                {Platform.OS === 'ios'
                  ? 'Dharma Mode on iPhone uses Apple’s Screen Time (Family Controls). You approve access, then pick apps, categories, or websites in Apple’s picker. Shields apply only while you enable the mode here, and you can turn them off anytime in this app or in Settings → Screen Time.'
                  : 'This feature helps you stay focused during your reading time by temporarily blocking distracting apps you select. Android uses Usage Access and a small overlay when a blocked app opens; you can disable everything from Settings or by turning Dharma Mode off here.'}
              </Text>

              <Text style={styles.modalSectionTitle}>🔥 Sadhana Streak</Text>
              <Text style={styles.modalText}>
                Track your daily reading consistency with the Sadhana Streak calendar. Every day you read your committed number of verses, your streak grows. This is a beautiful visual reminder of your spiritual dedication.
              </Text>

              <Text style={styles.modalSectionTitle}>🌙 Daily Intent</Text>
              <Text style={styles.modalText}>
                Tell the app how you are feeling today, and it will recommend a verse from the Gita that matches your mood. Whether you feel anxious, grateful, lost, or peaceful — the Gita has wisdom for every emotion.
              </Text>

              <Text style={styles.modalSectionTitle}>🔒 Your Privacy</Text>
              <Text style={styles.modalText}>
                All your progress, saved verses, and reading history are stored securely on your device. We do not track your personal information or sell your data. Your spiritual journey is yours alone.
              </Text>

              <Text style={styles.modalSectionTitle}>📚 Credits & Sources</Text>
              <Text style={styles.modalText}>
                The Sanskrit verses and translations in this app are sourced from publicly available texts including the IIT Kanpur Gitasupersite and traditional Gita commentaries. Extended commentaries are inspired by the works of Adi Shankaracharya, Ramanujacharya, and other revered acharyas. AI-generated content is reviewed for accuracy and faithfulness to the original teachings.
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>



      {/* App Selector Modal */}
      <AppSelectorModal
        visible={showAppSelector}
        onClose={() => setShowAppSelector(false)}
        selectedApps={blockedApps}
        onSelectApps={handleAppSelection}
      />

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: '80%', backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.modalTitle}>{t('language', language)}</Text>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'en', name: 'English' },
                { id: 'hi', name: 'हिन्दी (Hindi)' },
              ].map((langItem) => (
                <TouchableOpacity
                  key={langItem.id}
                  style={[
                    styles.langOption,
                    language === langItem.id && styles.langOptionSelected
                  ]}
                  onPress={() => selectLanguage(langItem.id as Language)}
                >
                  <Text style={[
                    styles.langOptionText,
                    language === langItem.id && styles.langOptionTextSelected
                  ]}>
                    {langItem.name}
                  </Text>
                  {language === langItem.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setShowLanguageModal(false)} 
              style={[styles.modalButton, { marginTop: 20, width: '100%' }]}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}