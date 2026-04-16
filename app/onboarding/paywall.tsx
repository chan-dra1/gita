import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Config } from '../../src/constants/config';
import { saveOnboardingStep } from '../../src/utils/stats';

const FALLBACK_TIERS = [
  { id: 'lifetime', name: 'Lifetime', description: 'One-time payment', price: '$99.99', period: '', popular: false, icon: 'infinite-outline' as const },
  { id: 'yearly', name: 'Yearly', description: 'Includes 15-day free trial', price: '$35.88', period: 'Just $2.99/mo', popular: true, badge: 'BEST VALUE', icon: 'refresh-outline' as const },
  { id: 'monthly', name: 'Monthly', description: 'Standard access', price: '$4.99', period: '', popular: false, icon: 'calendar-outline' as const },
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
        description: p.packageType === 'ANNUAL' ? 'Includes 15-day free trial' : p.packageType === 'MONTHLY' ? 'Standard access' : 'One-time payment',
        price: p.product.priceString,
        period: p.packageType === 'ANNUAL' ? `Just ${(p.product.price / 12).toFixed(2)}/mo` : '',
        popular: p.packageType === 'ANNUAL',
        badge: p.packageType === 'ANNUAL' ? 'BEST VALUE' : undefined,
        icon: (p.packageType === 'ANNUAL' ? 'refresh-outline' : p.packageType === 'MONTHLY' ? 'calendar-outline' : 'infinite-outline') as any,
      }));
    }
    return FALLBACK_TIERS;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" translucent />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D4A44C" />
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
                    <Ionicons name={item.icon} size={14} color="#D4A44C" />
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
                <ActivityIndicator size="large" color="#D4A44C" style={{ marginVertical: 32 }} />
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
                            <Ionicons name={tier.icon} size={18} color={isSelected ? '#0D0D0D' : '#D4A44C'} />
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
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handlePurchase}
              style={styles.ctaButton}
              disabled={isPurchasing || isFetching}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={styles.ctaButtonText}>BEGIN MY JOURNEY</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.cancelText}>START YOUR 15-DAY FREE TRIAL. CANCEL ANYTIME.</Text>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 12,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#D4A44C', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  // Hero
  heroSection: { marginBottom: 32, marginTop: 8 },
  verseReference: { fontSize: 11, color: '#D4A44C', fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  sanskritVerse: { fontSize: 24, color: '#D4A44C', lineHeight: 36, marginBottom: 20 },
  sanskritMuted: { color: 'rgba(212, 164, 76, 0.4)' },
  translationContainer: { borderWidth: 1, borderColor: '#222', padding: 16, borderRadius: 8 },
  translationText: { fontSize: 15, fontStyle: 'italic', color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 22 },

  // Features
  featuresSection: { marginBottom: 24 },
  sectionEyebrow: { fontSize: 10, color: '#666', fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  featuresList: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(212, 164, 76, 0.1)', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: '#E0D5C5' },

  // Divider
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 24 },

  // Pricing
  pricingContainer: { gap: 12, marginBottom: 24 },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  tierCardSelected: { borderColor: '#D4A44C', borderWidth: 2, backgroundColor: 'rgba(212, 164, 76, 0.08)' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: '#D4A44C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#0D0D0D', letterSpacing: 0.5 },
  tierContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tierIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212, 164, 76, 0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tierIconCircleSelected: { backgroundColor: '#D4A44C' },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  tierNameSelected: { color: '#FFFFFF' },
  tierDescription: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  tierDescriptionSelected: { color: 'rgba(255,255,255,0.6)' },
  tierRight: { alignItems: 'flex-end' },
  tierPrice: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  tierPriceSelected: { color: '#D4A44C' },
  tierPeriod: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  tierPeriodSelected: { color: 'rgba(212, 164, 76, 0.7)' },

  // CTA
  ctaButton: {
    backgroundColor: '#D4A44C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonText: { fontSize: 14, fontWeight: '800', color: '#0D0D0D', letterSpacing: 1 },
  cancelText: { fontSize: 9, color: '#666', fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 32 },

  // Footer
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 },
  footerLink: { fontSize: 11, color: '#666', fontWeight: '600', letterSpacing: 0.5 },
  footerDot: { fontSize: 11, color: '#444' },
  copyright: { fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 16, marginBottom: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, backgroundColor: '#1A1A1A', borderTopWidth: 1, borderColor: 'rgba(212, 164, 76, 0.2)' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textAlign: 'center' },
  modalText: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 24 },
  modalCloseButton: { marginTop: 24, height: 56, borderRadius: 28, backgroundColor: '#D4A44C', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 17, fontWeight: '700', color: '#0D0D0D' },
});
