
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

export const MASTER_ADMIN_EMAIL = "gnacxit@gmail.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
  auth: any;
  MASTER_ADMIN_EMAIL: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    const staffDocRef = doc(firestore, 'staff', fbUser.uid);
    const staffDocSnap = await getDoc(staffDocRef);

    if (staffDocSnap.exists()) {
        const staffData = staffDocSnap.data() as Omit<Staff, 'id'>;
        return {
            id: staffDocSnap.id,
            ...staffData
        } as User;
    }
    
    // Fallback for users who might exist under a different doc ID, like the master admin before migration.
    const staffCollection = collection(firestore, 'staff');
    const q = query(staffCollection, where("authUid", "==", fbUser.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
    }
    
    if (fbUser.email === MASTER_ADMIN_EMAIL) {
        const newAdminProfile: Staff = {
            id: fbUser.uid,
            authUid: fbUser.uid,
            name: "Angel Nacxit Gomez Campos",
            email: fbUser.email!,
            role: 'Admin',
            createdAt: serverTimestamp(),
            hireDate: serverTimestamp(),
            avatarUrl: '',
            dui: "04451625-5",
        };
        await setDoc(staffDocRef, newAdminProfile);
        return newAdminProfile as User;
    }
    
    console.error("User profile not found in 'staff' collection for UID:", fbUser.uid);
    return null;
  }, [firestore]);

 useEffect(() => {
    if (!auth || !firestore) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userProfile = await fetchAppUser(firebaseUser);
          if (userProfile) {
            setUser(userProfile);
            setAuthError(null);
          } else {
            setUser(null);
            setAuthError("Your user profile could not be found.");
            await signOut(auth);
          }
        } catch (error: any) {
          console.error("Failed to fetch app user profile:", error);
          setUser(null);
          setAuthError(error.message || "An error occurred fetching your profile.");
          await signOut(auth);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore, fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        let friendlyMessage = "An unexpected error occurred.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                friendlyMessage = "Invalid email or password.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "The email address is not valid.";
                break;
        }
        setAuthError(friendlyMessage);
        setUser(null);
    } finally {
        // setLoading(false) is handled by onAuthStateChanged
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    router.push('/login');
  }, [auth, router]);

  const setUserRole = useCallback((role: Role) => {
    if (user && user.email === MASTER_ADMIN_EMAIL) {
       setUser(currentUser => {
          if(!currentUser) return null;
          return { ...currentUser, role };
      });
    }
  }, [user]);
  
  const reloadUser = useCallback(async () => {
     if (auth?.currentUser) {
        setLoading(true);
        const updatedAppUser = await fetchAppUser(auth.currentUser);
        setUser(updatedAppUser);
        setLoading(false);
    }
  }, [auth, fetchAppUser]);

  const value = useMemo(
    () => ({ user, loading, authError, login, logout, setUserRole, reloadUser, auth, MASTER_ADMIN_EMAIL }),
    [user, loading, authError, login, logout, setUserRole, reloadUser, auth]
  );
  
  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
