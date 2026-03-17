import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView, Platform, Alert } from 'react-native';
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
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set(COMMON_DISTRACTIONS.map(a => a.id)));
  const [stats, setStats] = useState({ slokasRead: 0, dayStreak: 0 });

  useEffect(() => {
    getAllStats().then(setStats);
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
        Alert.alert('Select Apps', 'Please select at least one app to block.');
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F48B29" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dharma Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={40} color="#F48B29" style={{ marginBottom: 12 }} />
          <Text style={styles.infoTitle}>Cultivate Focus</Text>
          <Text style={styles.infoDesc}>
            Dharma mode eliminates temptations by temporarily blocking distracting apps until you complete your daily reading goal.
          </Text>
          <View style={styles.goalRow}>
            <Text style={styles.goalText}>Daily Progress: {stats.slokasRead} Slokas Read</Text>
          </View>
        </View>

        {/* Master Toggle */}
        <View style={styles.masterToggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.masterTitle}>Enable Dharma Mode</Text>
            <Text style={styles.masterSub}>Blocks selected apps</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggleDharmaMode}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(244, 139, 41, 0.5)' }}
            thumbColor={isActive ? '#F48B29' : '#B8A99A'}
          />
        </View>

        {/* App Selection List */}
        <Text style={styles.sectionTitle}>Apps to Restrict (Android Only)</Text>
        <View style={styles.appList}>
          {COMMON_DISTRACTIONS.map(app => (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appIconBg}>
                <Ionicons name={app.icon as any} size={20} color="#B8A99A" />
              </View>
              <Text style={styles.appName}>{app.name}</Text>
              <Switch
                value={selectedApps.has(app.id)}
                onValueChange={() => toggleApp(app.id)}
                disabled={isActive}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(244, 139, 41, 0.5)' }}
                thumbColor={selectedApps.has(app.id) ? '#F48B29' : '#B8A99A'}
              />
            </View>
          ))}
        </View>

        {Platform.OS === 'ios' && (
          <Text style={styles.iosWarning}>
            Note: On iOS, app blocking requires specific Apple Family Controls entitlements which are not available in standard development builds.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3D2817',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(244, 139, 41, 0.2)',
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  infoDesc: {
    fontSize: 14,
    color: '#B8A99A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  goalRow: {
    backgroundColor: 'rgba(244, 139, 41, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  goalText: {
    color: '#F48B29',
    fontWeight: '600',
    fontSize: 14,
  },
  masterToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  masterSub: {
    fontSize: 13,
    color: '#B8A99A',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 8,
  },
  appList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  appIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  iosWarning: {
    marginTop: 24,
    fontSize: 12,
    color: '#F48B29',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  }
});
