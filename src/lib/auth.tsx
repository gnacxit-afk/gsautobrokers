
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth, useFirebaseReady } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const firebaseReady = useFirebaseReady();

  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    
    const staffDocRef = doc(firestore, 'staff', fbUser.uid);
    
    try {
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

        // If user is not in staff, create a default profile.
        const newUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email || 'New User',
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || '',
            role: 'Broker', // Default role
            dui: '00000000-0',
        };
        
        await setDoc(staffDocRef, {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            dui: newUser.dui,
            createdAt: serverTimestamp(),
            avatarUrl: newUser.avatarUrl,
        });
        
        return newUser;
    } catch (error) {
        console.error("Error fetching or creating user document:", error);
        // This could be a permissions error if the user is not allowed to read/write their own profile
        // For now, we'll treat it as a login failure.
        setAuthError("Failed to access user profile.");
        if(auth) await signOut(auth);
        return null;
    }
  }, [firestore, auth]);


  useEffect(() => {
    if (!firebaseReady || !auth) {
        // Wait for Firebase to be ready
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await fetchAppUser(firebaseUser);
            setAppUser(userProfile);
        } else {
            setAppUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseReady, auth, fetchAppUser]);


  useEffect(() => {
    // This effect handles routing after the loading state is resolved.
    if (!loading) {
      if (!appUser && pathname !== "/login") {
        router.push("/login");
      } else if (appUser && pathname === "/login") {
        // Redirect from login page to a default page after successful login
        router.push("/leads");
      }
    }
  }, [appUser, loading, pathname, router]);


  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service is not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // The onAuthStateChanged listener will handle fetching the user and setting state.
    } catch (error: any) {
        setAuthError(error.message);
        setAppUser(null);
        setLoading(false); // Only set loading to false on error, success is handled by the listener
    }
  }, [auth]);


  const logout = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    await signOut(auth);
    setAppUser(null);
    // The onAuthStateChanged listener will set loading to false.
  }, [auth]);

  const setUserRole = useCallback((role: Role) => {
    setAppUser(currentUser => {
        if(!currentUser) return null;
        return { ...currentUser, role };
    });
  }, []);
  
  const reloadUser = useCallback(async () => {
     if (auth?.currentUser) {
        setLoading(true);
        const updatedAppUser = await fetchAppUser(auth.currentUser);
        setAppUser(updatedAppUser);
        setLoading(false);
    }
  }, [auth, fetchAppUser]);

  const value = useMemo(
    () => ({ user: appUser, loading, authError, login, logout, setUserRole, reloadUser }),
    [appUser, loading, authError, login, logout, setUserRole, reloadUser]
  );

  // Render children only when not in the initial loading phase and not on the login page without a user
  // This prevents flashing the content of a protected page.
  const shouldRenderChildren = !loading || (loading && pathname === '/login');

  return (
    <AuthContext.Provider value={value}>
        {shouldRenderChildren ? children : null}
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
