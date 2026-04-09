import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type StreakData } from '../types';

interface Props {
  streakData: StreakData | null;
}

export function StreakCalendar({ streakData }: Props) {
  if (!streakData) return null;

  // Let's generate a simple last 14 days grid
  const days: { date: string; read: boolean; isFuture: boolean }[] = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Safety check against timezone weirdness making 'today' look like past
    const isFuture = d > today && d.getDate() !== today.getDate();
    
    days.push({
      date: dateStr,
      read: streakData.readHistory.includes(dateStr),
      isFuture
    });
  }

  const startDateFormatted = streakData.startDate ? new Date(streakData.startDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Recently';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flame" size={20} color="#E8751A" />
          <Text style={styles.title}>Sadhana Streak</Text>
        </View>
        <Text style={styles.streakCount}>{streakData.currentStreak} Days</Text>
      </View>
      
      <Text style={styles.subtitle}>Started on {startDateFormatted}</Text>

      <View style={styles.grid}>
        {days.map((day, ix) => (
          <View 
            key={ix} 
            style={[
              styles.dayCell, 
              day.read ? styles.dayCellRead : (day.isFuture ? styles.dayCellFuture : styles.dayCellMissed)
            ]}
          >
            {day.read && <Ionicons name="checkmark" size={12} color="#FFF" />}
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E8751A' }]} />
          <Text style={styles.legendText}>Read</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F0E0CC' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(232, 117, 26, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E8751A',
  },
  subtitle: {
    fontSize: 12,
    color: '#9A9A9A',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCell: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellRead: {
    backgroundColor: '#E8751A',
  },
  dayCellMissed: {
    backgroundColor: '#F0E0CC',
  },
  dayCellFuture: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0E0CC',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#9A9A9A',
  }
});
