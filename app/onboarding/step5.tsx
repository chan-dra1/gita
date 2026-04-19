import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeIn, Easing } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { saveOnboardingStep, completeOnboarding, getOnboardingData } from '../../src/utils/stats';
import { scheduleSmartNotifications } from '../../src/utils/notifications';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { LinearGradient } from 'expo-linear-gradient';

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

function formatReminderDisplay(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function OnboardingStep5() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [time, setTime] = useState(new Date(new Date().setHours(8, 0, 0, 0))); // Default 8 AM
  const [isLoading, setIsLoading] = useState(false);
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dotsRow: { flexDirection: 'row', gap: 6 },
    topDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    topDotActive: { width: 18, backgroundColor: colors.primary },
    titleContainer: {
      marginTop: 8,
      marginBottom: 24,
    },
    mainTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      lineHeight: 36,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
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
      backgroundColor: colors.card,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    remindersContent: {
      flex: 1,
    },
    remindersTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    remindersDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    timeCardOuter: {
      marginBottom: 24,
      borderRadius: 20,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#D4A44C',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.2 : 0.12,
          shadowRadius: 20,
        },
        android: { elevation: 6 },
        default: {},
      }),
    },
    timeCardGradient: {
      borderRadius: 20,
      padding: 1,
    },
    timeCardInner: {
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(14, 14, 18, 0.98)' : colors.card,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(212, 164, 76, 0.18)',
    },
    timeEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
      color: colors.primary,
      opacity: 0.95,
      textAlign: 'center',
      marginBottom: 6,
    },
    timeTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    timeSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 18,
    },
    timeTapArea: {
      position: 'relative' as const,
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
    },
    timeTapGradient: {
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(212, 164, 76, 0.2)',
    },
    timeTapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    timeIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(212, 164, 76, 0.25)',
    },
    timeLarge: {
      fontSize: Platform.OS === 'web' ? 26 : 24,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.5,
    },
    timeHint: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      opacity: 0.85,
    },
    iosPickerShell: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: 180,
      backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timePickerIOS: {
      width: '100%',
      height: 178,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    button: {
      borderRadius: 8, // Updated from 16
      paddingVertical: 18, // Updated from 16
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12, // Updated from no gap
      backgroundColor: colors.primary, // Keeping background color for gradient to overlay
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.background,
      letterSpacing: 0.5,
    },
    footerHint: {
      fontSize: 12,
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 16,
    },
  }), [colors, isDark]);

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
      // Navigate to next step (share showcase) instead of paywall directly
      router.replace('/onboarding/step6' as any);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  const onAndroidTimeChange = (_event: any, selectedDate?: Date) => {
    setAndroidPickerVisible(false);
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  return (
    <OnboardingBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} translucent />
        
        {/* Progress dots */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <View key={i} style={[styles.topDot, i === 4 && styles.topDotActive]} />
            ))}
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Set your daily reminder</Text>
            <Text style={styles.subtitle}>Consistency is key to a peaceful mind.</Text>
          </Animated.View>

          {/* Reminders Toggle */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.remindersContainer}>
            <View style={styles.remindersContent}>
              <Text style={styles.remindersTitle}>Daily Reminders</Text>
              <Text style={styles.remindersDescription}>Remind me to stay on path</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={remindersEnabled ? (isDark ? colors.background : colors.card) : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </Animated.View>

          {/* Time picker — gold-accent card; tappable row on web & Android */}
          {remindersEnabled && (
            <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.timeCardOuter}>
              <LinearGradient
                colors={['rgba(212, 164, 76, 0.45)', 'rgba(212, 164, 76, 0.08)', 'rgba(20, 20, 24, 0.4)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.timeCardGradient}
              >
                <View style={styles.timeCardInner}>
                  <Text style={styles.timeEyebrow}>REMINDER TIME</Text>
                  <Text style={styles.timeTitle}>Choose a time</Text>
                  <Text style={styles.timeSubtitle}>We’ll send one gentle nudge each day at this hour.</Text>

                  {Platform.OS === 'web' ? (
                    <View style={styles.timeTapArea}>
                      <LinearGradient
                        colors={['rgba(212, 164, 76, 0.14)', 'rgba(212, 164, 76, 0.04)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.timeTapGradient}
                      >
                        <View style={styles.timeTapRow}>
                          <View style={styles.timeIconCircle}>
                            <Ionicons name="time-outline" size={22} color={colors.primary} />
                          </View>
                          <Text style={styles.timeLarge}>{formatReminderDisplay(time)}</Text>
                          <Ionicons name="chevron-down" size={20} color={colors.primary} />
                        </View>
                      </LinearGradient>
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
                        'aria-label': 'Choose reminder time',
                        style: {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 2,
                        },
                      })}
                    </View>
                  ) : Platform.OS === 'android' ? (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => setAndroidPickerVisible(true)}
                        style={styles.timeTapArea}
                      >
                        <LinearGradient
                          colors={['rgba(212, 164, 76, 0.14)', 'rgba(212, 164, 76, 0.04)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.timeTapGradient}
                        >
                          <View style={styles.timeTapRow}>
                            <View style={styles.timeIconCircle}>
                              <Ionicons name="time-outline" size={22} color={colors.primary} />
                            </View>
                            <Text style={styles.timeLarge}>{formatReminderDisplay(time)}</Text>
                            <Ionicons name="chevron-down" size={20} color={colors.primary} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      {androidPickerVisible ? (
                        <DateTimePicker
                          value={time}
                          mode="time"
                          display="default"
                          onChange={onAndroidTimeChange}
                        />
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.iosPickerShell}>
                      <DateTimePicker
                        value={time}
                        mode="time"
                        display="spinner"
                        onChange={onTimeChange}
                        style={styles.timePickerIOS}
                        textColor={colors.text}
                      />
                    </View>
                  )}

                  <Text style={styles.timeHint}>
                    {Platform.OS === 'ios'
                      ? 'Scroll to set the time · you can change this anytime in Settings'
                      : 'Tap the time to change · adjustable anytime in Settings'}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>

        <Animated.View entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))} style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleComplete}
            style={styles.button}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#D4A44C', '#C2983B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12, borderRadius: 8, overflow: 'hidden', flex: 1 }}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Saving...</Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>Complete Setup</Text>
                  <Ionicons name="sparkles" size={20} color={colors.background} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.footerHint}>
            You can change these settings anytime in your profile.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </OnboardingBackground>
  );
}