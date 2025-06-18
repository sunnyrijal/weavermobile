
"use client";

import type { UserProfile } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

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
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const MOCK_USER_PROFILE: UserProfile = {
  uid: 'user1', // Using 'user1' to match the ownerId in mock data
  email: 'dev@networknest.com',
  displayName: 'Dev User (No Login)',
  photoURL: 'https://picsum.photos/seed/devuser/200/200',
  createdAt: new Date(),
  userPreferences: { defaultView: 'grid' },
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(MOCK_USER_PROFILE);
  const [loading, setLoading] = useState(false); // Assume user is always "logged in" for now

  // Removed useEffect logic that handles Firebase auth state changes and localStorage.
  // The app will now start with the MOCK_USER_PROFILE by default.

  return (
    <AuthContext.Provider value={{ currentUser, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

