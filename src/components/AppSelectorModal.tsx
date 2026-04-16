import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Safe import: DharmaBlocker is only available in dev/production builds
let DharmaBlocker: any = null;
try {
  DharmaBlocker = require('../../modules/dharma-blocker').default;
} catch (e) {
  // Not available in Expo Go or web
}
if (!DharmaBlocker) {
  DharmaBlocker = {
    getInstalledApps: async () => [],
    requestPermissions: async () => false,
    startBlocking: () => {},
    stopBlocking: () => {},
  };
}

interface AppInfo {
  packageName: string;
  label: string;
}

interface AppSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedApps: string[];
  onSelectApps: (apps: string[]) => void;
}

export const AppSelectorModal: React.FC<AppSelectorModalProps> = ({
  visible,
  onClose,
  selectedApps,
  onSelectApps,
}) => {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedApps);

  useEffect(() => {
    if (visible) {
      loadApps();
      setTempSelected(selectedApps);
    }
  }, [visible]);

  const loadApps = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'android' && DharmaBlocker) {
        const installedApps = await DharmaBlocker.getInstalledApps();
        // Sort alphabetically
        const sorted = installedApps.sort((a: AppInfo, b: AppInfo) => a.label.localeCompare(b.label));
        setApps(sorted);
      } else {
        // Mock data for testing/web
        setApps([
          { packageName: 'com.instagram.android', label: 'Instagram' },
          { packageName: 'com.zhiliaoapp.musically', label: 'TikTok' },
          { packageName: 'com.facebook.katana', label: 'Facebook' },
          { packageName: 'com.google.android.youtube', label: 'YouTube' },
          { packageName: 'com.snapchat.android', label: 'Snapchat' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApp = (packageName: string) => {
    if (tempSelected.includes(packageName)) {
      setTempSelected(tempSelected.filter(id => id !== packageName));
    } else {
      setTempSelected([...tempSelected, packageName]);
    }
  };

  const handleSave = () => {
    onSelectApps(tempSelected);
    onClose();
  };

  const filteredApps = apps.filter(app => 
    app.label.toLowerCase().includes(search.toLowerCase()) ||
    app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Block Distractions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search apps..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4A44C" />
              <Text style={styles.loadingText}>Fetching installed apps...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.packageName}
              renderItem={({ item }) => {
                const isSelected = tempSelected.includes(item.packageName);
                return (
                  <TouchableOpacity 
                    style={[styles.appItem, isSelected && styles.appItemSelected]}
                    onPress={() => toggleApp(item.packageName)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appIconPlaceholder}>
                      <Ionicons name="apps-outline" size={20} color={isSelected ? "#D4A44C" : "#9CA3AF"} />
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={[styles.appLabel, isSelected && styles.appLabelSelected]}>{item.label}</Text>
                      <Text style={styles.appPackage}>{item.packageName}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#0D0D0D" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          )}

          <View style={styles.footer}>
            <Text style={styles.selectionCount}>
              {tempSelected.length} apps selected
            </Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4A44C',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 24,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  appItemSelected: {
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    borderColor: 'rgba(212, 164, 76, 0.3)',
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  appLabelSelected: {
    color: '#D4A44C',
  },
  appPackage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#D4A44C',
    borderColor: '#D4A44C',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0D0D0D',
  },
  selectionCount: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginBottom: 16,
    fontSize: 14,
  },
  saveButton: {
    height: 54,
    backgroundColor: '#D4A44C',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A44C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: {
    color: '#0D0D0D',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
