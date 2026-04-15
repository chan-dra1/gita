import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Switch, Platform, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
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
    startBlocking: (_apps: string[]) => console.warn("DharmaBlocker not available"),
    stopBlocking: () => console.warn("DharmaBlocker not available"),
    getInstalledApps: async () => { console.warn("DharmaBlocker not available"); return []; },
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
import { t } from '../../src/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
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
  const { mode, setMode, colors } = useTheme();

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
  const [isPremium, setIsPremium] = useState(false);

  // Global Community
  const [globalSankalpa, setGlobalSankalpa] = useState(0);


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
      setGlobalSankalpa(count);
    });


    return () => unsubscribe();
  }, [loadStats]);

  const handleThemeToggle = () => {
    Alert.alert(
      "Theme Mode",
      "Dark Mode is the current default.\nLight Mode is coming soon in a future update!",
      [
        { text: "OK", style: "cancel" }
      ]
    );
  };

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    await setLanguage(newLang);
  };

  const handleSaveName = async () => {
    if (editNameValue.trim()) {
      await saveProfileName(editNameValue.trim());
      setProfileName(editNameValue.trim());
    }
    setShowNameModal(false);
  };


  const handleDharmaModeToggle = async (value: boolean) => {
    if (value && blockedApps.length === 0) {
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
      } else {
        Alert.alert("Dharma Mode Active", "Focus mode enabled. Distractions minimized.");
      }
    } else {
      if (Platform.OS === 'android' && DharmaBlocker) {
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

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      const active = !!customerInfo.entitlements.active[Config.ENTITLEMENT_ID];
      setIsPremium(active || new Date() < new Date('2026-05-10'));
      Alert.alert(
        active ? 'Restored' : 'Status',
        active ? 'Premium access restored successfully!' : 'No active subscriptions found.'
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

  const SettingRow = ({ icon, label, desc, value, onPress, rightContent, isLast, iconColor = '#E8751A' }: any) => (
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
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <View style={styles.rightContent}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {rightContent}
        {onPress && <Ionicons name="chevron-forward" size={18} color="#475569" style={{marginLeft: 8}} />}
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
          <Text style={styles.headerTitle}>Settings</Text>
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
          <Text style={{ color: '#D4A44C', fontSize: 12, marginTop: 4, fontWeight: '600' }}>{profileName}</Text>
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
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.dayStreak || 0}</Text>
            <Text style={styles.statLabel}>{t('statsDayStreak', language)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.saved || 0}</Text>
            <Text style={styles.statLabel}>{t('statsSavedSlokas', language)}</Text>
          </View>
        </View>

        {/* ACCOUNT GROUP */}
        <View style={styles.section}>
          <SectionHeader title={t('accountSync', language)} />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="star" 
              label={t('gitaPremium', language)} 
              desc={isPremium ? "Active" : "Unlock all features"}
              iconColor="#F59E0B"
              value={isPremium ? "PRO" : ""}
              onPress={() => router.push('/onboarding/paywall')} 
            />
            <SettingRow 
              icon="refresh" 
              label="Restore Purchases" 
              desc="Renew access from App Store"
              iconColor="#8B5CF6"
              onPress={handleRestorePurchases} 
              isLast
            />
          </View>
        </View>

        {/* AI & COMMUNITY */}
        <View style={styles.section}>
          <SectionHeader title="COMMUNITY & AI" />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="people" 
              label="Global Sankalpa" 
              desc="Verses read worldwide by the community"
              iconColor="#10B981"
              value={globalSankalpa > 0 ? globalSankalpa.toLocaleString() : '...'}
              isLast
            />
          </View>
        </View>

        {/* STUDY GROUP */}
        <View style={styles.section}>
          <SectionHeader title={t('studyPractice', language)} />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="flame" 
              label="Sadhana Streak" 
              desc="View your devotion calendar"
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
              desc="Deep wisdom guidance"
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
              label="App Theme" 
              value="Dark (Coming Soon: Light)"
              iconColor="#8B5CF6"
              onPress={handleThemeToggle} 
            />
            <SettingRow 
              icon="information-circle" 
              label={t('howGitaWorks', language)} 
              desc="AI & Privacy details"
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
              desc={t('dharmaModeDesc', language)}
              iconColor="#DC2626"
              rightContent={
                <Switch 
                  value={dharmaMode} 
                  onValueChange={handleDharmaModeToggle} 
                  trackColor={{ false: '#D1D5DB', true: '#FED7AA' }}
                  thumbColor={dharmaMode ? '#E8751A' : '#F9FAFB'} 
                  ios_backgroundColor="#D1D5DB"
                />
              }
            />
            <SettingRow 
              icon="options" 
              label="Select Blocked Apps" 
              desc={blockedApps.length > 0 ? `${blockedApps.length} apps selected` : "No apps selected"}
              iconColor="#F97316"
              onPress={() => setShowAppSelector(true)}
              isLast={!remindersEnabled}
            />
            <SettingRow 
              icon="notifications" 
              label={t('dailyReminder', language)} 
              desc={remindersEnabled ? `Active at ${reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Off"}
              iconColor="#0891B2"
              rightContent={
                <Switch 
                  value={remindersEnabled} 
                  onValueChange={handleRemindersToggle} 
                  trackColor={{ false: '#D1D5DB', true: '#FED7AA' }}
                  thumbColor={remindersEnabled ? '#E8751A' : '#F9FAFB'} 
                  ios_backgroundColor="#D1D5DB"
                />
              }
            />
            
            {/* Set Time Row - Separate to avoid automatic popups */}
            {remindersEnabled && (
              <SettingRow 
                icon="time" 
                label="Set Reminder Time" 
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
                    <View style={{ marginVertical: 10, alignSelf: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, elevation: 2 }}>
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
                          color="#E8751A"
                          style={{
                             padding: '8px 12px',
                             fontSize: '16px',
                             borderRadius: '8px',
                             border: '1px solid #E8751A',
                             backgroundColor: '#FFF8F0',
                             color: '#E8751A',
                             fontWeight: 'bold',
                             outline: 'none',
                             cursor: 'pointer'
                          }}
                       />
                       <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => setShowTimePicker(false)}>
                          <Text style={{ color: '#E8751A', fontWeight: 'bold' }}>Done</Text>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
          <Text style={styles.footerText}>Made with devotion · The Gita Editorial</Text>
        </View>

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={editNameValue}
                onChangeText={setEditNameValue}
                placeholder="Enter your name"
                autoFocus
                maxLength={20}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowNameModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
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
                <Ionicons name="close" size={24} color="#FFF" />
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
                This feature helps you stay focused during your reading time by temporarily blocking distracting apps on your phone. You choose which apps to block, and they are only paused while you complete your daily verses. Available on Android only.
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 12, 
    paddingBottom: 20,
    backgroundColor: '#0D0D0D' 
  },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#D4A44C', letterSpacing: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  profileButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(212, 164, 76, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212, 164, 76, 0.3)' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D4A44C', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0D0D0D', fontSize: 18, fontWeight: '800' },
  
  scrollContent: { paddingBottom: 60 },
  
  statsCard: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginTop: 16, 
    backgroundColor: '#1A1A1A', 
    borderRadius: 20, 
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#D4A44C', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 3 
  },
  statDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { marginTop: 24, marginHorizontal: 20 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#D4A44C', marginLeft: 8, marginBottom: 8, letterSpacing: 1 },
  sectionBody: { backgroundColor: '#1A1A1A', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingRight: 16, 
    paddingLeft: 16, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: 'rgba(255, 255, 255, 0.08)' 
  },
  rowLast: { borderBottomWidth: 0 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  rowDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  rightContent: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { fontSize: 15, color: '#D4A44C', fontWeight: '500' },
  
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  footerText: { fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '500', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 164, 76, 0.3)' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 20 },
  inputWrapper: { width: '100%', marginBottom: 24 },
  textInput: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#333' },
  modalButtonPrimary: { backgroundColor: '#D4A44C' },
  modalButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  modalButtonPrimaryText: { fontSize: 16, fontWeight: '800', color: '#0D0D0D' },

  modalContentLarge: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, width: '100%', height: '85%', position: 'absolute', bottom: 0, borderWidth: 1, borderColor: 'rgba(212, 164, 76, 0.2)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitleLarge: { fontSize: 24, fontWeight: '800', color: '#D4A44C', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  modalScroll: { flex: 1 },
  modalSectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 24, marginBottom: 8 },
  modalText: { fontSize: 15, color: '#9CA3AF', lineHeight: 24 },
});
