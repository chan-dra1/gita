import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Modal, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeColors } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { Config } from '../../src/constants/config';
import { saveOnboardingStep } from '../../src/utils/stats';
import { t } from '../../src/utils/i18n';
import { useLanguage } from '../../src/context/LanguageContext';
import { PaywallPopup } from '../../src/components/PaywallPopup';
import { OnboardingBackground } from '../../src/components/OnboardingBackground';
import { ONBOARDING_BACKGROUND_IMAGE } from '../../src/constants/onboardingAssets';

const TRIAL_DESCRIPTION = 'Includes 14-day free trial';

const FALLBACK_TIERS = [
  { id: 'lifetime', name: 'Lifetime', description: TRIAL_DESCRIPTION, price: '$99.99', period: '', popular: false, icon: 'infinite-outline' as const },
  { id: 'yearly', name: 'Yearly', description: TRIAL_DESCRIPTION, price: '$35.88', period: 'Just $2.99/mo', popular: true, badge: 'BEST VALUE', icon: 'refresh-outline' as const },
  { id: 'monthly', name: 'Monthly', description: TRIAL_DESCRIPTION, price: '$4.99', period: '', popular: false, icon: 'calendar-outline' as const },
];

const FEATURES = [
  { icon: 'trending-up' as const, title: 'Sadhana Growth Engine' },
  { icon: 'people' as const, title: 'Global Sankalpa Collective' },
  { icon: 'headset' as const, title: 'Guided Meditation Pro' },
  { icon: 'apps' as const, title: 'Native Home Screen Widgets' },
  { icon: 'lock-closed' as const, title: 'Focus & Dharma Blocker' },
  { icon: 'bar-chart' as const, title: 'Visual Progress & Streaks' },
  { icon: 'notifications' as const, title: 'Smart Spiritual Reminders' },
  { icon: 'bookmark' as const, title: 'Soul-Stirring Sloka Library' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [selectedTier, setSelectedTier] = useState<string>('yearly');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsFetching(false);
      return;
    }

    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
          const annual = offerings.current.availablePackages.find(p => p.packageType === 'ANNUAL');
          if (annual) setSelectedTier(annual.identifier);
          else setSelectedTier(offerings.current.availablePackages[0].identifier);
        }
      } catch (e) {
        console.warn('Failed to fetch offerings', e);
      } finally {
        setIsFetching(false);
      }
    };
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (packages.length === 0) {
      // Dev/web bypass — mark onboarding complete first
      await saveOnboardingStep('completedAt', new Date().toISOString());
      router.replace('/auth' as any);
      return;
    }

    const selectedPackage = packages.find(p => p.identifier === selectedTier);
    if (!selectedPackage) return;

    try {
      setIsPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (customerInfo.entitlements.active[Config.ENTITLEMENT_ID]) {
        await saveOnboardingStep('completedAt', new Date().toISOString());
        router.replace('/auth' as any);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Error', e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[Config.ENTITLEMENT_ID]) {
        Alert.alert('Success', 'Your purchase has been restored.', [
          { text: 'OK', onPress: () => router.replace({ pathname: '/auth' as any, params: { mode: 'login' } }) }
        ]);
      } else {
        Alert.alert('Nothing to Restore', 'No active subscriptions found.');
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e.message);
    }
  };

  const getDisplayTiers = () => {
    if (packages.length > 0) {
      return packages.map(p => ({
        id: p.identifier,
        name: p.packageType === 'ANNUAL' ? 'Yearly' : p.packageType === 'MONTHLY' ? 'Monthly' : p.packageType === 'LIFETIME' ? 'Lifetime' : p.identifier,
        description: TRIAL_DESCRIPTION,
        price: p.product.priceString,
        period: p.packageType === 'ANNUAL' ? `Just ${(p.product.price / 12).toFixed(2)}/mo` : '',
        popular: p.packageType === 'ANNUAL',
        badge: p.packageType === 'ANNUAL' ? 'BEST VALUE' : undefined,
        icon: (p.packageType === 'ANNUAL' ? 'refresh-outline' : p.packageType === 'MONTHLY' ? 'calendar-outline' : 'infinite-outline') as any,
      }));
    }
    return FALLBACK_TIERS;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? 40 : 16,
      paddingBottom: 12,
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: colors.primary, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    
    // Hero
    heroSection: { marginBottom: 32, marginTop: 8 },
    verseReference: { fontSize: 11, color: colors.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
    sanskritVerse: { fontSize: 24, color: colors.primary, lineHeight: 36, marginBottom: 20 },
    sanskritMuted: { color: `${colors.primary}66` }, // rgba(212, 164, 76, 0.4) is roughly colors.primary with alpha 0.4
    translationContainer: { borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 8 },
    translationText: { fontSize: 15, fontStyle: 'italic', color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 22 },

    // Features
    featuresSection: { marginBottom: 24 },
    sectionEyebrow: { fontSize: 10, color: colors.textSecondary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
    featuresList: { gap: 12 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' }, // rgba(212, 164, 76, 0.1)
    featureText: { fontSize: 14, color: colors.text },

    // Divider
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 24 }, // rgba(255,255,255,0.06)

    // Pricing
    pricingContainer: { gap: 12, marginBottom: 24 },
    tierCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border, // rgba(255,255,255,0.08)
      backgroundColor: colors.card, // rgba(255,255,255,0.04)
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    tierCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: `${colors.primary}12` }, // rgba(212, 164, 76, 0.08)
    badge: {
      position: 'absolute',
      top: 0,
      right: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    badgeText: { fontSize: 10, fontWeight: '800', color: colors.background, letterSpacing: 0.5 },
    tierContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tierLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    tierIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}1F`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, // rgba(212, 164, 76, 0.12)
    tierIconCircleSelected: { backgroundColor: colors.primary },
    tierInfo: { flex: 1 },
    tierName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
    tierNameSelected: { color: colors.text },
    tierDescription: { fontSize: 12, color: colors.textSecondary }, // rgba(255,255,255,0.4)
    tierDescriptionSelected: { color: `${colors.textSecondary}A0` }, // rgba(255,255,255,0.6) is not easily mapped, using primary with alpha
    tierRight: { alignItems: 'flex-end' },
    tierPrice: { fontSize: 20, fontWeight: '800', color: colors.text },
    tierPriceSelected: { color: colors.primary },
    tierPeriod: { fontSize: 11, color: colors.textSecondary, marginTop: 2 }, // rgba(255,255,255,0.4)
    tierPeriodSelected: { color: `${colors.primary}B3` }, // rgba(212, 164, 76, 0.7) is primary with alpha 0.7

    // CTA
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.background,
      letterSpacing: 0.5,
    },
    cancelText: { fontSize: 9, color: colors.textSecondary, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 32 },

    // Footer
    footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 },
    footerLink: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 }, // '#666'
    footerDot: { fontSize: 11, color: colors.border }, // '#444'
    copyright: { fontSize: 10, color: `${colors.textSecondary}40`, textAlign: 'center', lineHeight: 16, marginBottom: 16 }, // rgba(255,255,255,0.15)

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border }, // '#1A1A1A'
    modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textAlign: 'center' }, // '#FFFFFF'
    modalText: { fontSize: 15, color: colors.text, lineHeight: 24 }, // rgba(255,255,255,0.8)
    modalCloseButton: { marginTop: 24, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, // '#D4A44C'
    modalCloseText: { fontSize: 17, fontWeight: '700', color: colors.background }, // '#0D0D0D'
  }), [colors, isDark]);

  return (
    <OnboardingBackground imageSource={ONBOARDING_BACKGROUND_IMAGE}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gita Pro</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sanskrit Verse & Quote */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.heroSection}>
            <Text style={styles.verseReference}>BHAGAVAD GITA 2.47</Text>
            <Text style={styles.sanskritVerse}>
              कर्मण्येवाधिकारस्ते{' '}
              <Text style={styles.sanskritMuted}>मा फलेषु कदाचन।</Text>{'\n'}
              <Text style={styles.sanskritMuted}>मा कर्मफलहेतुर्भूर्मा</Text>{' '}
              ते सङ्गोऽस्त्वकर्मणि॥
            </Text>
            
            <View style={styles.translationContainer}>
              <Text style={styles.translationText}>
                "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions."
              </Text>
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.featuresSection}>
            <Text style={styles.sectionEyebrow}>WHAT YOU UNLOCK</Text>
            <View style={styles.featuresList}>
              {FEATURES.map((item, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconBox}>
                    <Ionicons name={item.icon} size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.featureText}>{item.title}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Pricing Tiers */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)}>
            <Text style={styles.sectionEyebrow}>CHOOSE YOUR PLAN</Text>
            <View style={styles.pricingContainer}>
              {isFetching ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
              ) : (
                getDisplayTiers().map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTier(tier.id)}
                      style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                    >
                      {tier.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{tier.badge}</Text>
                        </View>
                      )}
                      <View style={styles.tierContent}>
                        <View style={styles.tierLeft}>
                          <View style={[styles.tierIconCircle, isSelected && styles.tierIconCircleSelected]}>
                            <Ionicons name={tier.icon} size={18} color={isSelected ? colors.background : colors.primary} />
                          </View>
                          <View style={styles.tierInfo}>
                            <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>{tier.name}</Text>
                            <Text style={[styles.tierDescription, isSelected && styles.tierDescriptionSelected]}>{tier.description}</Text>
                          </View>
                        </View>
                        <View style={styles.tierRight}>
                          <Text style={[styles.tierPrice, isSelected && styles.tierPriceSelected]}>{tier.price}</Text>
                          {tier.period ? <Text style={[styles.tierPeriod, isSelected && styles.tierPeriodSelected]}>{tier.period}</Text> : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.duration(800).delay(1500).easing(Easing.out(Easing.back(1.2)))}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handlePurchase}
              style={{ borderRadius: 8, overflow: 'hidden' }}
              disabled={isPurchasing || isFetching}
            >
              <LinearGradient
                colors={['#D4A44C', '#C2983B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>BEGIN MY JOURNEY</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.cancelText}>START YOUR 14-DAY FREE TRIAL. CANCEL ANYTIME.</Text>
          </Animated.View>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => setShowTerms(true)}><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity onPress={() => setShowTerms(true)}><Text style={styles.footerLink}>Privacy</Text></TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity onPress={handleRestore}><Text style={styles.footerLink}>Restore</Text></TouchableOpacity>
          </View>

          <Text style={styles.copyright}>© 2026 THE GITA EDITORIAL. ALL RIGHTS RESERVED.</Text>
        </ScrollView>

        {/* Terms Modal */}
        <Modal visible={showTerms} transparent={true} animationType="slide" onRequestClose={() => setShowTerms(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Terms & Privacy</Text>
              <ScrollView style={{maxHeight: 250}}>
                <Text style={styles.modalText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.{'\n\n'}
                  Your subscription will automatically renew unless canceled at least 24 hours before the end of the current period.{'\n\n'}
                  You can manage your subscriptions in your account settings after purchase.
                </Text>
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTerms(false)}>
                <Text style={styles.modalCloseText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <PaywallPopup heightPercentage={0.35} />
        </SafeAreaView>
      </View>
    </OnboardingBackground>
  );
}