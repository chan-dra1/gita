import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Switch, Platform, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

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
import { Language, getLanguage, saveLanguage, t } from '../../src/utils/i18n';
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
  const [language, setLanguage] = useState<Language>('en');

  // New Features
  const [profileName, setProfileName] = useState('Scholar');
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

  const loadStats = useCallback(async () => {
    try {
      const [allStats, onboarding, slokasRead, saved, lang, pName] = await Promise.all([
        getAllStats(),
        getOnboardingData(),
        getSlokasRead(),
        getSavedSlokas(),
        getLanguage(),
        getProfileName(),
      ]);
      setStats(allStats);
      setOnboardingData(onboarding);
      setLanguage(lang);
      setProfileName(pName);
      setEditNameValue(pName);
      
      // Load toggles from onboarding data if available
      if (onboarding?.dharmaMode !== undefined) setDharmaMode(onboarding.dharmaMode);
      if (onboarding?.remindersEnabled !== undefined) setRemindersEnabled(onboarding.remindersEnabled);
      if (onboarding?.reminderTime) setReminderTime(new Date(onboarding.reminderTime));
      
      const blocked = await getBlockedApps();
      setBlockedApps(blocked);

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
  }, [loadStats]);

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    await saveLanguage(newLang);
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
          const granted = await DharmaBlocker.requestPermissions();
          if (granted) {
            DharmaBlocker.startBlocking(blockedApps);
            Alert.alert("Dharma Mode Active", `${blockedApps.length} apps are now restricted.`);
          } else {
            setDharmaMode(false);
            await saveOnboardingStep('dharmaMode', false);
          }
        } catch (e) {
          console.warn("DharmaBlocker error:", e);
          Alert.alert("Dharma Mode", "Focus mode enabled. Install on device to block apps.");
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
        {onPress && <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={{marginLeft: 8}} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8751A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Settings Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>OM NAMO NARAYANAYA</Text>
          <Text style={styles.headerTitle}>Gita for {profileName}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowNameModal(true)}
          style={styles.profileButton}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{profileName.charAt(0).toUpperCase()}</Text>
          </View>
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
              icon="person" 
              label={t('profileName', language)} 
              value={profileName}
              iconColor="#4F46E5"
              onPress={() => {
                setEditNameValue(profileName);
                setShowNameModal(true);
              }} 
            />
            <SettingRow 
              icon="star" 
              label={t('gitaPremium', language)} 
              desc="Unlock all features"
              iconColor="#F59E0B"
              onPress={() => router.push('/onboarding/paywall')} 
            />
            <SettingRow 
              icon="sync" 
              label={t('backupRestore', language)} 
              desc="Move progress to a new device"
              iconColor="#10B981"
              onPress={() => router.push('/backup')} 
              isLast 
            />
          </View>
        </View>

        {/* STUDY GROUP */}
        <View style={styles.section}>
          <SectionHeader title={t('studyPractice', language)} />
          <View style={styles.sectionBody}>
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
              icon="library" 
              label={t('viewAllSlokas', language)} 
              iconColor="#3B82F6"
              onPress={() => router.push('/(tabs)/library')} 
            />
            <SettingRow 
              icon="language" 
              label={t('language', language)} 
              value={t('currentLanguage', language)}
              iconColor="#06B6D4"
              onPress={handleLanguageToggle} 
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
            {showTimePicker && DateTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
              />
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
          <Text style={styles.footerText}>Made with devotion · Gita for Scholar</Text>
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
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Your Privacy</Text>
              <Text style={styles.modalText}>
                No account or sign-up is required. All your progress, saved verses, and stats are saved securely on your device. We do not track your personal information.
              </Text>
              
              <Text style={styles.modalSectionTitle}>AI & Audio Technology</Text>
              <Text style={styles.modalText}>
                Gita uses advanced Artificial Intelligence to provide personalized answers based on ancient scriptures. The voice you hear is generated securely, mimicking human devotion, and the audio files are cached on your phone to save data and work offline.
              </Text>

              <Text style={styles.modalSectionTitle}>Data Backup</Text>
              <Text style={styles.modalText}>
                Because your data is strictly on your device, you are given a "Backup Code" in the Backup & Restore section. This long text code contains all your progress. You can copy it and paste it into a new phone to restore everything.
              </Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 12, 
    paddingBottom: 20,
    backgroundColor: '#FFF' 
  },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#E8751A', letterSpacing: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginTop: 4 },
  profileButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF3E8', alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8751A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  
  scrollContent: { paddingBottom: 60 },
  
  statsCard: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginTop: 16, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  statDivider: { width: 1, height: '60%', backgroundColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },

  section: { marginTop: 24, marginHorizontal: 20 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginLeft: 8, marginBottom: 8, letterSpacing: 0.5 },
  sectionBody: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingRight: 16, 
    paddingLeft: 16, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#F1F5F9' 
  },
  rowLast: { borderBottomWidth: 0 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  rowDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rightContent: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { fontSize: 15, color: '#94A3B8' },
  
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  footerText: { fontSize: 12, color: '#94A3B8', marginBottom: 4, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  inputWrapper: { width: '100%', marginBottom: 24 },
  textInput: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: '#1A1A1A', borderWidth: 1, borderColor: '#E2E8F0' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F1F5F9' },
  modalButtonPrimary: { backgroundColor: '#E8751A' },
  modalButtonText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  modalButtonPrimaryText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  modalContentLarge: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, width: '100%', height: '85%', position: 'absolute', bottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitleLarge: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalScroll: { flex: 1 },
  modalSectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 24, marginBottom: 8 },
  modalText: { fontSize: 15, color: '#475569', lineHeight: 24 },
});
