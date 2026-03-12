import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRandomSloka } from '../../src/utils/sloka';

const KRISHNA_IMAGES = [
  require('../../assets/images/home/krishna_1.png'),
  require('../../assets/images/home/krishna_2.png'),
  require('../../assets/images/home/krishna_3.png'),
  require('../../assets/images/home/krishna_4.png'),
  require('../../assets/images/home/krishna_5.png'),
  require('../../assets/images/home/krishna_6.png'),
  require('../../assets/images/home/krishna_7.png'),
  require('../../assets/images/home/krishna_8.png'),
  require('../../assets/images/home/krishna_9.png'),
  require('../../assets/images/home/krishna_10.png'),
];

const DHARMA_TIMES = ['1 min', '5 mins', '10 mins'];

export default function HomeScreen() {
  const router = useRouter();
  const dailySloka = getRandomSloka();
  const [selectedTime, setSelectedTime] = useState('5 mins');

  const randomKrishnaImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * KRISHNA_IMAGES.length);
    return KRISHNA_IMAGES[randomIndex];
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 24,
            paddingTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#E8751A" />
          </TouchableOpacity>
        </View>

        {/* Krishna Image Card */}
        <View style={{ alignItems: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              aspectRatio: 1,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: '#F5EDE0',
              shadowColor: '#E8751A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <Image
              source={randomKrishnaImage}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Title */}
        <View style={{ alignItems: 'center', marginTop: 28, paddingHorizontal: 32 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '700',
              color: '#1A1A1A',
              textAlign: 'center',
              lineHeight: 38,
            }}
          >
            Welcome, Seek Your{'\n'}Inner Peace
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: '#9A9A9A',
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            Set your daily spiritual intention
          </Text>
        </View>

        {/* I prefer to... */}
        <View style={{ marginTop: 32, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>✨</Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#1A1A1A',
              }}
            >
              I prefer to...
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Read Button */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library' as any)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E8751A',
                paddingVertical: 16,
                borderRadius: 16,
                gap: 8,
                shadowColor: '#E8751A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Ionicons name="book" size={18} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                Read
              </Text>
            </TouchableOpacity>

            {/* Listen Button */}
            <TouchableOpacity
              onPress={() => {
                if (dailySloka) {
                  router.push(`/sloka/${dailySloka.chapter}/${dailySloka.verse}` as any);
                }
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFF',
                paddingVertical: 16,
                borderRadius: 16,
                gap: 8,
                borderWidth: 1.5,
                borderColor: '#F0E0CC',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons name="headset" size={18} color="#E8751A" />
              <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>
                Listen
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Dharma Time */}
        <View style={{ marginTop: 32, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🕐</Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#1A1A1A',
              }}
            >
              Daily Dharma Time
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {DHARMA_TIMES.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selectedTime === time ? '#E8751A' : '#F0E0CC',
                  backgroundColor: selectedTime === time ? '#FFF3E8' : '#FFF',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: selectedTime === time ? '#E8751A' : '#888',
                  }}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Set My Daily Dharma Button */}
        <View style={{ marginTop: 32, paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/daily' as any)}
            style={{
              backgroundColor: '#F5C518',
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#F5C518',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#1A1A1A',
                letterSpacing: 0.3,
              }}
            >
              Set My Daily Dharma ✦
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontStyle: 'italic',
            color: '#B0A090',
            marginTop: 24,
            paddingHorizontal: 40,
          }}
        >
          "Your path to enlightenment starts with a single step."
        </Text>

        {/* Today's Verse Preview */}
        {dailySloka && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/sloka/${dailySloka.chapter}/${dailySloka.verse}` as any)
            }
            style={{
              marginHorizontal: 24,
              marginTop: 28,
              padding: 20,
              borderRadius: 20,
              backgroundColor: '#FFF',
              borderWidth: 1,
              borderColor: '#F0E0CC',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, marginRight: 8 }}>📖</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#E8751A' }}>
                Today's Verse
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                color: '#333',
                lineHeight: 24,
                fontStyle: 'italic',
              }}
              numberOfLines={3}
            >
              "{dailySloka.translation_english}"
            </Text>
            <Text style={{ fontSize: 12, color: '#B0A090', marginTop: 10 }}>
              Chapter {dailySloka.chapter}, Verse {dailySloka.verse}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
