import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStreakData } from '../src/utils/stats';
import { type StreakData } from '../src/types';

const { width } = Dimensions.get('window');
const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function StreakPage() {
  const router = useRouter();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getStreakData();
    setStreakData(data);
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days: { day: number; read: boolean; isToday: boolean; isFuture: boolean; isEmpty: boolean }[] = [];

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, read: false, isToday: false, isFuture: true, isEmpty: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today && !isToday;
      const read = streakData?.readHistory?.includes(dateStr) || false;
      days.push({ day: d, read, isToday, isFuture, isEmpty: false });
    }

    return days;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const streak = streakData?.currentStreak || 0;
  const bestStreak = streakData?.longestStreak || 0;
  const totalVersesRead = streakData?.readHistory?.length || 0;
  const startDate = streakData?.startDate
    ? new Date(streakData.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D4A44C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GITA PRO</Text>
          <TouchableOpacity onPress={() => router.push('/settings' as any)}>
            <Ionicons name="settings-outline" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Streak Hero */}
          <View style={styles.heroSection}>
            <View style={styles.streakIconCircle}>
              <Ionicons name="flame" size={38} color="#D4A44C" />
            </View>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>DAYS OF SACRED DEVOTION</Text>
          </View>

          {/* Calendar */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
                  <Ionicons name="chevron-back" size={18} color="#D4A44C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#D4A44C" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabelsRow}>
              {DAYS_OF_WEEK.map(d => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {getMonthDays().map((item, idx) => (
                <View key={idx} style={styles.dayCell}>
                  {item.isEmpty ? null : (
                    <View style={[
                      styles.dayCellInner,
                      item.read && styles.dayCellRead,
                      item.isToday && styles.dayCellToday,
                    ]}>
                      {item.read ? (
                        <Ionicons name="flame" size={14} color="#0D0D0D" />
                      ) : (
                        <Text style={[
                          styles.dayNumber,
                          item.isFuture && styles.dayNumberFuture,
                          item.isToday && styles.dayNumberToday,
                        ]}>
                          {item.day}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Consistency Insights */}
          <Text style={styles.insightsTitle}>CONSISTENCY INSIGHTS</Text>

          <View style={styles.insightsRow}>
            <View style={styles.insightCard}>
              <View style={styles.insightIconRow}>
                <Ionicons name="trophy" size={14} color="#D4A44C" />
                <Text style={styles.insightBadge}>BEST STREAK</Text>
              </View>
              <Text style={styles.insightValue}>{bestStreak} Days</Text>
              <Text style={styles.insightSub}>Since {startDate}</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIconRow}>
                <Ionicons name="book" size={14} color="#D4A44C" />
                <Text style={styles.insightBadge}>TOTAL VERSES</Text>
              </View>
              <Text style={styles.insightValue}>{totalVersesRead}</Text>
              <Text style={styles.insightSub}>Scholarly progress</Text>
            </View>
          </View>

          {/* Focus Card */}
          <View style={styles.focusCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle}>Focus Consistency</Text>
              <Text style={styles.focusSub}>Keep your streak alive by reading daily</Text>
            </View>
            <View style={styles.focusIconBox}>
              <Ionicons name="trending-up" size={24} color="#D4A44C" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D4A44C',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  streakIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 164, 76, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 164, 76, 0.3)',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#D4A44C',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  streakLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },

  // Calendar
  calendarCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  monthNav: { flexDirection: 'row', gap: 8 },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCellInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellRead: {
    backgroundColor: '#D4A44C',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#D4A44C',
  },
  dayNumber: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dayNumberFuture: { color: '#333' },
  dayNumberToday: { color: '#D4A44C', fontWeight: '700' },

  // Insights
  insightsTitle: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  insightBadge: {
    fontSize: 9,
    color: '#D4A44C',
    fontWeight: '800',
    letterSpacing: 1,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  insightSub: {
    fontSize: 11,
    color: '#666',
  },

  // Focus Card
  focusCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  focusSub: {
    fontSize: 12,
    color: '#666',
  },
  focusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 164, 76, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
});
