import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { getStreakData } from '../src/utils/stats';

export default function MilestoneScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(7);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    // Load actual streak if needed, default to 7 for showcase
    getStreakData().then(data => {
      if (data.currentStreak > 0) {
        setStreak(data.currentStreak);
      }
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF8' }}>
      
      {/* Background Gradient Illusion using Blurred Circles */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{
          position: 'absolute',
          top: -100,
          left: -50,
          width: 500,
          height: 600,
          borderRadius: 250,
          backgroundColor: '#EAA670',
          opacity: 0.4,
        }} />
        <View style={{
          position: 'absolute',
          top: 200,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: '#F8D1A8',
          opacity: 0.3,
        }} />
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Reading</Text>
        <View style={{ width: 44 }} /> {/* Spacer */}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          
          <Text style={styles.milestoneText}>
            MILESTONE REACHED
          </Text>

          {/* Central Circle */}
          <View style={styles.circleContainer}>
            <View style={styles.mainCircle}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>Days</Text>
            </View>
            
            {/* Star Badge */}
            <View style={styles.starBadge}>
              <Ionicons name="star" size={20} color="#FFF" />
            </View>
          </View>

          {/* Typography */}
          <Text style={styles.mainHeading}>
            Your soul is gaining{'\n'}true wisdom.
          </Text>
          
          <Text style={styles.subHeading}>
            You've unlocked the <Text style={{fontWeight: '700', color: '#555'}}>Seeker</Text> badge for{'\n'}your 1-week consistency.
          </Text>

          {/* Read Stats Card */}
          <TouchableOpacity activeOpacity={0.8} style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Ionicons name="book" size={20} color="#E8751A" />
            </View>
            <View style={styles.statsTextContainer}>
              <Text style={styles.statsTitle}>140 Minutes Read</Text>
              <Text style={styles.statsDesc}>Total focus time this week</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#E8751A" opacity={0.6} />
          </TouchableOpacity>

        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <Animated.View style={[styles.bottomActions, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Continue Journey</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareText}>Share your progress</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1128',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 160, // Space for fixed bottom buttons
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC7E33', // Darker orange
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  mainCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8751A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 245, 235, 0.8)',
  },
  streakNumber: {
    fontSize: 84,
    fontWeight: '700',
    color: '#E8751A',
    lineHeight: 90,
  },
  streakLabel: {
    fontSize: 22,
    color: '#606C76',
    fontWeight: '500',
  },
  starBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A1128', // Very dark blue/black
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subHeading: {
    fontSize: 18,
    color: '#717D96',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  statsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 164, 0.3)', // Very translucent orange 
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 164, 0.5)',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 117, 26, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1128',
    marginBottom: 4,
  },
  statsDesc: {
    fontSize: 13,
    color: '#717D96',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.8)',
    backgroundColor: '#FAFAF8',
  },
  primaryButton: {
    backgroundColor: '#FB923C', // matching UI screenshot orange
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  shareButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  shareText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  }
});
