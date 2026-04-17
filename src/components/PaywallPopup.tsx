import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/i18n';

interface PaywallPopupProps {
  heightPercentage?: number; // 0.3 for 30%, 0.4 for 40%
}

export const PaywallPopup: React.FC<PaywallPopupProps> = ({ heightPercentage = 0.35 }) => {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(700).delay(500)}
      style={[styles.popupContainer, { height: `${heightPercentage * 100}%` }]}
    >
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel={t('paywallPopupClose', language)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={26} color="rgba(255,255,255,0.55)" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.popupTitle}>{t('paywallPopupTitle', language)}</Text>
        <Text style={styles.popupText}>{t('paywallPopupMessage', language)}</Text>
        <Text style={styles.popupFreeTrial}>{t('paywallPopupFreeTrial', language)}</Text>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
    padding: 6,
    borderRadius: 20,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: 36,
    paddingBottom: 8,
    alignItems: 'center',
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
