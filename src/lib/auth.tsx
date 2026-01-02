
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useFirebase } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { firestore, auth, isUserLoading } = useFirebase();

  const fetchUserRole = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) return null;
    const staffDocRef = doc(firestore, 'staff', firebaseUser.uid);
    const staffDoc = await getDoc(staffDocRef);

    if (staffDoc.exists()) {
        const staffData = staffDoc.data() as Staff;
        const appUser: User = {
            id: firebaseUser.uid,
            name: staffData.name,
            email: staffData.email,
            avatarUrl: staffData.avatarUrl,
            role: staffData.role,
            dui: staffData.dui,
        };
       return appUser;
    } 

    // If user is not in staff collection, create a new staff document and a user object.
    const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email || 'New User',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || '',
        role: 'Broker', // Assign a default role
        dui: '00000000-0', // Default DUI, should be updated
    };
    
    const newStaffData: Staff = {
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
    if (!isUserLoading) {
      const handleAuthChange = async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const appUser = await fetchUserRole(firebaseUser);
          setUser(appUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      };
      
      const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
      return () => unsubscribe();
    }
  }, [auth, isUserLoading, fetchUserRole]);


  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && (pathname === "/login" || pathname === "/")) {
      router.push("/leads");
    }
  }, [user, loading, pathname, router]);


  const login = useCallback(async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setAuthError(null);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;
        if (firebaseUser) {
            const appUser = await fetchUserRole(firebaseUser);
            setUser(appUser);
            setLoading(false);
            return appUser;
        }
        return null;
    } catch (error: any) {
        setAuthError(error.message);
        setLoading(false);
        return null;
    }
  }, [auth, fetchUserRole]);


  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    router.push("/login");
  }, [auth, router]);

  const setUserRole = useCallback((role: Role) => {
    setUser(currentUser => {
        if(!currentUser) return null;
        return { ...currentUser, role };
    });
  }, []);
  
  const reloadUser = useCallback(async () => {
    if (auth?.currentUser) {
        setLoading(true);
        const appUser = await fetchUserRole(auth.currentUser);
        setUser(appUser);
        setLoading(false);
    }
  }, [auth, fetchUserRole]);

  const value = useMemo(
    () => ({ user, loading, authError, login, logout, setUserRole, reloadUser }),
    [user, loading, authError, login, logout, setUserRole, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
