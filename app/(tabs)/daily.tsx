import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSloka } from '../../src/hooks/useSloka';

const QUICK_MOODS = [
  'Anxious',
  'Focused',
  'Stressed',
  'Curious',
  'Grateful',
  'Lost',
  'Peaceful',
  'Fearful',
];

export default function DailyScreen() {
  const router = useRouter();
  const [mood, setMood] = useState('');
  const { sloka: recommendation, isLoading, error, fetchByMood } = useSloka();

  const handleFindSloka = async () => {
    if (!mood.trim()) return;
    await fetchByMood(mood);
  };

  // Navigate when recommendation changes
  if (recommendation && !isLoading) {
    router.push(`/sloka/${recommendation.chapter}/${recommendation.verse}` as any);
  }

  const handleQuickMood = async (selectedMood: string) => {
    setMood(selectedMood);
    await fetchByMood(selectedMood);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#D4A44C',
              letterSpacing: 1,
            }}
          >
            DAILY INTENT
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#FFFFFF',
              marginTop: 4,
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            }}
          >
            How do you feel today?
          </Text>
        </View>

        {/* Decorative accent line */}
        <View
          style={{
            marginHorizontal: 24,
            height: 1,
            backgroundColor: 'rgba(212, 164, 76, 0.2)',
            marginBottom: 24,
          }}
        />

        {/* Text Input Card */}
        <View style={{ paddingHorizontal: 24 }}>
          <View
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(212, 164, 76, 0.15)',
              padding: 20,
              minHeight: 160,
            }}
          >
            <TextInput
              style={{
                fontSize: 16,
                color: '#E0D5C5',
                lineHeight: 24,
                flex: 1,
                textAlignVertical: 'top',
              }}
              placeholder="Type your feelings or intentions here... e.g., 'I am feeling overwhelmed with work and need peace.'"
              placeholderTextColor="#555555"
              multiline
              value={mood}
              onChangeText={setMood}
            />
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontSize: 18, color: '#D4A44C' }}>✨</Text>
            </View>
          </View>
        </View>

        {/* Quick-Select Moods */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#D4A44C',
              letterSpacing: 1.5,
              marginBottom: 14,
            }}
          >
            QUICK-SELECT MOODS
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {QUICK_MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handleQuickMood(m)}
                disabled={isLoading}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: mood === m ? '#D4A44C' : 'rgba(255,255,255,0.1)',
                  backgroundColor: mood === m ? 'rgba(212, 164, 76, 0.1)' : '#1A1A1A',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: mood === m ? '#D4A44C' : '#9CA3AF',
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Error */}
        {error && (
          <View
            style={{
              marginHorizontal: 24,
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(220, 50, 50, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(220, 50, 50, 0.3)',
            }}
          >
            <Text style={{ fontSize: 14, color: '#FF6B6B' }}>{error}</Text>
          </View>
        )}

        {/* Find My Sloka Button */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <TouchableOpacity
            onPress={handleFindSloka}
            disabled={isLoading || !mood.trim()}
            style={{
              backgroundColor: isLoading || !mood.trim() ? '#333333' : '#D4A44C',
              paddingVertical: 18,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#D4A44C',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isLoading || !mood.trim() ? 0 : 0.3,
              shadowRadius: 16,
              elevation: isLoading || !mood.trim() ? 0 : 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text
                  style={{
                    color: isLoading || !mood.trim() ? '#666' : '#0D0D0D',
                    fontSize: 17,
                    fontWeight: '700',
                  }}
                >
                  Find My Sloka
                </Text>
                <Ionicons name="book" size={20} color={isLoading || !mood.trim() ? '#666' : '#0D0D0D'} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Gita Quote */}
        <View style={{ paddingHorizontal: 24, marginTop: 40, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              color: '#555',
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              lineHeight: 22,
              textAlign: 'center',
            }}
          >
            "You have the right to work, but never to the fruit of work."
          </Text>
          <Text style={{ fontSize: 10, color: '#444', fontWeight: '700', letterSpacing: 1, marginTop: 8 }}>
            BHAGAVAD GITA 2.47
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
