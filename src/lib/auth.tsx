
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
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

const PUBLIC_PATHS = ['/login', '/apply', '/inventory', '/privacy', '/terms', '/cookie-policy', '/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
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

    const staffCollection = collection(firestore, 'staff');
    const q = query(staffCollection, where("authUid", "==", fbUser.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
    }
    
    if (fbUser.email === MASTER_ADMIN_EMAIL) {
        console.log("Master Admin profile not found, creating it...");
        const newAdminProfile: Omit<Staff, 'id'> = {
            authUid: fbUser.uid,
            name: "Angel Nacxit Gomez Campos",
            email: fbUser.email!,
            role: 'Admin',
            createdAt: serverTimestamp(),
            hireDate: serverTimestamp(),
            avatarUrl: '',
            dui: "04451625-5",
        };
        await setDoc(doc(firestore, 'staff', fbUser.uid), newAdminProfile);
        return { id: fbUser.uid, ...newAdminProfile } as User;
    }
    
    console.error("User profile not found in 'staff' collection for UID:", fbUser.uid);
    return null;
  }, [firestore]);

 useEffect(() => {
    if (!auth || !firestore) {
        setLoading(true); 
        return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || (path !== '/' && pathname.startsWith(path))) || pathname.startsWith('/inventory/vehicle') || pathname.startsWith('/training/certificate');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isPublicPath) {
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (firebaseUser) {
        try {
          const userProfile = await fetchAppUser(firebaseUser);
          if (userProfile) {
            setUser(userProfile);
            setAuthError(null);
            if (isPublicPath) {
              router.push('/dashboard');
            }
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
          setLoading(false); // Ensure loading is false on profile fetch error
        }
      } else {
        setUser(null);
      }

      if (!isPublicPath) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore, fetchAppUser, pathname, router]);


  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // On success, the onAuthStateChanged listener will handle setting user and loading state.
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
        setLoading(false);
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
