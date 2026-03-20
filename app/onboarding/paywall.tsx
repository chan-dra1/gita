import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Modal, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { BlurView } from 'expo-blur';

// Use a beautiful Krishna image for the background
const KRISHNA_BACKGROUND = require('../../assets/images/home/krishna_19.webp');

const PRICING_TIERS = [
  {
    id: 'monthly',
    name: 'MONTHLY',
    price: '$4.99',
    period: '/month',
    popular: false,
  },
  {
    id: 'yearly',
    name: 'YEARLY',
    price: '$29.99',
    period: '/year',
    popular: true,
    badge: 'BEST VALUE',
    trial: 'Includes 7-Day Free Trial',
  },
  {
    id: 'lifetime',
    name: 'LIFETIME',
    price: '$99.99',
    period: '/forever',
    popular: false,
  },
];

const FEATURES = [
  { icon: 'person', text: 'Personalized AI sloka recommendations' },
  { icon: 'headset', text: 'Unlimited HD audio recitations' },
  { icon: 'checkmark-circle', text: 'Offline caching & ad-free experience' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>('yearly');
  const [showTerms, setShowTerms] = useState(false);

  const handleStartTrial = async () => {
    try {
      // Placeholder for actual RevenueCat purchase mechanism
      // e.g. const { customerInfo } = await Purchases.purchasePackage(pack);
      // For now, simulate success:
      router.replace('/(tabs)');
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Error', e.message);
      }
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
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

  const handleMaybeLater = () => {
    router.replace('/(tabs)');
  };

  return (
    <ImageBackground source={KRISHNA_BACKGROUND} style={styles.backgroundImage} blurRadius={Platform.OS === 'android' ? 3 : 0}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Close Button */}
        <TouchableOpacity onPress={handleMaybeLater} style={styles.closeButton}>
          <BlurView intensity={40} tint="dark" style={styles.closeBlur}>
            <Ionicons name="close" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="book" size={36} color="#F48B29" />
            </View>
          </View>

        {/* Title */}
        <Text style={styles.title}>Unlock Your Complete</Text>
        <Text style={styles.titleHighlight}>Spiritual Companion</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Deepen your understanding of the Gita with exclusive premium features.
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <BlurView intensity={30} tint="dark" key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon as any} size={18} color="#F48B29" />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </BlurView>
          ))}
        </View>

        {/* Pricing Tiers */}
        <View style={styles.pricingContainer}>
          {PRICING_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              activeOpacity={0.8}
              onPress={() => setSelectedTier(tier.id)}
              style={styles.tierCardWrapper}
            >
              <BlurView 
                intensity={selectedTier === tier.id ? 50 : 20} 
                tint={selectedTier === tier.id ? "light" : "dark"} 
                style={[
                  styles.tierCard,
                  selectedTier === tier.id && styles.tierCardSelected,
                  tier.popular && styles.tierCardPopular,
                ]}
              >
                {tier.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tier.badge}</Text>
                  </View>
                )}
                <View style={styles.tierContent}>
                  <View style={styles.tierLeft}>
                    <Text style={[styles.tierName, selectedTier === tier.id && styles.tierNameSelected]}>
                      {tier.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.tierPrice, selectedTier === tier.id && styles.tierPriceSelected]}>
                        {tier.price}
                      </Text>
                      <Text style={[styles.tierPeriod, selectedTier === tier.id && styles.tierPeriodSelected]}>
                        {tier.period}
                      </Text>
                    </View>
                    {tier.trial && (
                      <Text style={[styles.trialText, selectedTier === tier.id && styles.trialTextSelected]}>{tier.trial}</Text>
                    )}
                  </View>
                  <View style={[styles.radioCircle, selectedTier === tier.id && styles.radioCircleSelected]}>
                    {selectedTier === tier.id && <View style={styles.radioDot} />}
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleStartTrial}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Start 7-Day Free Trial</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Cancel anytime in your settings. No commitment required.
        </Text>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => setShowTerms(true)}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>·</Text>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.footerLink}>Restore</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>·</Text>
          <TouchableOpacity onPress={handleMaybeLater}>
            <Text style={styles.footerLink}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terms Modal */}
      <Modal
        visible={showTerms}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalOverlay}>
              <BlurView intensity={90} tint="dark" style={styles.modalContent}>
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
              </BlurView>
            </View>
          </Modal>
        </SafeAreaView>
      </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 100,
  },
  closeBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleHighlight: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F48B29',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  pricingContainer: {
    gap: 16,
    marginBottom: 32,
  },
  tierCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tierCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: 'rgba(244, 139, 41, 0.8)',
    borderWidth: 2,
  },
  tierCardPopular: {
    paddingTop: 32,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: '#F48B29',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierLeft: {
    flex: 1,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tierNameSelected: {
    color: '#1A1A1A',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tierPriceSelected: {
    color: '#1A1A1A',
  },
  tierPeriod: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
    fontWeight: '500',
  },
  tierPeriodSelected: {
    color: 'rgba(26, 26, 26, 0.7)',
  },
  trialText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F48B29',
    marginTop: 6,
  },
  trialTextSelected: {
    color: '#D87010',
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  radioCircleSelected: {
    borderColor: '#F48B29',
    backgroundColor: '#FFF',
    borderWidth: 0,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F48B29',
  },
  ctaButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F48B29',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#F48B29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  footerDivider: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    maxHeight: '65%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
