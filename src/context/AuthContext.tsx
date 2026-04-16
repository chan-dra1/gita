import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Bind RevenueCat to the Firebase UID
      if (Platform.OS !== 'web') {
        try {
          if (currentUser) {
            await Purchases.logIn(currentUser.uid);
          } else {
            await Purchases.logOut();
          }
        } catch (e) {
          console.warn("[Auth] RevenueCat sync failed", e);
        }
      }
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
