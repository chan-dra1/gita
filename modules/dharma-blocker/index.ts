import { Platform } from 'react-native';

export type DharmaAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'approved'
  | 'unknown'
  | 'unsupported';

export interface DharmaBlockerInterface {
  requestPermissions(): Promise<boolean>;
  hasUsagePermission(): boolean;
  startBlocking(appBundleIds: string[]): void;
  stopBlocking(): void;
  getInstalledApps(): Promise<{ packageName: string; label: string }[]>;
  getAuthorizationStatus(): Promise<DharmaAuthorizationStatus>;
  hasFamilySelection(): boolean;
  presentFamilyActivityPicker(): Promise<string | null>;
  setFamilySelectionBase64(base64: string | null): Promise<unknown>;
  clearFamilySelection(): Promise<unknown>;
}

const STUB: DharmaBlockerInterface = {
  requestPermissions: async () => {
    console.warn('DharmaBlocker: native module not available');
    return false;
  },
  hasUsagePermission: () => {
    console.warn('DharmaBlocker: native module not available');
    return false;
  },
  startBlocking: (_apps: string[]) => console.warn('DharmaBlocker: native module not available'),
  stopBlocking: () => console.warn('DharmaBlocker: native module not available'),
  getInstalledApps: async () => {
    console.warn('DharmaBlocker: native module not available');
    return [];
  },
  getAuthorizationStatus: async () => 'unsupported',
  hasFamilySelection: () => false,
  presentFamilyActivityPicker: async () => null,
  setFamilySelectionBase64: async () => null,
  clearFamilySelection: async () => null,
};

let DharmaBlocker: DharmaBlockerInterface = STUB;

// Only attempt to load native module on actual native platforms
if (Platform.OS !== 'web') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    DharmaBlocker = requireNativeModule('DharmaBlocker') as DharmaBlockerInterface;
  } catch (e) {
    // Native module not linked (e.g., Expo Go) — use stub
    console.warn('DharmaBlocker: failed to load native module, using stub', e);
    DharmaBlocker = STUB;
  }
}

export default DharmaBlocker;
