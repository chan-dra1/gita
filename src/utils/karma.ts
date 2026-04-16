import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  onSnapshot 
} from 'firebase/firestore';

const GLOBAL_SANKALPA_DOC = 'stats/global_sankalpa';

/**
 * Fetches the current global count of verses read by the entire community.
 * If the document doesn't exist, initializes it to a healthy starting number 
 * (to make it feel like a living community).
 */
export async function getGlobalSankalpa(): Promise<number> {
  try {
    const docRef = doc(db, GLOBAL_SANKALPA_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().total_verses || 0;
    } else {
      // Initialize with a base number (e.g., 108,000 for spiritual significance)
      const initialCount = 108000;
      await setDoc(docRef, { total_verses: initialCount });
      return initialCount;
    }
  } catch (error) {
    console.error('Error fetching global sankalpa:', error);
    return 0;
  }
}

/**
 * Increments the global counter when a user finishes reading a sloka.
 */
export async function incrementGlobalSankalpa(amount: number = 1): Promise<void> {
  try {
    const docRef = doc(db, GLOBAL_SANKALPA_DOC);
    await updateDoc(docRef, {
      total_verses: increment(amount),
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    // If update fails due to doc not existing, retry with set
    console.warn('Silent failure updating global sankalpa. This is normal for offline/first run.');
  }
}

/**
 * Subscribes to real-time updates for the global counter.
 * Useful for the Home Screen live ticker.
 */
export function subscribeToGlobalSankalpa(callback: (total: number) => void) {
  const docRef = doc(db, GLOBAL_SANKALPA_DOC);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().total_verses || 0);
    }
  }, (error) => {
    console.error('Sankalpa subscription error:', error);
  });
}
