import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSlokasRead, getSavedSlokas, getStreakData } from './stats';

export async function pushLocalDataToCloud(uid: string) {
  try {
    const slokasRead = await getSlokasRead();
    const savedSlokas = await getSavedSlokas();
    const streakData = await getStreakData();
    const onboardingData = await AsyncStorage.getItem('@gita_onboarding_data');
    const lastOpened = await AsyncStorage.getItem('@gita_last_opened');

    const payload = {
      slokasRead,
      savedSlokas,
      streakData,
      onboardingData: onboardingData ? JSON.parse(onboardingData) : null,
      lastOpened,
      lastSynced: new Date().toISOString()
    };

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, payload, { merge: true });
    console.log('[Cloud Sync] Successfully pushed local data to Firestore');
  } catch (err) {
    console.error('[Cloud Sync] Failed to push data', err);
  }
}

export async function pullCloudDataToLocal(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      
      // We will perform a simple replacement for now. 
      // In a production conflict scenario, you'd merge based on timestamps.
      if (data.slokasRead) await AsyncStorage.setItem('@gita_slokas_read', JSON.stringify(data.slokasRead));
      if (data.savedSlokas) await AsyncStorage.setItem('@gita_saved_slokas', JSON.stringify(data.savedSlokas));
      if (data.streakData) await AsyncStorage.setItem('@gita_streak_data', JSON.stringify(data.streakData));
      if (data.onboardingData) await AsyncStorage.setItem('@gita_onboarding_data', JSON.stringify(data.onboardingData));
      if (data.lastOpened) await AsyncStorage.setItem('@gita_last_opened', data.lastOpened);
      
      console.log('[Cloud Sync] Successfully pulled data to local storage');
    }
  } catch (err) {
    console.error('[Cloud Sync] Failed to pull data', err);
  }
}

/**
 * Convenience method to passively sync in background if logged in
 */
export async function syncIfLoggedIn() {
  const user = auth.currentUser;
  if (user) {
    await pushLocalDataToCloud(user.uid);
  }
}
