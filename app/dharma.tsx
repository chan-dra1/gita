import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView, Platform, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DharmaBlocker from '../modules/dharma-blocker';
import { getAllStats } from '../src/utils/stats';

const COMMON_DISTRACTIONS = [
  { id: 'com.instagram.android', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'com.zhiliaoapp.musically', name: 'TikTok', icon: 'videocam' },
  { id: 'com.google.android.youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'com.facebook.katana', name: 'Facebook', icon: 'logo-facebook' },
  { id: 'com.twitter.android', name: 'X (Twitter)', icon: 'logo-twitter' },
  { id: 'com.reddit.frontpage', name: 'Reddit', icon: 'logo-reddit' },
];

export default function DharmaModeScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [installedApps, setInstalledApps] = useState<{packageName: string, label: string}[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ slokasRead: 0, dayStreak: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const s = await getAllStats();
      setStats(s);
      
      try {
        const apps = await DharmaBlocker.getInstalledApps();
        // Sort alphabetically
        setInstalledApps(apps.sort((a, b) => a.label.localeCompare(b.label)));
      } catch (e) {
        console.error("Failed to load apps", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleApp = (id: string) => {
    const newSet = new Set(selectedApps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApps(newSet);
  };

  const handleToggleDharmaMode = async (value: boolean) => {
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
          Alert.alert('Permission Denied', 'Please grant the required permissions in Settings to enable Dharma Mode.');
        }
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    } else {
      DharmaBlocker.stopBlocking();
      setIsActive(false);
    }
  };

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
        {/* Info Card */}
        <View style={s.infoCard}>
          <View style={s.iconGlow}>
            <Ionicons name="shield-checkmark" size={40} color="#D4A44C" />
          </View>
          <Text style={s.infoTitle}>Cultivate Focus</Text>
          <Text style={s.infoDesc}>
            Restrict access to distracting social media and apps of your choice until you complete your daily reading.
          </Text>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>Progress: {stats.slokasRead} Slokas Read Today</Text>
          </View>
        </View>

        {/* Master Toggle */}
        <View style={s.masterCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.masterTitle}>Activate Restriction</Text>
            <Text style={[s.masterSub, isActive && { color: '#D4A44C' }]}>
              {isActive ? "Mode is ACTIVE" : "Blocks selected apps"}
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

        {/* App Selection List */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Select Apps to Restrict</Text>
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
                <Text style={s.appName} numberOfLines={1}>{app.label}</Text>
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

        {Platform.OS === 'ios' && (
          <View style={s.iosWarningBox}>
             <Ionicons name="information-circle-outline" size={16} color="#D4A44C" />
             <Text style={s.iosWarning}>
                iOS blocking requires specific system entitlements not available in dev builds.
             </Text>
          </View>
        )}
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
  iosWarningBox: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 164, 76, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.1)',
  },
  iosWarning: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  }
});
