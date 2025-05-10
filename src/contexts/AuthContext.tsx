
"use client";

import type { UserProfile } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
// import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // Real Firebase
// import { auth as firebaseAuth } from '@/lib/firebase/config'; // Real Firebase

// Mock User type similar to FirebaseUser for simplicity
interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>; // For mock login/logout
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate onAuthStateChanged
    setLoading(true);
    const mockAuthListener = (user: MockFirebaseUser | null) => {
      if (user) {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          userPreferences: { defaultView: 'grid' }
        };
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    // Check local storage for a mock user (simulates session persistence)
    const storedUser = localStorage.getItem('mockCurrentUser');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser) as UserProfile;
            // Simulate that this user is still valid by directly setting it
            // In a real app, Firebase SDK handles this automatically with onAuthStateChanged
             mockAuthListener({
                uid: parsedUser.uid,
                email: parsedUser.email,
                displayName: parsedUser.displayName,
                photoURL: parsedUser.photoURL,
             });

        } catch (error) {
            console.error("Failed to parse stored user:", error);
            localStorage.removeItem('mockCurrentUser');
            mockAuthListener(null);
        }
    } else {
         mockAuthListener(null); // No user initially
    }


    // In a real app, you would use Firebase's onAuthStateChanged:
    // const unsubscribe = onAuthStateChanged(firebaseAuth, (user: FirebaseUser | null) => {
    //   if (user) {
    //     const userProfile: UserProfile = { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
    //     // Potentially fetch more user details from Firestore here
    //     setCurrentUser(userProfile);
    //   } else {
    //     setCurrentUser(null);
    //   }
    //   setLoading(false);
    // });
    // return () => unsubscribe(); // Cleanup subscription

    // For mock, this effect doesn't need to return a cleanup function unless mockAuthListener sets up something.
     return () => {
      // Cleanup if necessary
    };
  }, []);
  
  // Effect to update localStorage when currentUser changes (for mock persistence)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mockCurrentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mockCurrentUser');
    }
  }, [currentUser]);


  return (
    <AuthContext.Provider value={{ currentUser, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
