import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/i18n';

interface PaywallPopupProps {
  heightPercentage?: number; // 0.3 for 30%, 0.4 for 40%
}

export const PaywallPopup: React.FC<PaywallPopupProps> = ({ heightPercentage = 0.35 }) => {
  const { language } = useLanguage();
  
  return (
    <Animated.View 
      entering={FadeInUp.duration(700).delay(500)}
      style={[styles.popupContainer, { height: `${heightPercentage * 100}%` }]}
    >
      <Text style={styles.popupTitle}>{t('paywallPopupTitle', language)}</Text>
      <Text style={styles.popupText}>{t('paywallPopupMessage', language)}</Text>
      <Text style={styles.popupFreeTrial}>{t('paywallPopupFreeTrial', language)}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A', // Dark background for the popup
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
    // Ensure it sits above other content but below Safe Area View
    zIndex: 10,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D4A44C',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  popupText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  popupFreeTrial: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
