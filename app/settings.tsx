import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../src/hooks/useNotifications';
import { getAllStats } from '../src/utils/stats';
export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useNotifications();
  const [dharmaMode, setDharmaMode] = useState(false);
  const [stats, setStats] = useState({ slokasRead: 0, dayStreak: 0, saved: 0 });

  useEffect(() => {
    getAllStats().then(setStats);
  }, []);

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#E8751A" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: '600',
            color: '#1A1A1A',
          }}
        >
          Settings
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Section */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 20,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: '#FFF3E8',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#F0E0CC',
            }}
          >
            <Ionicons name="person" size={24} color="#E8751A" />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>
              Arjun Sharma
            </Text>
            <Text style={{ fontSize: 13, color: '#B0A090', marginTop: 2 }}>
              {stats.slokasRead} Slokas Read • {stats.dayStreak} Day Streak
            </Text>
          </View>
        </View>

        {/* Profile & Language Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#E8751A',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Profile & Language
          </Text>

          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#F0E0CC',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => Alert.alert("Select Language", "Hindi language support will be available in a future update.", [{ text: "OK" }])}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F5F0E8',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 18 }}>🔤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  App Language
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  Choose your preferred reading language
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginRight: 6 }}>
                English
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#D0C0B0" />
            </TouchableOpacity>

            {/* Reading History */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F5F0E8',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="time-outline" size={18} color="#E8751A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  Reading History
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  Review your previously read Slokas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D0C0B0" />
            </TouchableOpacity>

            {/* View All Slokas */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library' as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="library-outline" size={18} color="#E8751A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  View All Slokas
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  Browse the complete collection
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D0C0B0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#E8751A',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Notifications
          </Text>

          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#F0E0CC',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Daily Notifications */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F5F0E8',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="notifications" size={18} color="#E8751A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  Daily Notifications
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  Receive a daily Sloka reminder
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(v) => updateSettings({ enabled: v })}
                trackColor={{ false: '#E0D8D0', true: '#E8751A' }}
                thumbColor="#FFF"
              />
            </View>

            {/* Reminder Time */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="time" size={18} color="#E8751A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                  Reminder Time
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#E8751A',
                  marginRight: 8,
                }}
              >
                {formatTime(settings.hour, settings.minute)}
              </Text>
              <Ionicons name="time-outline" size={18} color="#999" />
            </View>
          </View>
        </View>

        {/* Dharma Mode Card */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#E8751A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            {/* Gradient-like background using two layers */}
            <View
              style={{
                backgroundColor: '#E8751A',
                padding: 22,
                borderRadius: 24,
              }}
            >
              {/* Dharma Mode */}
              <TouchableOpacity
                onPress={() => router.push('/dharma' as any)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="shield-checkmark" size={24} color="#F48B29" />
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '500', marginBottom: 2 }}>
                      Dharma Mode
                    </Text>
                    <Text style={{ fontSize: 13, color: '#B8A99A' }}>
                      Block distracted apps
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B7355" />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 22,
                }}
              >
                Lock distracting apps until you complete your daily Sloka study. Build
                a disciplined spiritual habit.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={{ fontSize: 13, color: '#C0B0A0', marginBottom: 14 }}>
            Vande Mataram · App Version 1.0.0
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8751A' }}>
              PRIVACY
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8751A' }}>
              TERMS
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E8751A' }}>
              SUPPORT
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
