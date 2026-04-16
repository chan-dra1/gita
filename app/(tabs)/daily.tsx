import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
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
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 20,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginTop: 4,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    accentLine: {
      marginHorizontal: 24,
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 24,
    },
    textInputCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      minHeight: 160,
    },
    textInput: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      flex: 1,
      textAlignVertical: 'top',
    },
    moodEmoji: {
      fontSize: 18,
      color: colors.primary,
    },
    quickMoodsContainer: {
      paddingHorizontal: 24,
      marginTop: 28,
    },
    quickMoodsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.5,
      marginBottom: 14,
    },
    moodButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    moodButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1,
    },
    moodButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    errorContainer: {
      marginHorizontal: 24,
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      backgroundColor: 'rgba(220, 50, 50, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(220, 50, 50, 0.3)',
    },
    errorText: {
      fontSize: 14,
      color: '#FF6B6B',
    },
    findSlokaButtonContainer: {
      paddingHorizontal: 24,
      marginTop: 32,
    },
    findSlokaButton: {
      paddingVertical: 18,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    findSlokaButtonText: {
      fontSize: 17,
      fontWeight: '700',
    },
    gitaQuoteContainer: {
      paddingHorizontal: 24,
      marginTop: 40,
      alignItems: 'center',
    },
    gitaQuoteText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      lineHeight: 22,
      textAlign: 'center',
    },
    gitaQuoteSource: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '700',
      letterSpacing: 1,
      marginTop: 8,
    },
  }), [colors, isDark]);
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={styles.header}
        >
          <Text
            style={styles.headerSubtitle}
          >
            DAILY INTENT
          </Text>
          <Text
            style={styles.headerTitle}
          >
            How do you feel today?
          </Text>
        </View>

        {/* Decorative accent line */}
        <View
          style={styles.accentLine}
        />

        {/* Text Input Card */}
        <View style={{ paddingHorizontal: 24 }}>
          <View
            style={styles.textInputCard}
          >
            <TextInput
              style={styles.textInput}
              placeholder="Type your feelings or intentions here... e.g., 'I am feeling overwhelmed with work and need peace.'"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={mood}
              onChangeText={setMood}
            />
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={styles.moodEmoji}>✨</Text>
            </View>
          </View>
        </View>

        {/* Quick-Select Moods */}
        <View style={styles.quickMoodsContainer}>
          <Text
            style={styles.quickMoodsTitle}
          >
            QUICK-SELECT MOODS
          </Text>
          <View
            style={styles.moodButtonsContainer}
          >
            {QUICK_MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handleQuickMood(m)}
                disabled={isLoading}
                style={[
                  styles.moodButton,
                  { 
                    borderColor: mood === m ? colors.primary : colors.border,
                    backgroundColor: mood === m ? `${colors.primary}10` : colors.card,
                    opacity: isLoading ? 0.6 : 1,
                  }
                ]}
              >
                <Text
                  style={{
                    ...styles.moodButtonText,
                    color: mood === m ? colors.primary : colors.textSecondary,
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
            style={styles.errorContainer}
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Find My Sloka Button */}
        <View style={styles.findSlokaButtonContainer}>
          <TouchableOpacity
            onPress={handleFindSloka}
            disabled={isLoading || !mood.trim()}
            style={[
              styles.findSlokaButton,
              {
                backgroundColor: isLoading || !mood.trim() ? colors.border : colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: isLoading || !mood.trim() ? 0 : 0.3,
                elevation: isLoading || !mood.trim() ? 0 : 8,
              }
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Text
                  style={{
                    ...styles.findSlokaButtonText,
                    color: isLoading || !mood.trim() ? colors.textSecondary : colors.background,
                  }}
                >
                  Find My Sloka
                </Text>
                <Ionicons name="book" size={20} color={isLoading || !mood.trim() ? colors.textSecondary : colors.background} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Gita Quote */}
        <View style={styles.gitaQuoteContainer}>
          <Text
            style={styles.gitaQuoteText}
          >
            "You have the right to work, but never to the fruit of work."
          </Text>
          <Text style={styles.gitaQuoteSource}>
            BHAGAVAD GITA 2.47
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
