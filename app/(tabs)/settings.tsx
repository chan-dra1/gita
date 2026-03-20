import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Switch, Platform, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import DharmaBlocker from '../../modules/dharma-blocker';
import { getAllStats, getSlokasRead, getSavedSlokas, getOnboardingData, saveOnboardingStep, getProfileName, saveProfileName, type OnboardingData, type SlokaReadEntry } from '../../src/utils/stats';
import { Language, getLanguage, saveLanguage, t } from '../../src/utils/i18n';

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

      setRecentSlokas(slokasRead.slice(-3).reverse());
    } catch (error) {
      console.error('Failed to load stats:', error);
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
    setDharmaMode(value);
    await saveOnboardingStep('dharmaMode', value);
    if (value) {
      if (Platform.OS !== 'web') {
        const granted = await DharmaBlocker.requestPermissions();
        if (granted) {
          DharmaBlocker.startBlocking(['com.instagram.android', 'com.zhiliaoapp.musically']);
          Alert.alert("Dharma Mode Active", "Distracting apps are now blocked.");
        } else {
          setDharmaMode(false);
          await saveOnboardingStep('dharmaMode', false);
        }
      } else {
        Alert.alert("Dharma Mode Active", "Distractions minimized (Web Simulation).");
      }
    } else {
      if (Platform.OS !== 'web') DharmaBlocker.stopBlocking();
    }
  };

  const handleRemindersToggle = async (value: boolean) => {
    setRemindersEnabled(value);
    await saveOnboardingStep('remindersEnabled', value);
    if (value) {
      await scheduleNotification(reminderTime);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const onTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
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
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: { title: "Your Daily Dharma 🕉️", body: "Take a moment for inner peace." },
        trigger: { hour: time.getHours(), minute: time.getMinutes(), repeats: true } as any,
      });
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
  );

  const SettingRow = ({ icon, label, desc, value, onPress, rightContent, isLast }: any) => (
    <TouchableOpacity 
      style={[styles.row, isLast && styles.rowLast]} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: '#FEF0E6' }]}>
        <Ionicons name={icon} size={20} color="#E8751A" />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <View style={styles.rightContent}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {rightContent}
        {onPress && <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8751A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Settings Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gita for {profileName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.slokasRead || 0}</Text>
            <Text style={styles.statLabel}>Verses Read</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.dayStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.saved || 0}</Text>
            <Text style={styles.statLabel}>Saved Slokas</Text>
          </View>
        </View>

        {/* ACCOUNT GROUP */}
        <View style={styles.section}>
          <SectionHeader title="Account & Sync" />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="person" 
              label="Profile Name" 
              value={profileName}
              onPress={() => {
                setEditNameValue(profileName);
                setShowNameModal(true);
              }} 
            />
            <SettingRow 
              icon="star" 
              label="Gita Premium" 
              desc="Unlock all features"
              onPress={() => router.push('/onboarding/paywall')} 
            />
            <SettingRow 
              icon="sync" 
              label="Backup & Restore" 
              desc="Move progress to a new device"
              onPress={() => router.push('/backup')} 
              isLast 
            />
          </View>
        </View>

        {/* STUDY GROUP */}
        <View style={styles.section}>
          <SectionHeader title="Study & Practice" />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="bookmark" 
              label="Saved Slokas" 
              onPress={() => router.push('/saved')} 
            />
            <SettingRow 
              icon="library" 
              label={t('viewAllSlokas', language)} 
              onPress={() => router.push('/(tabs)/library')} 
            />
            <SettingRow 
              icon="language" 
              label={t('language', language)} 
              value={t('currentLanguage', language)}
              onPress={handleLanguageToggle} 
            />
            <SettingRow 
              icon="information-circle" 
              label="How Gita Works" 
              desc="Understand the AI & Privacy"
              onPress={() => setShowHowItWorks(true)} 
              isLast 
            />
          </View>
        </View>

        {/* WELLBEING & HABITS */}
        <View style={styles.section}>
          <SectionHeader title="Habits & Wellbeing" />
          <View style={styles.sectionBody}>
            <SettingRow 
              icon="shield-checkmark" 
              label="Dharma Mode" 
              desc="Block distracting apps during study"
              rightContent={
                <Switch 
                  value={dharmaMode} 
                  onValueChange={handleDharmaModeToggle} 
                  trackColor={{ false: '#E5E7EB', true: '#FDE8D4' }}
                  thumbColor={dharmaMode ? '#E8751A' : '#f4f3f4'} 
                />
              }
            />
            <SettingRow 
              icon="notifications" 
              label="Daily Reminder" 
              desc={remindersEnabled ? `Scheduled for ${reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Off"}
              rightContent={
                <Switch 
                  value={remindersEnabled} 
                  onValueChange={handleRemindersToggle} 
                  trackColor={{ false: '#E5E7EB', true: '#FDE8D4' }}
                  thumbColor={remindersEnabled ? '#E8751A' : '#f4f3f4'} 
                />
              }
              isLast={!remindersEnabled}
            />
            
            {/* Time Picker expands below if Reminders are enabled */}
            {remindersEnabled && (
              <View style={[styles.row, styles.rowLast, { paddingVertical: 12, justifyContent: 'center' }]}>
                {Platform.OS === 'web' ? (
                  <input
                    type="time"
                    value={`${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      if (e.target && e.target.value) {
                        const [h, m] = e.target.value.split(':');
                        const newTime = new Date(reminderTime);
                        newTime.setHours(parseInt(h, 10), parseInt(m, 10));
                        onTimeChange(null, newTime);
                      }
                    }}
                    style={{ padding: '8px 16px', fontSize: '18px', borderRadius: '12px', border: '1px solid #E5E7EB' }}
                  />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between', paddingLeft: 44 }}>
                    <Text style={{ fontSize: 16, color: '#1A1A1A' }}>Set Time</Text>
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      display="default"
                      onChange={onTimeChange}
                      style={{ width: 100 }}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
          <Text style={styles.footerText}>Made with devotion.</Text>
        </View>

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile Name</Text>
            <TextInput
              style={styles.textInput}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder="Enter your name"
              autoFocus
              maxLength={20}
            />
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
            <View style={styles.modalHeaderTitleBox}>
              <Text style={styles.modalTitle}>How Gita Works</Text>
              <TouchableOpacity onPress={() => setShowHowItWorks(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' }, // Classic iOS light gray background
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 34, fontWeight: '700', color: '#000', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  scrollContent: { paddingBottom: 60 },
  
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 16, backgroundColor: '#FFF', borderRadius: 16, padding: 16, justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  statLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4 },

  section: { marginTop: 24, marginHorizontal: 20 },
  sectionHeader: { fontSize: 13, color: '#6D6D72', marginLeft: 16, marginBottom: 8, letterSpacing: -0.08 },
  sectionBody: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 16, paddingLeft: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C6C6C8' },
  rowLast: { borderBottomWidth: 0 },
  iconContainer: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowLabel: { fontSize: 17, color: '#000', letterSpacing: -0.41 },
  rowDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2, letterSpacing: -0.08 },
  rightContent: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { fontSize: 17, color: '#8E8E93', marginRight: 8, letterSpacing: -0.41 },
  
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  footerText: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  modalContentLarge: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: '100%', height: '80%', position: 'absolute', bottom: 0 },
  modalHeaderTitleBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  textInput: { width: '100%', borderWidth: 1, borderColor: '#C6C6C8', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#F2F2F7' },
  modalButtonPrimary: { backgroundColor: '#E8751A' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  modalButtonPrimaryText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  modalScroll: { flex: 1 },
  modalSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  modalText: { fontSize: 15, color: '#4A4A4C', lineHeight: 22 },
});
