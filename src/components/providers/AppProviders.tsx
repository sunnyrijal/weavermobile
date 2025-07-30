
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ContactsProvider } from '@/contexts/ContactsContext';
import { MemoriesProvider } from '@/contexts/MemoriesContext';
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ContactsProvider>
          <MemoriesProvider>
        {children}
        <Toaster />
          </MemoriesProvider>
        </ContactsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
