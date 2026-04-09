import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSavedSlokas } from '../src/utils/stats';
import { getSloka, getChapter, getLocalizedTranslation } from '../src/utils/sloka';
import { useLanguage } from '../src/context/LanguageContext';
import type { SlokaReadEntry } from '../src/types';

interface SavedSlokaDetails extends SlokaReadEntry {
  sanskrit: string;
  translation: string;
  chapterName: string;
}

export default function SavedSlokasScreen() {
  const router = useRouter();
  const [savedItems, setSavedItems] = useState<SavedSlokaDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();

  const loadSaved = useCallback(async () => {
    try {
      const savedEntries = await getSavedSlokas();
      // Sort by most recently saved (timestamp descending)
      savedEntries.sort((a, b) => b.timestamp - a.timestamp);
      
      const enriched: SavedSlokaDetails[] = savedEntries.map(entry => {
        const slokaData = getSloka(entry.chapter, entry.verse);
        const chapterData = getChapter(entry.chapter);
        
        return {
          ...entry,
          sanskrit: slokaData?.sanskrit.split('\n')[0] || 'Sanskrit text unavailable', // Just first line
          translation: slokaData ? getLocalizedTranslation(entry.chapter, entry.verse, slokaData.translation_english, language) : 'Translation unavailable',
          chapterName: chapterData?.name || `Chapter ${entry.chapter}`,
        };
      });
      
      setSavedItems(enriched);
    } catch (e) {
      console.error('Failed to load saved slokas', e);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Slokas</Text>
        <View style={{ width: 44 }} /> {/* Spacer */}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : savedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color="#E0D0C0" />
            <Text style={styles.emptyTitle}>No saved slokas yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any sloka to save it here for quick access later.
            </Text>
          </View>
        ) : (
          savedItems.map((item) => (
            <TouchableOpacity
              key={`${item.chapter}-${item.verse}`}
              activeOpacity={0.7}
              onPress={() => router.push(`/sloka/${item.chapter}/${item.verse}` as any)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    Ch {item.chapter} • V {item.verse}
                  </Text>
                </View>
                <Ionicons name="bookmark" size={20} color="#E8751A" />
              </View>
              
              <Text style={styles.chapterName}>{item.chapterName}</Text>
              
              <View style={styles.sanskritContainer}>
                <Text style={styles.sanskritText} numberOfLines={2}>
                  {item.sanskrit}
                </Text>
              </View>
              
              <Text style={styles.translationText} numberOfLines={2}>
                {item.translation}
              </Text>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0E5D8',
    shadowColor: '#E8751A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#FEF3E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E8751A',
  },
  chapterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  sanskritContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#F5C518',
    paddingLeft: 12,
    marginBottom: 12,
  },
  sanskritText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  translationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
