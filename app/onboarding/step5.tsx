import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeIn, Layout, Easing } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { saveOnboardingStep, completeOnboarding, getOnboardingData } from '../../src/utils/stats';
import { scheduleSmartNotifications } from '../../src/utils/notifications';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function OnboardingStep5() {
  const router = useRouter();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [time, setTime] = useState(new Date(new Date().setHours(8, 0, 0, 0))); // Default 8 AM
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      // 1. ALWAYS save state first to ensure user isn't stuck if permissions hang
      await saveOnboardingStep('remindersEnabled', remindersEnabled);
      await saveOnboardingStep('reminderTime', time.toISOString());
      await completeOnboarding();

      // 2. Attempt notification setup if enabled
      if (remindersEnabled) {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
        
        try {
          const onboarding = await getOnboardingData();
          const slokasStr = onboarding?.dailyCommitment || '2';
          
          await Promise.race([
            scheduleSmartNotifications(time, slokasStr),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Smart Notification setup failed or timed out:', err);
        }
      }
    } catch (error) {
      console.error('Error in handleComplete:', error);
    } finally {
      setIsLoading(false);
      // Navigate to paywall regardless of notification success
      router.replace('/onboarding/paywall' as any);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  return (
    <OnboardingBackground
      image={require('../../assets/images/onboarding_3.png')}
      overlayOpacity={0.7}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D1D5DB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personalization</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressStepLabel}>Final Step</Text>
              <Text style={styles.progressStep}>5 OF 5</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View layout={Layout.springify().damping(15)} style={styles.progressBarFill} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Set your daily reminder</Text>
            <Text style={styles.subtitle}>Consistency is key to a peaceful mind.</Text>
          </Animated.View>

          {/* Reminders Toggle */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.remindersContainer}>
            <View style={styles.remindersContent}>
              <Text style={styles.remindersTitle}>Daily Reminders</Text>
              <Text style={styles.remindersDescription}>Remind me to stay on path</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: '#374151', true: '#1A2747' }}
              thumbColor={remindersEnabled ? '#F48B29' : '#9CA3AF'}
              ios_backgroundColor="#374151"
            />
          </Animated.View>

          {/* Time Picker */}
          {remindersEnabled && (
            <Animated.View entering={FadeIn.duration(400).delay(400)} style={styles.timePickerContainer}>
              <Text style={styles.timePickerLabel}>Choose a time</Text>
              <View style={styles.timePickerWrapper}>
                {Platform.OS === 'web' ? (
                  <View style={[styles.timePickerWrapper, { padding: 10 }]}>
                    {React.createElement('input', {
                      type: 'time',
                      value: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
                      onChange: (e: any) => {
                        if (e.target && e.target.value) {
                          const [h, m] = e.target.value.split(':');
                          const newTime = new Date(time);
                          newTime.setHours(parseInt(h, 10), parseInt(m, 10));
                          setTime(newTime);
                        }
                      },
                      style: {
                        padding: '12px 16px',
                        fontSize: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(22, 32, 58, 0.7)',
                        color: '#E5E7EB',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }
                    })}
                  </View>
                ) : (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                    style={styles.timePicker}
                    textColor="#E5E7EB"
                  />
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleComplete}
            style={styles.completeButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <React.Fragment>
                <Text style={styles.completeButtonText}>Saving...</Text>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Text style={styles.completeButtonText}>Complete Setup</Text>
                <Ionicons name="sparkles" size={20} color="#0A1128" style={styles.sparkleIcon} />
              </React.Fragment>
            )}
          </TouchableOpacity>
          
          <Text style={styles.footerHint}>
            You can change these settings anytime in your profile.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E5E7EB',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  progressStep: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F48B29',
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F48B29',
    width: '100%',
    borderRadius: 999,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 10,
    lineHeight: 22,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  remindersContainer: {
    marginTop: 8,
    padding: 18,
    backgroundColor: 'rgba(22, 32, 58, 0.7)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  remindersContent: {
    flex: 1,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  remindersDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(22, 32, 58, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timePickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
  },
  timePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timePicker: {
    width: 200,
    height: 150,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F48B29',
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1128',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 16,
  },
});
