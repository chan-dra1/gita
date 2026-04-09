import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { Config } from '../../src/constants/config';

const FALLBACK_TIERS = [
  { id: 'lifetime', name: 'Lifetime', description: 'One-time payment', price: '$99.99', period: '', popular: false, icon: 'infinite-outline' as const },
  { id: 'yearly', name: 'Yearly', description: 'Includes 7-day free trial', price: '$35.88', period: 'Just $2.99/mo', popular: true, badge: 'BEST VALUE', icon: 'refresh-outline' as const },
  { id: 'monthly', name: 'Monthly', description: 'Standard access', price: '$4.99', period: '', popular: false, icon: 'calendar-outline' as const },
];

const FEATURES = [
  {
    icon: 'lock-closed' as const,
    title: 'Dharma Blocker',
    description: 'Lock distracting apps to focus on your spiritual growth.',
  },
  {
    icon: 'notifications' as const,
    title: 'Spiritual Reminders',
    description: 'Daily alerts to keep you grounded.',
  },
  {
    icon: 'bookmark' as const,
    title: 'Save Your Soul-Stirring Slokas',
    description: 'Bookmark and revisit your favorites anytime.',
  },
  {
    icon: 'volume-high' as const,
    title: 'Divine Audio Recitations',
    description: 'Listen to high-quality HD audio in multiple languages.',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>('yearly');
  const [showTerms, setShowTerms] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [showDeveloperNote, setShowDeveloperNote] = useState(true);

  useEffect(() => {
    // First Month Free logic
    const today = new Date();
    const promoEnd = new Date('2026-05-10');
    setIsPromoActive(today < promoEnd);

    if (Platform.OS === 'web') {
      setIsFetching(false);
      return;
    }

    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
          const annualParams = offerings.current.availablePackages.find(p => p.packageType === 'ANNUAL');
          if (annualParams) setSelectedTier(annualParams.identifier);
          else setSelectedTier(offerings.current.availablePackages[0].identifier);
        }
      } catch (e) {
        console.warn('Failed to fetch offerings, using fallbacks', e);
      } finally {
        setIsFetching(false);
      }
    };
    fetchOfferings();
  }, []);

  const handleStartTrial = async () => {
    if (isPromoActive) {
      Alert.alert(
        "Welcome to Gita Pro!", 
        "Thank you for joining early. Enjoy full premium access free for 15 days.", 
        [{text: "Begin Journey", onPress: () => router.replace('/(tabs)')}]
      );
      return;
    }

    if (packages.length === 0) {
      Alert.alert("Simulated Purchase", "RevenueCat is not active yet. Bypassing.", [{text: "OK", onPress: () => router.replace('/(tabs)')}]);
      return;
    }

    const selectedPackage = packages.find(p => p.identifier === selectedTier);
    if (!selectedPackage) return;

    try {
      setIsPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (customerInfo.entitlements.active[Config.ENTITLEMENT_ID]) {
        router.replace('/(tabs)');
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
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
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
        description: p.packageType === 'ANNUAL' ? 'Includes 7-day free trial' : p.packageType === 'MONTHLY' ? 'Standard access' : 'One-time payment',
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
          <View style={styles.closeButton} />
          <Text style={styles.headerTitle}>Gita Pro</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Title */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>
              Embrace the Divine{'\n'}Wisdom of the Gita
            </Text>
            <Text style={styles.heroSubtitle}>
              Take control of your spiritual journey with{'\n'}the Dharma Blocker and reminders.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={20} color="#D4A44C" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Pricing Tiers */}
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
                    style={[
                      styles.tierCard,
                      isSelected && styles.tierCardSelected,
                    ]}
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

          {/* CTA Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartTrial}
            style={styles.ctaButton}
            disabled={isPurchasing}
          >
            <LinearGradient
              colors={['#D4A44C', '#B8862D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : isPromoActive ? (
                <>
                  <Text style={styles.ctaButtonText}>Claim Your Free Trial</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0D0D0D" style={{ marginLeft: 8 }} />
                </>
              ) : (
                <>
                  <Text style={styles.ctaButtonText}>
                    {selectedTier.includes('annual') || selectedTier === 'yearly' ? 'Claim Your Free Trial' : 'Purchase'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#0D0D0D" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => setShowTerms(true)}>
              <Text style={styles.footerLink}>TERMS OF{'\n'}SERVICE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTerms(true)}>
              <Text style={styles.footerLink}>PRIVACY{'\n'}POLICY</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.footerLink}>RESTORE{'\n'}PURCHASE</Text>
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <Text style={styles.copyright}>
            © 2026 THE GITA EDITORIAL. ALL RIGHTS{'\n'}RESERVED.
          </Text>
        </ScrollView>

        {/* Terms Modal */}
        <Modal
          visible={showTerms}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTerms(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Terms & Privacy</Text>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.{'\n\n'}
                  Your subscription will automatically renew unless canceled at least 24 hours before the end of the current period.{'\n\n'}
                  You can manage your subscriptions in your account settings after purchase.
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTerms(false)}
              >
                <Text style={styles.modalCloseText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Developer Note Modal */}
        <Modal
          visible={showDeveloperNote}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeveloperNote(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: '#D4A44C', borderWidth: 2, padding: 28 }]}>
              <View style={{ marginBottom: 20 }}>
                <Ionicons name="heart" size={40} color="#D4A44C" style={{ alignSelf: 'center' }} />
              </View>
              <Text style={styles.modalTitle}>A Note from the Developer</Text>
              <ScrollView style={[styles.modalScroll, { maxHeight: 300 }]}>
                <Text style={styles.modalText}>
                  Namaste 🙏{'\n\n'}
                  I am still passionately working to make this application better for you every single day.{'\n\n'}
                  Building ad-free, deeply native spiritual experiences takes immense resources, but I want to reward those who believe in this project early on.{'\n\n'}
                  As a heart-touching thank you to my first users, enjoy your <Text style={{fontWeight: 'bold', color: '#D4A44C'}}>first 15 days completely complimentary!</Text>{'\n\n'}
                  In return, you can always share your ideas and reviews with me. Your feedback means the world.
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDeveloperNote(false)}
              >
                <Text style={styles.modalCloseText}>Accept Gift & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 8,
    paddingBottom: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A44C',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  /* Hero */
  heroContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 38,
    fontStyle: 'italic',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
  },
  /* Features */
  featuresContainer: {
    gap: 20,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 164, 76, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
  },
  featureTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    lineHeight: 20,
  },
  /* Divider */
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  /* Pricing */
  pricingContainer: {
    gap: 12,
    marginBottom: 24,
  },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  tierCardSelected: {
    borderColor: '#D4A44C',
    borderWidth: 2,
    backgroundColor: 'rgba(212, 164, 76, 0.08)',
  },
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
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 0.5,
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tierIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 164, 76, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierIconCircleSelected: {
    backgroundColor: '#D4A44C',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tierNameSelected: {
    color: '#FFFFFF',
  },
  tierDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  tierDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tierRight: {
    alignItems: 'flex-end',
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tierPriceSelected: {
    color: '#D4A44C',
  },
  tierPeriod: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  tierPeriodSelected: {
    color: 'rgba(212, 164, 76, 0.7)',
  },
  /* CTA */
  ctaButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 0.3,
  },
  /* Maybe Later */
  maybeLaterButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 32,
  },
  maybeLaterText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1.5,
  },
  /* Footer */
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  footerLink: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.25)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  copyright: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.15)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    maxHeight: '65%',
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 250,
  },
  modalText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  modalCloseButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4A44C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0D0D0D',
  },
});
