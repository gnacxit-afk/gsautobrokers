
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  type User as FirebaseUser
} from "firebase/auth";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAppUserLoading, setAppUserLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useUser();

  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User> => {
    if (!firestore) throw new Error("Firestore not initialized");
    
    const staffDocRef = doc(firestore, 'staff', fbUser.uid);
    const staffDoc = await getDoc(staffDocRef);

    if (staffDoc.exists()) {
        const staffData = staffDoc.data() as Staff;
        return {
            id: fbUser.uid,
            name: staffData.name,
            email: staffData.email,
            avatarUrl: staffData.avatarUrl,
            role: staffData.role,
            dui: staffData.dui,
        };
    } 

    const newUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email || 'New User',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || '',
        role: 'Broker',
        dui: '00000000-0',
    };
    
    const newStaffData: Omit<Staff, 'hireDate'> & { hireDate: any } = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        dui: newUser.dui,
        hireDate: serverTimestamp(),
        avatarUrl: newUser.avatarUrl,
    };

    await setDoc(staffDocRef, newStaffData);
    
    return newUser;
  }, [firestore]);


  useEffect(() => {
    const syncUser = async () => {
      if (isFirebaseUserLoading) {
        return;
      }
      if (firebaseUser) {
        setAppUserLoading(true);
        const userProfile = await fetchAppUser(firebaseUser);
        setAppUser(userProfile);
        setAppUserLoading(false);
      } else {
        setAppUser(null);
        setAppUserLoading(false);
      }
    };
    syncUser();
  }, [firebaseUser, isFirebaseUserLoading, fetchAppUser]);


  useEffect(() => {
    const finalLoading = isFirebaseUserLoading || isAppUserLoading;
    if (!finalLoading && !appUser && pathname !== "/login") {
      router.push("/login");
    }
    if (!finalLoading && appUser && (pathname === "/login" || pathname === "/")) {
      router.push("/leads");
    }
  }, [appUser, isFirebaseUserLoading, isAppUserLoading, pathname, router]);


  const login = useCallback(async (email: string, pass: string): Promise<User | null> => {
    if (!auth) {
        setAuthError("Authentication service is not available.");
        return null;
    }
    setAppUserLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // The useEffect hooks will handle fetching the user profile and routing.
        // We can optimistically return something, but the state will be the source of truth.
        return null; 
    } catch (error: any) {
        setAuthError(error.message);
        setAppUserLoading(false);
        return null;
    }
  }, [auth]);


  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setAppUser(null);
    router.push("/login");
  }, [auth, router]);

  const setUserRole = useCallback((role: Role) => {
    setAppUser(currentUser => {
        if(!currentUser) return null;
        return { ...currentUser, role };
    });
  }, []);
  
  const reloadUser = useCallback(async () => {
    if (firebaseUser) {
        setAppUserLoading(true);
        const updatedAppUser = await fetchAppUser(firebaseUser);
        setAppUser(updatedAppUser);
        setAppUserLoading(false);
    }
  }, [firebaseUser, fetchAppUser]);

  const value = useMemo(
    () => ({ user: appUser, loading: isFirebaseUserLoading || isAppUserLoading, authError, login, logout, setUserRole, reloadUser }),
    [appUser, isFirebaseUserLoading, isAppUserLoading, authError, login, logout, setUserRole, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
