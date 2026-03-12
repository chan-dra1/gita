import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

  const handleStartTrial = () => {
    // In production, this would integrate with RevenueCat or similar
    // For now, just go to the main app
    router.replace('/(tabs)');
  };

  const handleRestore = () => {
    // Restore purchases logic
    router.replace('/(tabs)');
  };

  const handleMaybeLater = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3D2817" />
      
      {/* Close Button */}
      <TouchableOpacity onPress={handleMaybeLater} style={styles.closeButton}>
        <Ionicons name="close" size={28} color="#8B7355" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="book" size={32} color="#F48B29" />
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
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon as any} size={18} color="#F48B29" />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Tiers */}
        <View style={styles.pricingContainer}>
          {PRICING_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              activeOpacity={0.8}
              onPress={() => setSelectedTier(tier.id)}
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
                    <Text style={styles.trialText}>{tier.trial}</Text>
                  )}
                </View>
                <View style={[styles.radioCircle, selectedTier === tier.id && styles.radioCircleSelected]}>
                  {selectedTier === tier.id && <View style={styles.radioDot} />}
                </View>
              </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3D2817',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 100,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 139, 41, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  titleHighlight: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F48B29',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#B8A99A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  featuresContainer: {
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    borderRadius: 12,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 139, 41, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  pricingContainer: {
    gap: 12,
    marginBottom: 24,
  },
  tierCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: '#F48B29',
    borderWidth: 2,
    backgroundColor: 'rgba(244, 139, 41, 0.1)',
  },
  tierCardPopular: {
    paddingTop: 28,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#F48B29',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3D2817',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#B8A99A',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tierNameSelected: {
    color: '#F48B29',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tierPriceSelected: {
    color: '#FFFFFF',
  },
  tierPeriod: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 2,
  },
  tierPeriodSelected: {
    color: '#B8A99A',
  },
  trialText: {
    fontSize: 12,
    color: '#F48B29',
    marginTop: 4,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B7355',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: '#F48B29',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F48B29',
  },
  ctaButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F48B29',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3D2817',
  },
  footerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 13,
    color: '#B8A99A',
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 13,
    color: '#8B7355',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#3D2817',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalScroll: {
    maxHeight: 200,
  },
  modalText: {
    fontSize: 14,
    color: '#B8A99A',
    lineHeight: 22,
  },
  modalCloseButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F48B29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D2817',
  },
});
