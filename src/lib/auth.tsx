
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
  const firestore = useFirestore();
  const { auth } = useFirebase();

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
            role: staffData.role
        };
       return appUser;
    } 
    return null;
  }, [firestore]);


  useEffect(() => {
    if (!auth) {
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const appUser = await fetchUserRole(firebaseUser);
            if (appUser) {
                setUser(appUser);
            } else {
                // User is authenticated but not in staff collection
                setUser(null);
                setAuthError("No tienes acceso. Contacta al administrador.");
                await signOut(auth); // Sign out the user
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchUserRole]);


  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    if (!loading && user && (pathname === "/login" || pathname === "/")) {
      router.push("/leads");
    }
  }, [user, loading, pathname, router]);


  const login = useCallback(async (email: string, pass: string): Promise<User | null> => {
    if (!auth) return null;
    setAuthError(null); // Reset error on new login attempt
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    if (firebaseUser) {
        const appUser = await fetchUserRole(firebaseUser);
        if (appUser) {
            setUser(appUser);
            return appUser;
        }
        // If user is not in staff, sign them out and set error
        await signOut(auth);
        setAuthError("No tienes acceso. Contacta al administrador.");
        return null;
    }
    return null;
  }, [auth, fetchUserRole]);


  const logout = useCallback(async () => {
    if (!auth) return;
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
        if (appUser) {
            setUser(appUser);
        } else {
            setUser(null);
            setAuthError("No tienes acceso. Contacta al administrador.");
            await signOut(auth);
        }
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
