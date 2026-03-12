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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
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
            Daily Intent
          </Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Decorative circle */}
        <View
          style={{
            position: 'absolute',
            top: 60,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: '#FFE8D0',
            opacity: 0.5,
          }}
        />

        {/* Main Question */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: '#1A1A1A',
              lineHeight: 38,
            }}
          >
            How do you feel today,{'\n'}or what are you{'\n'}seeking?
          </Text>
        </View>

        {/* Text Input Card */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: '#F0E0CC',
              padding: 20,
              minHeight: 160,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TextInput
              style={{
                fontSize: 16,
                color: '#333',
                lineHeight: 24,
                flex: 1,
                textAlignVertical: 'top',
              }}
              placeholder="Type your feelings or intentions here... e.g., 'I am feeling overwhelmed with work and need peace.'"
              placeholderTextColor="#C0B0A0"
              multiline
              value={mood}
              onChangeText={setMood}
            />
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontSize: 18, color: '#F5C518' }}>✨</Text>
            </View>
          </View>
        </View>

        {/* Quick-Select Moods */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#999',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Quick-Select Moods
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
                  borderWidth: 1.5,
                  borderColor: '#F0D0B0',
                  backgroundColor: mood === m ? '#FFF3E8' : '#FFF',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#E8751A',
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
              backgroundColor: '#FFF0F0',
              borderWidth: 1,
              borderColor: '#FFD0D0',
            }}
          >
            <Text style={{ fontSize: 14, color: '#CC3333' }}>{error}</Text>
          </View>
        )}

        {/* Find My Sloka Button */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <TouchableOpacity
            onPress={handleFindSloka}
            disabled={isLoading || !mood.trim()}
            style={{
              backgroundColor: isLoading || !mood.trim() ? '#E0D0C0' : '#E8751A',
              paddingVertical: 18,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#E8751A',
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
                    color: '#FFF',
                    fontSize: 17,
                    fontWeight: '700',
                  }}
                >
                  Find My Sloka
                </Text>
                <Ionicons name="book" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
