import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Share, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BackupScreen() {
  const router = useRouter();
  const [importText, setImportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      // Filter out only our gita app keys to avoid exporting other expo metadata/cache
      const gitaKeys = keys.filter(k => k.startsWith('@gita_'));
      
      if (gitaKeys.length === 0) {
        Alert.alert('No Data', 'You have no progress data to export yet.');
        return;
      }

      const items = await AsyncStorage.multiGet(gitaKeys);
      const backupData = Object.fromEntries(items);
      const backupString = JSON.stringify(backupData);

      await Share.share({
        message: backupString,
        title: 'Bhagavad Gita Progress Backup',
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      Alert.alert('Empty Input', 'Please paste your backup code first.');
      return;
    }

    try {
      setIsLoading(true);
      const parsedData = JSON.parse(importText);
      
      // Validate it looks like our backup structure
      const isStructureValid = Object.keys(parsedData).every(k => k.startsWith('@gita_'));
      
      if (!isStructureValid) {
        Alert.alert('Invalid Code', 'The provided text does not match our valid backup format.');
        return;
      }

      // Convert object back to array of arrays for multiSet
      const entriesToSet = Object.entries(parsedData) as [string, string][];
      
      Alert.alert(
        'Confirm Restore',
        'This will overwrite your current device progress with the imported data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Restore', 
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear existing gita keys first (optional, but ensures clean state)
                const currentKeys = await AsyncStorage.getAllKeys();
                const currentGitaKeys = currentKeys.filter(k => k.startsWith('@gita_'));
                if (currentGitaKeys.length > 0) {
                  await AsyncStorage.multiRemove(currentGitaKeys);
                }
                
                // Set imported keys
                await AsyncStorage.multiSet(entriesToSet);
                setImportText('');
                Alert.alert('Success', 'Your progress has been successfully restored!', [
                  { text: 'OK', onPress: () => router.push('/(tabs)/settings') }
                ]);
              } catch (innerError) {
                 Alert.alert('Restore Failed', 'Write error occurred during restore.');
                 console.error(innerError);
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Invalid Format', 'The pasted text is not valid JSON. Ensure you copied the entire code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF7ED' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Backup & Sync</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#E8751A" />
            <Text style={styles.infoText}>
              Since this app does not require you to create an account, your progress is stored only on this device. You can transfer your data to another phone manually using this backup tool.
            </Text>
          </View>

          {/* Export Section */}
          <Text style={styles.sectionTitle}>1. Export Your Progress</Text>
          <View style={styles.card}>
            <Text style={styles.cardDesc}>
              Generate a unique text code containing your read slokas, streak, and saved preferences. You can save this to your notes or send it to your other device.
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleExport}
              disabled={isLoading}
            >
              <Ionicons name="share-outline" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Generate Backup Code</Text>
            </TouchableOpacity>
          </View>

          {/* Import Section */}
          <Text style={styles.sectionTitle}>2. Restore Progress</Text>
          <View style={styles.card}>
            <Text style={styles.cardDesc}>
              Paste a previously exported backup code here to restore your data on this device.
            </Text>
            
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Paste your backup code here..."
              placeholderTextColor="#B0A090"
              value={importText}
              onChangeText={setImportText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.secondaryButton, !importText.trim() && styles.buttonDisabled]}
              onPress={handleImport}
              disabled={isLoading || !importText.trim()}
            >
              <Ionicons name="download-outline" size={20} color={importText.trim() ? '#E8751A' : '#B0A090'} />
              <Text style={[styles.secondaryButtonText, !importText.trim() && styles.buttonTextDisabled]}>
                Restore Data
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  infoCard: {
    backgroundColor: '#FFF0E5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0E0CC',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#E8751A',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F0E5D8',
    shadowColor: '#E8751A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#E8751A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F9F4F0',
    borderWidth: 1,
    borderColor: '#E0D0C0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: '#FEF3E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0E0CC',
  },
  secondaryButtonText: {
    color: '#E8751A',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  buttonTextDisabled: {
    color: '#B0B0B0',
  }
});
