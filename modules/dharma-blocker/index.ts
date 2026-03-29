import { requireNativeModule } from 'expo-modules-core';

interface DharmaBlockerInterface {
  requestPermissions(): Promise<boolean>;
  startBlocking(appBundleIds: string[]): void;
  stopBlocking(): void;
  getInstalledApps(): Promise<{packageName: string, label: string}[]>;
}

// Fallback for when the native module is not linked (e.g. in Expo Go)
const DharmaBlocker = requireNativeModule<DharmaBlockerInterface>('DharmaBlocker') ?? {
  requestPermissions: async () => { console.warn("Native module disabled"); return false; },
  startBlocking: (apps: string[]) => console.warn("Native module disabled", apps),
  stopBlocking: () => console.warn("Native module disabled"),
  getInstalledApps: async () => { console.warn("Native module disabled"); return []; }
};

export default DharmaBlocker;
