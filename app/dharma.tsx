import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DharmaBlocker from '../modules/dharma-blocker';
import type { DharmaAuthorizationStatus } from '../modules/dharma-blocker';
import { getAllStats } from '../src/utils/stats';

export default function DharmaModeScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [installedApps, setInstalledApps] = useState<{ packageName: string; label: string }[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ slokasRead: 0, dayStreak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [iosAuth, setIosAuth] = useState<DharmaAuthorizationStatus>('unsupported');
  const [iosHasSelection, setIosHasSelection] = useState(false);

  const refreshIos = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const status = await DharmaBlocker.getAuthorizationStatus();
      setIosAuth(status);
      setIosHasSelection(DharmaBlocker.hasFamilySelection());
    } catch {
      setIosAuth('unknown');
      setIosHasSelection(false);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      const s = await getAllStats();
      setStats(s);

      try {
        if (Platform.OS === 'android') {
          const apps = await DharmaBlocker.getInstalledApps();
          setInstalledApps(apps.sort((a, b) => a.label.localeCompare(b.label)));
        }
        await refreshIos();
      } catch (e) {
        console.error('Failed to load apps', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [refreshIos]);

  useFocusEffect(
    useCallback(() => {
      refreshIos();
    }, [refreshIos]),
  );

  const toggleApp = (id: string) => {
    const newSet = new Set(selectedApps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApps(newSet);
  };

  const handleIOSAuthorize = async () => {
    try {
      const ok = await DharmaBlocker.requestPermissions();
      await refreshIos();
      if (!ok) {
        Alert.alert(
          'Screen Time access',
          'Apple did not approve Family Controls for this session. You can try again, or open Settings → Screen Time → See All Activity → scroll to this app.',
          [
            { text: 'Open app settings', onPress: () => Linking.openSettings() },
            { text: 'OK', style: 'cancel' },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert('Authorization', e?.message ?? 'Something went wrong.');
    }
  };

  const handleIOSPickDistractions = async () => {
    try {
      if (iosAuth !== 'approved') {
        await handleIOSAuthorize();
        if ((await DharmaBlocker.getAuthorizationStatus()) !== 'approved') return;
      }
      const b64 = await DharmaBlocker.presentFamilyActivityPicker();
      if (b64 == null) return;
      await DharmaBlocker.setFamilySelectionBase64(b64);
      await refreshIos();
      Alert.alert('Saved', 'Your Screen Time selection is saved. Turn on Dharma Mode when you are ready to shield those apps.');
    } catch (e: any) {
      Alert.alert('Picker', e?.message ?? 'Could not open the app picker.');
    }
  };

  const handleToggleDharmaMode = async (value: boolean) => {
    if (Platform.OS === 'ios') {
      if (value) {
        if (iosAuth !== 'approved') {
          await handleIOSAuthorize();
          const s = await DharmaBlocker.getAuthorizationStatus();
          setIosAuth(s);
          if (s !== 'approved') return;
        }
        if (!DharmaBlocker.hasFamilySelection()) {
          Alert.alert('Choose distractions', 'Use “Choose apps & websites” first so the system knows what to shield.', [
            { text: 'Choose now', onPress: () => void handleIOSPickDistractions() },
            { text: 'Cancel', style: 'cancel' },
          ]);
          return;
        }
        try {
          DharmaBlocker.startBlocking([]);
          setIsActive(true);
        } catch (e: any) {
          Alert.alert('Error', e?.message ?? 'Could not start shields.');
        }
      } else {
        DharmaBlocker.stopBlocking();
        setIsActive(false);
      }
      return;
    }

    if (value) {
      if (selectedApps.size === 0) {
        Alert.alert('Select Apps', 'Please select at least one app to restrict.');
        return;
      }
      try {
        const hasPermission = await DharmaBlocker.requestPermissions();
        if (hasPermission) {
          DharmaBlocker.startBlocking(Array.from(selectedApps));
          setIsActive(true);
        } else {
          Alert.alert(
            'Permission Denied',
            'Please grant Usage Access and overlay permission in Settings, then try again.',
            [{ text: 'Open settings', onPress: () => Linking.openSettings() }, { text: 'OK', style: 'cancel' }],
          );
        }
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    } else {
      DharmaBlocker.stopBlocking();
      setIsActive(false);
    }
  };

  const iosAuthLabel =
    iosAuth === 'approved'
      ? 'Approved'
      : iosAuth === 'denied'
        ? 'Denied'
        : iosAuth === 'notDetermined'
          ? 'Not determined'
          : iosAuth === 'unsupported'
            ? 'Not available on this device'
            : 'Unknown';

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dharma Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={s.infoCard}>
          <View style={s.iconGlow}>
            <Ionicons name="shield-checkmark" size={40} color="#D4A44C" />
          </View>
          <Text style={s.infoTitle}>Cultivate Focus</Text>
          <Text style={s.infoDesc}>
            Restrict distractions until you have done your reading for the day. You stay in control: turn shields off here at any time.
          </Text>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>Progress: {stats.slokasRead} Slokas Read Today</Text>
          </View>
        </View>

        {Platform.OS === 'ios' ? (
          <>
            <View style={s.platformCard}>
              <Text style={s.platformTitle}>How it works on iPhone</Text>
              <Text style={s.platformBody}>
                Apple only allows blocking through Screen Time APIs. You approve access, then pick apps, categories, or sites in
                Apple’s picker. This app cannot silently block arbitrary bundle IDs.
              </Text>
              <Text style={s.platformBody}>
                Turn shields off anytime with the toggle below. If something feels stuck, open Settings → Screen Time and adjust
                limits or allowed apps there.
              </Text>
            </View>

            <View style={s.platformCard}>
              <Text style={s.platformTitle}>Screen Time status</Text>
              <Text style={s.platformMeta}>Authorization: {iosAuthLabel}</Text>
              <Text style={s.platformMeta}>Saved picker choice: {iosHasSelection ? 'Yes' : 'No'}</Text>
              <TouchableOpacity style={s.secondaryBtn} onPress={handleIOSAuthorize} activeOpacity={0.85}>
                <Text style={s.secondaryBtnText}>Request / refresh Screen Time access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.primaryBtn} onPress={() => void handleIOSPickDistractions()} activeOpacity={0.85}>
                <Text style={s.primaryBtnText}>Choose apps & websites</Text>
              </TouchableOpacity>
            </View>

            <View style={s.emergencyCard}>
              <Ionicons name="medkit-outline" size={22} color="#F87171" />
              <View style={{ flex: 1 }}>
                <Text style={s.emergencyTitle}>Emergency disable</Text>
                <Text style={s.emergencyBody}>
                  Flip the master switch off here first. You can also open Settings → Screen Time to remove shields or change
                  allowed apps system-wide.
                </Text>
                <TouchableOpacity onPress={() => Linking.openSettings()} style={s.linkRow}>
                  <Text style={s.linkText}>Open Settings</Text>
                  <Ionicons name="open-outline" size={16} color="#D4A44C" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={s.platformCard}>
              <Text style={s.platformTitle}>How it works on Android</Text>
              <Text style={s.platformBody}>
                Dharma Mode uses Usage Access to know which app is in the foreground, a small overlay when a blocked app opens,
                and a foreground service so Android keeps the guard reliable. You can revoke those permissions in system Settings
                at any time.
              </Text>
            </View>

            <View style={s.emergencyCard}>
              <Ionicons name="medkit-outline" size={22} color="#F87171" />
              <View style={{ flex: 1 }}>
                <Text style={s.emergencyTitle}>Quick disable</Text>
                <Text style={s.emergencyBody}>
                  Turn the toggle off here to stop blocking immediately. You can also disable Usage Access or overlay permission for
                  this app in Android Settings if you need a hard reset.
                </Text>
                <TouchableOpacity onPress={() => Linking.openSettings()} style={s.linkRow}>
                  <Text style={s.linkText}>Open app settings</Text>
                  <Ionicons name="open-outline" size={16} color="#D4A44C" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <View style={s.masterCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.masterTitle}>Activate restriction</Text>
            <Text style={[s.masterSub, isActive && { color: '#D4A44C' }]}>
              {isActive ? 'Mode is ACTIVE' : 'Shields off'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggleDharmaMode}
            trackColor={{ false: 'rgba(255,255,255,0.05)', true: 'rgba(212, 164, 76, 0.4)' }}
            thumbColor={isActive ? '#D4A44C' : '#444'}
            ios_backgroundColor="rgba(255,255,255,0.05)"
          />
        </View>

        {Platform.OS === 'android' && (
          <>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionTitle}>Select apps to restrict</Text>
              <Text style={s.selectionCount}>{selectedApps.size} apps</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator color="#D4A44C" style={{ marginTop: 40 }} />
            ) : (
              <View style={s.appList}>
                {installedApps.map((app, index) => (
                  <TouchableOpacity
                    key={app.packageName}
                    activeOpacity={isActive ? 1 : 0.7}
                    onPress={() => !isActive && toggleApp(app.packageName)}
                    style={[s.appRow, index === installedApps.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={s.appIconBox}>
                      <Ionicons name="apps-outline" size={18} color="#D4A44C" />
                    </View>
                    <Text style={s.appName} numberOfLines={1}>
                      {app.label}
                    </Text>
                    <Switch
                      value={selectedApps.has(app.packageName)}
                      onValueChange={() => toggleApp(app.packageName)}
                      disabled={isActive}
                      trackColor={{ false: 'rgba(255,255,255,0.05)', true: 'rgba(212, 164, 76, 0.4)' }}
                      thumbColor={selectedApps.has(app.packageName) ? '#D4A44C' : '#444'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {Platform.OS === 'ios' && isLoading ? <ActivityIndicator color="#D4A44C" style={{ marginTop: 24 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#141414',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.15)',
  },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  infoDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusBadge: {
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
  },
  statusText: {
    color: '#D4A44C',
    fontWeight: '700',
    fontSize: 13,
  },
  platformCard: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  platformBody: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 22,
    marginBottom: 10,
  },
  platformMeta: {
    fontSize: 13,
    color: '#D4A44C',
    fontWeight: '600',
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: '#D4A44C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: {
    color: '#0D0D0D',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.35)',
  },
  secondaryBtnText: {
    color: '#D4A44C',
    fontWeight: '700',
    fontSize: 14,
  },
  emergencyCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(248,113,113,0.08)',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  emergencyBody: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  linkText: {
    color: '#D4A44C',
    fontWeight: '700',
    fontSize: 14,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  masterSub: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4A44C',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  selectionCount: {
    fontSize: 12,
    color: '#555',
    fontWeight: '700',
  },
  appList: {
    backgroundColor: '#111',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  appIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.1)',
  },
  appName: {
    flex: 1,
    fontSize: 16,
    color: '#E0D5C5',
    fontWeight: '700',
  },
});
