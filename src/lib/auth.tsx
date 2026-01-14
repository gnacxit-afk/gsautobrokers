
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Role, Staff, User } from "./types";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/icons";

export const MASTER_ADMIN_EMAIL = "gnacxit@gmail.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: Role) => void;
  reloadUser: () => void;
  MASTER_ADMIN_EMAIL: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }
    
    // Define public paths that don't require authentication
    const isPublicPage = pathname === '/apply';

    // If the user is on a public page, do nothing.
    if (isPublicPage) {
        // If the user is logged in and tries to go to login, redirect to leads.
        if (user && pathname === '/login') {
            router.push('/leads');
        }
      return;
    }
    
    // If not logged in and not on a public page, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }
    
    // If logged in and on the login page, redirect to the main app page
    if (user && pathname === '/login') {
      router.push('/leads');
    }

  }, [user, loading, router, pathname]);
  
  // Show loading screen only for protected pages
  if (loading && !(pathname === '/apply' || pathname === '/login')) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Logo />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Application...</p>
      </div>
    );
  }
  
  // If it's a public page, render it immediately without waiting for auth state.
  if (pathname === '/apply' || pathname === '/login') {
      return <>{children}</>;
  }

  // If we are on a protected route and still loading, show loading screen.
  if (loading) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
            <Logo />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Application...</p>
        </div>
    );
  }

  // If on a protected route and not logged in, this will be blank briefly before redirect.
  if (!user) {
      return null;
  }
  
  return <>{children}</>;
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const firestore = useFirestore();
  const auth = useAuth();
  
  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    try {
        const staffCollection = collection(firestore, 'staff');
        let q = query(staffCollection, where("authUid", "==", fbUser.uid));
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0];
            const staffData = staffDoc.data() as Staff;
            
            // Special handling for master admin to ensure their data is correct.
            if (staffData.email === MASTER_ADMIN_EMAIL) {
                if (staffData.authUid !== fbUser.uid) {
                    // Update authUid if it's incorrect in Firestore
                    await setDoc(doc(firestore, "staff", staffDoc.id), { authUid: fbUser.uid }, { merge: true });
                }
            }
            
            return {
                id: staffDoc.id,
                authUid: staffData.authUid,
                name: staffData.name,
                email: staffData.email,
                avatarUrl: staffData.avatarUrl,
                role: staffData.role,
                dui: staffData.dui
            };
        } else {
             // If no user doc, check if it's the master admin logging in for the first time.
             if (fbUser.email === MASTER_ADMIN_EMAIL) {
                 const newUserProfile: Omit<Staff, 'id'> = {
                     authUid: fbUser.uid,
                     name: "Angel Nacxit Gomez Campos",
                     email: fbUser.email!,
                     role: 'Admin',
                     createdAt: serverTimestamp(),
                     hireDate: serverTimestamp(),
                     avatarUrl: '',
                     dui: "04451625-5",
                 };
                 const docRef = await addDoc(staffCollection, newUserProfile);
                 return { id: docRef.id, ...newUserProfile } as User;
             }
             // For any other user, they should not be able to create a profile this way.
             throw new Error("User profile not found. Please contact an administrator.");
        }
    } catch (error: any) {
        console.error("Error fetching or validating user document:", error);
        setAuthError(error.message);
        if(auth) await signOut(auth);
        return null;
    }
  }, [firestore, auth]);

 useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await fetchAppUser(firebaseUser);
            setUser(userProfile);
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchAppUser]);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service is not available.");
        return;
    }
    setLoading(true);
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        setAuthError(error.message);
        setLoading(false);
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setLoading(false);
  }, [auth]);

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
    () => ({ user, loading, authError, login, logout, setUserRole, reloadUser, MASTER_ADMIN_EMAIL }),
    [user, loading, authError, login, logout, setUserRole, reloadUser]
  );
  
  // Conditionally wrap children in AuthHandler ONLY if it's not a public page
  const isPublicPage = pathname === '/apply';

  return (
    <AuthContext.Provider value={value}>
      {isPublicPage ? children : <AuthHandler>{children}</AuthHandler>}
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
