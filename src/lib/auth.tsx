

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();

  const fetchAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!firestore) throw new Error("Firestore not initialized");

    try {
        const staffCollection = collection(firestore, 'staff');
        let q = query(staffCollection, where("authUid", "==", fbUser.uid));
        
        if (fbUser.email === MASTER_ADMIN_EMAIL) {
            q = query(staffCollection, where("email", "==", MASTER_ADMIN_EMAIL));
        }
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const staffDoc = querySnapshot.docs[0];
            const staffData = staffDoc.data() as Staff;
            
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
             const isMasterAdmin = fbUser.email === MASTER_ADMIN_EMAIL;
             const newUserProfile: Omit<Staff, 'id'> = {
                 authUid: fbUser.uid,
                 name: isMasterAdmin ? "Angel Nacxit Gomez Campos" : (fbUser.displayName || 'New User'),
                 email: fbUser.email!,
                 role: isMasterAdmin ? 'Admin' : 'Broker',
                 createdAt: serverTimestamp(),
                 hireDate: serverTimestamp(),
                 avatarUrl: '',
                 dui: isMasterAdmin ? "04451625-5" : undefined,
             };
             const docRef = await addDoc(staffCollection, newUserProfile);
             return {
                 id: docRef.id,
                 ...newUserProfile
             } as User;
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
            try {
                const userProfile = await fetchAppUser(firebaseUser);
                setUser(userProfile);
            } catch (error) {
                // Error fetching profile, user remains null
                setUser(null);
            }
        } else {
            setUser(null);
        }
        // This is the crucial part: setLoading to false AFTER the async operations.
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchAppUser]);


  useEffect(() => {
    // Don't run redirection logic until auth state is resolved
    if (loading) return;

    const publicRoutes = ["/login", "/apply"];
    const isPublicPage = publicRoutes.some(path => pathname.startsWith(path));

    if (!user && !isPublicPage) {
      router.push("/login");
    } else if (user && isPublicPage) {
      if (user.role === 'Broker') {
          router.push('/leads');
      } else {
          router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    if (!auth) {
        setAuthError("Authentication service is not available.");
        return;
    }
    setLoading(true); // Set loading to true on login attempt
    setAuthError(null);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle setting the user and setting loading to false
    } catch (error: any) {
        setAuthError(error.message);
        setLoading(false); // Set loading to false on login failure
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    await signOut(auth);
    setUser(null);
    // No need to push to login, the useEffect will handle it.
    // Ensure loading is false after sign out is complete.
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
  
   if (loading && !user) {
     const publicRoutes = ["/login", "/apply"];
     const isPublicPage = publicRoutes.some(path => pathname.startsWith(path));
     if(isPublicPage) return <>{children}</>

     return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
            <Logo />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Application...</p>
        </div>
    );
  }

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
