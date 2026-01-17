
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
const PUBLIC_ROUTES = ['/login', '/apply'];

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
  const pathname = usePathname();
  
  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    // 1. Primary, most efficient fetch: by direct document ID (UID)
    const staffDocRef = doc(firestore, 'staff', fbUser.uid);
    const staffDocSnap = await getDoc(staffDocRef);

    if (staffDocSnap.exists()) {
        const staffData = staffDocSnap.data() as Omit<Staff, 'id'>;
        return {
            id: staffDocSnap.id,
            ...staffData
        } as User;
    }

    // 2. Secondary fetch: query by `authUid` field for legacy data
    const staffCollection = collection(firestore, 'staff');
    const q = query(staffCollection, where("authUid", "==", fbUser.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
    }
    
    // 3. Special case: Create Master Admin profile if it doesn't exist
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
        // Use the UID as the document ID for consistency
        await setDoc(doc(firestore, 'staff', fbUser.uid), newAdminProfile);
        return { id: fbUser.uid, ...newAdminProfile } as User;
    }
    
    // If no profile is found after all checks, the user is not a valid staff member.
    console.error("User profile not found in 'staff' collection for UID:", fbUser.uid);
    return null;
  }, [firestore]);

 useEffect(() => {
    if (!auth || !firestore) {
        setLoading(true); 
        return;
    }
    
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userProfile = await fetchAppUser(firebaseUser);
          if (userProfile) {
            setUser(userProfile);
            setAuthError(null);
            
            if (pathname === '/login') {
                if (userProfile.role === 'Admin' || userProfile.role === 'Supervisor') {
                    router.replace('/dashboard');
                } else {
                    router.replace('/kpi');
                }
            }
          } else {
            setUser(null);
            setAuthError("Your user profile could not be found.");
            await signOut(auth);
            if (!isPublicRoute) router.replace('/login');
          }
        } catch (error: any) {
          console.error("Failed to fetch app user profile:", error);
          setUser(null);
          setAuthError(error.message || "An error occurred fetching your profile.");
          await signOut(auth);
          if (!isPublicRoute) router.replace('/login');
        }
      } else {
        setUser(null);
         if (!isPublicRoute) {
            router.replace('/login');
         }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, fetchAppUser, router, pathname]);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle the rest, including redirection.
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
