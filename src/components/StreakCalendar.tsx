import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type StreakData } from '../types';

interface Props {
  streakData: StreakData | null;
}

const { width } = Dimensions.get('window');

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
          <Ionicons name="flame" size={20} color="#D4A44C" />
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
            {day.read && <Ionicons name="checkmark" size={12} color="#0D0D0D" />}
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#D4A44C' }]} />
          <Text style={styles.legendText}>Read</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.15)',
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
    color: '#FFFFFF',
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D4A44C',
  },
  subtitle: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCell: {
    width: (width - 40 - 40 - (13 * 4)) / 14, // Responsive cell sizing
    aspectRatio: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellRead: {
    backgroundColor: '#D4A44C',
  },
  dayCellMissed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayCellFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    borderStyle: 'dashed',
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
    color: '#666',
  }
});
