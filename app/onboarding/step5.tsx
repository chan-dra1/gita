import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { saveOnboardingStep, completeOnboarding } from '../../src/utils/stats';

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
        // Use a shorter timeout (2s) so we don't hang on OS permission prompts
        const permissionPromise = Notifications.requestPermissionsAsync();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
        
        try {
          const { status } = await Promise.race([permissionPromise, timeoutPromise]) as any;
          if (status === 'granted') {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Your Daily Dharma Awaits 🕉️",
                body: "Take a moment for inner peace. Read today's sloka.",
              },
              trigger: {
                hour: time.getHours(),
                minute: time.getMinutes(),
                repeats: true,
              } as any,
            });
          }
        } catch (err) {
          console.warn('Notification setup failed or timed out:', err);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6F0" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
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
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressStepLabel}>Final Step</Text>
            <Text style={styles.progressStep}>5 OF 5</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Set your daily reminder</Text>
          <Text style={styles.subtitle}>Consistency is key to a peaceful mind.</Text>
        </View>

        {/* Reminders Toggle */}
        <View style={styles.remindersContainer}>
          <View style={styles.remindersContent}>
            <Text style={styles.remindersTitle}>Daily Reminders</Text>
            <Text style={styles.remindersDescription}>Remind me to stay on path</Text>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{ false: '#E5E7EB', true: '#FDE8D4' }}
            thumbColor={remindersEnabled ? '#F48B29' : '#9CA3AF'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Time Picker */}
        {remindersEnabled && (
          <View style={styles.timePickerContainer}>
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
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#1A1A1A',
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
                  textColor="#1A1A1A"
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
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
              <Ionicons name="sparkles" size={20} color="#FFFFFF" style={styles.sparkleIcon} />
            </React.Fragment>
          )}
        </TouchableOpacity>
        
        <Text style={styles.footerHint}>
          You can change these settings anytime in your profile.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
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
    color: '#1A1A1A',
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
    color: '#1A1A1A',
  },
  progressStep: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F48B29',
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FDE8D4',
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F48B29',
    borderRadius: 999,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
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
    backgroundColor: '#FEF8F3',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FDE8D4',
    marginBottom: 24,
  },
  remindersContent: {
    flex: 1,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  remindersDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
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
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 16,
  },
});
